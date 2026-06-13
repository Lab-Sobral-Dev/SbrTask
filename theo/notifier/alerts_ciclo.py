# theo/notifier/alerts_ciclo.py
# Lê envelopes de fechamento de ciclo escritos pelo SbrTask em
# $ENTITY_EXCHANGE_PATH/msgs/<uuid>.json e injeta notificações.
# Formato esperado do envelope:
#   { de, para, tipo: "comissionamento_ciclo", assunto, corpo: { periodo, tecnicos[] } }
#   tecnicos[]: { adUsername, name, xp, tier, commissionAmt }
import json
import logging
import os
from datetime import datetime
from theo.config import ENTITY_EXCHANGE_PATH, THEO_CICLO_STATE_FILE
from theo.shared.alerts_store import load, save

log = logging.getLogger(__name__)

_TIER_ICONS = {
    "elite":    "🏆",
    "platinum": "💎",
    "gold":     "🥇",
    "silver":   "🥈",
    "bronze":   "🥉",
}


def _load_seen() -> set:
    try:
        with open(THEO_CICLO_STATE_FILE) as f:
            return set(json.load(f).get("seen", []))
    except Exception:
        return set()


def _save_seen(seen: set) -> None:
    tmp = THEO_CICLO_STATE_FILE + ".tmp"
    with open(tmp, "w") as f:
        json.dump({"seen": list(seen)}, f)
    os.replace(tmp, THEO_CICLO_STATE_FILE)


def refresh() -> None:
    msgs_dir = os.path.join(ENTITY_EXCHANGE_PATH, "msgs")
    try:
        os.makedirs(msgs_dir, exist_ok=True)
        seen = _load_seen()
        alerts = load()
        ts = datetime.now().isoformat(timespec="seconds")
        changed = False

        for fname in os.listdir(msgs_dir):
            if not fname.endswith(".json") or fname in seen:
                continue
            path = os.path.join(msgs_dir, fname)
            try:
                with open(path) as f:
                    envelope = json.load(f)
            except Exception:
                continue

            if envelope.get("tipo") != "comissionamento_ciclo":
                seen.add(fname)
                continue

            corpo = envelope.get("corpo", {})
            periodo = corpo.get("periodo", "?")
            tecnicos = corpo.get("tecnicos", [])
            total_comissao = sum(float(t.get("commissionAmt", 0)) for t in tecnicos)

            lines = [f"💼 <b>Ciclo de comissionamento fechado — {periodo}</b>"]
            lines.append(f"Técnicos: {len(tecnicos)}  |  Total: R$ {total_comissao:,.2f}\n")
            for t in sorted(tecnicos, key=lambda x: x.get("xp", 0), reverse=True):
                icon = _TIER_ICONS.get(t.get("tier", ""), "•")
                lines.append(
                    f"{icon} {t.get('name', '?')} — {t.get('xp', 0):,} XP "
                    f"({t.get('tier','?')}) · R$ {float(t.get('commissionAmt', 0)):,.2f}"
                )

            msg = "\n".join(lines)
            alert_id = f"ciclo-{fname.removesuffix('.json')}"
            _upsert(alerts, alert_id, ts, msg, "info", "P2")
            seen.add(fname)
            changed = True
            log.info("ciclo detectado: %s, %d técnicos", periodo, len(tecnicos))

        if changed:
            save(alerts)
        _save_seen(seen)

    except Exception:
        log.exception("alerts_ciclo.refresh falhou")


def _upsert(alerts, alert_id, ts, msg, severity, priority):
    for a in alerts:
        if a.get("id") == alert_id:
            return
    alerts.append({
        "id": alert_id, "type": "ciclo",
        "severity": severity, "priority": priority,
        "message": msg, "timestamp": ts,
        "acknowledged": False, "ack_by": None, "ack_at": None, "cleared": False,
    })
