import supabase, { unwrap } from '../config/supabase';
import { calculatePriorityScore } from '../utils/captain-calculator';
import { AppError } from '../utils/app-error';

export const getTasks = async (userId: string) => {
  return await unwrap(
    supabase.from('Task').select('*').eq('userId', userId).order('dueAt', { ascending: true })
  );
};

export const createTask = async (userId: string, data: any) => {
  return await unwrap(
    supabase
      .from('Task')
      .insert({
        ...data,
        userId,
        dueAt: new Date(data.dueAt).toISOString(),
      })
      .select()
      .single()
  );
};

export const updateTask = async (userId: string, taskId: string, data: any) => {
  const updateData = { ...data };
  if (data.dueAt) updateData.dueAt = new Date(data.dueAt).toISOString();

  const task = await unwrap(
    supabase
      .from('Task')
      .update(updateData)
      .eq('id', taskId)
      .eq('userId', userId)
      .select()
      .maybeSingle()
  );
  if (!task) throw new AppError('해당 과제를 찾을 수 없거나 수정 권한이 없습니다.', 404);
  return task;
};

export const deleteTask = async (userId: string, taskId: string) => {
  const task = await unwrap(
    supabase
      .from('Task')
      .delete()
      .eq('id', taskId)
      .eq('userId', userId)
      .select()
      .maybeSingle()
  );
  if (!task) throw new AppError('해당 과제를 찾을 수 없거나 삭제 권한이 없습니다.', 404);
  return task;
};

export const getPrioritizedTasks = async (userId: string) => {
  const tasks = await unwrap(
    supabase
      .from('Task')
      .select('*')
      .eq('userId', userId)
      .in('status', ['PENDING', 'IN_PROGRESS'])
  );

  return (tasks ?? [])
    .map((task: { dueAt: string; importance: number }) => ({
      ...task,
      priorityScore: calculatePriorityScore(task),
    }))
    .sort((a: { priorityScore: number }, b: { priorityScore: number }) => b.priorityScore - a.priorityScore)
    .slice(0, 3);
};
