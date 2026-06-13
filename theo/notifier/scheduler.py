# theo/notifier/scheduler.py
import asyncio
import json
import logging
import os
import time
from theo.config import NOTIFY_ENABLED, NOTIFY_INTERVAL, NOTIFY_POLL_INTERVAL
from theo.notifier import dispatcher

log = logging.getLogger(__name__)

HEARTBEAT_FILE = os.path.expanduser("~/theo-heartbeat.json")


def _write_heartbeat() -> None:
    try:
        with open(HEARTBEAT_FILE, "w") as f:
            json.dump({"last_tick": time.time()}, f)
    except Exception:
        log.exception("theo heartbeat write falhou")


def _run_all_refresh() -> None:
    from theo.notifier.alerts_sla     import refresh as r_sla
    from theo.notifier.alerts_xp      import refresh as r_xp
    from theo.notifier.alerts_ciclo   import refresh as r_ciclo
    from theo.notifier.alerts_ranking import refresh as r_rank
    from theo.notifier.writer         import write_manifest

    for fn in (r_sla, r_xp, r_ciclo, r_rank):
        try:
            fn()
        except Exception:
            log.exception("refresh falhou: %s", fn.__module__)
    try:
        write_manifest()
    except Exception:
        log.exception("write_manifest falhou")


async def _tick_loop() -> None:
    while True:
        try:
            await asyncio.to_thread(_run_all_refresh)
            await dispatcher.tick()
        except Exception:
            log.exception("theo tick falhou")
        _write_heartbeat()
        await asyncio.sleep(NOTIFY_INTERVAL)


async def _poll_loop() -> None:
    offset = 0
    while True:
        try:
            offset = await dispatcher.handle_callbacks(offset)
        except Exception:
            log.exception("theo poll falhou")
        await asyncio.sleep(NOTIFY_POLL_INTERVAL)


async def run_forever() -> None:
    if not NOTIFY_ENABLED:
        log.info("T.H.E.O. desativado (THEO_NOTIFY_ENABLED=false) — aguardando")
        while True:
            await asyncio.sleep(3600)
    log.info("T.H.E.O. iniciado (intervalo=%ss)", NOTIFY_INTERVAL)
    await asyncio.gather(_tick_loop(), _poll_loop())
