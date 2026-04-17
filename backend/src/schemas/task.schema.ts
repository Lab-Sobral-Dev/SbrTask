import { z } from 'zod';

export const createTaskSchema = z.object({
  title: z.string().min(1, 'Título é obrigatório').max(200),
  description: z.string().max(2000).optional(),
  priority: z.enum(['simple', 'medium', 'critical']).optional().default('medium'),
  dueDate: z.string().datetime({ offset: true }).optional(),
  category: z.string().max(100).optional(),
  xpReward: z.number().int().positive().optional(),
});

export const updateTaskSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  priority: z.enum(['simple', 'medium', 'critical']).optional(),
  status: z.enum(['pending', 'in_progress', 'completed']).optional(),
  dueDate: z.string().datetime({ offset: true }).optional(),
  category: z.string().max(100).optional(),
  xpReward: z.number().int().positive().optional(),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
