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
  try {
    const { data, error } = await query;
    if (error) throw new AppError(error.message, 500);
    return data;
  } catch (err: any) {
    if (err instanceof AppError) throw err;
    console.error('Supabase 통신 오류:', err.message || err);
    throw new AppError(
      `데이터베이스 통신 오류: ${err.message || 'Supabase 서버에 연결할 수 없습니다.'}`,
      503
    );
  }
}

export default supabase;
