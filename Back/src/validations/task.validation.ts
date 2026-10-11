import { z } from 'zod';

export const createTaskSchema = z.object({
  title: z.string().min(1, '과제 제목은 1자 이상이어야 합니다.').max(100, '과제 제목은 100자 이하이어야 합니다.'),
  dueAt: z.string().datetime({ message: '마감 일시는 올바른 ISO 날짜 형식이어야 합니다.' }),
  importance: z.number().int('중요도는 정수여야 합니다.').min(1, '중요도는 1 이상이어야 합니다.').max(5, '중요도는 5 이하이어야 합니다.'),
  status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED']).default('PENDING'),
});

export const updateTaskSchema = z.object({
  title: z.string().min(1, '과제 제목은 1자 이상이어야 합니다.').max(100, '과제 제목은 100자 이하이어야 합니다.').optional(),
  dueAt: z.string().datetime({ message: '마감 일시는 올바른 ISO 날짜 형식이어야 합니다.' }).optional(),
  importance: z.number().int().min(1).max(5).optional(),
  status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED']).optional(),
});
