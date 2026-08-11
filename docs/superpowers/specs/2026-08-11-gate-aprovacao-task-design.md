# Design: Gate de Aprovação de Task (checklist pré-código + XP de incentivo)

**Data:** 2026-08-11
**Status:** Em revisão
**Issue relacionada:** [Lab-Sobral-Dev/SbrTask#14](https://github.com/Lab-Sobral-Dev/SbrTask/issues/14)

---

## Objetivo

Antes de uma `Task` nova ficar visível/atribuível para quem vai executá-la, ela passa
por um checklist de 11 itens de higiene técnica e arquitetura. Quatro itens **travam**
a aprovação (sem opção N/A); os outros sete são **opcionais** (podem ser marcados N/A
com justificativa) e concedem **XP de bônus** ao criador quando de fato resolvidos —
o incentivo existe justamente para os itens que *não* são obrigatórios, evitando que
sejam pulados só porque dava pra marcar N/A.

Não cria uma entidade nova: o gate vive dentro do próprio `Task` existente, sem afetar
o campo `status` já usado para outro propósito (active/completed/etc.).

---

## Modelo de dados

```prisma
model Task {
  // ...campos atuais inalterados (id, title, description, priority, status, dueDate,
  // category, xpReward, createdBy, creator, assignments, createdAt, updatedAt)...
  approvalStatus  String              @default("pending_approval") // pending_approval | approved | rejected
  rejectionReason String?
  checklistItems  TaskChecklistItem[]
}

model TaskChecklistItem {
  id            String   @id @default(uuid())
  taskId        String
  key           String   // ver constante backend/src/constants/taskChecklistItems.ts
  itemStatus    String   @default("pending") // done | pending | not_applicable
  justification String?  // obrigatório na validação da app quando itemStatus = not_applicable
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  task          Task     @relation(fields: [taskId], references: [id], onDelete: Cascade)

  @@unique([taskId, key])
}
```

`Task.status` continua controlando o ciclo de vida operacional já existente
(active/completed/etc.); `approvalStatus` é um campo ortogonal para o gate. Uma Task
só aparece pra quem foi atribuído quando `approvalStatus = 'approved'`, independente
do valor de `status`.

### Os 11 itens (constante hardcoded, não configurável via admin)

`backend/src/constants/taskChecklistItems.ts`:

```ts
export const TASK_CHECKLIST_ITEMS = [
  { key: 'prd',              label: 'Documento do que a entrega resolve (PRD)', mandatory: false, xpWeight: 10 },
  { key: 'rbac',             label: 'Matriz de quem pode ver/fazer o quê',       mandatory: false, xpWeight: 20 },
  { key: 'tenant_isolation', label: 'Isolamento de dado entre clientes/setores', mandatory: false, xpWeight: 30 },
  { key: 'rls',              label: 'Trava de acesso dentro do próprio banco',   mandatory: false, xpWeight: 35 },
  { key: 'secrets',          label: 'Nenhuma credencial no código-fonte',        mandatory: true,  xpWeight: null },
  { key: 'modular_arch',     label: 'Arquitetura modular / feature flag',        mandatory: false, xpWeight: 25 },
  { key: 'error_reporting',  label: 'Canal visível de reportar erro',            mandatory: false, xpWeight: 15 },
  { key: 'automated_tests',  label: 'Testes automatizados do fluxo principal',   mandatory: true,  xpWeight: null },
  { key: 'security_audit',  label: 'Auditoria de segurança como gate de deploy', mandatory: true,  xpWeight: null },
  { key: 'waf_bot',          label: 'Blindagem de borda (rate limit / bot)',     mandatory: false, xpWeight: 20 },
  { key: 'https_tls',       label: 'HTTPS/TLS ponta a ponta',                    mandatory: true,  xpWeight: null },
] as const;
```

XP bônus máximo por Task: 155 (soma dos 7 itens opcionais).

**Regra de segurança:** `mandatory` e `xpWeight` vivem só nesta constante do backend.
O client nunca envia XP — só `{ key, itemStatus, justification }` por item. O valor
creditado é sempre recalculado server-side a partir da constante, nunca do payload.

---

## Fluxo

1. **Criação** (`POST /tasks`, admin) — o payload atual de criação de Task ganha um
   array `checklist: { key, itemStatus, justification? }[]`. O backend valida (Zod)
   que todas as 11 `key`s da constante estão presentes, que `itemStatus` é um dos três
   valores válidos, e que `justification` existe quando `itemStatus = 'not_applicable'`.
   Task é criada com `approvalStatus = 'pending_approval'` e as 11 linhas de
   `TaskChecklistItem`.
2. Enquanto `pending_approval` (ou `rejected`), a Task **não aparece** para os
   `assigneeIds` — nem em `GET /tasks` (listagem) nem em `GET /tasks/:id` (detalhe).
   O filtro é por role: admin sempre vê tudo; usuário comum só vê `approved`.
3. **Fila** — `GET /tasks/pending-approval` (admin) lista as Tasks pendentes com o
   resumo do checklist (quantos obrigatórios ok, XP bônus preenchido).
4. **Aprovar** — `POST /tasks/:id/approve` (admin, não precisa ser quem criou):
   - Rejeita com 400 se qualquer item `mandatory` não estiver `done`.
   - Se ok: `approvalStatus = 'approved'`; soma o `xpWeight` de todo item opcional
     `done` e chama `awardXp({ userId: task.createdBy, amount, reason: 'Checklist de aprovação: <título>', category: 'task_checklist', refId: task.id })`.
   - Notifica os assignees (`Notification`, reaproveitando o padrão já usado em
     `taskController.ts`) de que a Task está disponível.
5. **Rejeitar** — `POST /tasks/:id/reject` (admin, `reason` obrigatório no body):
   `approvalStatus = 'rejected'`, `rejectionReason` salvo, notifica `createdBy` com o
   motivo. Nenhum XP é creditado.
6. **Reenviar** — `PATCH /tasks/:id/checklist` (admin criador) edita os itens de uma
   Task `rejected`; `POST /tasks/:id/resubmit` volta `approvalStatus` pra
   `pending_approval` (novo ciclo na fila).

---

## Frontend

- `TaskChecklistForm` (novo, `frontend/src/components/tasks/`) — renderiza as 11
  linhas (radio feito/pendente/N-A + textarea de justificativa condicional), mantém
  estado local `{ key: itemStatus, justification }[]` e emite `onChange`. Sem chamada
  de API própria — reutilizado tanto na criação quanto (modo somente leitura) na
  revisão da fila.
- `AdminTasksView.tsx` — passo 2 do formulário de criação de Task usa
  `TaskChecklistForm`; nova seção "Aprovações pendentes" consome
  `GET /tasks/pending-approval`, mostra o resumo e os botões Aprovar (desabilitado
  se faltar item obrigatório) / Rejeitar (abre modal pedindo motivo).
- `UserTasksView.tsx` — sem mudança de lógica além de já não receber Tasks não
  aprovadas (filtro é no backend).
- **Efeito colateral pretendido:** esse trabalho é o gatilho pra finalmente dividir
  `Tasks.tsx` (571 linhas, 3 responsabilidades) em `AdminTasksView.tsx` +
  `UserTasksView.tsx` + roteador — já registrado como débito em
  [`#16`](https://github.com/Lab-Sobral-Dev/SbrTask/issues/16). O checklist entra
  direto nos arquivos novos, não no monólito atual.

---

## Testes

- **Frontend (Vitest, convenção já usada no projeto):** `TaskChecklistForm` —
  soma de XP exibida, exigência de justificativa quando N/A, e estado do botão
  Aprovar desabilitado quando falta item obrigatório.
- **Backend:** o projeto não tem framework de teste automatizado no backend hoje
  (só Vitest no frontend). Não introduzir isso como efeito colateral desta feature —
  decisão maior, separada. Verificação manual dos 3 endpoints novos (`approve`
  bloqueando com item obrigatório faltando, `reject` exigindo motivo, `resubmit`
  voltando o ciclo).

---

## Arquivos a criar/modificar

| Ação | Arquivo |
|------|---------|
| Modificar | `backend/prisma/schema.prisma` — `Task.approvalStatus`/`rejectionReason` + model `TaskChecklistItem` |
| Criar | `backend/prisma/migrations/.../` (via `prisma migrate dev`) |
| Criar | `backend/src/constants/taskChecklistItems.ts` |
| Modificar | `backend/src/controllers/taskController.ts` — `createTask` grava checklist; `getTasks` filtra `approvalStatus` pra não-admin; novos handlers `approveTask`, `rejectTask`, `resubmitTask`, `updateChecklist`, `getPendingApproval` |
| Modificar | `backend/src/routes/tasks.ts` — rotas novas |
| Criar | `frontend/src/components/tasks/TaskChecklistForm.tsx` |
| Criar | `frontend/src/components/tasks/TaskChecklistForm.test.tsx` |
| Criar (split de `Tasks.tsx`, ref. #16) | `frontend/src/pages/tasks/AdminTasksView.tsx` |
| Criar (split de `Tasks.tsx`, ref. #16) | `frontend/src/pages/tasks/UserTasksView.tsx` |
| Modificar | `frontend/src/pages/Tasks.tsx` — vira só o roteador por role |
| Modificar | `frontend/src/services/api.ts` — `tasks.getPendingApproval`, `tasks.approve`, `tasks.reject`, `tasks.resubmit`, `tasks.updateChecklist` |

---

## Critérios de aceitação

- [ ] Task criada nasce `pending_approval` e não aparece pro assignee
- [ ] Fila de aprovação lista pendentes com resumo de obrigatórios + XP bônus
- [ ] Aprovar bloqueia (400) se item obrigatório não estiver `done`
- [ ] Aprovar credita XP ao criador só pelos itens opcionais `done`, nunca pelos obrigatórios
- [ ] XP e obrigatoriedade calculados sempre server-side, nunca a partir do payload do client
- [ ] Rejeitar exige motivo e notifica quem criou
- [ ] Reenvio após rejeição volta pra `pending_approval`
- [ ] `Tasks.tsx` dividido em `AdminTasksView` + `UserTasksView` (fecha #16 como parte deste trabalho)
- [ ] Testes de `TaskChecklistForm` cobrindo soma de XP e validação de N/A
