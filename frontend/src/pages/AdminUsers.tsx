import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Shield, ShieldOff, UserCheck, UserX, Search } from 'lucide-react';
import { users, UserRecord } from '../services/api';
import { useAuthStore } from '../hooks/useAuthStore';

export default function AdminUsers() {
  const queryClient = useQueryClient();
  const { user: me } = useAuthStore();
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => users.getAll(),
  });

  const userList: UserRecord[] = data?.data ?? [];

  const updateMutation = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: { role?: string; active?: boolean } }) =>
      users.update(id, patch),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  });

  const departments = [...new Set(userList.map((u) => u.department).filter(Boolean))].sort() as string[];

  const filtered = userList.filter((u) => {
    const matchSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.adUsername.toLowerCase().includes(search.toLowerCase());
    const matchDept = !deptFilter || u.department === deptFilter;
    return matchSearch && matchDept;
  });

  function fmtDate(iso: string | null) {
    if (!iso) return '—';
    return new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
  }

  return (
    <div className="space-y-6">
      <div className="tf-panel p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="tf-title text-2xl text-[color:var(--tf-text-main)]">Gestão de Usuários</h2>
            <p className="mt-1 text-sm text-[color:var(--tf-text-muted)]">
              {userList.length} usuário{userList.length !== 1 ? 's' : ''} cadastrado{userList.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--tf-text-dim)]" />
              <input
                type="text"
                placeholder="Buscar por nome ou login..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="tf-input pl-9 w-64"
              />
            </div>
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="tf-input"
            >
              <option value="">Todos os setores</option>
              {departments.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="tf-panel overflow-hidden">
        {isLoading ? (
          <div className="p-10 text-center text-[color:var(--tf-text-muted)]">Carregando...</div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center text-[color:var(--tf-text-muted)]">Nenhum usuário encontrado</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[color:var(--tf-border-soft)] bg-[color:var(--tf-bg-inset)]">
                  <th className="px-4 py-3 text-left font-semibold text-[color:var(--tf-text-muted)]">Usuário</th>
                  <th className="px-4 py-3 text-left font-semibold text-[color:var(--tf-text-muted)]">Login AD</th>
                  <th className="px-4 py-3 text-left font-semibold text-[color:var(--tf-text-muted)]">Setor</th>
                  <th className="px-4 py-3 text-left font-semibold text-[color:var(--tf-text-muted)]">Último acesso</th>
                  <th className="px-4 py-3 text-center font-semibold text-[color:var(--tf-text-muted)]">Role</th>
                  <th className="px-4 py-3 text-center font-semibold text-[color:var(--tf-text-muted)]">Status</th>
                  <th className="px-4 py-3 text-center font-semibold text-[color:var(--tf-text-muted)]">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[color:var(--tf-border-soft)]">
                {filtered.map((u) => {
                  const isMe = u.id === me?.id;
                  const isAdmin = u.role === 'admin';
                  const loading = updateMutation.isPending;

                  return (
                    <tr
                      key={u.id}
                      className={`transition-colors hover:bg-[color:var(--tf-bg-panel-hover)] ${!u.active ? 'opacity-50' : ''}`}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#e76327] text-xs font-bold text-white">
                            {u.name.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-[color:var(--tf-text-main)]">
                              {u.name}
                              {isMe && (
                                <span className="ml-2 rounded px-1.5 py-0.5 text-[10px] font-semibold bg-[rgba(231,99,39,0.15)] text-[color:var(--tf-primary)]">
                                  você
                                </span>
                              )}
                            </p>
                            {u.email && (
                              <p className="text-xs text-[color:var(--tf-text-dim)]">{u.email}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-[color:var(--tf-text-muted)]">
                        {u.adUsername}
                      </td>
                      <td className="px-4 py-3 text-[color:var(--tf-text-muted)]">
                        {u.department ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-xs text-[color:var(--tf-text-dim)]">
                        {fmtDate(u.lastLoginAt)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
                            isAdmin
                              ? 'bg-[rgba(231,99,39,0.15)] text-[color:var(--tf-primary)]'
                              : 'bg-[color:var(--tf-bg-inset)] text-[color:var(--tf-text-dim)]'
                          }`}
                        >
                          {isAdmin ? <Shield className="h-3 w-3" /> : null}
                          {isAdmin ? 'Admin' : 'Usuário'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                            u.active
                              ? 'bg-[rgba(34,197,94,0.15)] text-[color:var(--tf-success)]'
                              : 'bg-[color:var(--tf-bg-inset)] text-[color:var(--tf-text-dim)]'
                          }`}
                        >
                          {u.active ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            disabled={loading || isMe}
                            title={isAdmin ? 'Remover admin' : 'Tornar admin'}
                            onClick={() =>
                              updateMutation.mutate({ id: u.id, patch: { role: isAdmin ? 'dept_user' : 'admin' } })
                            }
                            className={`tf-btn !p-1.5 text-xs ${
                              isAdmin
                                ? 'tf-btn-secondary !border-[color:var(--tf-danger)] !text-[color:var(--tf-danger)] hover:!bg-[rgba(239,68,68,0.1)]'
                                : 'tf-btn-secondary'
                            } disabled:cursor-not-allowed disabled:opacity-40`}
                          >
                            {isAdmin ? <ShieldOff className="h-3.5 w-3.5" /> : <Shield className="h-3.5 w-3.5" />}
                          </button>
                          <button
                            disabled={loading || isMe}
                            title={u.active ? 'Desativar' : 'Ativar'}
                            onClick={() =>
                              updateMutation.mutate({ id: u.id, patch: { active: !u.active } })
                            }
                            className={`tf-btn !p-1.5 text-xs ${
                              u.active
                                ? 'tf-btn-secondary !border-[color:var(--tf-danger)] !text-[color:var(--tf-danger)] hover:!bg-[rgba(239,68,68,0.1)]'
                                : 'tf-btn-secondary'
                            } disabled:cursor-not-allowed disabled:opacity-40`}
                          >
                            {u.active ? <UserX className="h-3.5 w-3.5" /> : <UserCheck className="h-3.5 w-3.5" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
