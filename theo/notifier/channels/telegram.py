# theo/notifier/channels/telegram.py
import logging
import httpx
from theo.config import (
    THEO_BOT_TOKEN, THEO_CHAT_ID,
    THEO_TOPIC_ALERTAS, THEO_TOPIC_XP, THEO_TOPIC_CICLOS, THEO_TOPIC_RESUMOS,
)

log = logging.getLogger(__name__)
_API = "https://api.telegram.org/bot{token}/{method}"

_TOPIC_MAP = {
    "alertas": THEO_TOPIC_ALERTAS,
    "xp":      THEO_TOPIC_XP,
    "ciclos":  THEO_TOPIC_CICLOS,
    "resumos": THEO_TOPIC_RESUMOS,
}

_THEO_TRIGGERS = ("o que é o theo", "quem é o theo", "/theo")

_THEO_RESPONSE = (
    "🤖 Olá! Eu sou o <b>T.H.E.O.</b>\n\n"
    "<b>T</b> — Tracking\n"
    "<i>Rastreio cada tarefa de campo, cada SLA e cada XP conquistado pelos técnicos.</i>\n\n"
    "<b>H</b> — Human Performance\n"
    "<i>Monitoro o desempenho humano — quem está entregando, quem está atrasado, quem merece reconhecimento.</i>\n\n"
    "<b>E</b> — Exchange\n"
    "<i>Falo com o S.H.E.L.D.O.N. via entity-exchange — negócios e infra trocando mensagens sem se pisarem.</i>\n\n"
    "<b>O</b> — Operations\n"
    "<i>Opero o ciclo de comissionamento — fecho ciclos, calculo faixas e entrego o envelope financeiro.</i>"
)


def handle_text_message(text: str) -> str | None:
    lower = text.lower().strip()
    if any(t in lower for t in _THEO_TRIGGERS):
        return _THEO_RESPONSE
    return None


def build_keyboard(alert_id: str, is_p1: bool = True) -> dict | None:
    if not is_p1:
        return None
    return {"inline_keyboard": [[
        {"text": "✅ Reconhecer", "callback_data": f"ack:{alert_id}"},
    ]]}


def build_send_payload(text: str, chat_id: str, thread_id=None,
                       alert_id: str = None, is_p1: bool = True) -> dict:
    payload = {"chat_id": chat_id, "text": text, "parse_mode": "HTML"}
    if thread_id:
        payload["message_thread_id"] = int(thread_id)
    if alert_id:
        kb = build_keyboard(alert_id, is_p1=is_p1)
        if kb:
            payload["reply_markup"] = kb
    return payload


def parse_callbacks(updates: dict):
    parsed = []
    max_uid = 0
    for u in updates.get("result", []):
        max_uid = max(max_uid, u.get("update_id", 0))
        cq = u.get("callback_query")
        if not cq or ":" not in cq.get("data", ""):
            continue
        action, _, alert_id = cq["data"].partition(":")
        if action != "ack":
            continue
        msg = cq.get("message", {})
        parsed.append({
            "action": action,
            "alert_id": alert_id,
            "user": cq.get("from", {}).get("username") or cq.get("from", {}).get("first_name", "?"),
            "from_id": str(cq.get("from", {}).get("id", "")),
            "callback_id": cq.get("id"),
            "message_id": msg.get("message_id"),
        })
    next_offset = (max_uid + 1) if max_uid else 0
    return parsed, next_offset


async def _call(method: str, payload: dict) -> dict:
    url = _API.format(token=THEO_BOT_TOKEN, method=method)
    try:
        async with httpx.AsyncClient(timeout=10) as c:
            r = await c.post(url, json=payload)
            return r.json()
    except Exception as e:
        log.warning("telegram %s falhou: %s", method, e)
        return {"ok": False}


async def send_message(text: str, thread_id=None, alert_id=None, is_p1: bool = True) -> int | None:
    data = await _call("sendMessage", build_send_payload(
        text, THEO_CHAT_ID, thread_id, alert_id, is_p1=is_p1
    ))
    if data.get("ok"):
        return data["result"]["message_id"]
    return None


async def send_to_topic(text: str, topic: str, alert_id=None, is_p1: bool = True) -> int | None:
    thread_id = _TOPIC_MAP.get(topic)
    return await send_message(text, thread_id=thread_id, alert_id=alert_id, is_p1=is_p1)


async def send_direct(text: str, chat_id: str) -> int | None:
    data = await _call("sendMessage", build_send_payload(text, chat_id))
    if data.get("ok"):
        return data["result"]["message_id"]
    return None


async def edit_message(message_id: int, text: str, alert_id=None) -> bool:
    payload = {"chat_id": THEO_CHAT_ID, "message_id": message_id,
               "text": text, "parse_mode": "HTML"}
    if alert_id:
        kb = build_keyboard(alert_id)
        if kb:
            payload["reply_markup"] = kb
    return bool(await _call("editMessageText", payload))


async def answer_callback(callback_id: str, text: str = "") -> None:
    await _call("answerCallbackQuery", {"callback_query_id": callback_id, "text": text})


async def get_updates(offset: int) -> dict:
    return await _call("getUpdates", {"offset": offset, "timeout": 0,
                                      "allowed_updates": ["callback_query", "message"]})
