import { Request, Response, NextFunction } from 'express';
import * as dashboardService from '../services/dashboard.service';

const getUserId = (req: Request) => (req as any).user?.id || 'mocked_user_id';

export const getDashboard = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = getUserId(req);
    const data = await dashboardService.getDashboardData(userId);
    res.json({ success: true, data });
  } catch (error) { next(error); }
};
