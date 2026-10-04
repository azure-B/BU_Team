import prisma from '../utils/prisma';

export const getTasks = async (userId: string) => {
  return prisma.task.findMany({ where: { userId } });
};

export const createTask = async (userId: string, data: any) => {
  return prisma.task.create({
    data: { ...data, userId, status: 'PENDING' }
  });
};

export const getPrioritizedTasks = async (userId: string) => {
  // Simple heuristic for priorities as requested in PDF
  const tasks = await prisma.task.findMany({ where: { userId, status: 'PENDING' } });
  return tasks.map(task => {
    let priorityScore = task.importance * 10;
    const daysLeft = (new Date(task.dueAt).getTime() - Date.now()) / (1000 * 3600 * 24);
    if (daysLeft < 3) priorityScore += 50;
    return { ...task, priorityScore };
  }).sort((a, b) => b.priorityScore - a.priorityScore).slice(0, 3);
};
