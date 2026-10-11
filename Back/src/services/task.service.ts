import prisma from '../utils/prisma';
import { calculatePriorityScore } from '../utils/captain-calculator';
import { AppError } from '../utils/app-error';

export const getTasks = async (userId: string) => {
  return prisma.task.findMany({ 
    where: { userId },
    orderBy: { dueAt: 'asc' } 
  });
};

export const createTask = async (userId: string, data: any) => {
  return prisma.task.create({
    data: {
      ...data,
      userId,
      dueAt: new Date(data.dueAt),
    }
  });
};

export const updateTask = async (userId: string, taskId: string, data: any) => {
  // 🔒 내 과제가 맞는지 확인
  const task = await prisma.task.findFirst({ where: { id: taskId, userId } });
  if (!task) throw new AppError('해당 과제를 찾을 수 없거나 수정 권한이 없습니다.', 404);

  const updateData = { ...data };
  if (data.dueAt) updateData.dueAt = new Date(data.dueAt);

  return prisma.task.update({
    where: { id: taskId },
    data: updateData
  });
};

export const deleteTask = async (userId: string, taskId: string) => {
  // 🔒 내 과제가 맞는지 확인
  const task = await prisma.task.findFirst({ where: { id: taskId, userId } });
  if (!task) throw new AppError('해당 과제를 찾을 수 없거나 삭제 권한이 없습니다.', 404);

  return prisma.task.delete({
    where: { id: taskId }
  });
};

// 프론트엔드 대시보드용 (오늘의 할 일 Top 3)
export const getPrioritizedTasks = async (userId: string) => {
  // 1. 아직 안 끝난(PENDING 또는 IN_PROGRESS) 과제들 가져오기
  const tasks = await prisma.task.findMany({ 
    where: { 
      userId, 
      status: { in: ['PENDING', 'IN_PROGRESS'] } 
    } 
  });
  
  // 2. 조장님 계산 모듈을 통해 긴급도/중요도 기반 점수 매기기
  const scoredTasks = tasks.map((task: any) => {
    const priorityScore = calculatePriorityScore(task);
    return { ...task, priorityScore };
  });

  // 3. 점수가 가장 높은 순으로 3개 반환
  return scoredTasks
    .sort((a: any, b: any) => b.priorityScore - a.priorityScore)
    .slice(0, 3);
};
