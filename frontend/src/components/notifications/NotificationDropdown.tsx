import { useState, useRef, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { useNotifications } from '../../hooks/useNotifications';

const NotificationDropdown: React.FC = () => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { notifications, unreadCount, isLoading, markAllRead } = useNotifications();

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'agora';
    if (diffMin < 60) return `${diffMin}min atrás`;
    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24) return `${diffH}h atrás`;
    return d.toLocaleDateString('pt-BR');
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="tf-btn tf-btn-ghost relative !p-2 hover:text-[color:var(--tf-text-main)]"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[color:var(--tf-primary)] text-[10px] font-bold text-[#0f1923]">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="tf-panel absolute right-0 top-full z-50 mt-2 w-80 p-0 overflow-hidden">
          <div className="flex items-center justify-between border-b-2 border-[color:var(--tf-border-soft)] px-4 py-3">
            <span className="tf-title text-sm text-[color:var(--tf-text-main)]">Notificações</span>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-xs text-[color:var(--tf-text-dim)] hover:text-[color:var(--tf-primary)] transition-colors"
              >
                Marcar todas como lidas
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {isLoading ? (
              <p className="p-4 text-center text-sm text-[color:var(--tf-text-muted)]">Carregando...</p>
            ) : notifications.length === 0 ? (
              <p className="p-4 text-center text-sm text-[color:var(--tf-text-muted)]">Sem notificações</p>
            ) : (
              notifications.slice(0, 10).map((n) => (
                <div
                  key={n.id}
                  className={`border-b border-[color:var(--tf-border-soft)] px-4 py-3 ${
                    !n.read ? 'border-l-2 border-l-[color:var(--tf-primary)]' : ''
                  }`}
                >
                  <p className={`text-sm ${n.read ? 'text-[color:var(--tf-text-muted)]' : 'text-[color:var(--tf-text-main)]'}`}>
                    {n.message}
                  </p>
                  <p className="mt-1 text-xs text-[color:var(--tf-text-dim)]">{formatDate(n.createdAt)}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;
