# theo/notifier/alerts_xp.py
# Detecta level-ups em UserGameProfile e injeta alertas celebratórios (P3).
import json
import logging
import os
from datetime import datetime
from theo.config import THEO_XP_STATE_FILE
from theo.db import query
from theo.shared.alerts_store import load, save

log = logging.getLogger(__name__)

_LEVEL_ICONS = {1: "🌱", 2: "🌿", 3: "⭐", 5: "🌟", 10: "💎", 20: "🏆"}


def _icon(level: int) -> str:
    for threshold in sorted(_LEVEL_ICONS, reverse=True):
        if level >= threshold:
            return _LEVEL_ICONS[threshold]
    return "⬆️"


def _load_state() -> dict:
    try:
        with open(THEO_XP_STATE_FILE) as f:
            return json.load(f)
    except Exception:
        return {}


def _save_state(state: dict) -> None:
    tmp = THEO_XP_STATE_FILE + ".tmp"
    with open(tmp, "w") as f:
        json.dump(state, f)
    os.replace(tmp, THEO_XP_STATE_FILE)


def refresh() -> None:
    try:
        rows = query("""
            SELECT g."userId", g.xp, g.level, u.name AS tech_name
            FROM "UserGameProfile" g
            JOIN "User" u ON u.id = g."userId"
        """)
        if not rows:
            return

        xp_state = _load_state()
        alerts = load()
        ts = datetime.now().isoformat(timespec="seconds")
        changed = False

        for r in rows:
            uid = str(r["userId"])
            current_level = r["level"]
            seen_level = xp_state.get(uid, 0)

            if current_level > seen_level:
                icon = _icon(current_level)
                msg = (
                    f"{icon} <b>Level up!</b> {r['tech_name']} "
                    f"subiu para nível {current_level} "
                    f"({r['xp']:,} XP total)"
                )
                alert_id = f"xp-levelup-{uid}-{current_level}"
                _upsert(alerts, alert_id, ts, msg, "info", "P3")
                xp_state[uid] = current_level
                changed = True
                log.info("level-up detectado: user=%s level=%d", uid, current_level)

        if changed:
            save(alerts)
            _save_state(xp_state)

    except Exception:
        log.exception("alerts_xp.refresh falhou")


def _upsert(alerts, alert_id, ts, msg, severity, priority):
    for a in alerts:
        if a.get("id") == alert_id:
            return
    alerts.append({
        "id": alert_id, "type": "xp",
        "severity": severity, "priority": priority,
        "message": msg, "timestamp": ts,
        "acknowledged": False, "ack_by": None, "ack_at": None, "cleared": False,
    })
