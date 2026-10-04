import prisma from '../utils/prisma';
import { calculatePriorityScore } from '../utils/captain-calculator';

export const getTasks = async (userId: string) => {
  return prisma.task.findMany({ where: { userId } });
};

export const createTask = async (userId: string, data: any) => {
  return prisma.task.create({
    data: { ...data, userId, status: 'PENDING' }
  });
};

export const updateTask = async (userId: string, taskId: string, data: any) => {
  const task = await prisma.task.findFirst({ where: { id: taskId, userId } });
  if (!task) throw new Error('Task not found or not authorized');

  return prisma.task.update({
    where: { id: taskId },
    data
  });
};

export const deleteTask = async (userId: string, taskId: string) => {
  const task = await prisma.task.findFirst({ where: { id: taskId, userId } });
  if (!task) throw new Error('Task not found or not authorized');

  return prisma.task.delete({
    where: { id: taskId }
  });
};

export const getPrioritizedTasks = async (userId: string) => {
  const tasks = await prisma.task.findMany({ where: { userId, status: 'PENDING' } });
  
  // 조장님 계산 모듈로 원본 데이터를 전달하고 계산된 점수를 받음
  const scoredTasks = tasks.map(task => {
    const priorityScore = calculatePriorityScore(task);
    return { ...task, priorityScore };
  });

  return scoredTasks.sort((a, b) => b.priorityScore - a.priorityScore).slice(0, 3);
};
