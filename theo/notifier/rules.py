# theo/notifier/rules.py — funções puras de decisão
from datetime import datetime, timedelta


def is_quiet_hours(now: datetime, start: int, end: int) -> bool:
    h = now.hour
    if start <= end:
        return start <= h < end
    return h >= start or h < end


def severity_to_topic(alert: dict) -> str:
    p = alert.get("priority", "P3")
    if p == "P1":
        return "alertas"
    if p == "P2":
        return "alertas"
    return "resumos"


def minutes_since(iso_ts: str, now: datetime) -> float:
    return (now - datetime.fromisoformat(iso_ts)).total_seconds() / 60.0


def due_escalation(notify: dict, now: datetime, thresholds: list) -> int | None:
    first = notify.get("first_notified_at")
    if not first:
        return None
    elapsed = minutes_since(first, now)
    fired = notify.get("escalations_fired", 0)
    for i, t in enumerate(thresholds):
        if i >= fired and elapsed >= t:
            return i
    return None


def is_flapping(flap_history: list, now: datetime, window_min: int, count: int) -> bool:
    cutoff = now - timedelta(minutes=window_min)
    recent = [t for t in flap_history if datetime.fromisoformat(t) >= cutoff]
    return len(recent) >= count


def is_weekly_digest_due(last_iso: str | None, now: datetime) -> bool:
    """Dispara digest de ranking uma vez por semana (sexta >= 17h)."""
    if now.weekday() != 4 or now.hour < 17:
        return False
    if not last_iso:
        return True
    last = datetime.fromisoformat(last_iso)
    return (now - last).days >= 6
