# theo/notifier/dispatcher.py
import logging
from datetime import datetime

from theo.config import NOTIFY_ENABLED, NOTIFY_QUIET_START, NOTIFY_QUIET_END
from theo.shared.alerts_store import load, save, acknowledge
from theo.notifier import rules, state
from theo.notifier.channels import telegram as tg

log = logging.getLogger(__name__)

_TOPIC_MAP = {
    "sla":     "alertas",
    "ciclo":   "ciclos",
    "xp":      "xp",
    "ranking": "resumos",
}


def _type_to_topic(alert: dict) -> str:
    return _TOPIC_MAP.get(alert.get("type", ""), "resumos")


def _fmt(a: dict) -> str:
    icon = "🔴" if a.get("priority") == "P1" else ("🟡" if a.get("priority") == "P2" else "ℹ️")
    return f"{icon} {a.get('message', '')}"


async def tick(now: datetime | None = None) -> None:
    if not NOTIFY_ENABLED:
        return
    now = now or datetime.now()
    alerts = load()
    changed = False

    for a in alerts:
        nb = state.ensure_notify(a)

        if a.get("cleared") and nb.get("tg_message_id") and not nb.get("resolved_sent"):
            dur = ""
            try:
                first = nb.get("first_notified_at")
                if first:
                    mins = int((now - datetime.fromisoformat(first)).total_seconds() // 60)
                    dur = f" · durou ~{mins}min"
            except Exception:
                pass
            await tg.edit_message(
                nb["tg_message_id"],
                f"✅ <b>Resolvido</b> às {now.strftime('%H:%M')}{dur}\n"
                f"Era <b>{a.get('priority','?')}</b>: {a.get('message','')}",
            )
            nb["resolved_sent"] = True
            changed = True
            continue

        if a.get("acknowledged") or a.get("cleared"):
            continue

        until = nb.get("silenced_until")
        if until and datetime.fromisoformat(until) > now:
            continue

        topic = _type_to_topic(a)
        nb["tg_topic"] = topic
        is_p1 = a.get("priority") == "P1"

        if nb.get("tg_message_id"):
            if a.get("message") != nb.get("last_msg_text"):
                await tg.edit_message(nb["tg_message_id"], _fmt(a), alert_id=a["id"])
                nb["last_msg_text"] = a.get("message")
                changed = True
            if is_p1:
                idx = rules.due_escalation(nb, now, [15, 30])
                if idx is not None:
                    from theo.config import THEO_SUPERADMIN_IDS
                    mentions = " ".join(f"<a href='tg://user?id={uid}'>admin</a>"
                                       for uid in THEO_SUPERADMIN_IDS)
                    await tg.send_to_topic(
                        f"⚠️ <b>P1 sem ACK ({[15,30][idx]}min)</b> {mentions}\n{a.get('message','')}",
                        topic="alertas",
                    )
                    nb["escalations_fired"] = idx + 1
                    nb["last_escalated_at"] = now.isoformat(timespec="seconds")
                    changed = True
            continue

        if rules.is_flapping(nb.get("flap_history") or [], now, 15, 3):
            continue
        if not is_p1 and rules.is_quiet_hours(now, NOTIFY_QUIET_START, NOTIFY_QUIET_END):
            continue

        mid = await tg.send_to_topic(_fmt(a), topic=topic, alert_id=a["id"], is_p1=is_p1)
        if mid:
            nb.update({
                "tg_message_id": mid,
                "first_notified_at": now.isoformat(timespec="seconds"),
                "notify_count": nb.get("notify_count", 0) + 1,
                "last_msg_text": a.get("message"),
            })
            changed = True

    if changed:
        save(alerts)


async def handle_callbacks(offset: int) -> int:
    if not NOTIFY_ENABLED:
        return offset
    updates = await tg.get_updates(offset)

    for u in updates.get("result", []):
        msg = u.get("message", {})
        user_id = str(msg.get("from", {}).get("id", ""))
        text = msg.get("text", "")

        if text and not state.is_authorized(user_id):
            continue

        response = tg.handle_text_message(text)
        if response:
            chat_id = str(msg.get("chat", {}).get("id", ""))
            if chat_id:
                from theo.notifier.channels.telegram import _call, build_send_payload
                await _call("sendMessage", build_send_payload(response, chat_id,
                                                              msg.get("message_thread_id")))

    parsed, next_offset = tg.parse_callbacks(updates)
    if not parsed:
        return next_offset if next_offset else offset

    alerts = load()
    changed = False
    for cb in parsed:
        if not state.is_authorized(str(cb.get("from_id", ""))):
            await tg.answer_callback(cb["callback_id"], "Acesso não autorizado.")
            continue
        if cb["action"] == "ack":
            if acknowledge(cb["alert_id"], cb["user"]):
                alerts = load()
                a = state.find_alert(alerts, cb["alert_id"])
                if cb.get("message_id") and a:
                    await tg.edit_message(
                        cb["message_id"],
                        f"{_fmt(a)}\n\n✅ <b>Reconhecido por @{cb['user']}</b> "
                        f"às {datetime.now().strftime('%H:%M')}",
                    )
            await tg.answer_callback(cb["callback_id"], "Reconhecido ✅")
            changed = True

    if changed:
        save(alerts)
    return next_offset
