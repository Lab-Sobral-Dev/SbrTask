# Debt Ledger

Auditoria retrospectiva de overengineering — procedimento em
`.agnostic-core/skills/audit/repo-overengineering-audit.md`. Este arquivo
so registra achados de trade-off consciente; nao aplica fix (fluxo normal
de correcao passa por plan mode / pre-implementation.md).

| data | arquivo | o que foi simplificado | o que seria o ideal | severidade |
|------|---------|-------------------------|----------------------|------------|
| 2026-08-11 | backend/src/controllers/taskController.ts:232-244 vs backend/src/services/xp.ts:4-15 | Formula de nivel (`xpForLevel`/`calculateLevel`) e credito de XP via UserGameProfile reimplementados localmente no controller legado, bypassando `services/xp.ts#awardXp()` — contraria a Regra Critica #9 do CLAUDE.md ("todo credito de XP passa por awardXp() sem excecao"), ja documentada no proprio CLAUDE.md como debito ("Legado: aprovacao de Task admin ainda credita XP via taskController, nao migrado") | Migrar taskController.ts para chamar `awardXp()` (que ja calcula level e emite `xp_update` via socket) e remover a copia local de `xpForLevel`/`calculateLevel`; elimina risco de a formula divergir entre os dois pontos | media |
| 2026-08-11 | frontend/src/pages/Tasks.tsx (571 linhas) | Um unico arquivo concentra tres componentes com responsabilidades distintas: `AdminTasksView` (~355 linhas, CRUD completo com modal/filtros/mutations), `UserTasksView` (~150 linhas, fluxo de submissao do usuario) e o componente-roteador `Tasks` que escolhe entre os dois por role | Extrair `AdminTasksView` e `UserTasksView` para arquivos proprios (`Tasks/AdminTasksView.tsx`, `Tasks/UserTasksView.tsx`), mantendo `Tasks.tsx` so como o componente-roteador — reduz a superficie de merge-conflict e deixa cada view testavel isoladamente | baixa |
| 2026-08-11 | frontend/package.json (`@dicebear/core`, `@dicebear/pixel-art`) | Duas dependencias de geracao de avatar instaladas, zero import em `frontend/src` (grep sem ocorrencias) — feature aparentemente descontinuada ou nunca ligada, mas nao removida | Remover as duas dependencias do package.json (ou reativar o uso, se a feature de avatar ainda for prevista) — reduz superficie de `npm install` e supply-chain sem ganho funcional atual | baixa |

## Notas de escopo (nao viraram entrada)

- Arquivos `Dashboard.tsx` (309 linhas) e `Achievements.tsx` (331 linhas) passam
  o limiar de 300 linhas por margem pequena e cada um mantem responsabilidade
  unica (pagina + um subcomponente de modal colocalizado) — nao configuram
  overengineering, so tamanho natural de pagina com grafico/lista densa.
- Nenhuma classe, interface, factory/adapter/strategy com consumidor unico foi
  encontrada no repo (grep por `implements`/`extends`/`class` nao retornou
  abstracoes OOP alem de um `interface AuthRequest extends Request` de uso
  disseminado, e um tipo condicional em `commissionController.ts`) — codebase
  e majoritariamente funcional, sem camadas de indirecao ociosas.
- `axios` (1 arquivo, `services/api.ts`) e `clsx`+`tailwind-merge` (util `cn()`
  em `lib/utils.ts`) sao usados uma vez no ponto de definicao mas por padrao
  amplamente consumido (client HTTP central; helper de classe usado em
  varios componentes) — uso concentrado e intencional, nao trivial nem
  descartavel.
- Duplicacao do `xpForLevel` em `frontend/src/lib/xp.ts` e intencional e
  documentada no CLAUDE.md ("replicada em frontend/src/lib/xp.ts") por cruzar
  a fronteira backend/frontend sem contrato compartilhado — nao e a mesma
  categoria do achado acima (que e duplicacao dentro do proprio backend).
