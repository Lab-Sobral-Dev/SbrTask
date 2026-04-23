import React, { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../hooks/useAuthStore';
import NotificationDropdown from '../notifications/NotificationDropdown';
import {
  Crown,
  LayoutDashboard,
  ListTodo,
  LogOut,
  Menu,
  Trophy,
  Users,
  X,
} from 'lucide-react';

const Layout: React.FC = () => {
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/tasks', icon: ListTodo, label: 'Tarefas' },
    { path: '/achievements', icon: Trophy, label: 'Conquistas' },
    { path: '/leaderboard', icon: Users, label: 'Ranking' },
  ];

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  const initials = user?.name
    ? user.name.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase()
    : '?';

  return (
    <div className="tf-screen min-h-screen flex">
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="tf-btn tf-btn-secondary fixed left-4 top-4 z-50 !p-2 !shadow-none lg:hidden"
      >
        {sidebarOpen ? <X /> : <Menu />}
      </button>

      <aside
        className={`tf-panel fixed inset-y-0 left-0 z-40 w-64 rounded-none border-y-0 border-l-0 transform transition-transform duration-300 lg:static ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex h-full flex-col">
          <div className="border-b-2 border-[color:var(--tf-border-soft)] p-6">
            <Link to="/dashboard" className="flex items-center gap-3">
              <div className="tf-frame flex h-11 w-11 items-center justify-center">
                <Crown className="h-5 w-5 text-[color:var(--tf-primary)]" />
              </div>
              <div>
                <span className="tf-title block text-2xl text-[color:var(--tf-text-main)]">SbrTask</span>
                <span className="text-xs uppercase tracking-[0.2em] text-[color:var(--tf-text-dim)]">
                  Laboratório Sobral
                </span>
              </div>
            </Link>
          </div>

          {user && (
            <div className="border-b-2 border-[color:var(--tf-border-soft)] p-4">
              <div className="flex items-center gap-3">
                <div className="tf-frame flex h-12 w-12 items-center justify-center bg-[color:var(--tf-primary)] text-white font-bold text-sm select-none">
                  {initials}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-[color:var(--tf-text-main)]">{user.name}</p>
                  <p className="text-xs uppercase tracking-[0.14em] text-[color:var(--tf-text-dim)]">
                    {user.department ?? 'Sem setor'}
                  </p>
                </div>
              </div>
            </div>
          )}

          <nav className="flex-1 space-y-2 p-4">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`tf-sidebar-link ${isActive ? 'tf-sidebar-link-active' : ''}`}
                >
                  <Icon className="h-5 w-5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="space-y-2 border-t-2 border-[color:var(--tf-border-soft)] p-4">
            <button
              onClick={handleLogout}
              className="tf-sidebar-link w-full text-[color:var(--tf-danger)] hover:bg-[rgba(216,91,83,0.12)] hover:text-[color:var(--tf-text-main)]"
            >
              <LogOut className="h-5 w-5" />
              Sair
            </button>
          </div>
        </div>
      </aside>

      {sidebarOpen && (
        <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <main className="min-h-screen flex-1 lg:ml-0">
        <header className="relative z-50 flex h-16 items-center justify-between border-b-2 border-[color:var(--tf-border-soft)] bg-[rgba(17,22,29,0.68)] px-4 backdrop-blur-sm lg:px-8">
          <div className="w-10 lg:hidden" />
          <div className="flex items-center gap-4">
            <NotificationDropdown />
          </div>
        </header>

        <div className="p-4 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;
