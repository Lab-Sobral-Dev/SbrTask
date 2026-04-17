import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AlertTriangle, Calendar, CheckCircle, Clock, Edit2, Plus, Search, Tag, Trash2, X, Zap } from 'lucide-react';
import { tasks } from '../services/api';

const taskSchema = z.object({
  title: z.string().min(1, 'Titulo obrigatorio'),
  description: z.string().optional(),
  priority: z.string().refine((val) => ['simple', 'medium', 'critical'].includes(val), {
    message: 'Prioridade invalida',
  }),
  category: z.string().optional(),
  dueDate: z.string().optional(),
});

type TaskForm = z.infer<typeof taskSchema>;

const filterLabels: Record<string, string> = {
  all: 'Todas',
  pending: 'Pendentes',
  in_progress: 'Em andamento',
  completed: 'Concluidas',
};

const Tasks: React.FC = () => {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);
  const [filter, setFilter] = useState<string>('all');
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => tasks.getAll(),
  });

  const createMutation = useMutation({
    mutationFn: (data: TaskForm) => tasks.create(data),
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
      setEditingTask(null);
      setShowModal(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => tasks.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  const completeMutation = useMutation({
    mutationFn: (id: string) => tasks.complete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TaskForm>({
    resolver: zodResolver(taskSchema),
  });

  const onSubmit = (data: TaskForm) => {
    if (editingTask) {
      updateMutation.mutate({ id: editingTask.id, data });
      return;
    }

    createMutation.mutate(data);
  };

  const taskList = data?.data || [];
  const filteredTasks = taskList.filter((task: any) => {
    if (filter !== 'all' && task.status !== filter) return false;
    if (search && !task.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const openEdit = (task: any) => {
    setEditingTask(task);
    reset({
      title: task.title,
      description: task.description || '',
      priority: task.priority,
      category: task.category || '',
      dueDate: task.dueDate ? task.dueDate.split('T')[0] : '',
    });
    setShowModal(true);
  };

  const priorityColors = {
    simple: 'border-[color:var(--tf-success)] bg-[rgba(110,203,99,0.14)] text-[color:var(--tf-success)]',
    medium: 'border-[color:var(--tf-warning)] bg-[rgba(217,140,63,0.14)] text-[color:var(--tf-warning)]',
    critical: 'border-[color:var(--tf-danger)] bg-[rgba(216,91,83,0.14)] text-[color:var(--tf-danger)]',
  };

  const statusIcons = {
    pending: Clock,
    in_progress: AlertTriangle,
    completed: CheckCircle,
  };

  const openCreate = () => {
    setEditingTask(null);
    reset();
    setShowModal(true);
  };

  return (
    <div className="space-y-6">
      <section className="tf-panel p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="tf-title text-sm uppercase tracking-[0.18em] text-[color:var(--tf-primary)]">Missao board</p>
            <h1 className="tf-title mt-2 text-3xl text-[color:var(--tf-text-main)]">Minhas tarefas</h1>
            <p className="mt-2 text-[color:var(--tf-text-muted)]">Organize a campanha, filtre objetivos e conclua missoes por XP.</p>
          </div>
          <button onClick={openCreate} className="tf-btn tf-btn-primary">
            <Plus className="h-5 w-5" />
            Nova tarefa
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
            {['all', 'pending', 'in_progress', 'completed'].map((value) => (
              <button
                key={value}
                onClick={() => setFilter(value)}
                className={`tf-btn ${filter === value ? 'tf-btn-primary' : 'tf-btn-secondary'} !px-4 !py-2 !text-sm`}
              >
                {filterLabels[value]}
              </button>
            ))}
          </div>
        </div>
      </section>

      <div className="space-y-3">
        {isLoading ? (
          <div className="tf-panel p-10 text-center text-[color:var(--tf-text-muted)]">Carregando...</div>
        ) : filteredTasks.length === 0 ? (
          <div className="tf-panel p-10 text-center text-[color:var(--tf-text-muted)]">Nenhuma tarefa encontrada</div>
        ) : (
          filteredTasks.map((task: any) => {
            const StatusIcon = statusIcons[task.status as keyof typeof statusIcons];
            const done = task.status === 'completed';

            return (
              <article key={task.id} className={`tf-panel p-4 ${done ? 'opacity-70' : ''}`}>
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex gap-3">
                    <button
                      onClick={() => !done && completeMutation.mutate(task.id)}
                      disabled={done}
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
                          <StatusIcon className="h-3.5 w-3.5" />
                          {filterLabels[task.status] || task.status}
                        </div>
                      </div>

                      {task.description && (
                        <p className="mt-2 text-sm leading-6 text-[color:var(--tf-text-muted)]">{task.description}</p>
                      )}

                      <div className="mt-4 flex flex-wrap gap-2">
                        <span className={`tf-badge border ${priorityColors[task.priority as keyof typeof priorityColors]}`}>
                          {task.priority === 'simple' ? 'Simples' : task.priority === 'medium' ? 'Media' : 'Critica'}
                        </span>
                        {task.category && (
                          <span className="tf-badge border border-[color:var(--tf-info)] bg-[rgba(111,168,220,0.14)] text-[color:var(--tf-info)]">
                            <Tag className="h-3 w-3" />
                            {task.category}
                          </span>
                        )}
                        {task.dueDate && (
                          <span className="tf-badge border border-[#8f72ff] bg-[rgba(143,114,255,0.14)] text-[#c7bcff]">
                            <Calendar className="h-3 w-3" />
                            {new Date(task.dueDate).toLocaleDateString('pt-BR')}
                          </span>
                        )}
                      </div>
                    </div>
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
          <div className="tf-panel w-full max-w-xl p-6">
            <div className="mb-6 flex items-center justify-between gap-4">
              <div>
                <p className="tf-title text-xs uppercase tracking-[0.16em] text-[color:var(--tf-primary)]">Mission editor</p>
                <h2 className="tf-title mt-2 text-2xl text-[color:var(--tf-text-main)]">{editingTask ? 'Editar tarefa' : 'Nova tarefa'}</h2>
              </div>
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingTask(null);
                }}
                className="tf-btn tf-btn-secondary !p-2"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="tf-label">Titulo</label>
                <input {...register('title')} type="text" placeholder="Titulo da tarefa" className="tf-input" />
                {errors.title && <p className="mt-1 text-xs text-[color:var(--tf-danger)]">{errors.title.message}</p>}
              </div>

              <div>
                <label className="tf-label">Descricao</label>
                <textarea
                  {...register('description')}
                  placeholder="Descricao opcional"
                  rows={3}
                  className="tf-input resize-none"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="tf-label">Prioridade</label>
                  <select {...register('priority')} className="tf-input">
                    <option value="simple">Simples</option>
                    <option value="medium">Media</option>
                    <option value="critical">Critica</option>
                  </select>
                </div>

                <div>
                  <label className="tf-label">Categoria</label>
                  <input {...register('category')} type="text" placeholder="Ex: Trabalho" className="tf-input" />
                </div>
              </div>

              <div>
                <label className="tf-label">Prazo</label>
                <input {...register('dueDate')} type="date" className="tf-input" />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingTask(null);
                  }}
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

export default Tasks;
