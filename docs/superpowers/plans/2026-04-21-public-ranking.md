# Public Ranking — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Disponibilizar `/ranking` pública com avatares pixel-art, filtros por período/setor, busca e atualização em tempo real via Socket.io sem exigir autenticação.

**Architecture:** Backend estende `getLeaderboard` com filtro `?period=` e emite `ranking_update` para a sala `ranking-public` após cada aprovação de XP. Frontend cria rota pública `/ranking` com `PublicLayout` próprio (sem sidebar autenticada), pódio animado para top 3, tabela com deltas de posição e conexão Socket.io sem token.

**Tech Stack:** Node.js + Express 5 + Prisma 6 + Socket.io 4 (backend) · React 19 + Vite + Tailwind + React Query + socket.io-client (frontend) · DiceBear pixel-art (avatares)

---

## File Map

| Ação | Arquivo |
|------|---------|
| Modificar | `backend/src/controllers/achievementController.ts` |
| Modificar | `backend/src/index.ts` |
| Modificar | `backend/src/controllers/taskController.ts` |
| Modificar | `frontend/src/services/api.ts` |
| Modificar | `frontend/src/services/socket.ts` |
| Modificar | `frontend/src/App.tsx` |
| Criar | `frontend/src/components/layout/PublicLayout.tsx` |
| Criar | `frontend/src/components/ranking/PublicRankingPodium.tsx` |
| Criar | `frontend/src/components/ranking/PublicRankingRow.tsx` |
| Criar | `frontend/src/pages/PublicRanking.tsx` |

---

## Task 1: Backend — Filtro de período no getLeaderboard

**Files:**
- Modify: `backend/src/controllers/achievementController.ts:61-93`

- [ ] **Step 1: Substituir a função `getLeaderboard` com suporte a `?period=`**

Abrir `backend/src/controllers/achievementController.ts` e substituir toda a função `getLeaderboard` (linhas 61–93) pelo código abaixo:

```typescript
export const getLeaderboard = async (req: Request, res: Response) => {
  try {
    const { sector, period } = req.query;

    // Para period=all (ou ausente), usa XP total acumulado
    if (!period || period === 'all') {
      const where: any = {};
      if (sector) where.sector = sector as string;

      const users = await prisma.user.findMany({
        where,
        select: { id: true, name: true, sector: true, level: true, xp: true, avatar: true },
        orderBy: { xp: 'desc' },
        take: 20,
      });

      return res.json(users.map((u, i) => ({ rank: i + 1, ...u })));
    }

    // Para períodos específicos: soma XP ganho de tarefas concluídas no intervalo
    const now = new Date();
    let periodStart: Date;
    if (period === 'today') {
      periodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (period === 'week') {
      periodStart = new Date(now);
      periodStart.setDate(now.getDate() - 7);
    } else if (period === 'month') {
      periodStart = new Date(now);
      periodStart.setDate(now.getDate() - 30);
    } else {
      return res.status(400).json({ error: 'period inválido. Use: today, week, month, all' });
    }

    const assignments = await prisma.taskAssignment.findMany({
      where: {
        status: 'completed',
        completedAt: { gte: periodStart },
        ...(sector ? { user: { sector: sector as string } } : {}),
      },
      include: {
        task: { select: { xpReward: true } },
        user: { select: { id: true, name: true, sector: true, level: true, avatar: true } },
      },
    });

    // Agregar XP por usuário
    const xpByUser = new Map<string, { xp: number; user: typeof assignments[0]['user'] }>();
    for (const a of assignments) {
      if (!xpByUser.has(a.userId)) {
        xpByUser.set(a.userId, { xp: 0, user: a.user });
      }
      xpByUser.get(a.userId)!.xp += a.task.xpReward;
    }

    const leaderboard = Array.from(xpByUser.values())
      .sort((a, b) => b.xp - a.xp)
      .slice(0, 20)
      .map(({ xp, user }, index) => ({ rank: index + 1, ...user, xp }));

    res.json(leaderboard);
  } catch (error) {
    console.error('Erro ao buscar leaderboard:', error);
    res.status(500).json({ error: 'Erro ao buscar ranking' });
  }
};
```

- [ ] **Step 2: Verificar que o backend compila sem erros**

```bash
cd backend && npx tsc --noEmit
```

Esperado: sem erros de tipo.

- [ ] **Step 3: Commit**

```bash
git add backend/src/controllers/achievementController.ts
git commit -m "feat(backend): add period filter to leaderboard endpoint"
```

---

## Task 2: Backend — Socket.io: sala pública e broadcast ranking_update

**Files:**
- Modify: `backend/src/index.ts:33-37`
- Modify: `backend/src/controllers/taskController.ts` (após linha 334)

- [ ] **Step 1: Adicionar handler `join-ranking` no `index.ts`**

Em `backend/src/index.ts`, localizar o bloco `io.on('connection', ...)` (linhas 33–37) e substituir por:

```typescript
io.on('connection', (socket) => {
  socket.on('join-user-room', (userId: string) => {
    socket.join(`user-${userId}`);
  });

  socket.on('join-ranking', () => {
    socket.join('ranking-public');
  });
});
```

- [ ] **Step 2: Emitir `ranking_update` após aprovar XP em `taskController.ts`**

Em `backend/src/controllers/taskController.ts`, após o bloco `try { getIo().to(...).emit('xp_update', ...) }` (em torno da linha 330–334), adicionar o broadcast do ranking:

```typescript
    // Broadcast ranking atualizado para a sala pública
    try {
      const topUsers = await prisma.user.findMany({
        select: { id: true, name: true, sector: true, level: true, xp: true, avatar: true },
        orderBy: { xp: 'desc' },
        take: 20,
      });
      const rankingPayload = topUsers.map((u, i) => ({ rank: i + 1, ...u }));
      getIo().to('ranking-public').emit('ranking_update', rankingPayload);
    } catch (_) {}
```

O trecho resultante deve ficar assim (linhas 328–340 aproximadamente):

```typescript
    // Empurrar XP/level atualizados para o frontend do usuário via socket
    try {
      getIo().to(`user-${targetUserId}`).emit('xp_update', {
        xp: updatedUser.xp,
        level: newLevel,
      });
    } catch (_) {}

    // Broadcast ranking atualizado para a sala pública
    try {
      const topUsers = await prisma.user.findMany({
        select: { id: true, name: true, sector: true, level: true, xp: true, avatar: true },
        orderBy: { xp: 'desc' },
        take: 20,
      });
      const rankingPayload = topUsers.map((u, i) => ({ rank: i + 1, ...u }));
      getIo().to('ranking-public').emit('ranking_update', rankingPayload);
    } catch (_) {}
```

- [ ] **Step 3: Verificar compilação**

```bash
cd backend && npx tsc --noEmit
```

Esperado: sem erros.

- [ ] **Step 4: Commit**

```bash
git add backend/src/index.ts backend/src/controllers/taskController.ts
git commit -m "feat(backend): broadcast ranking_update to public socket room on XP award"
```

---

## Task 3: Frontend — Adicionar período ao API e socket público

**Files:**
- Modify: `frontend/src/services/api.ts:91-92`
- Modify: `frontend/src/services/socket.ts`

- [ ] **Step 1: Adicionar param `period` ao `getLeaderboard` em `api.ts`**

Em `frontend/src/services/api.ts`, substituir a linha do `getLeaderboard`:

```typescript
// ANTES
  getLeaderboard: (sector?: string) =>
    api.get('/achievements/leaderboard', { params: { sector } }),

// DEPOIS
  getLeaderboard: (sector?: string, period?: string) =>
    api.get('/achievements/leaderboard', { params: { sector, period } }),
```

- [ ] **Step 2: Adicionar `connectPublicSocket` ao `socket.ts`**

Em `frontend/src/services/socket.ts`, adicionar ao final do arquivo (antes de `export default socket`):

```typescript
let _publicSocket: Socket | null = null;

export const connectPublicSocket = (): Socket => {
  if (_publicSocket?.connected) return _publicSocket;

  const SOCKET_URL = API_URL.replace('/api', '');
  _publicSocket = io(SOCKET_URL, {
    transports: ['websocket', 'polling'],
  });

  _publicSocket.on('connect', () => {
    _publicSocket?.emit('join-ranking');
  });

  return _publicSocket;
};

export const disconnectPublicSocket = (): void => {
  if (_publicSocket) {
    _publicSocket.disconnect();
    _publicSocket = null;
  }
};
```

- [ ] **Step 3: Verificar compilação do frontend**

```bash
cd frontend && npx tsc --noEmit
```

Esperado: sem erros.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/services/api.ts frontend/src/services/socket.ts
git commit -m "feat(frontend): add period param to leaderboard API and public socket helper"
```

---

## Task 4: Frontend — Criar PublicLayout

**Files:**
- Create: `frontend/src/components/layout/PublicLayout.tsx`

- [ ] **Step 1: Criar o componente**

Criar `frontend/src/components/layout/PublicLayout.tsx`:

```tsx
import React from 'react';
import { Link, Outlet } from 'react-router-dom';
import { Crown } from 'lucide-react';

const PublicLayout: React.FC = () => (
  <div className="tf-screen min-h-screen flex flex-col">
    <header className="tf-panel border-y-0 border-l-0 border-r-0 border-b-2 border-[color:var(--tf-border-soft)] sticky top-0 z-50 flex items-center gap-4 px-4 py-3 lg:px-8">
      <Link to="/ranking" className="flex items-center gap-3">
        <div className="tf-frame flex h-9 w-9 items-center justify-center">
          <Crown className="h-4 w-4 text-[color:var(--tf-primary)]" />
        </div>
        <div>
          <span className="tf-title block text-lg text-[color:var(--tf-text-main)]">SbrTask</span>
          <span className="text-[10px] uppercase tracking-[0.2em] text-[color:var(--tf-text-dim)]">
            Terminal Fantasy
          </span>
        </div>
      </Link>

      <div className="ml-auto flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="inline-block h-2 w-2 rounded-full bg-[color:var(--tf-success)] animate-pulse" />
          <span className="text-[11px] uppercase tracking-[1px] text-[color:var(--tf-success)]">Ao vivo</span>
        </div>
        <Link
          to="/login"
          className="tf-btn tf-btn-secondary !px-4 !py-2 !text-xs"
        >
          Entrar
        </Link>
      </div>
    </header>

    <main className="flex-1 p-4 lg:p-8">
      <Outlet />
    </main>
  </div>
);

export default PublicLayout;
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/components/layout/PublicLayout.tsx
git commit -m "feat(frontend): add PublicLayout for unauthenticated pages"
```

---

## Task 5: Frontend — Criar PublicRankingPodium

**Files:**
- Create: `frontend/src/components/ranking/PublicRankingPodium.tsx`

- [ ] **Step 1: Criar o componente do pódio**

Criar `frontend/src/components/ranking/PublicRankingPodium.tsx`:

```tsx
import React from 'react';
import { Crown, Medal, Award } from 'lucide-react';
import { Avatar } from '../character/Avatar';
import type { LeaderboardEntry } from '../../types';

interface Props {
  top3: LeaderboardEntry[];
}

const podiumOrder = [1, 0, 2]; // visual: 2nd | 1st | 3rd

const configs = [
  {
    label: '2',
    baseHeight: 'h-14',
    avatarSize: 'h-16 w-16' as const,
    borderColor: 'border-[#6d7988]',
    shadowClass: 'shadow-[0_0_14px_rgba(185,194,207,0.3)]',
    icon: <Medal className="h-5 w-5 text-[#b9c2cf]" />,
    glowClass: '',
  },
  {
    label: '1',
    baseHeight: 'h-20',
    avatarSize: 'h-20 w-20' as const,
    borderColor: 'border-[color:var(--tf-border-accent)]',
    shadowClass: 'shadow-[0_0_24px_rgba(217,164,65,0.5)]',
    icon: <Crown className="h-6 w-6 text-[color:var(--tf-primary)]" />,
    glowClass: 'animate-pulse',
  },
  {
    label: '3',
    baseHeight: 'h-10',
    avatarSize: 'h-14 w-14' as const,
    borderColor: 'border-[#8f5d34]',
    shadowClass: 'shadow-[0_0_10px_rgba(200,135,75,0.3)]',
    icon: <Award className="h-5 w-5 text-[#c8874b]" />,
    glowClass: '',
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

            <div
              className={`tf-frame overflow-hidden rounded-full ${cfg.avatarSize} border-2 ${cfg.borderColor} ${cfg.shadowClass} ${cfg.glowClass}`}
            >
              <Avatar data={player.avatar} size="sm" />
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
              style={{
                background:
                  playerIdx === 0
                    ? 'linear-gradient(180deg,rgba(217,164,65,0.18),transparent)'
                    : playerIdx === 1
                    ? 'linear-gradient(180deg,rgba(185,194,207,0.1),transparent)'
                    : 'linear-gradient(180deg,rgba(200,135,75,0.1),transparent)',
              }}
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
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/components/ranking/PublicRankingPodium.tsx
git commit -m "feat(frontend): add PublicRankingPodium component with pixel-art avatars"
```

---

## Task 6: Frontend — Criar PublicRankingRow

**Files:**
- Create: `frontend/src/components/ranking/PublicRankingRow.tsx`

- [ ] **Step 1: Criar o componente de linha**

Criar `frontend/src/components/ranking/PublicRankingRow.tsx`:

```tsx
import React, { useEffect, useRef } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Avatar } from '../character/Avatar';
import type { LeaderboardEntry } from '../../types';

interface Props {
  player: LeaderboardEntry;
  delta: number; // positivo = subiu, negativo = desceu, 0 = mesmo
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

  const DeltaIcon =
    delta > 0 ? TrendingUp : delta < 0 ? TrendingDown : Minus;
  const deltaColor =
    delta > 0
      ? 'text-[color:var(--tf-success)]'
      : delta < 0
      ? 'text-[color:var(--tf-danger)]'
      : 'text-[color:var(--tf-text-dim)]';
  const deltaLabel =
    delta > 0 ? `▲${delta}` : delta < 0 ? `▼${Math.abs(delta)}` : '—';

  return (
    <div
      ref={rowRef}
      className="tf-panel flex items-center gap-3 p-3 transition-transform duration-200 hover:translate-x-1 hover:border-[color:var(--tf-primary)]"
      style={{ animationDelay: `${animationDelay}ms`, animation: 'rankSlideIn 0.35s ease both' }}
    >
      {/* Posição */}
      <div className="w-8 text-center font-bold text-sm text-[color:var(--tf-text-dim)] flex-shrink-0">
        #{player.rank}
      </div>

      {/* Avatar */}
      <div className="tf-frame h-11 w-11 overflow-hidden rounded-full flex-shrink-0">
        <Avatar data={player.avatar} size="sm" />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="tf-title text-sm text-[color:var(--tf-text-main)] truncate">{player.name}</p>
        <p className="text-[10px] uppercase tracking-[1.2px] text-[color:var(--tf-text-dim)]">
          {player.sector}
        </p>
      </div>

      {/* Stats */}
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

      {/* Delta */}
      <div className={`w-8 text-center flex-shrink-0 ${deltaColor}`}>
        <DeltaIcon className="h-4 w-4 mx-auto" />
        <span className="text-[10px] font-bold">{deltaLabel}</span>
      </div>
    </div>
  );
};

export default PublicRankingRow;
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/components/ranking/PublicRankingRow.tsx
git commit -m "feat(frontend): add PublicRankingRow with delta animation"
```

---

## Task 7: Frontend — Criar página PublicRanking

**Files:**
- Create: `frontend/src/pages/PublicRanking.tsx`

- [ ] **Step 1: Criar a página principal**

Criar `frontend/src/pages/PublicRanking.tsx`:

```tsx
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
    refetchInterval: 30_000, // fallback poll caso socket desconecte
  });

  // Sync fetch inicial → estado local
  useEffect(() => {
    const fetched: LeaderboardEntry[] = data?.data ?? [];
    if (fetched.length === 0) return;
    setRanking(fetched);
    prevRanksRef.current = new Map(fetched.map((e) => [e.id, e.rank]));
    setDeltas(new Map());
  }, [data]);

  // Socket.io — sala pública sem auth
  useEffect(() => {
    const socket = connectPublicSocket();

    socket.on('ranking_update', (updated: LeaderboardEntry[]) => {
      const newDeltas = new Map<string, number>();
      const newHighlights = new Set<string>();

      updated.forEach((entry) => {
        const prev = prevRanksRef.current.get(entry.id);
        if (prev !== undefined) {
          const diff = prev - entry.rank; // positivo = subiu
          newDeltas.set(entry.id, diff);
          if (diff !== 0) newHighlights.add(entry.id);
        }
      });

      prevRanksRef.current = new Map(updated.map((e) => [e.id, e.rank]));
      setDeltas(newDeltas);
      setHighlightedIds(newHighlights);
      setRanking(updated);

      // Limpar highlights após 1.2s
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
      {/* Cabeçalho */}
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

        {/* Filtros de período */}
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

        {/* Busca */}
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

      {/* Conteúdo */}
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
          {/* Pódio top 3 */}
          {top3.length >= 3 && <PublicRankingPodium top3={top3} />}

          {/* Tabela restante */}
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
```

- [ ] **Step 2: Adicionar keyframe de animação ao CSS global**

Em `frontend/src/index.css` (ou arquivo CSS global do projeto), adicionar as animações:

```css
@keyframes rankSlideIn {
  from { opacity: 0; transform: translateX(-16px); }
  to   { opacity: 1; transform: translateX(0); }
}

.rank-flash {
  animation: rankFlash 1.2s ease forwards !important;
}

@keyframes rankFlash {
  0%   { background: rgba(217, 164, 65, 0.18); border-color: var(--tf-border-accent); }
  100% { background: var(--tf-panel); border-color: var(--tf-border); }
}
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/pages/PublicRanking.tsx frontend/src/index.css
git commit -m "feat(frontend): add PublicRanking page with real-time socket updates and animations"
```

---

## Task 8: Frontend — Registrar rota pública /ranking no App.tsx

**Files:**
- Modify: `frontend/src/App.tsx`

- [ ] **Step 1: Adicionar imports e rota pública**

Em `frontend/src/App.tsx`, adicionar os novos imports após os existentes:

```typescript
import PublicLayout from './components/layout/PublicLayout';
import PublicRanking from './pages/PublicRanking';
```

Em seguida, adicionar a rota pública **antes** do `<Route path="/" ...>` final, ainda dentro de `<Routes>`:

```tsx
          <Route element={<PublicLayout />}>
            <Route path="/ranking" element={<PublicRanking />} />
          </Route>
```

O arquivo completo resultante deve ser:

```tsx
import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Layout from './components/layout/Layout';
import PublicLayout from './components/layout/PublicLayout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Tasks from './pages/Tasks';
import Achievements from './pages/Achievements';
import Leaderboard from './pages/Leaderboard';
import PublicRanking from './pages/PublicRanking';
import { useAuthStore } from './hooks/useAuthStore';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isInitializing } = useAuthStore();

  if (isInitializing) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[color:var(--tf-bg)]">
        <p className="tf-title text-sm uppercase tracking-[0.2em] text-[color:var(--tf-primary)]">
          Carregando...
        </p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

function AppBoot() {
  const { token, user, initAuth } = useAuthStore();

  useEffect(() => {
    if (token && !user) {
      initAuth();
    } else {
      useAuthStore.setState({ isInitializing: false });
    }
  }, []);

  return null;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppBoot />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route element={<PublicLayout />}>
            <Route path="/ranking" element={<PublicRanking />} />
          </Route>

          <Route element={<Layout />}>
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/tasks"
              element={
                <ProtectedRoute>
                  <Tasks />
                </ProtectedRoute>
              }
            />
            <Route
              path="/achievements"
              element={
                <ProtectedRoute>
                  <Achievements />
                </ProtectedRoute>
              }
            />
            <Route
              path="/leaderboard"
              element={
                <ProtectedRoute>
                  <Leaderboard />
                </ProtectedRoute>
              }
            />
          </Route>

          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
```

- [ ] **Step 2: Verificar compilação do frontend**

```bash
cd frontend && npx tsc --noEmit
```

Esperado: sem erros.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/App.tsx
git commit -m "feat(frontend): register public /ranking route outside ProtectedRoute"
```

---

## Task 9: Verificação manual da feature completa

- [ ] **Step 1: Subir backend e frontend em dev**

```bash
# Terminal 1
cd backend && npm run dev

# Terminal 2
cd frontend && npm run dev
```

- [ ] **Step 2: Acessar `/ranking` sem estar logado**

Abrir `http://localhost:5173/ranking` em aba anônima.
Esperado: página carrega sem redirecionamento para `/login`, exibe header com logo + "Ao vivo" + botão "Entrar".

- [ ] **Step 3: Verificar avatares pixel-art**

Esperado: top 3 no pódio e demais jogadores na tabela exibem avatar nicebear (DiceBear pixel-art), não emojis ou placeholders.

- [ ] **Step 4: Testar filtros de período**

Clicar em "Hoje", "Semana", "Mês" — tabela deve recarregar com XP do período (pode estar vazia se não há tarefas completadas no período).

- [ ] **Step 5: Testar filtro de setor**

Clicar em "TI" — tabela filtra por setor. "Todos" volta ao geral.

- [ ] **Step 6: Testar busca**

Digitar nome de um jogador — tabela filtra em tempo real. Digitar texto inexistente — exibe "Nenhum jogador encontrado".

- [ ] **Step 7: Testar atualização em tempo real**

Em outra aba, logar como admin e aprovar um assignment. Esperado: a aba do `/ranking` atualiza a tabela com flash âmbar nas linhas que mudaram de posição e deltas `▲` / `▼`.

- [ ] **Step 8: Verificar responsividade mobile**

Reduzir viewport para 375px. Esperado: pódio e tabela se adaptam, sem scroll horizontal indesejado, stats colapsam no mobile.

- [ ] **Step 9: Commit final de ajustes (se necessário)**

```bash
git add -p
git commit -m "fix(ranking): visual adjustments after manual testing"
```
