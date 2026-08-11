# Gate de Aprovação de Task (checklist + XP) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Toda `Task` nova passa por um checklist de 11 itens (4 obrigatórios, 7 opcionais com XP de incentivo) antes de ficar visível/atribuível; um admin aprova ou rejeita numa fila separada.

**Architecture:** Nova tabela `TaskChecklistItem` (1:N com `Task`) + campo `Task.approvalStatus`; catálogo dos 11 itens hardcoded em `backend/src/constants/taskChecklistItems.ts` (peso/obrigatoriedade só existem no backend, nunca confiados ao payload do client); 3 endpoints novos (`approve`/`reject`/`resubmit`) + 1 de listagem (`pending-approval`); XP creditado via `services/xp.ts#awardXp()` só na aprovação.

**Tech Stack:** Express 5 + Prisma 6 (backend), React 19 + React Query + React Hook Form + Zod (frontend), Vitest + Testing Library (frontend only — backend não tem framework de teste).

## Global Constraints

- Todo endpoint novo passa por `authMiddleware` + `adminMiddleware` (Regra #1/#3 do CLAUDE.md do projeto).
- `xpWeight` e `mandatory` de cada item do checklist só existem na constante do backend — o client nunca envia XP, só `{ key, itemStatus, justification }`.
- XP só é creditado via `awardXp()` (Regra #9 do CLAUDE.md) — nunca escrita direta em `UserGameProfile`.
- `Task.status` (ciclo operacional existente) não é tocado — `approvalStatus` é um campo ortogonal novo.
- Spec de referência: `docs/superpowers/specs/2026-08-11-gate-aprovacao-task-design.md`.

---

### Task 1: Schema Prisma + catálogo dos 11 itens

**Files:**
- Modify: `backend/prisma/schema.prisma`
- Create: `backend/src/constants/taskChecklistItems.ts`

**Interfaces:**
- Produces: `TaskChecklistItemDef { key: string; label: string; mandatory: boolean; xpWeight: number | null }`, `TASK_CHECKLIST_ITEMS: TaskChecklistItemDef[]`, `TASK_CHECKLIST_KEYS: string[]`, `getChecklistItemDef(key: string): TaskChecklistItemDef | undefined` — consumidos pelas Tasks 2, 5 e 8.

- [ ] **Step 1: Editar `schema.prisma`**

No `model Task`, adicionar (mantendo todos os campos atuais intocados):

```prisma
model Task {
  id              String              @id @default(uuid())
  title           String
  description     String?
  priority        String              @default("medium")
  status          String              @default("active")
  dueDate         DateTime?
  category        String?
  xpReward        Int                 @default(10)
  createdBy       String
  creator         User                @relation("TaskCreator", fields: [createdBy], references: [id], onDelete: Cascade)
  assignments     TaskAssignment[]
  approvalStatus  String              @default("pending_approval") // pending_approval | approved | rejected
  rejectionReason String?
  checklistItems  TaskChecklistItem[]
  createdAt       DateTime            @default(now())
  updatedAt       DateTime            @updatedAt
}

model TaskChecklistItem {
  id            String   @id @default(uuid())
  taskId        String
  key           String
  itemStatus    String   @default("pending") // done | pending | not_applicable
  justification String?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  task          Task     @relation(fields: [taskId], references: [id], onDelete: Cascade)

  @@unique([taskId, key])
}
```

- [ ] **Step 2: Validar sintaxe**

Run: `cd backend && npx prisma format`
Expected: termina sem erro (reformata o arquivo).

- [ ] **Step 3: Criar e aplicar a migration**

Run: `cd backend && npx prisma migrate dev --name add_task_checklist_gate`
Expected: cria `backend/prisma/migrations/<timestamp>_add_task_checklist_gate/` e aplica no Postgres local (container em `localhost:5434`, ver `docker-compose.override.yml`). Se o container não estiver de pé, subir antes com o setup do Docker Engine no WSL2 documentado no `CLAUDE.md` do projeto.

- [ ] **Step 4: Criar a constante do catálogo**

Create `backend/src/constants/taskChecklistItems.ts`:

```ts
export interface TaskChecklistItemDef {
  key: string;
  label: string;
  mandatory: boolean;
  xpWeight: number | null;
}

// Ordem e pesos definidos no spec (docs/superpowers/specs/2026-08-11-gate-aprovacao-task-design.md).
// mandatory = true nunca tem xpWeight (é higiene mínima, não incentivo).
export const TASK_CHECKLIST_ITEMS: TaskChecklistItemDef[] = [
  { key: 'prd', label: 'Documento do que a entrega resolve (PRD)', mandatory: false, xpWeight: 10 },
  { key: 'rbac', label: 'Matriz de quem pode ver/fazer o quê', mandatory: false, xpWeight: 20 },
  { key: 'tenant_isolation', label: 'Isolamento de dado entre clientes/setores', mandatory: false, xpWeight: 30 },
  { key: 'rls', label: 'Trava de acesso dentro do próprio banco', mandatory: false, xpWeight: 35 },
  { key: 'secrets', label: 'Nenhuma credencial no código-fonte', mandatory: true, xpWeight: null },
  { key: 'modular_arch', label: 'Arquitetura modular / feature flag', mandatory: false, xpWeight: 25 },
  { key: 'error_reporting', label: 'Canal visível de reportar erro', mandatory: false, xpWeight: 15 },
  { key: 'automated_tests', label: 'Testes automatizados do fluxo principal', mandatory: true, xpWeight: null },
  { key: 'security_audit', label: 'Auditoria de segurança como gate de deploy', mandatory: true, xpWeight: null },
  { key: 'waf_bot', label: 'Blindagem de borda (rate limit / bot)', mandatory: false, xpWeight: 20 },
  { key: 'https_tls', label: 'HTTPS/TLS ponta a ponta', mandatory: true, xpWeight: null },
];

export const TASK_CHECKLIST_KEYS = TASK_CHECKLIST_ITEMS.map((i) => i.key);

export function getChecklistItemDef(key: string): TaskChecklistItemDef | undefined {
  return TASK_CHECKLIST_ITEMS.find((i) => i.key === key);
}
```

- [ ] **Step 5: Typecheck**

Run: `cd backend && npm run build`
Expected: compila sem erro (o `dist/` gerado não precisa ser commitado — já está fora do controle de versão).

- [ ] **Step 6: Commit**

```bash
git add backend/prisma/schema.prisma backend/prisma/migrations backend/src/constants/taskChecklistItems.ts
git commit -m "feat(tasks): adiciona modelo de checklist de aprovação (TaskChecklistItem)"
```

---

### Task 2: Validação Zod do checklist + `createTask` grava o gate

**Files:**
- Create: `backend/src/validators/taskChecklist.ts`
- Modify: `backend/src/controllers/taskController.ts:38-81` (`createTask`)

**Interfaces:**
- Consumes: `TASK_CHECKLIST_ITEMS`, `TASK_CHECKLIST_KEYS` (Task 1)
- Produces: `checklistSubmissionSchema: ZodSchema`, `type ChecklistSubmission` — consumidos pela Task 7 (`updateChecklist`)

- [ ] **Step 1: Criar o validador**

Create `backend/src/validators/taskChecklist.ts`:

```ts
import { z } from 'zod';
import { TASK_CHECKLIST_KEYS } from '../constants/taskChecklistItems';

const keys = TASK_CHECKLIST_KEYS as [string, ...string[]];

export const checklistSubmissionSchema = z
  .array(
    z.object({
      key: z.enum(keys),
      itemStatus: z.enum(['done', 'pending', 'not_applicable']),
      justification: z.string().min(1).optional(),
    }),
  )
  .refine((items) => items.length === TASK_CHECKLIST_KEYS.length, {
    message: `checklist deve conter exatamente ${TASK_CHECKLIST_KEYS.length} itens`,
  })
  .refine((items) => new Set(items.map((i) => i.key)).size === items.length, {
    message: 'checklist não pode repetir key',
  })
  .refine((items) => TASK_CHECKLIST_KEYS.every((k) => items.some((i) => i.key === k)), {
    message: 'checklist está faltando algum item do catálogo',
  })
  .refine(
    (items) => items.every((i) => i.itemStatus !== 'not_applicable' || !!i.justification),
    { message: 'justification é obrigatório quando itemStatus = not_applicable' },
  );

export type ChecklistSubmission = z.infer<typeof checklistSubmissionSchema>;
```

- [ ] **Step 2: Typecheck**

Run: `cd backend && npm run build`
Expected: compila sem erro.

- [ ] **Step 3: Atualizar `createTask`**

Em `backend/src/controllers/taskController.ts`, importar o validador no topo:

```ts
import { checklistSubmissionSchema } from '../validators/taskChecklist';
```

Substituir a função `createTask` (linhas 38-81) por:

```ts
export const createTask = async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    const { title, description, priority, dueDate, category, xpReward, assigneeIds, checklist } =
      req.body as {
        title: string;
        description?: string;
        priority?: string;
        dueDate?: string;
        category?: string;
        xpReward: number;
        assigneeIds: string[];
        checklist: unknown;
      };

    if (!Array.isArray(assigneeIds) || assigneeIds.length === 0) {
      return res.status(400).json({ error: 'assigneeIds deve ser um array não vazio' });
    }

    const parsedChecklist = checklistSubmissionSchema.safeParse(checklist);
    if (!parsedChecklist.success) {
      return res.status(400).json({ error: 'checklist inválido', details: parsedChecklist.error.issues });
    }

    const task = await prisma.task.create({
      data: {
        title,
        description,
        priority: priority ?? 'medium',
        dueDate: dueDate ? new Date(dueDate) : null,
        category,
        xpReward,
        createdBy: authReq.userId!,
        approvalStatus: 'pending_approval',
        assignments: {
          create: assigneeIds.map((uid) => ({ userId: uid })),
        },
        checklistItems: {
          create: parsedChecklist.data.map((item) => ({
            key: item.key,
            itemStatus: item.itemStatus,
            justification: item.justification ?? null,
          })),
        },
      },
      include: { ...taskInclude, checklistItems: true },
    });

    // Nota: notificação de atribuição (task_assigned) só é enviada na aprovação
    // (ver approveTask, Task 5) — a task não é visível pro assignee antes disso.

    res.status(201).json(task);
  } catch (error) {
    console.error('Erro ao criar tarefa:', error);
    res.status(500).json({ error: 'Erro ao criar tarefa' });
  }
};
```

- [ ] **Step 4: Typecheck**

Run: `cd backend && npm run build`
Expected: compila sem erro.

- [ ] **Step 5: Verificação manual**

Run: `cd backend && npm run dev` (em outro terminal, com o Postgres local de pé)

```bash
# checklist incompleto (falta item) → esperado 400
curl -s -X POST http://localhost:3001/api/tasks \
  -H "Authorization: Bearer $ADMIN_JWT" -H "Content-Type: application/json" \
  -d '{"title":"teste","xpReward":10,"assigneeIds":["<uid>"],"checklist":[{"key":"prd","itemStatus":"done"}]}'

# checklist completo (11 itens) → esperado 201 com approvalStatus "pending_approval"
curl -s -X POST http://localhost:3001/api/tasks \
  -H "Authorization: Bearer $ADMIN_JWT" -H "Content-Type: application/json" \
  -d '{"title":"teste","xpReward":10,"assigneeIds":["<uid>"],"checklist":[
    {"key":"prd","itemStatus":"not_applicable","justification":"tarefa cosmética"},
    {"key":"rbac","itemStatus":"not_applicable","justification":"sem novo dado"},
    {"key":"tenant_isolation","itemStatus":"not_applicable","justification":"sem multi-tenant"},
    {"key":"rls","itemStatus":"not_applicable","justification":"sem novo dado"},
    {"key":"secrets","itemStatus":"done"},
    {"key":"modular_arch","itemStatus":"not_applicable","justification":"não aplicável"},
    {"key":"error_reporting","itemStatus":"not_applicable","justification":"não aplicável"},
    {"key":"automated_tests","itemStatus":"done"},
    {"key":"security_audit","itemStatus":"done"},
    {"key":"waf_bot","itemStatus":"not_applicable","justification":"sem endpoint novo"},
    {"key":"https_tls","itemStatus":"done"}
  ]}'
```

Expected: primeira chamada 400 (`checklist inválido`); segunda 201 com `approvalStatus: "pending_approval"` e `checklistItems` com 11 linhas.

- [ ] **Step 6: Commit**

```bash
git add backend/src/validators/taskChecklist.ts backend/src/controllers/taskController.ts
git commit -m "feat(tasks): createTask grava checklist de aprovação e nasce pending_approval"
```

---

### Task 3: Filtro por role em `getTasks`/`getTaskById`

**Files:**
- Modify: `backend/src/controllers/taskController.ts:83-111` (`getTasks`), `:158-179` (`getTaskById`)

- [ ] **Step 1: Editar `getTasks`**

Dentro do bloco `if (!isAdmin) { ... }` (linha 96-98), adicionar a linha de filtro:

```ts
if (!isAdmin) {
  where.assignments = { some: { userId: authReq.userId! } };
  where.approvalStatus = 'approved';
}
```

- [ ] **Step 2: Editar `getTaskById`**

Trocar o `where` do `findFirst` (linhas 166-169) por:

```ts
const task = await prisma.task.findFirst({
  where: isAdmin
    ? { id }
    : { id, assignments: { some: { userId: authReq.userId! } }, approvalStatus: 'approved' },
  include: taskInclude,
});
```

- [ ] **Step 3: Typecheck**

Run: `cd backend && npm run build`
Expected: compila sem erro.

- [ ] **Step 4: Verificação manual**

Com uma Task `pending_approval` criada na Task 2 e um usuário comum atribuído a ela:

```bash
curl -s http://localhost:3001/api/tasks -H "Authorization: Bearer $USER_JWT" | grep -c "pending_approval"
```

Expected: `0` (task pendente não aparece pro usuário comum). Repetir com `$ADMIN_JWT` — deve aparecer.

- [ ] **Step 5: Commit**

```bash
git add backend/src/controllers/taskController.ts
git commit -m "feat(tasks): esconde tasks não aprovadas de quem não é admin"
```

---

### Task 4: `GET /tasks/pending-approval`

**Files:**
- Modify: `backend/src/controllers/taskController.ts` (adicionar `getPendingApproval`)
- Modify: `backend/src/routes/tasks.ts`

**Interfaces:**
- Produces: `GET /tasks/pending-approval` → `Task[]` (com `checklistItems` incluído) — consumido pela Task 11 (frontend).

- [ ] **Step 1: Adicionar o handler**

Em `taskController.ts`, após `getTasks`:

```ts
export const getPendingApproval = async (req: Request, res: Response) => {
  try {
    const pending = await prisma.task.findMany({
      where: { approvalStatus: 'pending_approval' },
      include: { ...taskInclude, checklistItems: true },
      orderBy: { createdAt: 'asc' },
    });
    res.json(pending);
  } catch (error) {
    console.error('Erro ao buscar tarefas pendentes de aprovação:', error);
    res.status(500).json({ error: 'Erro ao buscar tarefas pendentes de aprovação' });
  }
};
```

- [ ] **Step 2: Registrar a rota**

Em `backend/src/routes/tasks.ts`, importar `getPendingApproval` e adicionar a rota **antes** de `router.get('/:id', ...)` (senão o Express tenta casar `pending-approval` como `:id`):

```ts
router.get('/pending-approval', adminMiddleware, getPendingApproval);
router.get('/:id', getTaskById);
```

- [ ] **Step 3: Typecheck**

Run: `cd backend && npm run build`
Expected: compila sem erro.

- [ ] **Step 4: Verificação manual**

```bash
curl -s http://localhost:3001/api/tasks/pending-approval -H "Authorization: Bearer $ADMIN_JWT"
```

Expected: array com as Tasks `pending_approval` criadas antes, cada uma com `checklistItems` (11 itens).

- [ ] **Step 5: Commit**

```bash
git add backend/src/controllers/taskController.ts backend/src/routes/tasks.ts
git commit -m "feat(tasks): endpoint GET /tasks/pending-approval"
```

---

### Task 5: `POST /tasks/:id/approve`

**Files:**
- Modify: `backend/src/controllers/taskController.ts`
- Modify: `backend/src/routes/tasks.ts`

**Interfaces:**
- Consumes: `awardXp({ userId, amount, reason, category, refId }): Promise<{ xp, level }>` (`backend/src/services/xp.ts`), `TASK_CHECKLIST_ITEMS`/`getChecklistItemDef` (Task 1)

- [ ] **Step 1: Adicionar o handler**

Em `taskController.ts`, importar no topo:

```ts
import { awardXp } from '../services/xp';
import { TASK_CHECKLIST_ITEMS, getChecklistItemDef } from '../constants/taskChecklistItems';
```

Adicionar após `deleteTask`:

```ts
export const approveTask = async (req: Request, res: Response) => {
  try {
    const taskId = req.params.id as string;

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: { checklistItems: true, assignments: true },
    });
    if (!task) return res.status(404).json({ error: 'Tarefa não encontrada' });
    if (task.approvalStatus !== 'pending_approval') {
      return res.status(400).json({ error: 'Tarefa não está pendente de aprovação' });
    }

    const missingMandatory = TASK_CHECKLIST_ITEMS.filter((def) => def.mandatory).filter((def) => {
      const item = task.checklistItems.find((i) => i.key === def.key);
      return item?.itemStatus !== 'done';
    });
    if (missingMandatory.length > 0) {
      return res.status(400).json({
        error: 'Itens obrigatórios pendentes',
        missing: missingMandatory.map((d) => d.key),
      });
    }

    const bonusXp = task.checklistItems.reduce((sum, item) => {
      const def = getChecklistItemDef(item.key);
      if (!def || def.mandatory || item.itemStatus !== 'done') return sum;
      return sum + (def.xpWeight ?? 0);
    }, 0);

    await prisma.task.update({ where: { id: taskId }, data: { approvalStatus: 'approved' } });

    if (bonusXp > 0) {
      await awardXp({
        userId: task.createdBy,
        amount: bonusXp,
        reason: `Checklist de aprovação: ${task.title}`,
        category: 'task_checklist',
        refId: task.id,
      });
    }

    for (const a of task.assignments) {
      await sendNotification(a.userId, 'task_approved', `Tarefa disponível: ${task.title}`, task.id);
    }

    res.json({ approvalStatus: 'approved', bonusXpAwarded: bonusXp });
  } catch (error) {
    console.error('Erro ao aprovar tarefa:', error);
    res.status(500).json({ error: 'Erro ao aprovar tarefa' });
  }
};
```

- [ ] **Step 2: Registrar a rota**

Em `backend/src/routes/tasks.ts`:

```ts
router.post('/:id/approve', adminMiddleware, approveTask);
```

- [ ] **Step 3: Typecheck**

Run: `cd backend && npm run build`
Expected: compila sem erro.

- [ ] **Step 4: Verificação manual**

```bash
# task com item obrigatório "automated_tests" ainda pending → esperado 400 com missing: ["automated_tests"]
curl -s -X POST http://localhost:3001/api/tasks/<taskId>/approve -H "Authorization: Bearer $ADMIN_JWT"

# depois de marcar todos os obrigatórios como done (via Task 7) → esperado 200 com bonusXpAwarded
curl -s -X POST http://localhost:3001/api/tasks/<taskId>/approve -H "Authorization: Bearer $ADMIN_JWT"
```

Conferir no banco (`npx prisma studio` ou query direta) que `XpTransaction` ganhou uma linha `category: 'task_checklist'` pro `createdBy` da task, com o valor correto (soma dos itens opcionais `done`).

- [ ] **Step 5: Commit**

```bash
git add backend/src/controllers/taskController.ts backend/src/routes/tasks.ts
git commit -m "feat(tasks): endpoint de aprovação credita XP bônus e libera a task"
```

---

### Task 6: `POST /tasks/:id/reject`

**Files:**
- Modify: `backend/src/controllers/taskController.ts`
- Modify: `backend/src/routes/tasks.ts`

- [ ] **Step 1: Adicionar o handler**

```ts
export const rejectTask = async (req: Request, res: Response) => {
  try {
    const taskId = req.params.id as string;
    const { reason } = req.body as { reason?: string };
    if (!reason || reason.trim().length === 0) {
      return res.status(400).json({ error: 'reason é obrigatório' });
    }

    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!task) return res.status(404).json({ error: 'Tarefa não encontrada' });
    if (task.approvalStatus !== 'pending_approval') {
      return res.status(400).json({ error: 'Tarefa não está pendente de aprovação' });
    }

    await prisma.task.update({
      where: { id: taskId },
      data: { approvalStatus: 'rejected', rejectionReason: reason },
    });

    await sendNotification(
      task.createdBy,
      'task_rejected',
      `Tarefa "${task.title}" rejeitada: ${reason}`,
      task.id,
    );

    res.json({ approvalStatus: 'rejected' });
  } catch (error) {
    console.error('Erro ao rejeitar tarefa:', error);
    res.status(500).json({ error: 'Erro ao rejeitar tarefa' });
  }
};
```

- [ ] **Step 2: Registrar a rota**

```ts
router.post('/:id/reject', adminMiddleware, rejectTask);
```

- [ ] **Step 3: Typecheck**

Run: `cd backend && npm run build`
Expected: compila sem erro.

- [ ] **Step 4: Verificação manual**

```bash
# sem reason → esperado 400
curl -s -X POST http://localhost:3001/api/tasks/<taskId>/reject -H "Authorization: Bearer $ADMIN_JWT" -H "Content-Type: application/json" -d '{}'

# com reason → esperado 200, approvalStatus rejected
curl -s -X POST http://localhost:3001/api/tasks/<taskId>/reject -H "Authorization: Bearer $ADMIN_JWT" -H "Content-Type: application/json" -d '{"reason":"faltou o item de testes"}'
```

- [ ] **Step 5: Commit**

```bash
git add backend/src/controllers/taskController.ts backend/src/routes/tasks.ts
git commit -m "feat(tasks): endpoint de rejeição exige motivo e notifica o criador"
```

---

### Task 7: `PATCH /tasks/:id/checklist` + `POST /tasks/:id/resubmit`

**Files:**
- Modify: `backend/src/controllers/taskController.ts`
- Modify: `backend/src/routes/tasks.ts`

**Interfaces:**
- Consumes: `checklistSubmissionSchema` (Task 2)

- [ ] **Step 1: Adicionar os handlers**

```ts
export const updateChecklist = async (req: Request, res: Response) => {
  try {
    const taskId = req.params.id as string;
    const parsed = checklistSubmissionSchema.safeParse(req.body.checklist);
    if (!parsed.success) {
      return res.status(400).json({ error: 'checklist inválido', details: parsed.error.issues });
    }

    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!task) return res.status(404).json({ error: 'Tarefa não encontrada' });

    for (const item of parsed.data) {
      await prisma.taskChecklistItem.update({
        where: { taskId_key: { taskId, key: item.key } },
        data: { itemStatus: item.itemStatus, justification: item.justification ?? null },
      });
    }

    res.json({ message: 'Checklist atualizado' });
  } catch (error) {
    console.error('Erro ao atualizar checklist:', error);
    res.status(500).json({ error: 'Erro ao atualizar checklist' });
  }
};

export const resubmitTask = async (req: Request, res: Response) => {
  try {
    const taskId = req.params.id as string;
    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!task) return res.status(404).json({ error: 'Tarefa não encontrada' });
    if (task.approvalStatus !== 'rejected') {
      return res.status(400).json({ error: 'Tarefa não está rejeitada' });
    }

    await prisma.task.update({
      where: { id: taskId },
      data: { approvalStatus: 'pending_approval', rejectionReason: null },
    });

    res.json({ approvalStatus: 'pending_approval' });
  } catch (error) {
    console.error('Erro ao reenviar tarefa:', error);
    res.status(500).json({ error: 'Erro ao reenviar tarefa' });
  }
};
```

- [ ] **Step 2: Registrar as rotas**

```ts
router.patch('/:id/checklist', adminMiddleware, updateChecklist);
router.post('/:id/resubmit', adminMiddleware, resubmitTask);
```

- [ ] **Step 3: Typecheck**

Run: `cd backend && npm run build`
Expected: compila sem erro.

- [ ] **Step 4: Verificação manual**

Ciclo completo numa task rejeitada na Task 6:

```bash
curl -s -X PATCH http://localhost:3001/api/tasks/<taskId>/checklist \
  -H "Authorization: Bearer $ADMIN_JWT" -H "Content-Type: application/json" \
  -d '{"checklist":[{"key":"automated_tests","itemStatus":"done"}, ... demais 10 itens ...]}'

curl -s -X POST http://localhost:3001/api/tasks/<taskId>/resubmit -H "Authorization: Bearer $ADMIN_JWT"
```

Expected: segunda chamada retorna `approvalStatus: "pending_approval"`; a task volta a aparecer em `GET /tasks/pending-approval`.

- [ ] **Step 5: Commit**

```bash
git add backend/src/controllers/taskController.ts backend/src/routes/tasks.ts
git commit -m "feat(tasks): edição de checklist e reenvio após rejeição"
```

---

### Task 8: Frontend — catálogo + `TaskChecklistForm` (TDD)

**Files:**
- Create: `frontend/src/lib/taskChecklist.ts`
- Create: `frontend/src/components/tasks/TaskChecklistForm.tsx`
- Test: `frontend/src/components/tasks/TaskChecklistForm.test.tsx`

**Interfaces:**
- Produces: `ChecklistItemValue { key: string; itemStatus: 'done' | 'pending' | 'not_applicable'; justification?: string }`, `emptyChecklistValue(): ChecklistItemValue[]`, componente `<TaskChecklistForm value readOnly? onChange />` — consumido pela Task 10 e 11.

- [ ] **Step 1: Criar o catálogo espelhado**

Create `frontend/src/lib/taskChecklist.ts` (espelha `backend/src/constants/taskChecklistItems.ts` — mesma duplicação intencional já usada pra fórmula de nível em `lib/xp.ts`):

```ts
export type ChecklistItemStatus = 'done' | 'pending' | 'not_applicable';

export interface ChecklistItemValue {
  key: string;
  itemStatus: ChecklistItemStatus;
  justification?: string;
}

export interface ChecklistItemDef {
  key: string;
  label: string;
  mandatory: boolean;
  xpWeight: number | null;
}

export const TASK_CHECKLIST_ITEMS: ChecklistItemDef[] = [
  { key: 'prd', label: 'Documento do que a entrega resolve (PRD)', mandatory: false, xpWeight: 10 },
  { key: 'rbac', label: 'Matriz de quem pode ver/fazer o quê', mandatory: false, xpWeight: 20 },
  { key: 'tenant_isolation', label: 'Isolamento de dado entre clientes/setores', mandatory: false, xpWeight: 30 },
  { key: 'rls', label: 'Trava de acesso dentro do próprio banco', mandatory: false, xpWeight: 35 },
  { key: 'secrets', label: 'Nenhuma credencial no código-fonte', mandatory: true, xpWeight: null },
  { key: 'modular_arch', label: 'Arquitetura modular / feature flag', mandatory: false, xpWeight: 25 },
  { key: 'error_reporting', label: 'Canal visível de reportar erro', mandatory: false, xpWeight: 15 },
  { key: 'automated_tests', label: 'Testes automatizados do fluxo principal', mandatory: true, xpWeight: null },
  { key: 'security_audit', label: 'Auditoria de segurança como gate de deploy', mandatory: true, xpWeight: null },
  { key: 'waf_bot', label: 'Blindagem de borda (rate limit / bot)', mandatory: false, xpWeight: 20 },
  { key: 'https_tls', label: 'HTTPS/TLS ponta a ponta', mandatory: true, xpWeight: null },
];

export function emptyChecklistValue(): ChecklistItemValue[] {
  return TASK_CHECKLIST_ITEMS.map((i) => ({ key: i.key, itemStatus: 'pending' as const }));
}
```

- [ ] **Step 2: Escrever o teste (falha primeiro)**

Create `frontend/src/components/tasks/TaskChecklistForm.test.tsx`:

```tsx
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import TaskChecklistForm from './TaskChecklistForm';
import { emptyChecklistValue } from '../../lib/taskChecklist';

describe('TaskChecklistForm', () => {
  it('starts with 0 XP bônus quando nada está marcado feito', () => {
    render(<TaskChecklistForm value={emptyChecklistValue()} onChange={vi.fn()} />);
    expect(screen.getByText('+0 XP bônus')).toBeInTheDocument();
  });

  it('não oferece opção N/A pros 4 itens obrigatórios', () => {
    render(<TaskChecklistForm value={emptyChecklistValue()} onChange={vi.fn()} />);
    expect(screen.getAllByLabelText('N/A')).toHaveLength(7);
  });

  it('soma o xpWeight do item ao marcar "Feito"', () => {
    const onChange = vi.fn();
    const { rerender } = render(<TaskChecklistForm value={emptyChecklistValue()} onChange={onChange} />);
    fireEvent.click(screen.getAllByLabelText('Feito')[0]); // primeiro item = 'prd', peso 10
    rerender(<TaskChecklistForm value={onChange.mock.calls[0][0]} onChange={onChange} />);
    expect(screen.getByText('+10 XP bônus')).toBeInTheDocument();
  });

  it('mostra campo de justificativa ao marcar um item opcional como N/A', () => {
    const onChange = vi.fn();
    const { rerender } = render(<TaskChecklistForm value={emptyChecklistValue()} onChange={onChange} />);
    fireEvent.click(screen.getAllByLabelText('N/A')[0]);
    rerender(<TaskChecklistForm value={onChange.mock.calls[0][0]} onChange={onChange} />);
    expect(screen.getByPlaceholderText('Por que não se aplica?')).toBeInTheDocument();
  });
});
```

- [ ] **Step 3: Rodar e confirmar que falha**

Run: `cd frontend && npx vitest run src/components/tasks/TaskChecklistForm.test.tsx`
Expected: FAIL — `Cannot find module './TaskChecklistForm'` (componente ainda não existe).

- [ ] **Step 4: Implementar o componente**

Create `frontend/src/components/tasks/TaskChecklistForm.tsx`:

```tsx
import { TASK_CHECKLIST_ITEMS } from '../../lib/taskChecklist';
import type { ChecklistItemValue, ChecklistItemStatus } from '../../lib/taskChecklist';

interface TaskChecklistFormProps {
  value: ChecklistItemValue[];
  onChange: (value: ChecklistItemValue[]) => void;
  readOnly?: boolean;
}

const TaskChecklistForm: React.FC<TaskChecklistFormProps> = ({ value, onChange, readOnly }) => {
  const getValue = (key: string): ChecklistItemValue =>
    value.find((v) => v.key === key) ?? { key, itemStatus: 'pending' };

  const setItem = (key: string, itemStatus: ChecklistItemStatus, justification?: string) => {
    const next = value.filter((v) => v.key !== key);
    next.push({ key, itemStatus, justification });
    onChange(next);
  };

  const bonusXp = TASK_CHECKLIST_ITEMS.filter((i) => !i.mandatory).reduce((sum, def) => {
    const v = getValue(def.key);
    return v.itemStatus === 'done' ? sum + (def.xpWeight ?? 0) : sum;
  }, 0);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="tf-label">Checklist de aprovação</span>
        <span className="tf-panel-inset px-3 py-1 text-sm font-semibold text-[color:var(--tf-primary)]">
          +{bonusXp} XP bônus
        </span>
      </div>
      {TASK_CHECKLIST_ITEMS.map((def) => {
        const current = getValue(def.key);
        return (
          <div key={def.key} className="tf-panel-inset p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-sm text-[color:var(--tf-text-main)]">{def.label}</span>
              {def.mandatory ? (
                <span className="tf-badge border border-[color:var(--tf-danger)] text-[color:var(--tf-danger)]">
                  obrigatório
                </span>
              ) : (
                <span className="text-xs text-[color:var(--tf-primary)]">+{def.xpWeight} XP</span>
              )}
            </div>
            <div className="mt-2 flex gap-3 text-sm">
              <label className="flex items-center gap-1">
                <input
                  type="radio"
                  name={`checklist-${def.key}`}
                  disabled={readOnly}
                  checked={current.itemStatus === 'done'}
                  onChange={() => setItem(def.key, 'done')}
                />
                Feito
              </label>
              <label className="flex items-center gap-1">
                <input
                  type="radio"
                  name={`checklist-${def.key}`}
                  disabled={readOnly}
                  checked={current.itemStatus === 'pending'}
                  onChange={() => setItem(def.key, 'pending')}
                />
                Pendente
              </label>
              {!def.mandatory && (
                <label className="flex items-center gap-1">
                  <input
                    type="radio"
                    name={`checklist-${def.key}`}
                    disabled={readOnly}
                    checked={current.itemStatus === 'not_applicable'}
                    onChange={() => setItem(def.key, 'not_applicable', current.justification ?? '')}
                  />
                  N/A
                </label>
              )}
            </div>
            {current.itemStatus === 'not_applicable' && (
              <input
                type="text"
                placeholder="Por que não se aplica?"
                disabled={readOnly}
                value={current.justification ?? ''}
                onChange={(e) => setItem(def.key, 'not_applicable', e.target.value)}
                className="tf-input mt-2 !text-sm"
              />
            )}
          </div>
        );
      })}
    </div>
  );
};

export default TaskChecklistForm;
```

- [ ] **Step 5: Rodar e confirmar que passa**

Run: `cd frontend && npx vitest run src/components/tasks/TaskChecklistForm.test.tsx`
Expected: PASS — 4 testes.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/lib/taskChecklist.ts frontend/src/components/tasks/TaskChecklistForm.tsx frontend/src/components/tasks/TaskChecklistForm.test.tsx
git commit -m "feat(tasks): componente TaskChecklistForm com XP bônus ao vivo"
```

---

### Task 9: Dividir `Tasks.tsx` em `AdminTasksView` + `UserTasksView` (refactor puro, ref. #16)

**Files:**
- Create: `frontend/src/pages/tasks/AdminTasksView.tsx`
- Create: `frontend/src/pages/tasks/UserTasksView.tsx`
- Modify: `frontend/src/pages/Tasks.tsx`

Refactor puro — sem mudança de comportamento. Fecha a issue [`#16`](https://github.com/Lab-Sobral-Dev/SbrTask/issues/16).

- [ ] **Step 1: Mover `AdminTasksView` (linhas 1-406 do `Tasks.tsx` atual)**

Create `frontend/src/pages/tasks/AdminTasksView.tsx` com o conteúdo atual de `AdminTasksView` (linhas 62-406 de `Tasks.tsx`), ajustando os imports relativos (um nível mais profundo):

```tsx
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Calendar, CheckCircle, Clock, Edit2, Plus, Search, Tag, Trash2, ThumbsUp, X, Zap,
} from 'lucide-react';
import { tasks, users } from '../../services/api';

// ... colar aqui, sem alterações de lógica, o conteúdo de:
// - adminTaskSchema / AdminTaskForm (linhas 22-31)
// - filterLabels / priorityColors / assignmentStatusColors / assignmentStatusLabels (linhas 33-58)
// - a função AdminTasksView inteira (linhas 62-406)

export default AdminTasksView;
```

(Removido apenas `useAuthStore` do import — `AdminTasksView` não usa; e a função passa a ser `export default` em vez de `const ... export` no fim do arquivo original.)

- [ ] **Step 2: Mover `UserTasksView` (linhas 408-561 do `Tasks.tsx` atual)**

Create `frontend/src/pages/tasks/UserTasksView.tsx`, mesma lógica de import ajustado:

```tsx
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Calendar, CheckCircle, Clock, Search, Tag, Zap } from 'lucide-react';
import { tasks } from '../../services/api';
import { useAuthStore } from '../../hooks/useAuthStore';

// ... colar aqui: priorityColors / assignmentStatusColors (reexportar de um arquivo
// compartilhado seria mais DRY, mas os dois arquivos usam paletas parcialmente
// diferentes hoje — manter a duplicação atual do Tasks.tsx original, sem introduzir
// abstração nova fora do escopo desta tarefa)
// - userFilterLabels (linhas 410-415)
// - a função UserTasksView inteira (linhas 417-561)

export default UserTasksView;
```

- [ ] **Step 3: Reduzir `Tasks.tsx` ao roteador**

Replace o conteúdo de `frontend/src/pages/Tasks.tsx` inteiro por:

```tsx
import { useAuthStore } from '../hooks/useAuthStore';
import AdminTasksView from './tasks/AdminTasksView';
import UserTasksView from './tasks/UserTasksView';

const Tasks: React.FC = () => {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin';
  return isAdmin ? <AdminTasksView /> : <UserTasksView />;
};

export default Tasks;
```

`frontend/src/App.tsx` não muda — continua importando `from './pages/Tasks'`.

- [ ] **Step 4: Typecheck**

Run: `cd frontend && npx tsc --noEmit`
Expected: sem erro.

- [ ] **Step 5: Rodar a suíte inteira**

Run: `cd frontend && npm test`
Expected: PASS (nenhum teste existente referenciava `Tasks.tsx` diretamente, então nenhum quebra).

- [ ] **Step 6: Verificação manual**

Run: `cd frontend && npm run dev`, abrir `/tasks` logado como admin e depois como usuário comum — comportamento idêntico ao de antes do split.

- [ ] **Step 7: Commit**

```bash
git add frontend/src/pages/tasks/AdminTasksView.tsx frontend/src/pages/tasks/UserTasksView.tsx frontend/src/pages/Tasks.tsx
git commit -m "refactor(tasks): divide Tasks.tsx em AdminTasksView + UserTasksView (fecha #16)"
```

---

### Task 10: Integrar `TaskChecklistForm` na criação de Task

**Files:**
- Modify: `frontend/src/pages/tasks/AdminTasksView.tsx` (Task 9)
- Modify: `frontend/src/services/api.ts:58-66` (`tasks.create`)

**Interfaces:**
- Consumes: `<TaskChecklistForm value onChange readOnly? />`, `emptyChecklistValue()` (Task 8)

- [ ] **Step 1: Atualizar `services/api.ts`**

Em `tasks.create`, adicionar `checklist` ao tipo do payload:

```ts
create: (data: {
  title: string;
  description?: string;
  priority?: string;
  dueDate?: string;
  category?: string;
  xpReward: number;
  assigneeIds: string[];
  checklist: { key: string; itemStatus: string; justification?: string }[];
}) => api.post('/tasks', data),
```

- [ ] **Step 2: Adicionar estado do checklist em `AdminTasksView`**

No topo do componente, junto aos outros `useState`:

```ts
const [checklist, setChecklist] = useState<ChecklistItemValue[]>(emptyChecklistValue());
```

Import necessário: `import TaskChecklistForm from '../../components/tasks/TaskChecklistForm';` e `import { emptyChecklistValue, type ChecklistItemValue } from '../../lib/taskChecklist';`.

- [ ] **Step 3: Resetar o checklist ao abrir o modal e enviar no submit**

Em `openCreate`, `openEdit` e no `onSubmit`, ajustar:

```ts
const openCreate = () => {
  setEditingTask(null);
  reset({ priority: 'medium', xpReward: 25, assigneeIds: [] });
  setChecklist(emptyChecklistValue());
  setShowModal(true);
};

const onSubmit = (data: AdminTaskForm) => {
  if (editingTask) {
    updateMutation.mutate({ id: editingTask.id, data });
  } else {
    createMutation.mutate({ ...data, checklist });
  }
};
```

(Edição de Task existente não passa `checklist` — o backend só exige o array em `createTask`; editar o checklist de uma task já criada é feito pela fila de aprovação, Task 11.)

- [ ] **Step 4: Renderizar o formulário dentro do modal**

Dentro do `<form onSubmit={handleSubmit(onSubmit)} ...>`, após o bloco "Atribuir usuários" e antes dos botões de ação:

```tsx
{!editingTask && (
  <div>
    <label className="tf-label">Checklist pré-implementação</label>
    <TaskChecklistForm value={checklist} onChange={setChecklist} />
  </div>
)}
```

- [ ] **Step 5: Typecheck**

Run: `cd frontend && npx tsc --noEmit`
Expected: sem erro.

- [ ] **Step 6: Verificação manual**

Run: `cd frontend && npm run dev`, abrir "Nova tarefa" como admin, preencher o checklist, criar — confirmar (via Network tab ou backend log) que o payload inclui `checklist` com 11 itens e que a resposta tem `approvalStatus: "pending_approval"`.

- [ ] **Step 7: Commit**

```bash
git add frontend/src/pages/tasks/AdminTasksView.tsx frontend/src/services/api.ts
git commit -m "feat(tasks): passo de checklist na criação de Task"
```

---

### Task 11: Fila de aprovação no frontend

**Files:**
- Modify: `frontend/src/pages/tasks/AdminTasksView.tsx`
- Modify: `frontend/src/services/api.ts`

**Interfaces:**
- Consumes: `GET /tasks/pending-approval`, `POST /tasks/:id/approve`, `POST /tasks/:id/reject` (Tasks 4-6), `<TaskChecklistForm readOnly />` (Task 8)

- [ ] **Step 1: Adicionar os métodos em `services/api.ts`**

Após `tasks.getStats`:

```ts
getPendingApproval: () => api.get('/tasks/pending-approval'),
approveTask: (id: string) => api.post(`/tasks/${id}/approve`),
rejectTask: (id: string, reason: string) => api.post(`/tasks/${id}/reject`, { reason }),
```

- [ ] **Step 2: Adicionar a seção "Aprovações pendentes" em `AdminTasksView`**

Query + mutations, junto às demais já existentes no componente:

```ts
const { data: pendingData } = useQuery({
  queryKey: ['tasks', 'pending-approval'],
  queryFn: () => tasks.getPendingApproval(),
});
const pendingList = pendingData?.data ?? [];

const [rejectingId, setRejectingId] = useState<string | null>(null);
const [rejectReason, setRejectReason] = useState('');

const approvePendingMutation = useMutation({
  mutationFn: (id: string) => tasks.approveTask(id),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['tasks'] });
    queryClient.invalidateQueries({ queryKey: ['tasks', 'pending-approval'] });
  },
});

const rejectPendingMutation = useMutation({
  mutationFn: ({ id, reason }: { id: string; reason: string }) => tasks.rejectTask(id, reason),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['tasks', 'pending-approval'] });
    setRejectingId(null);
    setRejectReason('');
  },
});
```

- [ ] **Step 3: Renderizar a fila**

Antes da `<section className="tf-panel p-6">` existente (lista principal de tasks), adicionar:

```tsx
{pendingList.length > 0 && (
  <section className="tf-panel p-6">
    <h2 className="tf-title text-xl text-[color:var(--tf-text-main)]">
      Aprovações pendentes ({pendingList.length})
    </h2>
    <div className="mt-4 space-y-3">
      {pendingList.map((task: any) => {
        const mandatoryDefs = TASK_CHECKLIST_ITEMS.filter((i) => i.mandatory);
        const mandatoryOk = mandatoryDefs.every(
          (def) => task.checklistItems.find((i: any) => i.key === def.key)?.itemStatus === 'done',
        );
        const bonusXp = task.checklistItems.reduce((sum: number, item: any) => {
          const def = TASK_CHECKLIST_ITEMS.find((d) => d.key === item.key);
          if (!def || def.mandatory || item.itemStatus !== 'done') return sum;
          return sum + (def.xpWeight ?? 0);
        }, 0);

        return (
          <article key={task.id} className="tf-panel-inset p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <strong className="text-[color:var(--tf-text-main)]">{task.title}</strong>
                <p className="text-xs text-[color:var(--tf-text-dim)]">
                  {mandatoryOk ? 'Obrigatórios ok' : 'Falta item obrigatório'} · {bonusXp} XP bônus preenchido
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => approvePendingMutation.mutate(task.id)}
                  disabled={!mandatoryOk || approvePendingMutation.isPending}
                  className="tf-btn tf-btn-primary disabled:opacity-50"
                >
                  Aprovar
                </button>
                <button onClick={() => setRejectingId(task.id)} className="tf-btn tf-btn-secondary">
                  Rejeitar
                </button>
              </div>
            </div>
            <details className="mt-2">
              <summary className="cursor-pointer text-xs text-[color:var(--tf-text-dim)]">Ver checklist</summary>
              <div className="mt-2">
                <TaskChecklistForm value={task.checklistItems} onChange={() => {}} readOnly />
              </div>
            </details>
            {rejectingId === task.id && (
              <div className="mt-2 flex gap-2">
                <input
                  type="text"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Motivo da rejeição"
                  className="tf-input !text-sm"
                />
                <button
                  onClick={() => rejectPendingMutation.mutate({ id: task.id, reason: rejectReason })}
                  disabled={!rejectReason.trim() || rejectPendingMutation.isPending}
                  className="tf-btn !border-[color:var(--tf-danger)] !text-[color:var(--tf-danger)] disabled:opacity-50"
                >
                  Confirmar
                </button>
              </div>
            )}
          </article>
        );
      })}
    </div>
  </section>
)}
```

Import necessário no topo: `import { TASK_CHECKLIST_ITEMS } from '../../lib/taskChecklist';`.

- [ ] **Step 4: Typecheck**

Run: `cd frontend && npx tsc --noEmit`
Expected: sem erro.

- [ ] **Step 5: Verificação manual**

Run: `cd frontend && npm run dev`. Como admin: criar uma Task com item obrigatório pendente → aparece na fila com "Aprovar" desabilitado; marcar via edição/reenvio até obrigatórios ok → "Aprovar" habilita; aprovar → task some da fila e some da seção de pendentes; rejeitar outra com motivo → some da fila (fica em `rejected`, sem UI de reenvio nesta versão — reenvio via API direta, ver nota abaixo).

**Nota de escopo:** a UI de edição+reenvio de uma Task `rejected` (endpoints da Task 7) não está coberta nesta Task 11 — ficou definida no spec mas a superfície de UI mínima (fila + aprovar/rejeitar) já entrega o core do gate. Se quiser a UI de reenvio, é uma Task 12 à parte, não incluída aqui por escopo.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/pages/tasks/AdminTasksView.tsx frontend/src/services/api.ts
git commit -m "feat(tasks): fila de aprovação com XP bônus e bloqueio por item obrigatório"
```

---

## Cobertura do spec

- [x] Modelo de dados (`Task.approvalStatus`/`rejectionReason` + `TaskChecklistItem`) — Task 1
- [x] Catálogo hardcoded dos 11 itens, peso/obrigatoriedade só no backend — Tasks 1, 8
- [x] Criação grava checklist e nasce `pending_approval` — Task 2
- [x] Task não aparece pra quem não é admin antes de aprovada — Task 3
- [x] Fila de aprovação — Tasks 4, 11
- [x] Aprovar bloqueia por item obrigatório e credita XP via `awardXp()` — Task 5
- [x] Rejeitar exige motivo e notifica — Task 6
- [x] Reenvio após rejeição (API) — Task 7 (UI de reenvio fora de escopo, ver nota na Task 11)
- [x] Split de `Tasks.tsx` (#16) — Task 9
- [x] Testes de `TaskChecklistForm` — Task 8
