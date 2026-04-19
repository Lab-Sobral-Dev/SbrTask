# Admin Task Management + Assignments + Notifications — Design Spec

**Data:** 2026-04-19
**Status:** Aprovado
**Escopo:** `backend/`, `frontend/src/`

---

## Contexto

O sistema atual é individual: cada usuário cria e gerencia suas próprias tasks. A nova versão transfere a criação de tasks para admins, que atribuem tasks a múltiplos usuários. Usuários comuns não criam mais tasks — apenas recebem, executam e concluem. Este documento cobre Sub-projeto 1: roles, assignment, notificações. Sub-projeto 2 (fluxo de aprovação + XP pós-aprovação) constrói sobre este.

---

## Modelo de Dados (Prisma)

### Alterações em modelos existentes

**User** — sem campo novo; `role` já existe como `String @default("user")`. Passa a aceitar `"admin"` | `"user"` explicitamente. Adiciona relações:
```prisma
createdTasks   Task[]           @relation("TaskCreator")
assignments    TaskAssignment[]
notifications  Notification[]
```

**Task** — remove `userId` (dono único), adiciona `createdBy`:
```prisma
// Remover:
userId   String
user     User     @relation(fields: [userId], references: [id])

// Adicionar:
createdBy   String
creator     User             @relation("TaskCreator", fields: [createdBy], references: [id])
assignments TaskAssignment[]
```
`Task.status` passa a ser derivado: `"active"` enquanto houver assignments incompletos; `"completed"` quando todos os assignments estiverem `"completed"`. Atualizado pelo endpoint de conclusão.

### Novos modelos

```prisma
model TaskAssignment {
  id          String    @id @default(uuid())
  taskId      String
  userId      String
  status      String    @default("pending")  // pending | in_progress | completed
  completedAt DateTime?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  task        Task      @relation(fields: [taskId], references: [id], onDelete: Cascade)
  user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([taskId, userId])
}

model Notification {
  id        String   @id @default(uuid())
  userId    String
  type      String   // "task_assigned" | "task_updated"
  message   String
  read      Boolean  @default(false)
  taskId    String?
  createdAt DateTime @default(now())
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

---

## Backend

### Middleware

**`adminMiddleware`** — novo, composto com `authMiddleware`:
```ts
// backend/src/middlewares/admin.ts
export const adminMiddleware = async (req, res, next) => {
  const user = await prisma.user.findUnique({ where: { id: req.userId } });
  if (!user || user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  next();
};
```

### Rotas de Tasks (reescritas)

| Método | Rota | Middleware | Descrição |
|--------|------|------------|-----------|
| `POST` | `/tasks` | auth + admin | Cria task + assignments + notificações |
| `GET` | `/tasks` | auth | Admin: todas as tasks com assignments. Usuário: só as suas |
| `GET` | `/tasks/:id` | auth | Detalhe da task (admin: vê todos assignments; usuário: vê só o seu) |
| `PUT` | `/tasks/:id` | auth + admin | Atualiza task + notifica assignees |
| `DELETE` | `/tasks/:id` | auth + admin | Remove task e assignments em cascata |
| `PATCH` | `/tasks/:id/assignment` | auth | Usuário atualiza status do seu assignment (pending → in_progress → completed) |
| `GET` | `/tasks/stats` | auth | Estatísticas baseadas em TaskAssignment do usuário |

#### POST /tasks — corpo esperado
```ts
{
  title: string;
  description?: string;
  priority: 'simple' | 'medium' | 'critical';
  dueDate?: string;
  category?: string;
  xpReward: number;        // admin define livremente
  assigneeIds: string[];   // array de User.id
}
```

#### Lógica de conclusão (PATCH /tasks/:id/assignment)
1. Atualiza `TaskAssignment.status = "completed"`, `completedAt = now()`
2. Verifica se todos os assignments da task estão `"completed"`
3. Se sim: atualiza `Task.status = "completed"`
4. Retorna assignment atualizado + status da task

**Nota:** XP não é creditado aqui — isso pertence ao Sub-projeto 2 (fluxo de aprovação).

### Rotas de Notificações

| Método | Rota | Middleware | Descrição |
|--------|------|------------|-----------|
| `GET` | `/notifications` | auth | Últimas 50 notificações do usuário, ordenadas por `createdAt DESC` |
| `PATCH` | `/notifications/read-all` | auth | Marca todas as notificações do usuário como `read = true` |

### Fluxo de Notificação (Socket.io)

Executado dentro dos controllers `createTask` e `updateTask`:
```ts
// Para cada assigneeId:
await prisma.notification.create({ data: { userId: assigneeId, type, message, taskId } });
io.to(`user-${assigneeId}`).emit('notification', { type, message, taskId, createdAt: new Date() });
```

O `io` exportado de `backend/src/index.ts` é passado para os controllers via injeção simples (parâmetro no construtor ou importação direta).

---

## Frontend

### Arquivos alterados

| Arquivo | Mudança |
|---------|---------|
| `src/services/api.ts` | Adicionar `tasks.getAssignmentStatus()`, `tasks.updateAssignment()`, `notifications.getAll()`, `notifications.markAllRead()` |
| `src/hooks/useNotifications.ts` | Conectar ao React Query: ao receber evento Socket.io `notification`, invalidar query `['notifications']` |
| `src/pages/Tasks.tsx` | Bifurcar UI: admin view vs user view baseado em `user.role` |
| `src/components/layout/Navbar.tsx` | Adicionar sino de notificações com badge e dropdown |
| `src/components/tasks/CreateTaskModal.tsx` | Novo — formulário admin com multi-select de usuários e campo xpReward |
| `src/components/tasks/TaskCard.tsx` | Atualizar para mostrar assignees + status individual (admin) ou botão "Concluir" (usuário) |
| `src/components/notifications/NotificationDropdown.tsx` | Novo — dropdown do sino |

### Página /tasks — lógica de bifurcação

```tsx
const { user } = useAuthStore();
const isAdmin = user?.role === 'admin';

return isAdmin ? <AdminTasksView /> : <UserTasksView />;
```

**AdminTasksView:** botão "Nova Tarefa", lista de todas as tasks com progresso por assignee (ex: "1/3 concluído"), ações de editar/deletar.

**UserTasksView:** lista somente tasks onde o usuário tem um `TaskAssignment`, botão "Concluir" que chama `PATCH /tasks/:id/assignment`.

### Notificações — Navbar

- Ícone de sino com badge numérico (contagem de `read: false`)
- Clique abre dropdown com lista das últimas 10 notificações
- Botão "Marcar todas como lidas" chama `PATCH /notifications/read-all` e invalida o cache

### React Query — query keys

```ts
['tasks']              // lista de tasks (bifurcada por role no backend)
['notifications']      // notificações do usuário
['notifications', 'unread-count']  // contagem para o badge
```

---

## Fluxo completo: admin cria task

1. Admin preenche modal: título, prioridade, XP, data, seleciona usuários
2. `POST /tasks` → backend cria `Task` + N `TaskAssignment` + N `Notification` no banco
3. Backend emite `notification` via Socket.io para cada assignee online
4. Frontend dos assignees recebe evento → invalida `['notifications']` → badge atualiza
5. Assignee abre o dropdown → vê "Nova tarefa atribuída: Relatório Mensal"
6. Assignee abre /tasks → vê a nova task na sua lista

## Fluxo completo: usuário conclui assignment

1. Usuário clica "Concluir" na task
2. `PATCH /tasks/:id/assignment` → `TaskAssignment.status = "completed"`
3. Backend verifica todos os assignments: se todos completos → `Task.status = "completed"`
4. Frontend invalida `['tasks']` → lista atualiza
5. *(XP e aprovação: Sub-projeto 2)*

---

## O que NÃO está neste sub-projeto

- Crédito de XP (Sub-projeto 2)
- Status `pending_approval` (Sub-projeto 2)
- Endpoint de aprovação admin (Sub-projeto 2)
- Dashboard em tempo real pós-aprovação (Sub-projeto 2)
- Página de leaderboard ou achievements (sem mudança)

---

## Arquivos do backend a criar/modificar

| Arquivo | Ação |
|---------|------|
| `backend/prisma/schema.prisma` | Alterar Task, User; criar TaskAssignment, Notification |
| `backend/src/middlewares/admin.ts` | Criar |
| `backend/src/controllers/taskController.ts` | Reescrever |
| `backend/src/controllers/notificationController.ts` | Criar |
| `backend/src/routes/tasks.ts` | Reescrever rotas + adicionar adminMiddleware |
| `backend/src/routes/notifications.ts` | Criar |
| `backend/src/index.ts` | Registrar rota /notifications; exportar `io` para controllers |
