import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Award, Crown, Medal, TrendingUp, Users } from 'lucide-react';
import { Avatar } from '../components/character/Avatar';
import { achievements } from '../services/api';

const Leaderboard: React.FC = () => {
  const [selectedSector, setSelectedSector] = useState<string>('');

  const { data, isLoading } = useQuery({
    queryKey: ['leaderboard', selectedSector],
    queryFn: () => achievements.getLeaderboard(selectedSector || undefined),
  });

  const leaderboard = data?.data || [];
  const sectors = ['TI', 'RH', 'Financeiro', 'Marketing', 'Vendas', 'Operacoes'];

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="h-6 w-6 text-[color:var(--tf-primary)]" />;
      case 2:
        return <Medal className="h-6 w-6 text-[#b9c2cf]" />;
      case 3:
        return <Award className="h-6 w-6 text-[#c8874b]" />;
      default:
        return <span className="w-6 text-center font-bold text-[color:var(--tf-text-dim)]">{rank}</span>;
    }
  };

  const getRankStyles = (rank: number) => {
    switch (rank) {
      case 1:
        return 'border-[color:var(--tf-border-accent)] bg-[linear-gradient(180deg,rgba(217,164,65,0.18),rgba(27,36,48,0.98))]';
      case 2:
        return 'border-[#6d7988] bg-[linear-gradient(180deg,rgba(148,163,184,0.12),rgba(27,36,48,0.98))]';
      case 3:
        return 'border-[#8f5d34] bg-[linear-gradient(180deg,rgba(200,135,75,0.14),rgba(27,36,48,0.98))]';
      default:
        return '';
    }
  };

  return (
    <div className="space-y-6">
      <section className="tf-panel p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-4">
            <div className="tf-frame flex h-14 w-14 items-center justify-center">
              <Users className="h-7 w-7 text-[color:var(--tf-primary)]" />
            </div>
            <div>
              <p className="tf-title text-sm uppercase tracking-[0.18em] text-[color:var(--tf-primary)]">Arena competitiva</p>
              <h1 className="tf-title mt-2 text-3xl text-[color:var(--tf-text-main)]">Ranking</h1>
              <p className="mt-2 text-[color:var(--tf-text-muted)]">Veja quem esta liderando a campanha por XP e evolucao.</p>
            </div>
          </div>
          <div className="tf-panel-inset flex items-center gap-3 px-4 py-3">
            <Users className="h-5 w-5 text-[color:var(--tf-primary)]" />
            <span className="font-semibold text-[color:var(--tf-text-main)]">{leaderboard.length} jogadores</span>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedSector('')}
            className={`tf-btn ${selectedSector === '' ? 'tf-btn-primary' : 'tf-btn-secondary'} !px-4 !py-2 !text-sm`}
          >
            Todos
          </button>
          {sectors.map((sector) => (
            <button
              key={sector}
              onClick={() => setSelectedSector(sector)}
              className={`tf-btn ${selectedSector === sector ? 'tf-btn-primary' : 'tf-btn-secondary'} !px-4 !py-2 !text-sm`}
            >
              {sector}
            </button>
          ))}
        </div>
      </section>

      <div className="space-y-3">
        {isLoading ? (
          <div className="tf-panel p-10 text-center text-[color:var(--tf-text-muted)]">Carregando...</div>
        ) : leaderboard.length === 0 ? (
          <div className="tf-panel p-10 text-center text-[color:var(--tf-text-muted)]">Nenhum jogador encontrado</div>
        ) : (
          leaderboard.map((player: any) => (
            <article key={player.id} className={`tf-panel p-4 ${getRankStyles(player.rank)}`}>
              <div className="flex flex-col gap-4 md:flex-row md:items-center">
                <div className="flex items-center gap-4 md:w-[110px]">
                  <div className="tf-panel-inset flex h-12 w-12 items-center justify-center">{getRankIcon(player.rank)}</div>
                  <div className="text-sm uppercase tracking-[0.14em] text-[color:var(--tf-text-dim)]">#{player.rank}</div>
                </div>

                <div className="flex items-center gap-4 md:flex-1">
                  <div className="tf-frame h-14 w-14 overflow-hidden">
                    <Avatar data={player.avatar} size="sm" />
                  </div>
                  <div>
                    <h3 className="tf-title text-xl text-[color:var(--tf-text-main)]">{player.name}</h3>
                    <p className="mt-1 text-sm uppercase tracking-[0.14em] text-[color:var(--tf-text-dim)]">{player.sector}</p>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 md:w-[260px]">
                  <div className="tf-panel-inset p-3 text-center">
                    <p className="tf-title text-xs uppercase tracking-[0.16em] text-[color:var(--tf-text-dim)]">Nivel</p>
                    <p className="mt-2 text-xl font-bold text-[color:var(--tf-primary)]">{player.level}</p>
                  </div>
                  <div className="tf-panel-inset p-3 text-center">
                    <p className="tf-title text-xs uppercase tracking-[0.16em] text-[color:var(--tf-text-dim)]">XP total</p>
                    <p className="mt-2 flex items-center justify-center gap-2 text-lg font-semibold text-[color:var(--tf-text-main)]">
                      <TrendingUp className="h-4 w-4 text-[color:var(--tf-info)]" />
                      {player.xp.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            </article>
          ))
        )}
      </div>
    </div>
  );
};

export default Leaderboard;
