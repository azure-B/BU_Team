import supabase, { unwrap } from '../config/supabase';
import * as taskService from './task.service';

function parseTitle(title = '') {
  const room = title.match(/\(([^)]+)\)\s*$/)?.[1] || '';
  const name = title.replace(/\s*\([^)]*\)\s*$/, '').trim() || title;
  return { name, room };
}

/** CLASS는 요일·시각 템플릿으로 오늘에 투영. 그 외는 오늘 날짜만. */
function projectOntoToday(schedules: any[] = [], buildingMap: Record<string, string> = {}) {
  const now = new Date();
  const day = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12);
  const dow = day.getDay();
  const dayKey = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`;

  const projected: any[] = [];
  for (const item of schedules) {
    if (!item?.startAt) continue;
    const startSrc = new Date(item.startAt);
    const endSrc = new Date(item.endAt || item.startAt);
    if (Number.isNaN(startSrc.getTime())) continue;

    if (item.type === 'CLASS' || item.type === 'WEEKLY' || !item.type) {
      if (startSrc.getDay() !== dow) continue;
      const startAt = new Date(day.getFullYear(), day.getMonth(), day.getDate(), startSrc.getHours(), startSrc.getMinutes(), 0, 0);
      let endAt = new Date(day.getFullYear(), day.getMonth(), day.getDate(), endSrc.getHours(), endSrc.getMinutes(), 0, 0);
      if (endAt <= startAt) endAt = new Date(endAt.getTime() + 60 * 60 * 1000);
      const { name, room } = parseTitle(item.title);
      projected.push({
        ...item,
        startAt: startAt.toISOString(),
        endAt: endAt.toISOString(),
        displayTitle: name,
        room,
        buildingName: buildingMap[item.buildingId] || null,
      });
      continue;
    }

    const srcKey = `${startSrc.getFullYear()}-${String(startSrc.getMonth() + 1).padStart(2, '0')}-${String(startSrc.getDate()).padStart(2, '0')}`;
    if (srcKey === dayKey) {
      const { name, room } = parseTitle(item.title);
      projected.push({
        ...item,
        displayTitle: name || item.title,
        room,
        buildingName: buildingMap[item.buildingId] || null,
      });
    }
  }

  return projected.sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());
}

export const getDashboardData = async (userId: string) => {
  const user = await unwrap(
    supabase.from('User').select('name, studentId, department, grade').eq('id', userId).maybeSingle()
  );

  const [allSchedules, buildings, notices] = await Promise.all([
    unwrap(supabase.from('Schedule').select('*').eq('userId', userId).order('startAt', { ascending: true })),
    unwrap(supabase.from('Building').select('id, name')),
    unwrap(
      supabase
        .from('Notice')
        .select('id, title, category, tags, createdAt')
        .order('createdAt', { ascending: false })
        .limit(5)
    ),
  ]);

  const buildingMap = Object.fromEntries((buildings || []).map((b: { id: string; name: string }) => [b.id, b.name]));
  const todaySchedules = projectOntoToday(allSchedules || [], buildingMap);
  const now = new Date();
  const nextClass = todaySchedules.find((s) => new Date(s.endAt) > now) || todaySchedules[0] || null;
  const priorityTasks = await taskService.getPrioritizedTasks(userId);
  const recommendedNotices = (notices || []).map((row: any) => {
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
    greeting: {
      userName: user?.name || '이승빈',
      studentId: user?.studentId || null,
      department: user?.department || null,
      grade: user?.grade || null,
      date: new Date().toISOString().split('T')[0],
      classCount: todaySchedules.length,
    },
    todaySchedules,
    todayTasks: priorityTasks,
    nextClass,
    recommendedNotices,
    recentSummaries: [],
    freeTimeRecommendation: {},
  };
};
