import React, { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../hooks/useAuthStore';
import NotificationDropdown from '../notifications/NotificationDropdown';
import {
  LayoutDashboard,
  ListTodo,
  LogOut,
  Menu,
  Shield,
  Trophy,
  Users,
  X,
} from 'lucide-react';

const Layout: React.FC = () => {
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isAdmin = user?.role === 'admin';

  const navItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/tasks', icon: ListTodo, label: 'Tarefas' },
    { path: '/achievements', icon: Trophy, label: 'Conquistas' },
    { path: '/leaderboard', icon: Users, label: 'Ranking' },
    ...(isAdmin ? [{ path: '/admin/users', icon: Shield, label: 'Usuários' }] : []),
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
        className={`fixed inset-y-0 left-0 z-40 w-64 transform transition-transform duration-300 lg:static bg-[color:var(--tf-bg-elevated)] border-r border-[color:var(--tf-border-soft)] ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex h-full flex-col">
          <div className="border-b border-[color:var(--tf-border-soft)] p-5">
            <Link to="/dashboard" className="flex items-center gap-3">
              <img src="/favicon.svg" alt="" className="h-10 w-10 rounded-xl" />
              <div>
                <span className="block text-lg font-bold text-[color:var(--tf-text-main)]">SbrTasks</span>
                <span className="text-[11px] text-[color:var(--tf-text-dim)]">
                  Laboratório Sobral
                </span>
              </div>
            </Link>
          </div>

          {user && (
            <div className="border-b border-[color:var(--tf-border-soft)] p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#e76327] text-white font-bold text-sm select-none">
                  {initials}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-[color:var(--tf-text-main)]">{user.name}</p>
                  <p className="text-[11px] text-[color:var(--tf-text-dim)]">
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

          <div className="space-y-1 border-t border-[color:var(--tf-border-soft)] p-4">
            <button
              onClick={handleLogout}
              className="tf-sidebar-link w-full text-[color:var(--tf-danger)] hover:bg-[rgba(239,68,68,0.1)] hover:text-[color:var(--tf-danger)]"
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
        <header className="relative z-50 flex h-16 items-center justify-between border-b border-[color:var(--tf-border-soft)] bg-[color:var(--tf-bg-base)] px-4 lg:px-8">
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
