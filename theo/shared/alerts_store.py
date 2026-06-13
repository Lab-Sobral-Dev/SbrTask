# theo/shared/alerts_store.py — fonte única de verdade dos alertas do T.H.E.O.
import json
import os
from datetime import datetime
from theo.config import THEO_ALERTS_FILE


def load() -> list:
    try:
        with open(THEO_ALERTS_FILE) as f:
            return json.load(f).get("alerts", [])
    except Exception:
        return []


def save(alerts: list) -> None:
    tmp = THEO_ALERTS_FILE + ".tmp"
    with open(tmp, "w") as f:
        json.dump({"alerts": alerts}, f, indent=2, default=str)
    os.replace(tmp, THEO_ALERTS_FILE)


def acknowledge(alert_id: str, user: str) -> bool:
    alerts = load()
    for a in alerts:
        if a["id"] == alert_id and not a.get("acknowledged"):
            a.update({
                "acknowledged": True,
                "ack_by": user,
                "ack_at": datetime.now().isoformat(timespec="seconds"),
            })
            save(alerts)
            return True
    return False
