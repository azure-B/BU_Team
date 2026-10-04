import prisma from '../utils/prisma';

// ─── 건물 목록 조회 ───────────────────────────────
export const getBuildings = async () => {
  return prisma.building.findMany();
};

// ─── 시설 목록 조회 (타입 필터 가능: 도서관, 카페, 편의점 등) ─
export const getFacilities = async (type?: string) => {
  return prisma.facility.findMany({
    where: type ? { type } : {},
  });
};

// ─── 날짜별 학식 메뉴 조회 ────────────────────────
export const getCafeteriaMenu = async (date: string) => {
  const targetDate = new Date(date);
  targetDate.setHours(0, 0, 0, 0);
  const nextDate = new Date(targetDate);
  nextDate.setDate(nextDate.getDate() + 1);

  return prisma.cafeteriaMenu.findMany({
    where: {
      menuDate: {
        gte: targetDate,
        lt: nextDate,
      },
    },
  });
};

// ─── 강의실 조회 ──────────────────────────────────
export const getClassrooms = async (buildingId?: string) => {
  return prisma.classroom.findMany({
    where: buildingId ? { buildingId } : {},
  });
};
