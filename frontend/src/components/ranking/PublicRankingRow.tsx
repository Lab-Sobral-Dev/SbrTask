import React, { useEffect, useRef } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Avatar } from '../character/Avatar';
import type { LeaderboardEntry } from '../../types';

interface Props {
  player: LeaderboardEntry;
  delta: number;
  highlighted: boolean;
  animationDelay?: number;
}

const PublicRankingRow: React.FC<Props> = ({ player, delta, highlighted, animationDelay = 0 }) => {
  const rowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (highlighted && rowRef.current) {
      rowRef.current.classList.add('rank-flash');
      const t = setTimeout(() => rowRef.current?.classList.remove('rank-flash'), 1200);
      return () => clearTimeout(t);
    }
  }, [highlighted]);

  const DeltaIcon = delta > 0 ? TrendingUp : delta < 0 ? TrendingDown : Minus;
  const deltaColor =
    delta > 0
      ? 'text-[color:var(--tf-success)]'
      : delta < 0
      ? 'text-[color:var(--tf-danger)]'
      : 'text-[color:var(--tf-text-dim)]';
  const deltaLabel = delta > 0 ? `▲${delta}` : delta < 0 ? `▼${Math.abs(delta)}` : '—';

  return (
    <div
      ref={rowRef}
      className="tf-panel flex items-center gap-3 p-3 transition-transform duration-200 hover:translate-x-1 hover:border-[color:var(--tf-primary)]"
      style={{ animationDelay: `${animationDelay}ms`, animation: 'rankSlideIn 0.35s ease both' }}
    >
      <div className="w-8 text-center font-bold text-sm text-[color:var(--tf-text-dim)] flex-shrink-0">
        #{player.rank}
      </div>

      <div className="tf-frame h-11 w-11 overflow-hidden flex-shrink-0 flex items-center justify-center">
        <Avatar data={player.avatar} size="sm" />
      </div>

      <div className="flex-1 min-w-0">
        <p className="tf-title text-sm text-[color:var(--tf-text-main)] truncate">{player.name}</p>
        <p className="text-[10px] uppercase tracking-[1.2px] text-[color:var(--tf-text-dim)]">
          {player.sector}
        </p>
      </div>

      <div className="hidden sm:flex gap-5 flex-shrink-0">
        <div className="tf-panel-inset px-3 py-1 text-center">
          <p className="text-[9px] uppercase tracking-[1.5px] text-[color:var(--tf-text-dim)]">Nível</p>
          <p className="text-base font-bold text-[color:var(--tf-info)]">{player.level}</p>
        </div>
        <div className="tf-panel-inset px-3 py-1 text-center">
          <p className="text-[9px] uppercase tracking-[1.5px] text-[color:var(--tf-text-dim)]">XP</p>
          <p className="text-base font-bold text-[color:var(--tf-primary)]">
            {player.xp.toLocaleString()}
          </p>
        </div>
      </div>

      <div className={`w-8 text-center flex-shrink-0 ${deltaColor}`}>
        <DeltaIcon className="h-4 w-4 mx-auto" />
        <span className="text-[10px] font-bold">{deltaLabel}</span>
      </div>
    </div>
  );
};

export default PublicRankingRow;
