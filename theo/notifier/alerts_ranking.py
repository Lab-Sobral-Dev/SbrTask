# theo/notifier/alerts_ranking.py
# Digest semanal de ranking de XP dos técnicos (sextas >= 17h).
import logging
from datetime import datetime
from theo.db import query
from theo.shared.alerts_store import load, save
from theo.notifier import rules, state

log = logging.getLogger(__name__)

_PODIUM = ["🥇", "🥈", "🥉", "4️⃣", "5️⃣"]
_TIER_ICONS = {
    "elite": "🏆", "platinum": "💎", "gold": "🌟",
    "silver": "⭐", "bronze": "🎖️",
}


def refresh() -> None:
    try:
        last = state.get_meta("last_ranking_digest")
        now = datetime.now()
        if not rules.is_weekly_digest_due(last, now):
            return

        rows = query("""
            SELECT u.name AS tech_name, g.xp, g.level,
                   COALESCE(cc.tier, 'bronze') AS tier
            FROM "UserGameProfile" g
            JOIN "User" u ON u.id = g."userId"
            LEFT JOIN (
                SELECT DISTINCT ON ("userId") "userId", tier
                FROM "CommissionCycle"
                ORDER BY "userId", "closedAt" DESC
            ) cc ON cc."userId" = g."userId"
            ORDER BY g.xp DESC
            LIMIT 10
        """)
        if not rows:
            return

        ts = now.isoformat(timespec="seconds")
        week_str = now.strftime("semana %W/%Y")
        lines = [f"📊 <b>Ranking de XP — {week_str}</b>\n"]
        for i, r in enumerate(rows):
            medal = _PODIUM[i] if i < len(_PODIUM) else "•"
            tier_icon = _TIER_ICONS.get(r["tier"], "•")
            lines.append(
                f"{medal} {r['tech_name']} — {r['xp']:,} XP "
                f"(nível {r['level']}) {tier_icon}"
            )

        alerts = load()
        _upsert(alerts, "ranking-semanal", ts, "\n".join(lines), "info", "P3")
        save(alerts)
        state.set_meta("last_ranking_digest", ts)
        log.info("ranking semanal injetado: %d técnicos", len(rows))

    except Exception:
        log.exception("alerts_ranking.refresh falhou")


def _upsert(alerts, alert_id, ts, msg, severity, priority):
    for a in alerts:
        if a.get("id") == alert_id and not a.get("cleared"):
            a.update({"message": msg, "severity": severity, "priority": priority, "updated_at": ts,
                      "acknowledged": False, "cleared": False})
            return
    alerts.append({
        "id": alert_id, "type": "ranking",
        "severity": severity, "priority": priority,
        "message": msg, "timestamp": ts,
        "acknowledged": False, "ack_by": None, "ack_at": None, "cleared": False,
    })
