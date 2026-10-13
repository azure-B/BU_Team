import dotenv from 'dotenv';
import path from 'path';
import { createClient, PostgrestError } from '@supabase/supabase-js';
import { AppError } from '../utils/app-error';

dotenv.config();
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const supabaseUrl = process.env.SUPABASE_URL?.trim();
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

if (!supabaseUrl || !supabaseKey) {
  throw new Error('SUPABASE_URL 또는 SUPABASE_SERVICE_ROLE_KEY가 없습니다.');
}

const supabase = createClient(supabaseUrl, supabaseKey);

type QueryResult<T> = PromiseLike<{ data: T; error: Pick<PostgrestError, 'message'> | null }>;

export async function unwrap<T>(query: QueryResult<T>): Promise<T> {
  const { data, error } = await query;
  if (error) throw new AppError(error.message, 500);
  return data;
}

export default supabase;
