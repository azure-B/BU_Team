import { Request, Response, NextFunction } from 'express';
import * as taskService from '../services/task.service';

const getUserId = (req: Request) => (req as any).user?.id || 'mocked_user_id';

export const getTasks = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = getUserId(req);
    const tasks = await taskService.getTasks(userId);
    res.json({ success: true, data: tasks });
  } catch (error) { next(error); }
};

export const createTask = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = getUserId(req);
    const task = await taskService.createTask(userId, req.body);
    res.status(201).json({ success: true, data: task });
  } catch (error) { next(error); }
};

export const updateTask = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = getUserId(req);
    const { id } = req.params;
    const task = await taskService.updateTask(userId, id, req.body);
    res.json({ success: true, data: task });
  } catch (error) { next(error); }
};

export const deleteTask = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = getUserId(req);
    const { id } = req.params;
    await taskService.deleteTask(userId, id);
    res.json({ success: true, message: 'Task deleted' });
  } catch (error) { next(error); }
};

export const getPrioritizedTasks = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = getUserId(req);
    const tasks = await taskService.getPrioritizedTasks(userId);
    res.json({ success: true, data: tasks });
  } catch (error) { next(error); }
};
