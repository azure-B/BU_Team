import supabase, { unwrap } from '../config/supabase';
import { AppError } from '../utils/app-error';

/**
 * Schedule 시각은 시드·프론트와 같이 「한국 벽시계」 naive datetime 으로 저장한다.
 * toISOString() UTC 를 그대로 넣으면 DB(timestamp w/o tz)에 04:00 등으로 남아
 * 프론트가 13:00 을 04:00 으로 보여 주는 문제가 난다.
 */
function toDbTimestamp(value: string | Date): string {
  const raw = String(value ?? '').trim()
  const naive = raw.match(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2})(?::(\d{2}))?(?:\.\d+)?$/)
  if (naive && !/[zZ]|[+-]\d{2}:?\d{2}$/.test(raw)) {
    return `${naive[1]}:${naive[2] || '00'}`
  }
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return raw
  const seoul = new Date(d.getTime() + 9 * 60 * 60 * 1000)
  return seoul.toISOString().replace(/\.\d{3}Z$/, '').slice(0, 19)
}

export const getSchedules = async (userId: string, from?: string, to?: string) => {
  let query = supabase
    .from('Schedule')
    .select('id, userId, type, title, startAt, endAt, buildingId')
    .eq('userId', userId);

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
        startAt: toDbTimestamp(data.startAt),
        endAt: toDbTimestamp(data.endAt),
      })
      .select()
      .single()
  );
};

export const updateSchedule = async (userId: string, scheduleId: string, data: any) => {
  const updateData = { ...data };
  if (data.startAt) updateData.startAt = toDbTimestamp(data.startAt);
  if (data.endAt) updateData.endAt = toDbTimestamp(data.endAt);

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

// 💡 일정 ↔ 과제 기능 연동: 특정 일정(수업)에 연계된 과제 목록 조회
export const getScheduleTasks = async (userId: string, scheduleId: string) => {
  // 1. 해당 일정이 존재하는지 및 소유권 확인
  const schedule = await unwrap(
    supabase
      .from('Schedule')
      .select('*')
      .eq('id', scheduleId)
      .eq('userId', userId)
      .maybeSingle()
  );
  if (!schedule) throw new AppError('해당 일정을 찾을 수 없거나 접근 권한이 없습니다.', 404);

  // 2. 연계 과제: 수업명(끝 강의실 괄호 제외)으로 제목 매칭 — 예) "인공지능 · 1주차: …"
  const courseName = String(schedule.title || '').replace(/\s*\([^)]*\)\s*$/, '').trim()
  const tasks = await unwrap(
    supabase
      .from('Task')
      .select('*')
      .eq('userId', userId)
      .ilike('title', `${courseName} ·%`)
      .order('dueAt', { ascending: true })
  )

  return {
    schedule,
    tasks: tasks || [],
  };
};
