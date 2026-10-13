import { randomUUID } from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import supabase, { unwrap } from '../config/supabase';
import { AppError } from '../utils/app-error';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkey';

function withoutPassword<T extends { passwordHash?: string }>(user: T) {
  const { passwordHash, ...userWithoutPassword } = user;
  return userWithoutPassword;
}

export const register = async (data: any) => {
  const { studentId, password, name, department, grade } = data;

  const existing = await unwrap(
    supabase.from('User').select('id').eq('studentId', studentId).maybeSingle()
  );
  if (existing) {
    throw new AppError('이미 가입된 학번입니다.', 400);
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await unwrap(
    supabase
      .from('User')
      .insert({
        id: randomUUID(),
        studentId,
        passwordHash,
        name: name || studentId,
        department: department || '미설정',
        grade: Number(grade) || 1,
      })
      .select()
      .single()
  );

  return withoutPassword(user);
};

export const login = async (data: any) => {
  const { studentId, password } = data;

  const user = await unwrap(
    supabase.from('User').select('*').eq('studentId', studentId).maybeSingle()
  );
  if (!user) {
    throw new AppError('학번 또는 비밀번호가 올바르지 않습니다.', 401);
  }

  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
  if (!isPasswordValid) {
    throw new AppError('학번 또는 비밀번호가 올바르지 않습니다.', 401);
  }

  const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '1d' });
  return { user: withoutPassword(user), token };
};

export const getMe = async (userId: string) => {
  const user = await unwrap(
    supabase.from('User').select('*').eq('id', userId).maybeSingle()
  );
  if (!user) throw new AppError('User not found', 404);
  return withoutPassword(user);
};
