# theo/notifier/state.py — estado de notificação e controle de acesso
import json
import os
from theo.config import NOTIFY_META_FILE, THEO_SUPERADMIN_IDS

_DEFAULT_NOTIFY = {
    "tg_message_id": None,
    "tg_topic": None,
    "first_notified_at": None,
    "last_edit_at": None,
    "notify_count": 0,
    "escalations_fired": 0,
    "last_escalated_at": None,
    "silenced_until": None,
    "flap_history": [],
    "digested": False,
    "resolved_sent": False,
    "last_msg_text": None,
}


def ensure_notify(alert: dict) -> dict:
    nb = alert.get("notify")
    if not isinstance(nb, dict):
        nb = dict(_DEFAULT_NOTIFY)
        nb["flap_history"] = []
        alert["notify"] = nb
        return nb
    for k, v in _DEFAULT_NOTIFY.items():
        nb.setdefault(k, [] if isinstance(v, list) else v)
    return nb


def find_alert(alerts: list, alert_id: str) -> dict | None:
    for a in alerts:
        if a.get("id") == alert_id:
            return a
    return None


def _load_meta() -> dict:
    try:
        with open(NOTIFY_META_FILE) as f:
            return json.load(f)
    except Exception:
        return {}


def _save_meta(meta: dict) -> None:
    tmp = NOTIFY_META_FILE + ".tmp"
    with open(tmp, "w") as f:
        json.dump(meta, f)
    os.replace(tmp, NOTIFY_META_FILE)


def get_meta(key: str, default=None):
    return _load_meta().get(key, default)


def set_meta(key: str, value) -> None:
    meta = _load_meta()
    meta[key] = value
    _save_meta(meta)


def get_admin_ids() -> list[str]:
    meta = _load_meta()
    ids = set(THEO_SUPERADMIN_IDS)
    ids.update(str(x) for x in meta.get("admin_ids", []))
    return list(ids)


def is_authorized(user_id: str) -> bool:
    return str(user_id) in get_admin_ids()


def set_admin_name(user_id: str, name: str) -> None:
    meta = _load_meta()
    meta.setdefault("admin_names", {})[str(user_id)] = name
    _save_meta(meta)


def get_admin_name(user_id: str, default: str = "Admin") -> str:
    return _load_meta().get("admin_names", {}).get(str(user_id), default)
