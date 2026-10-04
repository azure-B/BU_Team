import prisma from '../utils/prisma';

export const getSchedules = async (userId: string, from?: string, to?: string) => {
  const whereClause: any = { userId };
  if (from && to) {
    whereClause.startAt = { gte: new Date(from) };
    whereClause.endAt = { lte: new Date(to) };
  }
  return prisma.schedule.findMany({ where: whereClause });
};

export const createSchedule = async (userId: string, data: any) => {
  return prisma.schedule.create({
    data: { ...data, userId }
  });
};

export const updateSchedule = async (userId: string, scheduleId: string, data: any) => {
  // 권한 검증: 내 일정인지 확인
  const schedule = await prisma.schedule.findFirst({ where: { id: scheduleId, userId } });
  if (!schedule) throw new Error('Schedule not found or not authorized');

  return prisma.schedule.update({
    where: { id: scheduleId },
    data
  });
};

export const deleteSchedule = async (userId: string, scheduleId: string) => {
  const schedule = await prisma.schedule.findFirst({ where: { id: scheduleId, userId } });
  if (!schedule) throw new Error('Schedule not found or not authorized');

  return prisma.schedule.delete({
    where: { id: scheduleId }
  });
};
