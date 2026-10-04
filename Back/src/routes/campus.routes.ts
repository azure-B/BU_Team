import { Router } from 'express';
import {
  getBuildings,
  getFacilities,
  getCafeteriaMenu,
  getClassrooms,
  getRouteAndLateness,
} from '../controllers/campus.controller';

const router = Router();

// 건물 목록 조회
router.get('/buildings', getBuildings as any);

// 강의실 조회 (?buildingId=xxx)
router.get('/classrooms', getClassrooms as any);

// 시설 조회 (?type=카페)
router.get('/facilities', getFacilities as any);

// 학식 메뉴 조회 (?date=2026-10-04)
router.get('/cafeteria', getCafeteriaMenu as any);

// 동선 계산 및 지각 위험도 → 조장님 모듈 연동
// POST body: { currentBuildingId, nextClassBuildingId, nextClassStartAt }
router.post('/route/lateness', getRouteAndLateness as any);

export default router;
