import { Request, Response, NextFunction } from 'express';
import * as scheduleService from '../services/schedule.service';

const getUserId = (req: Request) => (req as any).user?.id || 'mocked_user_id';

export const getSchedules = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { from, to } = req.query;
    const userId = getUserId(req);
    const schedules = await scheduleService.getSchedules(userId, from as string, to as string);
    res.json({ success: true, data: schedules });
  } catch (error) { next(error); }
};

export const createSchedule = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = getUserId(req);
    const schedule = await scheduleService.createSchedule(userId, req.body);
    res.status(201).json({ success: true, data: schedule });
  } catch (error) { next(error); }
};

export const updateSchedule = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = getUserId(req);
    const { id } = req.params;
    const schedule = await scheduleService.updateSchedule(userId, id, req.body);
    res.json({ success: true, data: schedule });
  } catch (error) { next(error); }
};

export const deleteSchedule = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = getUserId(req);
    const { id } = req.params;
    await scheduleService.deleteSchedule(userId, id);
    res.json({ success: true, message: 'Schedule deleted' });
  } catch (error) { next(error); }
};
