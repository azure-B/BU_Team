import supabase from '../config/supabase';
import { AppError } from '../utils/app-error';

export const getCourses = async (query: {
  department?: string;
  major?: string;
  kind?: string;
  q?: string;
  limit?: number;
}) => {
  const size = Math.min(Math.max(Number(query.limit) || 50, 1), 300);
  let request = supabase
    .from('Course')
    .select('id, department, major, kind, code, title, credit, hours, professor, schedule, room, online, day, startTime, endTime, meetings', { count: 'exact' })
    .order('title', { ascending: true })
    .limit(size);

  if (query.department) request = request.eq('department', query.department);
  if (query.major) request = request.eq('major', query.major);
  if (query.kind) request = request.eq('kind', query.kind);
  if (query.q) request = request.ilike('title', `%${query.q}%`);

  const { data, error, count } = await request;
  if (error) throw new AppError(error.message, 500);

  return {
    total: count ?? data?.length ?? 0,
    courses: (data ?? []).map((row) => ({
      ...row,
      meetings: typeof row.meetings === 'string' ? JSON.parse(row.meetings || '[]') : row.meetings,
    })),
  };
};
