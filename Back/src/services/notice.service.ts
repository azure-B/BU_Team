import supabase from '../config/supabase';
import { AppError } from '../utils/app-error';

export const getNotices = async (limit = 8) => {
  const size = Math.min(Math.max(Number(limit) || 8, 1), 300);
  const { data, error, count } = await supabase
    .from('Notice')
    .select('id, title, content, category, tags, createdAt', { count: 'exact' })
    .order('createdAt', { ascending: false })
    .limit(size);

  if (error) throw new AppError(error.message, 500);

  const notices = (data ?? []).map((row) => {
    const link = String(row.content ?? '').match(/https?:\/\/\S+/)?.[0] ?? null;
    return {
      id: row.id,
      title: row.title,
      category: row.category,
      tags: row.tags,
      source: row.tags,
      link,
      createdAt: row.createdAt,
    };
  });

  return {
    total: count ?? notices.length,
    notices,
  };
};
