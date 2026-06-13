# theo/db.py — conexão direta ao PostgreSQL do SbrTask
import logging
import psycopg2
import psycopg2.extras
from theo.config import SBRTASK_DB_URL

log = logging.getLogger(__name__)


def get_conn():
    if not SBRTASK_DB_URL:
        raise RuntimeError("SBRTASK_DB_URL não configurado")
    return psycopg2.connect(SBRTASK_DB_URL, cursor_factory=psycopg2.extras.RealDictCursor)


def query(sql: str, params=None) -> list[dict]:
    try:
        with get_conn() as conn:
            with conn.cursor() as cur:
                cur.execute(sql, params or ())
                return [dict(r) for r in cur.fetchall()]
    except Exception:
        log.exception("DB query falhou: %s", sql[:80])
        return []
