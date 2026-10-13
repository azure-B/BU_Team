import { Request, Response, NextFunction } from 'express';
import * as noticeService from '../services/notice.service';

export const getNotices = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const limit = Number(req.query.limit) || 8;
    const data = await noticeService.getNotices(limit);
    res.json({ success: true, ...data });
  } catch (error) {
    next(error);
  }
};
