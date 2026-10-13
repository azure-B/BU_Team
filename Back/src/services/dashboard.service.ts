import supabase, { unwrap } from '../config/supabase';
import * as taskService from './task.service';

export const getDashboardData = async (userId: string) => {
  const user = await unwrap(
    supabase.from('User').select('name').eq('id', userId).maybeSingle()
  );

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const todaySchedules = await unwrap(
    supabase
      .from('Schedule')
      .select('*')
      .eq('userId', userId)
      .gte('startAt', today.toISOString())
      .lt('startAt', tomorrow.toISOString())
      .order('startAt', { ascending: true })
  );

  const priorityTasks = await taskService.getPrioritizedTasks(userId);

  return {
    greeting: {
      userName: user?.name || 'User',
      date: new Date().toISOString().split('T')[0],
      classCount: todaySchedules?.length ?? 0,
    },
    todayTasks: priorityTasks,
    nextClass: todaySchedules?.[0] || null,
    recommendedNotices: [],
    recentSummaries: [],
    freeTimeRecommendation: {},
  };
};
