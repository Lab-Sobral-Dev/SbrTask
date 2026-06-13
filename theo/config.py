# theo/config.py — variáveis de ambiente do T.H.E.O.
import os

# SbrTask — acesso direto ao PostgreSQL (mesmo host: Zion VPS)
SBRTASK_DB_URL = os.environ.get("SBRTASK_DB_URL", "")

# Entity exchange — mailbox compartilhada com SbrTask
ENTITY_EXCHANGE_PATH = os.environ.get("ENTITY_EXCHANGE_PATH", "/tmp/entity_exchange")

# Telegram — T.H.E.O. usa bot e grupo próprios (negócios, não infra)
THEO_BOT_TOKEN     = os.environ.get("THEO_BOT_TOKEN", "")
THEO_CHAT_ID       = os.environ.get("THEO_CHAT_ID", "")
THEO_TOPIC_ALERTAS = os.environ.get("THEO_TOPIC_ALERTAS", "")   # SLA violations
THEO_TOPIC_XP      = os.environ.get("THEO_TOPIC_XP", "")        # milestones / level-up
THEO_TOPIC_CICLOS  = os.environ.get("THEO_TOPIC_CICLOS", "")    # commission cycle close
THEO_TOPIC_RESUMOS = os.environ.get("THEO_TOPIC_RESUMOS", "")   # rankings semanais

# Matrix — grupo inter-entidades (Sheldon + T.H.E.O. + Arquiteto)
MATRIX_CHAT_ID     = os.environ.get("MATRIX_CHAT_ID", "")
MATRIX_TOPIC_MUNDO = os.environ.get("MATRIX_TOPIC_MUNDO", "")   # snapshot 07h conjunto

# Notifier
NOTIFY_ENABLED       = os.environ.get("THEO_NOTIFY_ENABLED", "false").lower() == "true"
NOTIFY_INTERVAL      = int(os.environ.get("THEO_NOTIFY_INTERVAL", "60"))
NOTIFY_POLL_INTERVAL = int(os.environ.get("THEO_POLL_INTERVAL", "2"))
NOTIFY_QUIET_START   = int(os.environ.get("THEO_QUIET_START", "22"))
NOTIFY_QUIET_END     = int(os.environ.get("THEO_QUIET_END", "7"))
NOTIFY_META_FILE     = os.path.expanduser("~/theo-notify-meta.json")

# Arquivos de estado locais
THEO_ALERTS_FILE      = os.path.expanduser("~/theo-alerts.json")
THEO_XP_STATE_FILE    = os.path.expanduser("~/theo-xp-state.json")
THEO_CICLO_STATE_FILE = os.path.expanduser("~/theo-ciclo-state.json")

# SLA: limiares de desvio para prioridade de alerta
SLA_P1_RATIO = 1.50  # >150% do SLA → P1
SLA_P2_RATIO = 1.20  # >120% → P2

# Superadmins — IDs do Telegram separados por vírgula
THEO_SUPERADMIN_IDS: set[str] = {
    s.strip()
    for s in os.environ.get("THEO_SUPERADMIN_IDS", "1030157568").split(",")
    if s.strip()
}
