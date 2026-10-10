import prisma from '../utils/prisma';

export const getSchedules = async (userId: string, from?: string, to?: string) => {
  const whereClause: any = { userId };
  
  if (from && to) {
    // 💡 버그 수정 완료: '어제 시작해서 내일 끝나는' 겹치는 일정도 완벽하게 검색해 냅니다.
    whereClause.startAt = { lte: new Date(to) };
    whereClause.endAt = { gte: new Date(from) };
  }
  
  return prisma.schedule.findMany({ 
    where: whereClause,
    orderBy: { startAt: 'asc' } // 시작 시간순으로 예쁘게 정렬해서 줍니다.
  });
};

export const createSchedule = async (userId: string, data: any) => {
  return prisma.schedule.create({
    data: { ...data, userId }
  });
};

export const updateSchedule = async (userId: string, scheduleId: string, data: any) => {
  // 🔒 보안: 혹시 남의 일정을 수정하려고 하는지(userId) DB에서 한 번 더 깐깐하게 검사
  const schedule = await prisma.schedule.findFirst({ where: { id: scheduleId, userId } });
  if (!schedule) throw new Error('해당 일정을 찾을 수 없거나 수정 권한이 없습니다.');

  return prisma.schedule.update({
    where: { id: scheduleId },
    data
  });
};

export const deleteSchedule = async (userId: string, scheduleId: string) => {
  // 🔒 보안: 내 일정이 맞는지 검사
  const schedule = await prisma.schedule.findFirst({ where: { id: scheduleId, userId } });
  if (!schedule) throw new Error('해당 일정을 찾을 수 없거나 삭제 권한이 없습니다.');

  return prisma.schedule.delete({
    where: { id: scheduleId }
  });
};
