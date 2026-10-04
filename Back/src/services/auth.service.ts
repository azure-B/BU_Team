import prisma from '../utils/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { AppError } from '../utils/app-error';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkey';

export const register = async (data: any) => {
  const { studentId, password, name, department, grade } = data;

  const existingUser = await prisma.user.findUnique({ where: { studentId } });
  if (existingUser) {
    throw new AppError('이미 가입된 학번입니다.', 400);
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      studentId,
      passwordHash,
      name: name || studentId, // name이 없으면 학번으로 대체
      department: department || '미설정',
      grade: Number(grade) || 1
    }
  });

  const { passwordHash: _, ...userWithoutPassword } = user;
  return userWithoutPassword;
};

export const login = async (data: any) => {
  const { studentId, password } = data;

  const user = await prisma.user.findUnique({ where: { studentId } });
  if (!user) {
    throw new AppError('학번 또는 비밀번호가 올바르지 않습니다.', 401);
  }

  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
  if (!isPasswordValid) {
    throw new AppError('학번 또는 비밀번호가 올바르지 않습니다.', 401);
  }

  const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '1d' });
  const { passwordHash: _, ...userWithoutPassword } = user;

  return { user: userWithoutPassword, token };
};

export const getMe = async (userId: string) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AppError('User not found', 404);

  const { passwordHash: _, ...userWithoutPassword } = user;
  return userWithoutPassword;
};
