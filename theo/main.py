# theo/main.py — entrypoint do T.H.E.O. standalone (theo.service)
import asyncio
import logging
import os
import sys

_DEPLOY = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if _DEPLOY not in sys.path:
    sys.path.insert(0, _DEPLOY)

logging.basicConfig(
    level=logging.INFO,
    format='{"timestamp": "%(asctime)s", "level": "%(levelname)s", '
           '"service": "theo", "module": "%(module)s", "message": "%(message)s"}',
)
log = logging.getLogger("theo")


def main() -> None:
    from theo.notifier.scheduler import run_forever
    log.info("T.H.E.O. standalone subindo (deploy=%s)", _DEPLOY)
    try:
        asyncio.run(run_forever())
    except KeyboardInterrupt:
        log.info("T.H.E.O. encerrado (SIGINT)")


if __name__ == "__main__":
    main()
