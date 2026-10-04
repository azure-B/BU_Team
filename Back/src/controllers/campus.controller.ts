import { Request, Response, NextFunction } from 'express';
import * as campusService from '../services/campus.service';
import { calculateRouteAndLateness } from '../utils/captain-route-calculator';

// 건물 목록 조회
export const getBuildings = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await campusService.getBuildings();
    res.json({ success: true, data });
  } catch (error) { next(error); }
};

// 시설 조회 (타입 필터)
export const getFacilities = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { type } = req.query;
    const data = await campusService.getFacilities(type as string);
    res.json({ success: true, data });
  } catch (error) { next(error); }
};

// 날짜별 학식 메뉴 조회
export const getCafeteriaMenu = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { date } = req.query;
    const targetDate = (date as string) || new Date().toISOString().split('T')[0];
    const data = await campusService.getCafeteriaMenu(targetDate);
    res.json({ success: true, data });
  } catch (error) { next(error); }
};

// 강의실 조회
export const getClassrooms = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { buildingId } = req.query;
    const data = await campusService.getClassrooms(buildingId as string);
    res.json({ success: true, data });
  } catch (error) { next(error); }
};

// 동선 계산 및 지각 위험도 반환 (조장님 모듈 연동)
export const getRouteAndLateness = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { currentBuildingId, nextClassBuildingId, nextClassStartAt } = req.body;
    if (!currentBuildingId || !nextClassBuildingId || !nextClassStartAt) {
      res.status(400).json({ success: false, message: 'currentBuildingId, nextClassBuildingId, nextClassStartAt 는 필수 값입니다.' });
      return;
    }
    const data = await calculateRouteAndLateness(currentBuildingId, nextClassBuildingId, nextClassStartAt);
    res.json({ success: true, data });
  } catch (error) { next(error); }
};
