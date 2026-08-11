import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Calendar, CheckCircle, Clock, Search, Tag, Zap } from 'lucide-react';
import { tasks } from '../../services/api';
import { useAuthStore } from '../../hooks/useAuthStore';

const priorityColors: Record<string, string> = {
  simple: 'border-[color:var(--tf-success)] bg-[rgba(110,203,99,0.14)] text-[color:var(--tf-success)]',
  medium: 'border-[color:var(--tf-warning)] bg-[rgba(217,140,63,0.14)] text-[color:var(--tf-warning)]',
  critical: 'border-[color:var(--tf-danger)] bg-[rgba(216,91,83,0.14)] text-[color:var(--tf-danger)]',
};

const assignmentStatusColors: Record<string, string> = {
  pending: 'text-[color:var(--tf-text-dim)]',
  in_progress: 'text-[color:var(--tf-warning)]',
  pending_review: 'text-[color:var(--tf-info)]',
  completed: 'text-[color:var(--tf-success)]',
};

const userFilterLabels: Record<string, string> = {
  all: 'Todas',
  active: 'Ativas',
  pending_review: 'Enviadas',
  completed: 'Concluídas',
};

const UserTasksView: React.FC = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => tasks.getAll(),
  });

  const submitMutation = useMutation({
    mutationFn: (taskId: string) => tasks.updateAssignment(taskId, 'pending_review'),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
  });

  const taskList = data?.data ?? [];
  const filtered = taskList.filter((t: any) => {
    const myAssignment = t.assignments.find((a: any) => a.userId === user?.id);
    if (!myAssignment) return false;
    const s = myAssignment.status;
    if (filter === 'active' && (s !== 'pending' && s !== 'in_progress')) return false;
    if (filter === 'pending_review' && s !== 'pending_review') return false;
    if (filter === 'completed' && s !== 'completed') return false;
    if (search && !t.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <section className="tf-panel p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="tf-title text-sm uppercase tracking-[0.18em] text-[color:var(--tf-primary)]">Missao board</p>
            <h1 className="tf-title mt-2 text-3xl text-[color:var(--tf-text-main)]">Minhas tarefas</h1>
          </div>
          <span className="text-sm text-[color:var(--tf-text-muted)]">{filtered.length} tarefa(s)</span>
        </div>
        <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[color:var(--tf-text-dim)]" />
            <input
              type="text"
              placeholder="Buscar tarefas..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="tf-input pl-10"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {(['all', 'active', 'pending_review', 'completed'] as const).map((v) => (
              <button
                key={v}
                onClick={() => setFilter(v)}
                className={`tf-btn ${filter === v ? 'tf-btn-primary' : 'tf-btn-secondary'} !px-4 !py-2 !text-sm`}
              >
                {userFilterLabels[v]}
              </button>
            ))}
          </div>
        </div>
      </section>

      <div className="space-y-3">
        {isLoading ? (
          <div className="tf-panel p-10 text-center text-[color:var(--tf-text-muted)]">Carregando...</div>
        ) : filtered.length === 0 ? (
          <div className="tf-panel p-10 text-center text-[color:var(--tf-text-muted)]">Nenhuma tarefa encontrada</div>
        ) : (
          filtered.map((task: any) => {
            const myAssignment = task.assignments.find((a: any) => a.userId === user?.id);
            const status = myAssignment?.status ?? 'pending';
            const done = status === 'completed';
            const inReview = status === 'pending_review';

            return (
              <article key={task.id} className={`tf-panel p-4 ${done ? 'opacity-70' : ''}`}>
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        if (!done && !inReview) submitMutation.mutate(task.id);
                      }}
                      disabled={done || inReview || submitMutation.isPending}
                      title={inReview ? 'Aguardando aprovação do admin' : done ? 'Aprovada' : 'Marcar como concluída'}
                      className={`mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-[4px] border-2 transition-colors ${
                        done
                          ? 'border-[color:var(--tf-success)] bg-[rgba(110,203,99,0.15)] text-[color:var(--tf-success)]'
                          : inReview
                          ? 'border-[color:var(--tf-info)] bg-[rgba(111,168,220,0.15)] text-[color:var(--tf-info)]'
                          : 'border-[color:var(--tf-border-soft)] bg-[rgba(17,22,29,0.7)] text-[color:var(--tf-text-dim)] hover:border-[color:var(--tf-primary)] hover:text-[color:var(--tf-primary)]'
                      }`}
                    >
                      {done ? <CheckCircle className="h-5 w-5" /> : inReview ? <Clock className="h-5 w-5" /> : <CheckCircle className="h-5 w-5" />}
                    </button>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className={`tf-title text-xl ${done ? 'line-through text-[color:var(--tf-text-dim)]' : 'text-[color:var(--tf-text-main)]'}`}>
                          {task.title}
                        </h3>
                        <div className={`tf-panel-inset flex items-center gap-2 px-2 py-1 text-xs ${assignmentStatusColors[status]}`}>
                          {done
                            ? <><CheckCircle className="h-3.5 w-3.5" /> Aprovada</>
                            : inReview
                            ? <><Clock className="h-3.5 w-3.5" /> Aguardando aprovação</>
                            : status === 'in_progress'
                            ? <><Clock className="h-3.5 w-3.5" /> Em andamento</>
                            : <><Clock className="h-3.5 w-3.5" /> Pendente</>
                          }
                        </div>
                      </div>
                      {task.description && (
                        <p className="mt-2 text-sm text-[color:var(--tf-text-muted)]">{task.description}</p>
                      )}
                      <div className="mt-3 flex flex-wrap gap-2">
                        <span className={`tf-badge border ${priorityColors[task.priority]}`}>
                          {task.priority === 'simple' ? 'Simples' : task.priority === 'medium' ? 'Média' : 'Crítica'}
                        </span>
                        {task.category && (
                          <span className="tf-badge border border-[color:var(--tf-info)] bg-[rgba(111,168,220,0.14)] text-[color:var(--tf-info)]">
                            <Tag className="h-3 w-3" />{task.category}
                          </span>
                        )}
                        {task.dueDate && (
                          <span className="tf-badge border border-[#8f72ff] bg-[rgba(143,114,255,0.14)] text-[#c7bcff]">
                            <Calendar className="h-3 w-3" />{new Date(task.dueDate).toLocaleDateString('pt-BR')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`tf-panel-inset flex items-center gap-2 px-3 py-2 text-sm font-semibold ${done ? 'text-[color:var(--tf-success)]' : 'text-[color:var(--tf-primary)]'}`}>
                      <Zap className="h-4 w-4" />{done ? `+${task.xpReward} XP` : `${task.xpReward} XP`}
                    </div>
                  </div>
                </div>
              </article>
            );
          })
        )}
      </div>
    </div>
  );
};

export default UserTasksView;
