import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkey';

/** 토큰이 있으면 검증하고, 없으면 LMS 데모용 mocked_user_id를 사용한다. */
export const optionalAuthenticate = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    (req as any).user = { id: 'mocked_user_id' };
    return next();
  }

  try {
    const decoded = jwt.verify(authHeader.split(' ')[1], JWT_SECRET);
    (req as any).user = decoded;
    next();
  } catch {
    (req as any).user = { id: 'mocked_user_id' };
    next();
  }
};
