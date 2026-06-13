# theo/notifier/alerts_sla.py
# Monitora FieldTaskSessions com violação de SLA no SbrTask.
# Sessões ABERTAS vencidas → P1/P2 em tempo real.
# Sessões FECHADAS com slaStatus != 'within' nas últimas 24h → P3 informativo.
import logging
import time
from datetime import datetime
from theo.db import query
from theo.shared.alerts_store import load, save

log = logging.getLogger(__name__)

_STATUS_LABELS = {
    "over_20":  "leve (≤120% SLA)",
    "over_50":  "moderada (≤150% SLA)",
    "exceeded": "crítica (>150% SLA)",
}


def refresh() -> None:
    try:
        alerts = load()
        ts = datetime.now().isoformat(timespec="seconds")
        now_unix = time.time()

        open_rows = query("""
            SELECT s.id, s."startedAt",
                   u.name AS tech_name,
                   t.name AS task_name, t."slaMinutes", t.category
            FROM "FieldTaskSession" s
            JOIN "FieldTask"        t ON t.id = s."fieldTaskId"
            JOIN "User"             u ON u.id = s."userId"
            WHERE s."stoppedAt" IS NULL
        """)

        seen_open: set[str] = set()
        for r in open_rows:
            elapsed_min = (now_unix - r["startedAt"].timestamp()) / 60.0
            sla = r["slaMinutes"]
            ratio = elapsed_min / sla if sla else 0
            if ratio < 1.0:
                _clear(alerts, f"sla-open-{r['id']}", ts)
                continue
            seen_open.add(str(r["id"]))
            priority = "P1" if ratio > 1.50 else "P2"
            pct = int(ratio * 100)
            msg = (
                f"[SLA] {r['tech_name']} · {r['task_name']} — "
                f"{int(elapsed_min)}min ({pct}% do SLA de {sla}min)"
            )
            _upsert(alerts, f"sla-open-{r['id']}", ts, msg, "warning", priority)

        for a in alerts:
            if a.get("id", "").startswith("sla-open-") and not a.get("cleared"):
                sid = a["id"].removeprefix("sla-open-")
                if sid not in seen_open:
                    _clear(alerts, a["id"], ts)

        closed_rows = query("""
            SELECT s.id, s."slaStatus", s."durationMin",
                   u.name AS tech_name,
                   t.name AS task_name, t."slaMinutes", t.category
            FROM "FieldTaskSession" s
            JOIN "FieldTask"        t ON t.id = s."fieldTaskId"
            JOIN "User"             u ON u.id = s."userId"
            WHERE s."stoppedAt" >= NOW() - INTERVAL '24 hours'
              AND s."slaStatus" != 'within'
              AND s."stoppedAt" IS NOT NULL
        """)

        for r in closed_rows:
            label = _STATUS_LABELS.get(r["slaStatus"], r["slaStatus"])
            msg = (
                f"[SLA encerrada] {r['tech_name']} · {r['task_name']} — "
                f"violação {label} ({r['durationMin']}min, SLA {r['slaMinutes']}min)"
            )
            alert_id = f"sla-closed-{r['id']}"
            priority = "P2" if r["slaStatus"] == "exceeded" else "P3"
            _upsert(alerts, alert_id, ts, msg, "info", priority)

        save(alerts)
    except Exception:
        log.exception("alerts_sla.refresh falhou")


def _upsert(alerts, alert_id, ts, msg, severity, priority):
    for a in alerts:
        if a.get("id") == alert_id and not a.get("acknowledged"):
            a.update({"message": msg, "severity": severity, "priority": priority, "updated_at": ts})
            return
    alerts.append({
        "id": alert_id, "type": "sla",
        "severity": severity, "priority": priority,
        "message": msg, "timestamp": ts,
        "acknowledged": False, "ack_by": None, "ack_at": None, "cleared": False,
    })


def _clear(alerts, alert_id, ts):
    for a in alerts:
        if a.get("id") == alert_id and not a.get("acknowledged") and not a.get("cleared"):
            a.update({"acknowledged": True, "ack_by": "sistema", "ack_at": ts, "cleared": True})
