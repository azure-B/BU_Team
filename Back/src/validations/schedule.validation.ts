import { z } from 'zod';

export const createScheduleSchema = z.object({
  title: z.string().min(1, '일정 제목은 1자 이상이어야 합니다.').max(100, '일정 제목은 100자 이하이어야 합니다.'),
  type: z.string().default('CLASS'),
  startAt: z.string().datetime({ message: '시작 일시는 올바른 ISO 날짜 형식이어야 합니다.' }),
  endAt: z.string().datetime({ message: '종료 일시는 올바른 ISO 날짜 형식이어야 합니다.' }),
  buildingId: z.string().optional().nullable(),
}).refine((data) => new Date(data.startAt) <= new Date(data.endAt), {
  message: '종료 일시는 시작 일시 이후여야 합니다.',
  path: ['endAt'],
});

export const updateScheduleSchema = z.object({
  title: z.string().min(1, '일정 제목은 1자 이상이어야 합니다.').max(100, '일정 제목은 100자 이하이어야 합니다.').optional(),
  type: z.string().optional(),
  startAt: z.string().datetime({ message: '올바른 ISO 날짜 형식이어야 합니다.' }).optional(),
  endAt: z.string().datetime({ message: '올바른 ISO 날짜 형식이어야 합니다.' }).optional(),
  buildingId: z.string().optional().nullable(),
}).refine((data) => {
  if (data.startAt && data.endAt) {
    return new Date(data.startAt) <= new Date(data.endAt);
  }
  return true;
}, {
  message: '종료 일시는 시작 일시 이후여야 합니다.',
  path: ['endAt'],
});

export const getSchedulesQuerySchema = z.object({
  from: z.string().datetime({ message: 'from은 올바른 ISO 날짜 형식이어야 합니다.' }).optional(),
  to: z.string().datetime({ message: 'to는 올바른 ISO 날짜 형식이어야 합니다.' }).optional(),
});
