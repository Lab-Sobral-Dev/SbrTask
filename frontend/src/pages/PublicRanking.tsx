import React, { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Users } from 'lucide-react';
import { achievements } from '../services/api';
import { connectPublicSocket, disconnectPublicSocket } from '../services/socket';
import PublicRankingPodium from '../components/ranking/PublicRankingPodium';
import PublicRankingRow from '../components/ranking/PublicRankingRow';
import type { LeaderboardEntry } from '../types';

const SECTORS = ['TI', 'RH', 'Financeiro', 'Marketing', 'Vendas', 'Operacoes'];
const PERIODS = [
  { value: 'all', label: 'Geral' },
  { value: 'today', label: 'Hoje' },
  { value: 'week', label: 'Semana' },
  { value: 'month', label: 'Mês' },
];

const PublicRanking: React.FC = () => {
  const [sector, setSector] = useState('');
  const [period, setPeriod] = useState('all');
  const [search, setSearch] = useState('');
  const [ranking, setRanking] = useState<LeaderboardEntry[]>([]);
  const [deltas, setDeltas] = useState<Map<string, number>>(new Map());
  const [highlightedIds, setHighlightedIds] = useState<Set<string>>(new Set());
  const prevRanksRef = useRef<Map<string, number>>(new Map());

  const { data, isLoading } = useQuery({
    queryKey: ['public-leaderboard', sector, period],
    queryFn: () => achievements.getLeaderboard(sector || undefined, period),
    refetchInterval: 30_000,
  });

  useEffect(() => {
    const fetched: LeaderboardEntry[] = data?.data ?? [];
    if (fetched.length === 0) return;
    setRanking(fetched);
    prevRanksRef.current = new Map(fetched.map((e) => [e.id, e.rank]));
    setDeltas(new Map());
  }, [data]);

  useEffect(() => {
    const socket = connectPublicSocket();

    socket.on('ranking_update', (updated: LeaderboardEntry[]) => {
      const newDeltas = new Map<string, number>();
      const newHighlights = new Set<string>();

      updated.forEach((entry) => {
        const prev = prevRanksRef.current.get(entry.id);
        if (prev !== undefined) {
          const diff = prev - entry.rank;
          newDeltas.set(entry.id, diff);
          if (diff !== 0) newHighlights.add(entry.id);
        }
      });

      prevRanksRef.current = new Map(updated.map((e) => [e.id, e.rank]));
      setDeltas(newDeltas);
      setHighlightedIds(newHighlights);
      setRanking(updated);

      setTimeout(() => setHighlightedIds(new Set()), 1200);
    });

    return () => {
      socket.off('ranking_update');
      disconnectPublicSocket();
    };
  }, []);

  const filtered = ranking.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()),
  );

  const top3 = filtered.slice(0, 3);
  const rest = filtered.slice(3);

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <section className="tf-panel p-6">
        <div className="flex items-start gap-4">
          <div className="tf-frame flex h-14 w-14 items-center justify-center">
            <Users className="h-7 w-7 text-[color:var(--tf-primary)]" />
          </div>
          <div>
            <p className="tf-title text-xs uppercase tracking-[0.18em] text-[color:var(--tf-primary)]">
              Arena Competitiva
            </p>
            <h1 className="tf-title mt-1 text-3xl text-[color:var(--tf-text-main)]">Ranking</h1>
            <p className="mt-1 text-sm text-[color:var(--tf-text-muted)]">
              Classificação em tempo real — {ranking.length} jogador{ranking.length !== 1 ? 'es' : ''}
            </p>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {PERIODS.map((p) => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={`tf-btn ${period === p.value ? 'tf-btn-primary' : 'tf-btn-secondary'} !px-4 !py-2 !text-xs`}
            >
              {p.label}
            </button>
          ))}
          <span className="mx-1 self-center text-[color:var(--tf-border)]">|</span>
          <button
            onClick={() => setSector('')}
            className={`tf-btn ${sector === '' ? 'tf-btn-primary' : 'tf-btn-secondary'} !px-4 !py-2 !text-xs`}
          >
            Todos
          </button>
          {SECTORS.map((s) => (
            <button
              key={s}
              onClick={() => setSector(s)}
              className={`tf-btn ${sector === s ? 'tf-btn-primary' : 'tf-btn-secondary'} !px-4 !py-2 !text-xs`}
            >
              {s}
            </button>
          ))}
        </div>

        <div className="mt-3">
          <input
            type="text"
            placeholder="Buscar jogador..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="tf-panel-inset w-full max-w-xs px-3 py-2 text-sm text-[color:var(--tf-text-main)] placeholder-[color:var(--tf-text-dim)] outline-none focus:border-[color:var(--tf-primary)] border border-[color:var(--tf-border)]"
          />
        </div>
      </section>

      {isLoading ? (
        <div className="tf-panel p-10 text-center text-[color:var(--tf-text-muted)]">
          Carregando...
        </div>
      ) : filtered.length === 0 ? (
        <div className="tf-panel p-10 text-center text-[color:var(--tf-text-muted)]">
          Nenhum jogador encontrado
        </div>
      ) : (
        <>
          {top3.length >= 3 && <PublicRankingPodium top3={top3} />}

          <div className="space-y-2">
            {rest.map((player, idx) => (
              <PublicRankingRow
                key={player.id}
                player={player}
                delta={deltas.get(player.id) ?? 0}
                highlighted={highlightedIds.has(player.id)}
                animationDelay={idx * 40}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default PublicRanking;
