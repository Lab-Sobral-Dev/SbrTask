import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { achievements } from '../services/api';
import { Award, Check, Crown, Flame, Lock, Medal, Target, Trophy, Zap } from 'lucide-react';

const iconMap: Record<string, React.ReactNode> = {
  trophy: <Trophy className="h-8 w-8" />,
  medal: <Medal className="h-8 w-8" />,
  award: <Award className="h-8 w-8" />,
  crown: <Crown className="h-8 w-8" />,
  zap: <Zap className="h-8 w-8" />,
  flame: <Flame className="h-8 w-8" />,
  target: <Target className="h-8 w-8" />,
};

const Achievements: React.FC = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['achievements'],
    queryFn: () => achievements.getAll(),
  });

  const achievementsList = data?.data || [];
  const achievedCount = achievementsList.filter((a: any) => a.achieved).length;
  const totalCount = achievementsList.length;
  const progress = totalCount > 0 ? (achievedCount / totalCount) * 100 : 0;

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
          <div className="tf-panel-inset min-w-[180px] p-4 text-center">
            <p className="tf-title text-xs uppercase tracking-[0.16em] text-[color:var(--tf-text-dim)]">Colecao</p>
            <p className="mt-2 text-3xl font-bold text-[color:var(--tf-primary)]">
              {achievedCount}/{totalCount}
            </p>
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
              <div className="flex items-start justify-between gap-4">
                <div
                  className={`flex h-16 w-16 items-center justify-center rounded-[6px] border-2 ${
                    achievement.achieved
                      ? 'border-[color:var(--tf-border-accent)] bg-[rgba(217,164,65,0.12)] text-[color:var(--tf-primary)]'
                      : 'border-[color:var(--tf-border-soft)] bg-[rgba(17,22,29,0.7)] text-[color:var(--tf-text-dim)]'
                  }`}
                >
                  {achievement.achieved ? iconMap[achievement.icon] || <Trophy className="h-8 w-8" /> : <Lock className="h-8 w-8" />}
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
    </div>
  );
};

export default Achievements;
