import prisma from '../utils/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { AppError } from '../utils/app-error';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkey';

export const register = async (data: any) => {
  const { email, password, name, department, grade } = data;
  
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    throw new AppError('Email already in use', 400);
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      name,
      department,
      grade: Number(grade)
    }
  });

  const { passwordHash: _, ...userWithoutPassword } = user;
  return userWithoutPassword;
};

export const login = async (data: any) => {
  const { email, password } = data;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new AppError('Invalid credentials', 401);
  }

  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
  if (!isPasswordValid) {
    throw new AppError('Invalid credentials', 401);
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
