import supabase, { unwrap } from '../config/supabase';
import { AppError } from '../utils/app-error';

export const getSchedules = async (userId: string, from?: string, to?: string) => {
  let query = supabase.from('Schedule').select('*').eq('userId', userId);

  if (from && to) {
    query = query.lte('startAt', new Date(to).toISOString()).gte('endAt', new Date(from).toISOString());
  }

  return await unwrap(query.order('startAt', { ascending: true }));
};

export const createSchedule = async (userId: string, data: any) => {
  return await unwrap(
    supabase
      .from('Schedule')
      .insert({
        ...data,
        userId,
        startAt: new Date(data.startAt).toISOString(),
        endAt: new Date(data.endAt).toISOString(),
      })
      .select()
      .single()
  );
};

export const updateSchedule = async (userId: string, scheduleId: string, data: any) => {
  const updateData = { ...data };
  if (data.startAt) updateData.startAt = new Date(data.startAt).toISOString();
  if (data.endAt) updateData.endAt = new Date(data.endAt).toISOString();

  const schedule = await unwrap(
    supabase
      .from('Schedule')
      .update(updateData)
      .eq('id', scheduleId)
      .eq('userId', userId)
      .select()
      .maybeSingle()
  );
  if (!schedule) throw new AppError('해당 일정을 찾을 수 없거나 수정 권한이 없습니다.', 404);
  return schedule;
};

export const deleteSchedule = async (userId: string, scheduleId: string) => {
  const schedule = await unwrap(
    supabase
      .from('Schedule')
      .delete()
      .eq('id', scheduleId)
      .eq('userId', userId)
      .select()
      .maybeSingle()
  );
  if (!schedule) throw new AppError('해당 일정을 찾을 수 없거나 삭제 권한이 없습니다.', 404);
  return schedule;
};
