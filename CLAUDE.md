SbrTask — Fullstack TypeScript

Stack:
  Backend (backend/):  Node.js + Express 5 + Prisma 6 + Socket.io + Zod + JWT
  Frontend (frontend/): React 19 + Vite 8 + Tailwind 3.4 + React Query + React Router 7 + Zustand + React Hook Form + Recharts + Vitest
  Estrutura:           Monorepo manual (sem turbo/nx) — pastas backend/ e frontend/ na raiz
  Submodulo:           .agnostic-core/

---

CONVENCOES DO PROJETO

  Backend:    TypeScript 6 + Express 5 + Prisma 6 ORM
  Frontend:   React 19 + Vite 8 + Tailwind CSS 3.4
  Banco:      via Prisma 6 (schema em backend/prisma/)
  Auth:       JWT (jsonwebtoken) + bcryptjs
  Realtime:   Socket.io 4.8 (server) + socket.io-client (frontend)
  Validacao:  Zod 4 (compartilhada entre back e front)
  Estado:     Zustand (cliente) + React Query (servidor)
  Forms:      React Hook Form + zod resolver
  Testes:     Vitest (frontend) — backend ainda sem framework de teste
  Estilo:     Conventional Commits

---

ORQUESTRACAO DO FLUXO DE TRABALHO

  1. Modo de Planejamento (default)
     - Use plan mode em QUALQUER tarefa nao trivial: 3+ etapas, decisao
       arquitetural, mudanca em area sensivel (auth, schema Prisma,
       contrato Socket.io, build/deploy).
     - Especificacao detalhada antecipada reduz ambiguidade — descreva
       arquivos a tocar, contratos, criterios de verificacao.
     - Plan mode tambem para verificacao, nao apenas para construcao.
     - Se algo der errado durante a execucao: PARE e replaneje
       imediatamente — nao improvise por cima do plano quebrado.

  2. Estrategia de Subagentes
     - Use subagentes liberalmente para preservar a janela de contexto.
     - Descarregue pesquisa, exploracao de codebase e analise paralela
       (Explore para mapear, Plan para desenhar, reviewers para auditar).
     - Uma tarefa por subagente; prompt auto-contido com caminhos,
       trechos relevantes e criterio de "pronto".
     - Nao duplique trabalho que o subagente ja esta fazendo.

  3. Verificacao Antes de Concluir
     - Nunca marque "done" sem prova de que funciona: rode os testes
       (Vitest no front), leia logs, demonstre a correcao no caso real.
     - Pergunta-teste: "um engenheiro senior aprovaria isto em code
       review?" — se a resposta for "talvez", ainda nao acabou.
     - Para mudancas de UI: subir o dev server (Vite) e exercitar o
       fluxo no browser, incluindo edge cases e regressoes vizinhas.
     - Se nao for possivel verificar (ex.: ambiente sem dev server,
       integracao externa indisponivel), DECLARE explicitamente o que
       nao foi verificado em vez de fingir sucesso.

  4. Exigencia de Elegancia (balanceada)
     - Em mudancas nao triviais: pause e pergunte "existe forma mais
       elegante?" antes de commitar.
     - Se detectar correcao paliativa (band-aid, condicional especifico,
       try/catch que esconde causa): re-implemente com o que voce
       sabe agora, atacando a raiz.
     - Pule esta etapa em correcoes obvias (typo, rename, ajuste de
       copy) — nao super-engenhe o trivial.

  5. Correcao de Bugs Autonoma
     - Recebeu bug report: investigue e corrija; nao peca instrucoes
       passo-a-passo ao usuario.
     - Persiga logs, mensagens de erro, testes falhando ate a causa
       raiz; so entao aplique a correcao.
     - Zero troca de contexto exigida do usuario para reproduzir o que
       voce ja consegue reproduzir sozinho.

  6. Loop de Auto-aperfeicoamento
     - Apos qualquer correcao do usuario sobre seu trabalho: registre
       o padrao em tasks/lessons.md como regra concreta que previna
       o mesmo erro (nao apenas o sintoma especifico).
     - Revise tasks/lessons.md no inicio de cada sessao do projeto.
     - Skill complementar (metodologia): .agnostic-core/skills/workflow/auto-learning-lessons.md

---

ANTES DE IMPLEMENTAR

Backend (Express + Prisma):
  Express setup:        .agnostic-core/skills/nodejs/express-best-practices.md
  Node.js patterns:     .agnostic-core/skills/nodejs/nodejs-patterns.md
  REST API design:      .agnostic-core/skills/backend/rest-api-design.md
  Error handling:       .agnostic-core/skills/backend/error-handling.md
  Seguranca de API:     .agnostic-core/skills/security/api-hardening.md
  OWASP checklist:      .agnostic-core/skills/security/owasp-checklist.md
  Query compliance:     .agnostic-core/skills/database/query-compliance.md
  Schema design:        .agnostic-core/skills/database/schema-design.md
  OpenAPI:              .agnostic-core/skills/documentation/openapi-swagger.md

Frontend (React 19 + Vite + Tailwind):
  React performance:       .agnostic-core/skills/frontend/react-performance.md
  React task checklists:   .agnostic-core/skills/frontend/react-task-checklists.md
  Tailwind patterns:       .agnostic-core/skills/frontend/tailwind-patterns.md
  Anti-Frankenstein CSS:   .agnostic-core/skills/frontend/anti-frankenstein.md
  CSS Governance:          .agnostic-core/skills/frontend/css-governance.md
  Acessibilidade WCAG:     .agnostic-core/skills/frontend/accessibility.md
  UX Guidelines:           .agnostic-core/skills/frontend/ux-guidelines.md
  Dark mode tokens:        .agnostic-core/skills/frontend/dark-mode-tokens.md
  Responsive breakpoints:  .agnostic-core/skills/frontend/responsive-breakpoint-table.md
  Menos e mais (limpeza):  .agnostic-core/skills/frontend/menos-e-mais.md

Realtime (Socket.io):
  Verificar contratos de eventos antes de adicionar nova mensagem (back e front em sync).
  Auth do socket via mesmo JWT da API (middleware no server, header no client).

Qualidade:
  Testes unitarios (Vitest):  .agnostic-core/skills/testing/unit-testing.md
  TDD workflow:               .agnostic-core/skills/testing/tdd-workflow.md
  Performance audit:          .agnostic-core/skills/performance/performance-audit.md
  Caching strategies:         .agnostic-core/skills/performance/caching-strategies.md
  Validacao consolidada:      .agnostic-core/skills/audit/validation-checklist.md

Auditoria:
  Code review:                .agnostic-core/skills/audit/code-review.md
  Pre-implementation:         .agnostic-core/skills/audit/pre-implementation.md
  Systematic debugging:       .agnostic-core/skills/audit/systematic-debugging.md
  Senior verification:        .agnostic-core/skills/audit/senior-verification-protocol.md
  S.A.I.S principle:          .agnostic-core/skills/workflow/sais-principle.md

Operacional:
  Commits convencionais:      .agnostic-core/skills/git/commit-conventions.md
  Branching strategy:         .agnostic-core/skills/git/branching-strategy.md
  PR template:                .agnostic-core/skills/git/pr-template.md
  Pre-deploy checklist:       .agnostic-core/skills/devops/pre-deploy-checklist.md
  Eruda mobile debug:         .agnostic-core/skills/devops/eruda-mobile-debug.md

Workflow:
  Goal-backward planning:     .agnostic-core/skills/workflow/goal-backward-planning.md
  Context management:         .agnostic-core/skills/workflow/context-management.md
  Claude Code productivity:   .agnostic-core/skills/workflow/claude-code-productivity.md
  Auto-aprendizado LESSONS:   .agnostic-core/skills/workflow/auto-learning-lessons.md

---

AGENTS DISPONIVEIS

Reviewers (cobre stack do projeto):
  Security Reviewer:        .agnostic-core/agents/reviewers/security-reviewer.md
  Frontend Reviewer:        .agnostic-core/agents/reviewers/frontend-reviewer.md
  Code Inspector (SPARC):   .agnostic-core/agents/reviewers/code-inspector.md
  Test Reviewer:            .agnostic-core/agents/reviewers/test-reviewer.md
  Performance Reviewer:     .agnostic-core/agents/reviewers/performance-reviewer.md
  Architecture Reviewer:    .agnostic-core/agents/reviewers/architecture-reviewer.md
  Codebase Mapper:          .agnostic-core/agents/reviewers/codebase-mapper.md

Validators:
  Migration Validator (Prisma): .agnostic-core/agents/validators/migration-validator.md

Generators:
  Project Planner:          .agnostic-core/agents/generators/project-planner.md
  Docs Generator:           .agnostic-core/agents/generators/docs-generator.md

Specialists:
  Database Architect:       .agnostic-core/agents/specialists/database-architect.md
  DevOps Engineer:          .agnostic-core/agents/specialists/devops-engineer.md

Onboarding (rodar uma vez para mapear o projeto):
  Project Onboarding:       .agnostic-core/agents/project-onboarding.md

---

WORKFLOWS

  Brainstorm (antes de feature):  .agnostic-core/commands/workflows/brainstorm.md
  Create (feature do zero):        .agnostic-core/commands/workflows/create.md
  Debug (4 fases):                 .agnostic-core/commands/workflows/debug.md
  Deploy (seguro):                 .agnostic-core/commands/workflows/deploy.md

Guia de roteamento (qual agent/skill usar para cada tarefa):
  .agnostic-core/docs/agent-routing-guide.md

---

DEBUG MOBILE — ERUDA

  O frontend Vite tem o Eruda integrado (auto em dev, ?debug=true em prod).
  Ver: frontend/vite.config.ts (plugin eruda) e doc em .agnostic-core/skills/devops/eruda-mobile-debug.md
  Aba "Report" copia relatorio Markdown direto pro Claude Code.

---

GIT AUTO-PUSH WORKFLOW

  Apos cada commit do Claude Code, o hook PostToolUse faz push automatico para a branch atual.
  Hook script:    .agnostic-core/scripts/hooks/post-tool-use-autopush
  Configuracao:   ~/.claude/settings.json (PostToolUse -> Bash matcher)
  Comportamento:  detecta "git commit" -> push origin <branch> -> retry 1x se falhar

---

GERENCIAMENTO DE TAREFAS

  1. Plano primeiro em tasks/todo.md, com itens marcados `[ ]`.
  2. Verifique o plano antes de iniciar — alinhamento explicito sobre
     escopo, arquivos tocados e criterio de "pronto".
  3. Marque `[x]` conforme avanca, um item por vez (nada de batches).
  4. A cada etapa concluida, deixe um resumo de alto nivel (1-3 linhas)
     no proprio item: o que mudou e por que.
  5. Ao final, escreva uma secao "Revisao" em tasks/todo.md com:
     mudancas entregues, o que ficou de fora, riscos remanescentes e
     proximos passos sugeridos.
  6. Apos cada correcao do usuario sobre seu trabalho, atualize
     tasks/lessons.md com a regra concreta que previne a recorrencia.

---

PRINCIPIOS BASICOS

  Simplicidade primeiro:  busque a solucao de menor impacto que
                          resolva o problema completo.
  Sem paliativos:         ataque causas raiz; rejeite band-aids,
                          condicionais ad-hoc e try/catch que escondem
                          o problema.
  Impacto minimo:         toque apenas no necessario; sem efeitos
                          colaterais em areas nao relacionadas.
  Sem over-engineering:   nao adicione features, abstracoes,
                          flags de configuracao ou error handling
                          que a tarefa nao pediu.
  Honestidade tecnica:    se nao puder verificar, declare; nunca
                          finja sucesso. "Nao testado" e uma resposta
                          aceitavel; "funciona" sem prova nao e.

---

REGRAS CRITICAS DESTE PROJETO

  1. Validacao Zod compartilhada — sempre tipar request body do Express com schema Zod.
  2. Prisma queries — nunca usar raw SQL sem revisao de seguranca (preparar via Prisma).
  3. Auth — todo endpoint protegido valida JWT no middleware antes de chegar ao handler.
  4. Socket.io — autenticar via mesmo JWT no handshake; nao confiar em payload sem auth.
  5. React 19 — preferir Server Actions / use() / form actions onde aplicavel.
  6. Tailwind 3.4 — config em tailwind.config.js (nao migrar para v4 sem alinhamento).
  7. Mobile-first — todo componente novo passa pelo responsive-breakpoint-table.md.
