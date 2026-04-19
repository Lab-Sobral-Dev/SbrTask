import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Calendar,
  CheckCircle,
  Clock,
  Edit2,
  Plus,
  Search,
  Tag,
  Trash2,
  X,
  Zap,
} from 'lucide-react';
import { tasks, users } from '../services/api';
import { useAuthStore } from '../hooks/useAuthStore';

const adminTaskSchema = z.object({
  title: z.string().min(1, 'Título obrigatório'),
  description: z.string().optional(),
  priority: z.enum(['simple', 'medium', 'critical']),
  category: z.string().optional(),
  dueDate: z.string().optional(),
  xpReward: z.number({ message: 'XP deve ser um número' }).min(1, 'Mínimo 1 XP'),
  assigneeIds: z.array(z.string()).min(1, 'Selecione ao menos um usuário'),
});
type AdminTaskForm = z.infer<typeof adminTaskSchema>;

const filterLabels: Record<string, string> = {
  all: 'Todas',
  active: 'Ativas',
  completed: 'Concluídas',
};

const priorityColors: Record<string, string> = {
  simple: 'border-[color:var(--tf-success)] bg-[rgba(110,203,99,0.14)] text-[color:var(--tf-success)]',
  medium: 'border-[color:var(--tf-warning)] bg-[rgba(217,140,63,0.14)] text-[color:var(--tf-warning)]',
  critical: 'border-[color:var(--tf-danger)] bg-[rgba(216,91,83,0.14)] text-[color:var(--tf-danger)]',
};

const assignmentStatusColors: Record<string, string> = {
  pending: 'text-[color:var(--tf-text-dim)]',
  in_progress: 'text-[color:var(--tf-warning)]',
  completed: 'text-[color:var(--tf-success)]',
};

const assignmentStatusLabels: Record<string, string> = {
  pending: '⏳',
  in_progress: '🔄',
  completed: '✓',
};

const AdminTasksView: React.FC = () => {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  const { data: taskData, isLoading } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => tasks.getAll(),
  });

  const { data: usersData } = useQuery({
    queryKey: ['users'],
    queryFn: () => users.getAll(),
  });

  const userList = usersData?.data ?? [];

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<AdminTaskForm>({
    resolver: zodResolver(adminTaskSchema),
    defaultValues: { priority: 'medium', xpReward: 25, assigneeIds: [] },
  });

  const selectedAssignees = watch('assigneeIds') ?? [];

  const createMutation = useMutation({
    mutationFn: (data: AdminTaskForm) => tasks.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setShowModal(false);
      reset();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => tasks.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setShowModal(false);
      setEditingTask(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => tasks.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
  });

  const onSubmit = (data: AdminTaskForm) => {
    if (editingTask) {
      updateMutation.mutate({ id: editingTask.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const openEdit = (task: any) => {
    setEditingTask(task);
    reset({
      title: task.title,
      description: task.description ?? '',
      priority: task.priority,
      category: task.category ?? '',
      dueDate: task.dueDate ? task.dueDate.split('T')[0] : '',
      xpReward: task.xpReward,
      assigneeIds: task.assignments.map((a: any) => a.userId),
    });
    setShowModal(true);
  };

  const openCreate = () => {
    setEditingTask(null);
    reset({ priority: 'medium', xpReward: 25, assigneeIds: [] });
    setShowModal(true);
  };

  const toggleAssignee = (uid: string) => {
    const cur = selectedAssignees;
    setValue(
      'assigneeIds',
      cur.includes(uid) ? cur.filter((id) => id !== uid) : [...cur, uid],
      { shouldValidate: true },
    );
  };

  const taskList = taskData?.data ?? [];
  const filtered = taskList.filter((t: any) => {
    if (filter !== 'all' && t.status !== filter) return false;
    if (search && !t.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <section className="tf-panel p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="tf-title text-sm uppercase tracking-[0.18em] text-[color:var(--tf-primary)]">Admin</p>
            <h1 className="tf-title mt-2 text-3xl text-[color:var(--tf-text-main)]">Gestão de Tarefas</h1>
          </div>
          <button onClick={openCreate} className="tf-btn tf-btn-primary">
            <Plus className="h-5 w-5" /> Nova Tarefa
          </button>
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
            {['all', 'active', 'completed'].map((v) => (
              <button
                key={v}
                onClick={() => setFilter(v)}
                className={`tf-btn ${filter === v ? 'tf-btn-primary' : 'tf-btn-secondary'} !px-4 !py-2 !text-sm`}
              >
                {filterLabels[v]}
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
            const done = task.status === 'completed';
            const total = task.assignments.length;
            const completedCount = task.assignments.filter((a: any) => a.status === 'completed').length;
            return (
              <article key={task.id} className={`tf-panel p-4 ${done ? 'opacity-70' : ''}`}>
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className={`tf-title text-xl ${done ? 'line-through text-[color:var(--tf-text-dim)]' : 'text-[color:var(--tf-text-main)]'}`}>
                        {task.title}
                      </h3>
                      <span className={`tf-badge border ${priorityColors[task.priority]}`}>
                        {task.priority === 'simple' ? 'Simples' : task.priority === 'medium' ? 'Média' : 'Crítica'}
                      </span>
                    </div>
                    {task.description && (
                      <p className="mt-2 text-sm text-[color:var(--tf-text-muted)]">{task.description}</p>
                    )}
                    <div className="mt-3 flex flex-wrap gap-2">
                      {task.dueDate && (
                        <span className="tf-badge border border-[#8f72ff] bg-[rgba(143,114,255,0.14)] text-[#c7bcff]">
                          <Calendar className="h-3 w-3" />{new Date(task.dueDate).toLocaleDateString('pt-BR')}
                        </span>
                      )}
                      {task.category && (
                        <span className="tf-badge border border-[color:var(--tf-info)] bg-[rgba(111,168,220,0.14)] text-[color:var(--tf-info)]">
                          <Tag className="h-3 w-3" />{task.category}
                        </span>
                      )}
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {task.assignments.map((a: any) => (
                        <span
                          key={a.id}
                          className={`tf-badge border border-[color:var(--tf-border-soft)] ${assignmentStatusColors[a.status]}`}
                        >
                          {assignmentStatusLabels[a.status]} {a.user.name}
                        </span>
                      ))}
                    </div>
                    <p className="mt-2 text-xs text-[color:var(--tf-text-dim)]">{completedCount}/{total} concluído</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                    <div className="tf-panel-inset flex items-center gap-2 px-3 py-2 text-sm font-semibold text-[color:var(--tf-primary)]">
                      <Zap className="h-4 w-4" />+{task.xpReward} XP
                    </div>
                    {!done && (
                      <>
                        <button onClick={() => openEdit(task)} className="tf-btn tf-btn-secondary !p-2">
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => deleteMutation.mutate(task.id)}
                          className="tf-btn !border-[color:var(--tf-danger)] !bg-[rgba(216,91,83,0.12)] !p-2 !text-[color:var(--tf-danger)]"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </article>
            );
          })
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="tf-panel w-full max-w-xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="mb-6 flex items-center justify-between gap-4">
              <div>
                <p className="tf-title text-xs uppercase tracking-[0.16em] text-[color:var(--tf-primary)]">Admin</p>
                <h2 className="tf-title mt-2 text-2xl text-[color:var(--tf-text-main)]">
                  {editingTask ? 'Editar tarefa' : 'Nova tarefa'}
                </h2>
              </div>
              <button
                onClick={() => { setShowModal(false); setEditingTask(null); }}
                className="tf-btn tf-btn-secondary !p-2"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="tf-label">Título</label>
                <input {...register('title')} type="text" placeholder="Título da tarefa" className="tf-input" />
                {errors.title && <p className="mt-1 text-xs text-[color:var(--tf-danger)]">{errors.title.message}</p>}
              </div>
              <div>
                <label className="tf-label">Descrição</label>
                <textarea {...register('description')} placeholder="Descrição opcional" rows={2} className="tf-input resize-none" />
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label className="tf-label">Prioridade</label>
                  <select {...register('priority')} className="tf-input">
                    <option value="simple">Simples</option>
                    <option value="medium">Média</option>
                    <option value="critical">Crítica</option>
                  </select>
                </div>
                <div>
                  <label className="tf-label">XP Reward</label>
                  <input {...register('xpReward', { valueAsNumber: true })} type="number" min={1} className="tf-input" />
                  {errors.xpReward && <p className="mt-1 text-xs text-[color:var(--tf-danger)]">{errors.xpReward.message}</p>}
                </div>
                <div>
                  <label className="tf-label">Prazo</label>
                  <input {...register('dueDate')} type="date" className="tf-input" />
                </div>
              </div>
              <div>
                <label className="tf-label">Categoria</label>
                <input {...register('category')} type="text" placeholder="Ex: Vendas" className="tf-input" />
              </div>
              <div>
                <label className="tf-label">Atribuir usuários</label>
                <div className="mt-2 flex max-h-36 flex-wrap gap-2 overflow-y-auto">
                  {userList.map((u) => (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => toggleAssignee(u.id)}
                      className={`tf-btn !px-3 !py-1 !text-sm ${selectedAssignees.includes(u.id) ? 'tf-btn-primary' : 'tf-btn-secondary'}`}
                    >
                      {u.name}
                    </button>
                  ))}
                </div>
                {errors.assigneeIds && (
                  <p className="mt-1 text-xs text-[color:var(--tf-danger)]">{errors.assigneeIds.message}</p>
                )}
              </div>
              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); setEditingTask(null); }}
                  className="tf-btn tf-btn-secondary"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="tf-btn tf-btn-primary disabled:opacity-50"
                >
                  {editingTask ? 'Salvar' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
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

  const completeMutation = useMutation({
    mutationFn: (taskId: string) => tasks.updateAssignment(taskId, 'completed'),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
  });

  const taskList = data?.data ?? [];
  const filtered = taskList.filter((t: any) => {
    const myAssignment = t.assignments.find((a: any) => a.userId === user?.id);
    if (!myAssignment) return false;
    if (filter === 'active' && myAssignment.status === 'completed') return false;
    if (filter === 'completed' && myAssignment.status !== 'completed') return false;
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
            {['all', 'active', 'completed'].map((v) => (
              <button
                key={v}
                onClick={() => setFilter(v)}
                className={`tf-btn ${filter === v ? 'tf-btn-primary' : 'tf-btn-secondary'} !px-4 !py-2 !text-sm`}
              >
                {filterLabels[v]}
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
            const done = myAssignment?.status === 'completed';
            return (
              <article key={task.id} className={`tf-panel p-4 ${done ? 'opacity-70' : ''}`}>
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex gap-3">
                    <button
                      onClick={() => !done && completeMutation.mutate(task.id)}
                      disabled={done || completeMutation.isPending}
                      className={`mt-1 flex h-10 w-10 items-center justify-center rounded-[4px] border-2 transition-colors ${
                        done
                          ? 'border-[color:var(--tf-success)] bg-[rgba(110,203,99,0.15)] text-[color:var(--tf-success)]'
                          : 'border-[color:var(--tf-border-soft)] bg-[rgba(17,22,29,0.7)] text-[color:var(--tf-text-dim)] hover:border-[color:var(--tf-primary)] hover:text-[color:var(--tf-primary)]'
                      }`}
                    >
                      <CheckCircle className="h-5 w-5" />
                    </button>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className={`tf-title text-xl ${done ? 'line-through text-[color:var(--tf-text-dim)]' : 'text-[color:var(--tf-text-main)]'}`}>
                          {task.title}
                        </h3>
                        <div className="tf-panel-inset flex items-center gap-2 px-2 py-1 text-xs text-[color:var(--tf-text-dim)]">
                          {done ? <CheckCircle className="h-3.5 w-3.5" /> : <Clock className="h-3.5 w-3.5" />}
                          {done ? 'Concluída' : myAssignment?.status === 'in_progress' ? 'Em andamento' : 'Pendente'}
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
                    <div className="tf-panel-inset flex items-center gap-2 px-3 py-2 text-sm font-semibold text-[color:var(--tf-primary)]">
                      <Zap className="h-4 w-4" />+{task.xpReward} XP
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

const Tasks: React.FC = () => {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin';
  return isAdmin ? <AdminTasksView /> : <UserTasksView />;
};

export default Tasks;
