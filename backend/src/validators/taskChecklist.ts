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
