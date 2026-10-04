import prisma from '../utils/prisma';

export const getSchedules = async (userId: string, from: string, to: string) => {
  return prisma.schedule.findMany({
    where: {
      userId,
      startAt: { gte: new Date(from) },
      endAt: { lte: new Date(to) },
    }
  });
};

export const createSchedule = async (userId: string, data: any) => {
  return prisma.schedule.create({
    data: { ...data, userId }
  });
};
