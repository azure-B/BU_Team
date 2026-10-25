import supabase, { unwrap } from '../config/supabase';

export const getBuildings = async () => {
  return await unwrap(supabase.from('Building').select('id, name, code, x, y'));
};

export const getFacilities = async (type?: string) => {
  let query = supabase.from('Facility').select('*');
  if (type) query = query.eq('type', type);
  return await unwrap(query);
};

export const getCafeteriaMenu = async (date: string) => {
  const targetDate = new Date(date);
  targetDate.setHours(0, 0, 0, 0);
  const nextDate = new Date(targetDate);
  nextDate.setDate(nextDate.getDate() + 1);

  return await unwrap(
    supabase
      .from('CafeteriaMenu')
      .select('*')
      .gte('menuDate', targetDate.toISOString())
      .lt('menuDate', nextDate.toISOString())
  );
};

export const getClassrooms = async (buildingId?: string) => {
  let query = supabase.from('Classroom').select('*');
  if (buildingId) query = query.eq('buildingId', buildingId);
  return await unwrap(query);
};
