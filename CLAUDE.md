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

REGRAS CRITICAS DESTE PROJETO

  1. Validacao Zod compartilhada — sempre tipar request body do Express com schema Zod.
  2. Prisma queries — nunca usar raw SQL sem revisao de seguranca (preparar via Prisma).
  3. Auth — todo endpoint protegido valida JWT no middleware antes de chegar ao handler.
  4. Socket.io — autenticar via mesmo JWT no handshake; nao confiar em payload sem auth.
  5. React 19 — preferir Server Actions / use() / form actions onde aplicavel.
  6. Tailwind 3.4 — config em tailwind.config.js (nao migrar para v4 sem alinhamento).
  7. Mobile-first — todo componente novo passa pelo responsive-breakpoint-table.md.
