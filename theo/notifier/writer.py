# theo/notifier/writer.py
# Escreve o manifesto do T.H.E.O. em $ENTITY_EXCHANGE_PATH/theo.json
# para que o Sheldon monitore via alerts_entity_exchange.
import json
import logging
import os
import time
from theo.config import ENTITY_EXCHANGE_PATH
from theo.db import query

log = logging.getLogger(__name__)

_MANIFEST_PATH = None


def _get_manifest_path() -> str:
    global _MANIFEST_PATH
    if _MANIFEST_PATH is None:
        _MANIFEST_PATH = os.path.join(ENTITY_EXCHANGE_PATH, "theo.json")
    return _MANIFEST_PATH


def write_manifest() -> None:
    try:
        stats_rows = query("""
            SELECT
                COUNT(DISTINCT g."userId")                                     AS active_techs,
                COALESCE(SUM(g.xp), 0)                                        AS total_xp,
                COUNT(DISTINCT s.id) FILTER (WHERE s."stoppedAt" IS NULL)     AS open_sessions,
                COUNT(DISTINCT s.id) FILTER (WHERE s."slaStatus" = 'within'
                    AND s."stoppedAt" IS NOT NULL
                    AND s."startedAt" >= date_trunc('month', NOW()))           AS sla_ok_month,
                COUNT(DISTINCT s.id) FILTER (WHERE s."slaStatus" != 'within'
                    AND s."stoppedAt" IS NOT NULL
                    AND s."startedAt" >= date_trunc('month', NOW()))           AS sla_nok_month
            FROM "UserGameProfile" g
            LEFT JOIN "FieldTaskSession" s ON s."userId" = g."userId"
        """)

        top_rows = query("""
            SELECT u.name, g.xp, g.level
            FROM "UserGameProfile" g
            JOIN "User" u ON u.id = g."userId"
            ORDER BY g.xp DESC
            LIMIT 3
        """)

        stats = stats_rows[0] if stats_rows else {}
        active = int(stats.get("active_techs") or 0)
        total_xp = int(stats.get("total_xp") or 0)
        open_s = int(stats.get("open_sessions") or 0)
        sla_ok = int(stats.get("sla_ok_month") or 0)
        sla_nok = int(stats.get("sla_nok_month") or 0)
        sla_total = sla_ok + sla_nok
        sla_pct = round(sla_ok / sla_total * 100, 1) if sla_total else None

        top3 = [{"nome": r["name"], "xp": r["xp"], "nivel": r["level"]} for r in top_rows]

        if sla_pct is not None:
            summary = (
                f"{active} técnicos ativos · {total_xp:,} XP total · "
                f"sessões abertas: {open_s} · SLA mês: {sla_pct}%"
            )
        else:
            summary = f"{active} técnicos ativos · {total_xp:,} XP total"

        manifest = {
            "entity":         "theo",
            "schema_version": "1.0",
            "written_at":     time.time(),
            "summary":        summary,
            "payload": {
                "active_techs":       active,
                "total_xp":           total_xp,
                "open_sessions":      open_s,
                "sla_compliance_pct": sla_pct,
                "sla_ok_month":       sla_ok,
                "sla_nok_month":      sla_nok,
                "top3":               top3,
            },
        }

        path = _get_manifest_path()
        os.makedirs(os.path.dirname(path), exist_ok=True)
        tmp = path + ".tmp"
        with open(tmp, "w") as f:
            json.dump(manifest, f, ensure_ascii=False)
        os.replace(tmp, path)
        log.debug("manifesto theo.json atualizado: %s", summary)

    except Exception:
        log.exception("writer.write_manifest falhou")
