import { Request, Response, NextFunction } from 'express';
import * as courseService from '../services/course.service';

export const getCourses = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { department, major, kind, q, limit, offset } = req.query;
    const data = await courseService.getCourses({
      department: typeof department === 'string' ? department : undefined,
      major: typeof major === 'string' ? major : undefined,
      kind: typeof kind === 'string' ? kind : undefined,
      q: typeof q === 'string' ? q : undefined,
      limit: Number(limit) || 50,
      offset: Number(offset) || 0,
    });
    res.json({ success: true, ...data });
  } catch (error) {
    next(error);
  }
};
