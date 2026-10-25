import { z } from 'zod';

export const routeLatenessSchema = z
  .object({
    currentBuildingId: z.string().min(1).optional(),
    lat: z.number().min(-90).max(90).optional(),
    lng: z.number().min(-180).max(180).optional(),
    nextClassBuildingId: z.string().min(1, '다음 수업 건물 ID는 필수입니다.'),
    nextClassStartAt: z.string().datetime({ message: '올바른 ISO 날짜 형식이어야 합니다.' }),
    nowAt: z.string().datetime().optional(),
  })
  .refine(
    (body) => Boolean(body.currentBuildingId) || (body.lat != null && body.lng != null),
    { message: '현재 건물 ID 또는 GPS(lat, lng)가 필요합니다.', path: ['lat'] },
  );

export const cafeteriaQuerySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '날짜 형식은 YYYY-MM-DD여야 합니다.').optional(),
});

export const facilityQuerySchema = z.object({
  type: z.string().optional(),
  buildingId: z.string().optional(),
});

export const classroomQuerySchema = z.object({
  buildingId: z.string().optional(),
});
