import prisma from '../utils/prisma';
import { AppError } from '../utils/app-error';

export const getSchedules = async (userId: string, from?: string, to?: string) => {
  const whereClause: any = { userId };
  
  if (from && to) {
    whereClause.startAt = { lte: new Date(to) };
    whereClause.endAt = { gte: new Date(from) };
  }
  
  return prisma.schedule.findMany({ 
    where: whereClause,
    orderBy: { startAt: 'asc' }
  });
};

export const createSchedule = async (userId: string, data: any) => {
  return prisma.schedule.create({
    data: {
      ...data,
      userId,
      startAt: new Date(data.startAt),
      endAt: new Date(data.endAt),
    }
  });
};

export const updateSchedule = async (userId: string, scheduleId: string, data: any) => {
  // 🔒 보안: 혹시 남의 일정을 수정하려고 하는지(userId) DB에서 한 번 더 깐깐하게 검사
  const schedule = await prisma.schedule.findFirst({ where: { id: scheduleId, userId } });
  if (!schedule) throw new AppError('해당 일정을 찾을 수 없거나 수정 권한이 없습니다.', 404);

  const updateData = { ...data };
  if (data.startAt) updateData.startAt = new Date(data.startAt);
  if (data.endAt) updateData.endAt = new Date(data.endAt);

  return prisma.schedule.update({
    where: { id: scheduleId },
    data: updateData
  });
};

export const deleteSchedule = async (userId: string, scheduleId: string) => {
  // 🔒 보안: 내 일정이 맞는지 검사
  const schedule = await prisma.schedule.findFirst({ where: { id: scheduleId, userId } });
  if (!schedule) throw new AppError('해당 일정을 찾을 수 없거나 삭제 권한이 없습니다.', 404);

  return prisma.schedule.delete({
    where: { id: scheduleId }
  });
};
