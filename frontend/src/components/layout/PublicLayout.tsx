import React from 'react';
import { Link, Outlet } from 'react-router-dom';
import { CheckSquare } from 'lucide-react';

const PublicLayout: React.FC = () => (
  <div className="tf-screen min-h-screen flex flex-col">
    <header className="tf-panel border-y-0 border-l-0 border-r-0 border-b-2 border-[color:var(--tf-border-soft)] sticky top-0 z-50 flex items-center gap-4 px-4 py-3 lg:px-8">
      <Link to="/ranking" className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#e76327]">
          <CheckSquare className="h-4 w-4 text-white" />
        </div>
        <div>
          <span className="block text-base font-bold text-[color:var(--tf-text-main)]">SbrTasks</span>
          <span className="text-[11px] text-[color:var(--tf-text-dim)]">
            Gerenciador de Tarefas
          </span>
        </div>
      </Link>

      <div className="ml-auto flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="inline-block h-2 w-2 rounded-full bg-[color:var(--tf-success)] animate-pulse" />
          <span className="text-[11px] uppercase tracking-[1px] text-[color:var(--tf-success)]">Ao vivo</span>
        </div>
        <Link
          to="/login"
          className="tf-btn tf-btn-secondary !px-4 !py-2 !text-xs"
        >
          Entrar
        </Link>
      </div>
    </header>

    <main className="flex-1 p-4 lg:p-8">
      <Outlet />
    </main>
  </div>
);

export default PublicLayout;
