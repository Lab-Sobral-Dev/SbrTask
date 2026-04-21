import React from 'react';
import { Crown, Medal, Award } from 'lucide-react';
import { Avatar } from '../character/Avatar';
import type { LeaderboardEntry } from '../../types';

interface Props {
  top3: LeaderboardEntry[];
}

// visual order: left=2nd, center=1st, right=3rd
const podiumOrder = [1, 0, 2];

// indexed by playerIdx (0=1st place, 1=2nd place, 2=3rd place)
const configs = [
  {
    // 1st place
    baseHeight: 'h-20',
    frameSize: 'h-20 w-20',
    avatarSize: 'md' as const,
    borderColor: 'border-[color:var(--tf-border-accent)]',
    shadowClass: 'shadow-[0_0_24px_rgba(217,164,65,0.5)]',
    glowClass: 'animate-pulse',
    icon: <Crown className="h-6 w-6 text-[color:var(--tf-primary)]" />,
    bgGradient: 'linear-gradient(180deg,rgba(217,164,65,0.18),transparent)',
  },
  {
    // 2nd place
    baseHeight: 'h-14',
    frameSize: 'h-16 w-16',
    avatarSize: 'sm' as const,
    borderColor: 'border-[#6d7988]',
    shadowClass: 'shadow-[0_0_14px_rgba(185,194,207,0.3)]',
    glowClass: '',
    icon: <Medal className="h-5 w-5 text-[#b9c2cf]" />,
    bgGradient: 'linear-gradient(180deg,rgba(185,194,207,0.1),transparent)',
  },
  {
    // 3rd place
    baseHeight: 'h-10',
    frameSize: 'h-14 w-14',
    avatarSize: 'sm' as const,
    borderColor: 'border-[#8f5d34]',
    shadowClass: 'shadow-[0_0_10px_rgba(200,135,75,0.3)]',
    glowClass: '',
    icon: <Award className="h-5 w-5 text-[#c8874b]" />,
    bgGradient: 'linear-gradient(180deg,rgba(200,135,75,0.1),transparent)',
  },
];

const PublicRankingPodium: React.FC<Props> = ({ top3 }) => {
  if (top3.length < 3) return null;

  return (
    <div className="flex items-end justify-center gap-4 mb-10">
      {podiumOrder.map((playerIdx) => {
        const player = top3[playerIdx];
        const cfg = configs[playerIdx];

        return (
          <div key={player.id} className="flex flex-col items-center gap-2">
            {playerIdx === 0 && (
              <Crown className="h-6 w-6 text-[color:var(--tf-primary)] animate-bounce" />
            )}

            {/* Avatar frame — tf-frame sem rounded para não cortar o pixel-art */}
            <div
              className={`tf-frame ${cfg.frameSize} overflow-hidden flex items-center justify-center border-2 ${cfg.borderColor} ${cfg.shadowClass} ${cfg.glowClass}`}
            >
              <Avatar data={player.avatar} size={cfg.avatarSize} />
            </div>

            <div className="text-center">
              <p className="tf-title text-sm text-[color:var(--tf-text-main)] max-w-[80px] truncate">
                {player.name}
              </p>
              <p className="text-[10px] text-[color:var(--tf-text-dim)] uppercase tracking-[1px]">
                {player.xp.toLocaleString()} XP
              </p>
            </div>

            <div
              className={`w-[90px] ${cfg.baseHeight} flex items-center justify-center border-t-2 ${cfg.borderColor}`}
              style={{ background: cfg.bgGradient }}
            >
              {cfg.icon}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default PublicRankingPodium;
