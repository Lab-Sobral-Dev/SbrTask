-- Backfill: Tasks criadas antes do gate de aprovação (migration
-- add_task_checklist_gate) nasceram com approvalStatus = 'pending_approval'
-- (DEFAULT da coluna) e nunca tiveram TaskChecklistItem — nunca passaram pelo
-- novo fluxo de checklist. Sem este backfill, essas tasks ficam invisíveis
-- para seus assignees (getTasks/getTaskById só liberam approvalStatus =
-- 'approved' pra não-admin) e travadas para sempre na fila de aprovação (o
-- botão Aprovar exige itens obrigatórios 'done', que não existem).
--
-- O sinal de "task pré-existente ao gate" é a AUSÊNCIA de TaskChecklistItem —
-- não o valor atual de approvalStatus, que pode ter sido alterado depois por
-- fluxos que não exigem checklist (ex.: reject de uma task legada). Qualquer
-- Task com pelo menos um TaskChecklistItem passou pelo fluxo novo e não é
-- tocada por este backfill.
UPDATE "Task" t SET "approvalStatus" = 'approved'
WHERE NOT EXISTS (SELECT 1 FROM "TaskChecklistItem" c WHERE c."taskId" = t."id");
