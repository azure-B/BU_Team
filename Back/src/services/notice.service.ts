import supabase from '../config/supabase';
import { AppError } from '../utils/app-error';

export const getNotices = async (limit = 8) => {
  // 목록용: 본문(content) 전체·exact count 는 비용 큼 → 필요한 행·컬럼만
  const size = Math.min(Math.max(Number(limit) || 8, 1), 50);
  const { data, error } = await supabase
    .from('Notice')
    .select('id, title, category, tags, createdAt, content')
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
    total: notices.length,
    notices,
  };
};
