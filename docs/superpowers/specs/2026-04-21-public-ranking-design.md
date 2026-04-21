# Design: Tela Pública de Ranking em Tempo Real

**Data:** 2026-04-21  
**Status:** Aprovado

---

## Objetivo

Disponibilizar uma página pública de Ranking acessível sem autenticação, com atualização em tempo real via Socket.io, avatares pixel-art (nicebear), filtros por período e setor, busca por nome e animações que reforcem o aspecto competitivo.

---

## Arquitetura

### Backend

**Endpoint existente (reutilizado com extensão):**
- `GET /api/achievements/leaderboard` — já público (sem auth)
- Adicionar query param `?period=today|week|month|all` para filtrar por data de conclusão de tarefas
- Lógica: filtrar usuários que completaram tarefas no período, ordenar por XP acumulado no período (não XP total)
- Para `period=all` (padrão), manter comportamento atual (top 20 por XP total)

**Novo evento Socket.io:**
- `ranking_update` — emitido para a sala pública `ranking-public` sempre que qualquer usuário ganhar XP
- Payload: array completo do ranking atualizado (mesma estrutura do endpoint REST)
- Emitir a partir de `taskController.ts` após o `xp_update` pessoal existente

**Sala pública Socket.io:**
- Cliente entra na sala `ranking-public` via evento `join-ranking` (sem autenticação)
- Nenhum dado sensível exposto: apenas `id`, `name`, `sector`, `level`, `xp`, `avatar`

### Frontend

**Nova rota pública:** `/ranking`
- Fora do `ProtectedRoute` e fora do `<Layout>` autenticado
- Layout próprio: `PublicLayout` (header mínimo + outlet)

**Componentes novos:**
- `PublicLayout.tsx` — header com logo "⬡ SBRTASK", badge "Ao vivo" pulsando, botão "Entrar" linkando para `/login`
- `PublicRanking.tsx` — página principal
- `PublicRankingPodium.tsx` — pódio animado para top 3
- `PublicRankingRow.tsx` — linha da tabela com animação de flash ao atualizar

**Estado e dados:**
- React Query para fetch inicial do ranking
- Socket.io para atualizações em tempo real
- Delta de posição calculado em memória: comparar ranking anterior vs novo a cada `ranking_update`
- Zustand não necessário (sem estado global compartilhado)

---

## Funcionalidades

### Pódio (top 3)
- Avatares `<Avatar data={player.avatar} size="sm" />` com borda colorida por posição (ouro/prata/bronze)
- Animação: brilho pulsante dourado no 1º lugar (`glow-gold` keyframe)
- Coroa animada (bounce) acima do 1º lugar
- Ordem visual: 2º | 1º | 3º (pódio clássico)

### Tabela (posição 4+)
- Colunas: posição · avatar · nome · setor · nível · XP total · delta
- Delta: `▲N` (verde), `▼N` (vermelho), `—` (cinza) — calculado entre snapshots
- Ao receber `ranking_update`: linha com mudança de posição recebe classe `highlight` (flash âmbar por 1s)
- Entrada inicial: animação `slideIn` escalonada por linha

### Filtros
- Período: Geral | Hoje | Semana | Mês — botões `tf-btn` / `tf-btn-primary`
- Setor: Todos | TI | RH | Financeiro | Marketing | Vendas | Operacoes
- Busca: input com debounce de 300ms, filtragem client-side sobre o array atual
- Sem resultado: mensagem "Nenhum jogador encontrado para esta busca"

### Tempo real
- Conectar socket sem token (public endpoint)
- `socket.emit('join-ranking')` após connect
- Receber `ranking_update` → atualizar estado → recalcular deltas → animar linhas alteradas
- Se socket desconectar: refetch via React Query a cada 30s como fallback

### Responsividade
- Mobile: pódio empilhado verticalmente, tabela scroll horizontal
- Tablet+: layout completo conforme mockup
- Breakpoints conforme `responsive-breakpoint-table.md`

---

## Segurança

- Nenhum dado sensível no payload: sem email, senha, role, createdAt
- Backend filtra campos antes de enviar: `select: { id, name, sector, level, xp, avatar }`
- Sala Socket.io `ranking-public` não requer token — apenas leitura
- Rate limit existente do Express cobre o endpoint

---

## Fidelidade visual ao sistema

- Tema `tf-*` completo: variáveis CSS, `.tf-panel`, `.tf-panel-inset`, `.tf-btn`, `.tf-title`, `.tf-frame`
- Avatares: componente `<Avatar>` existente (nicebear pixel-art)
- Tipografia: mesma fonte monospace e letter-spacing do sistema
- Cores: `--tf-primary` (dourado), `--tf-info` (azul), `--tf-success` (verde), `--tf-danger` (vermelho)

---

## Arquivos a criar/modificar

| Ação | Arquivo |
|------|---------|
| Modificar | `backend/src/controllers/achievementController.ts` — add `?period` filter |
| Modificar | `backend/src/controllers/taskController.ts` — emit `ranking_update` |
| Modificar | `backend/src/socket.ts` — add `join-ranking` handler |
| Criar | `frontend/src/pages/PublicRanking.tsx` |
| Criar | `frontend/src/components/layout/PublicLayout.tsx` |
| Criar | `frontend/src/components/ranking/PublicRankingPodium.tsx` |
| Criar | `frontend/src/components/ranking/PublicRankingRow.tsx` |
| Modificar | `frontend/src/App.tsx` — add `/ranking` public route |
| Modificar | `frontend/src/services/api.ts` — add period param to leaderboard call |

---

## Critérios de aceitação

- [ ] `/ranking` acessível sem login, sem redirecionamento
- [ ] Avatares nicebear exibidos no pódio e na tabela
- [ ] Mudanças de XP refletidas em tempo real (flash + delta)
- [ ] Filtros de período e setor funcionando
- [ ] Busca por nome com feedback de "sem resultado"
- [ ] Responsivo em mobile e desktop
- [ ] Nenhum dado sensível exposto
