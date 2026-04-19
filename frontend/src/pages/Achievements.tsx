import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { achievements } from '../services/api';
import { useAuthStore } from '../hooks/useAuthStore';
import {
  Award,
  Check,
  Crown,
  Edit2,
  Flame,
  Lock,
  Medal,
  Plus,
  Target,
  Trash2,
  Trophy,
  X,
  Zap,
} from 'lucide-react';

const iconMap: Record<string, React.ReactNode> = {
  trophy: <Trophy className="h-8 w-8" />,
  medal: <Medal className="h-8 w-8" />,
  award: <Award className="h-8 w-8" />,
  crown: <Crown className="h-8 w-8" />,
  zap: <Zap className="h-8 w-8" />,
  flame: <Flame className="h-8 w-8" />,
  target: <Target className="h-8 w-8" />,
};

const ICON_OPTIONS = ['trophy', 'medal', 'award', 'crown', 'zap', 'flame', 'target'];
const TYPE_OPTIONS = ['milestone', 'daily', 'weekly'];

const achievementSchema = z.object({
  name: z.string().min(1, 'Nome obrigatório'),
  description: z.string().min(1, 'Descrição obrigatória'),
  icon: z.string().min(1, 'Ícone obrigatório'),
  requirement: z.number({ message: 'Requisito deve ser um número' }).min(1, 'Mínimo 1'),
  type: z.enum(['milestone', 'daily', 'weekly']),
  xpReward: z.number({ message: 'XP deve ser um número' }).min(0),
});
type AchievementForm = z.infer<typeof achievementSchema>;

const typeColors: Record<string, string> = {
  daily: 'border-[color:var(--tf-info)] bg-[rgba(111,168,220,0.14)] text-[color:var(--tf-info)]',
  weekly: 'border-[#7f6cff] bg-[rgba(127,108,255,0.14)] text-[#b6adff]',
  milestone: 'border-[color:var(--tf-primary)] bg-[rgba(217,164,65,0.14)] text-[color:var(--tf-primary)]',
};

const typeLabels: Record<string, string> = {
  daily: 'Diaria',
  weekly: 'Semanal',
  milestone: 'Marco',
};

const AchievementModal: React.FC<{
  editingItem: any | null;
  onClose: () => void;
}> = ({ editingItem, onClose }) => {
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<AchievementForm>({
    resolver: zodResolver(achievementSchema),
    defaultValues: editingItem
      ? {
          name: editingItem.name,
          description: editingItem.description,
          icon: editingItem.icon,
          requirement: editingItem.requirement,
          type: editingItem.type,
          xpReward: editingItem.xpReward,
        }
      : { icon: 'trophy', type: 'milestone', xpReward: 0, requirement: 1 },
  });

  const selectedIcon = watch('icon');

  const createMutation = useMutation({
    mutationFn: (data: AchievementForm) => achievements.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['achievements'] }); onClose(); },
  });

  const updateMutation = useMutation({
    mutationFn: (data: AchievementForm) => achievements.update(editingItem.id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['achievements'] }); onClose(); },
  });

  const onSubmit = (data: AchievementForm) => {
    editingItem ? updateMutation.mutate(data) : createMutation.mutate(data);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="tf-panel w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="tf-title text-xs uppercase tracking-[0.16em] text-[color:var(--tf-primary)]">Admin</p>
            <h2 className="tf-title mt-1 text-2xl text-[color:var(--tf-text-main)]">
              {editingItem ? 'Editar conquista' : 'Nova conquista'}
            </h2>
          </div>
          <button onClick={onClose} className="tf-btn tf-btn-secondary !p-2">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="tf-label">Nome</label>
            <input {...register('name')} type="text" placeholder="Nome da conquista" className="tf-input" />
            {errors.name && <p className="mt-1 text-xs text-[color:var(--tf-danger)]">{errors.name.message}</p>}
          </div>

          <div>
            <label className="tf-label">Descrição</label>
            <textarea {...register('description')} rows={2} placeholder="O que o usuário precisa fazer" className="tf-input resize-none" />
            {errors.description && <p className="mt-1 text-xs text-[color:var(--tf-danger)]">{errors.description.message}</p>}
          </div>

          <div>
            <label className="tf-label">Ícone</label>
            <div className="mt-2 flex flex-wrap gap-2">
              {ICON_OPTIONS.map((icon) => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => setValue('icon', icon, { shouldValidate: true })}
                  className={`tf-btn !p-2 ${selectedIcon === icon ? 'tf-btn-primary' : 'tf-btn-secondary'}`}
                  title={icon}
                >
                  {iconMap[icon]}
                </button>
              ))}
            </div>
            {errors.icon && <p className="mt-1 text-xs text-[color:var(--tf-danger)]">{errors.icon.message}</p>}
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="tf-label">Tipo</label>
              <select {...register('type')} className="tf-input">
                {TYPE_OPTIONS.map((t) => (
                  <option key={t} value={t}>{typeLabels[t]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="tf-label">Requisito</label>
              <input {...register('requirement', { valueAsNumber: true })} type="number" min={1} className="tf-input" />
              {errors.requirement && <p className="mt-1 text-xs text-[color:var(--tf-danger)]">{errors.requirement.message}</p>}
            </div>
            <div>
              <label className="tf-label">XP Reward</label>
              <input {...register('xpReward', { valueAsNumber: true })} type="number" min={0} className="tf-input" />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="tf-btn tf-btn-secondary">Cancelar</button>
            <button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
              className="tf-btn tf-btn-primary disabled:opacity-50"
            >
              {editingItem ? 'Salvar' : 'Criar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const Achievements: React.FC = () => {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const isAdmin = user?.role === 'admin';

  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['achievements'],
    queryFn: () => achievements.getAll(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => achievements.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['achievements'] }),
  });

  const achievementsList = data?.data || [];
  const achievedCount = achievementsList.filter((a: any) => a.achieved).length;
  const totalCount = achievementsList.length;
  const progress = totalCount > 0 ? (achievedCount / totalCount) * 100 : 0;

  const openCreate = () => { setEditingItem(null); setShowModal(true); };
  const openEdit = (item: any) => { setEditingItem(item); setShowModal(true); };

  return (
    <div className="space-y-6">
      <section className="tf-panel p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-4">
            <div className="tf-frame flex h-14 w-14 items-center justify-center">
              <Trophy className="h-7 w-7 text-[color:var(--tf-primary)]" />
            </div>
            <div>
              <p className="tf-title text-sm uppercase tracking-[0.18em] text-[color:var(--tf-primary)]">Hall de feitos</p>
              <h1 className="tf-title mt-2 text-3xl text-[color:var(--tf-text-main)]">Conquistas</h1>
              <p className="mt-2 text-[color:var(--tf-text-muted)]">Desbloqueie emblemas, marcos e premios da campanha.</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="tf-panel-inset min-w-[120px] p-4 text-center">
              <p className="tf-title text-xs uppercase tracking-[0.16em] text-[color:var(--tf-text-dim)]">Colecao</p>
              <p className="mt-2 text-3xl font-bold text-[color:var(--tf-primary)]">
                {achievedCount}/{totalCount}
              </p>
            </div>
            {isAdmin && (
              <button onClick={openCreate} className="tf-btn tf-btn-primary">
                <Plus className="h-5 w-5" /> Nova
              </button>
            )}
          </div>
        </div>

        <div className="mt-6">
          <div className="mb-2 flex justify-between text-sm">
            <span className="text-[color:var(--tf-text-muted)]">Progresso geral</span>
            <span className="font-semibold text-[color:var(--tf-primary)]">{Math.round(progress)}%</span>
          </div>
          <div className="tf-progress h-4 w-full">
            <div className="tf-progress-bar transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {isLoading ? (
          <div className="tf-panel col-span-full p-10 text-center text-[color:var(--tf-text-muted)]">Carregando...</div>
        ) : achievementsList.length === 0 ? (
          <div className="tf-panel col-span-full p-10 text-center text-[color:var(--tf-text-muted)]">Nenhuma conquista disponivel</div>
        ) : (
          achievementsList.map((achievement: any) => (
            <article
              key={achievement.id}
              className={`tf-panel relative p-5 ${achievement.achieved ? '' : 'opacity-70 grayscale-[0.15]'}`}
            >
              {isAdmin && (
                <div className="absolute right-3 top-3 flex gap-1">
                  <button
                    onClick={() => openEdit(achievement)}
                    className="tf-btn tf-btn-secondary !p-1.5"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => deleteMutation.mutate(achievement.id)}
                    className="tf-btn !border-[color:var(--tf-danger)] !bg-[rgba(216,91,83,0.12)] !p-1.5 !text-[color:var(--tf-danger)]"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}

              <div className="flex items-start justify-between gap-4">
                <div
                  className={`flex h-16 w-16 items-center justify-center rounded-[6px] border-2 ${
                    achievement.achieved
                      ? 'border-[color:var(--tf-border-accent)] bg-[rgba(217,164,65,0.12)] text-[color:var(--tf-primary)]'
                      : 'border-[color:var(--tf-border-soft)] bg-[rgba(17,22,29,0.7)] text-[color:var(--tf-text-dim)]'
                  }`}
                >
                  {achievement.achieved
                    ? iconMap[achievement.icon] || <Trophy className="h-8 w-8" />
                    : <Lock className="h-8 w-8" />}
                </div>
                {achievement.achieved && (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-[color:var(--tf-success)] bg-[rgba(110,203,99,0.15)]">
                    <Check className="h-4 w-4 text-[color:var(--tf-success)]" />
                  </div>
                )}
              </div>

              <div className="mt-4">
                <h3 className="tf-title text-xl text-[color:var(--tf-text-main)]">{achievement.name}</h3>
                <p className="mt-2 min-h-[48px] text-sm leading-6 text-[color:var(--tf-text-muted)]">{achievement.description}</p>
                {isAdmin && (
                  <p className="mt-1 text-xs text-[color:var(--tf-text-dim)]">
                    Requisito: {achievement.requirement}
                  </p>
                )}
              </div>

              <div className="mt-4 flex items-center justify-between gap-3">
                <span className={`tf-badge border ${typeColors[achievement.type] || typeColors.milestone}`}>
                  {typeLabels[achievement.type] || achievement.type}
                </span>
                {achievement.xpReward > 0 && (
                  <span className="flex items-center gap-1 text-sm font-semibold text-[color:var(--tf-primary)]">
                    <Zap className="h-4 w-4" />+{achievement.xpReward} XP
                  </span>
                )}
              </div>
            </article>
          ))
        )}
      </div>

      {showModal && (
        <AchievementModal
          editingItem={editingItem}
          onClose={() => { setShowModal(false); setEditingItem(null); }}
        />
      )}
    </div>
  );
};

export default Achievements;
