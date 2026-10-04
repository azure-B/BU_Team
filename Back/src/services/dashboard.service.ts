import prisma from '../utils/prisma';
import * as taskService from './task.service';

export const getDashboardData = async (userId: string) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  
  // Combine schedules, tasks, etc.
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const todaySchedules = await prisma.schedule.findMany({
    where: { userId, startAt: { gte: today, lt: tomorrow } }
  });

  const priorityTasks = await taskService.getPrioritizedTasks(userId);

  return {
    greeting: {
      userName: user?.name || 'User',
      date: new Date().toISOString().split('T')[0],
      classCount: todaySchedules.length
    },
    todayTasks: priorityTasks,
    nextClass: todaySchedules[0] || null, // Simplified for now
    recommendedNotices: [], // Placeholder for later
    recentSummaries: [], // Placeholder for later
    freeTimeRecommendation: {}
  };
};
