import prisma from '../utils/prisma';
import { calculatePriorityScore } from '../utils/captain-calculator';

export const getTasks = async (userId: string) => {
  // 마감일이 빠른 순서대로 과제 목록을 가져옵니다.
  return prisma.task.findMany({ 
    where: { userId },
    orderBy: { dueAt: 'asc' } 
  });
};

export const createTask = async (userId: string, data: any) => {
  return prisma.task.create({
    data: { ...data, userId }
  });
};

export const updateTask = async (userId: string, taskId: string, data: any) => {
  // 🔒 내 과제가 맞는지 확인
  const task = await prisma.task.findFirst({ where: { id: taskId, userId } });
  if (!task) throw new Error('해당 과제를 찾을 수 없거나 수정 권한이 없습니다.');

  return prisma.task.update({
    where: { id: taskId },
    data
  });
};

export const deleteTask = async (userId: string, taskId: string) => {
  // 🔒 내 과제가 맞는지 확인
  const task = await prisma.task.findFirst({ where: { id: taskId, userId } });
  if (!task) throw new Error('해당 과제를 찾을 수 없거나 삭제 권한이 없습니다.');

  return prisma.task.delete({
    where: { id: taskId }
  });
};

// 💡 6주차 목표: 프론트엔드 대시보드용 (오늘의 할 일 Top 3)
export const getPrioritizedTasks = async (userId: string) => {
  // 1. 아직 안 끝난(PENDING) 과제들만 가져오기
  const tasks = await prisma.task.findMany({ 
    where: { userId, status: 'PENDING' } 
  });
  
  // 2. 조장님 계산 모듈(현재는 임시 0점 반환)을 통해 점수 매기기
  const scoredTasks = tasks.map((task: any) => {
    const priorityScore = calculatePriorityScore(task);
    return { ...task, priorityScore };
  });

  // 3. 점수가 가장 높은 순으로 3개만 잘라서 반환
  return scoredTasks
    .sort((a: any, b: any) => b.priorityScore - a.priorityScore)
    .slice(0, 3);
};
