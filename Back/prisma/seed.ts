import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // 기존 데이터 초기화
  await prisma.cafeteriaMenu.deleteMany({});
  await prisma.facility.deleteMany({});
  await prisma.classroom.deleteMany({});
  await prisma.campusEdge.deleteMany({});
  await prisma.building.deleteMany({});
  await prisma.task.deleteMany({});
  await prisma.schedule.deleteMany({});
  await prisma.user.deleteMany({});

  const bcrypt = await import('bcryptjs');
  const passwordHash = await bcrypt.hash('password123', 10);

  // ─── 유저 ─────────────────────────────────────────
  const user = await prisma.user.create({
    data: {
      id: 'mocked_user_id',
      studentId: '20221001',
      passwordHash,
      name: '이승빈',
      department: '컴퓨터공학부',
      grade: 2,
    },
  });

  // ─── 과제 ─────────────────────────────────────────
  await prisma.task.createMany({
    data: [
      { userId: user.id, title: '인공지능 과제 초안 작성', dueAt: new Date(Date.now() + 2 * 86400000), importance: 5, status: 'PENDING' },
      { userId: user.id, title: '운영체제 복습', dueAt: new Date(Date.now() + 5 * 86400000), importance: 3, status: 'PENDING' },
    ],
  });

  // ─── 오늘 수업 일정 ────────────────────────────────
  const today = new Date();
  today.setHours(10, 0, 0, 0);
  await prisma.schedule.create({
    data: {
      userId: user.id,
      type: 'CLASS',
      title: '인공지능 수업',
      startAt: today,
      endAt: new Date(today.getTime() + 2 * 3600000),
    }
  });

  // ─── 건물 ─────────────────────────────────────────
  const b1 = await prisma.building.create({ data: { name: '백석관', code: 'BSG', x: 37.521, y: 127.031 } });
  const b2 = await prisma.building.create({ data: { name: '창조관', code: 'CJG', x: 37.522, y: 127.033 } });
  const b3 = await prisma.building.create({ data: { name: '학생회관', code: 'SHG', x: 37.520, y: 127.029 } });

  // ─── 강의실 ───────────────────────────────────────
  await prisma.classroom.createMany({
    data: [
      { buildingId: b1.id, roomNumber: '101', floor: 1 },
      { buildingId: b1.id, roomNumber: '201', floor: 2 },
      { buildingId: b2.id, roomNumber: '301', floor: 3 },
    ],
  });

  // ─── 시설 ─────────────────────────────────────────
  await prisma.facility.createMany({
    data: [
      { buildingId: b3.id, name: '학생식당', type: '학식', openTime: '08:00', closeTime: '19:00' },
      { buildingId: b1.id, name: '편의점 CU', type: '편의점', openTime: '08:00', closeTime: '22:00' },
      { buildingId: b2.id, name: '카페 빈스', type: '카페', openTime: '09:00', closeTime: '20:00' },
    ],
  });

  // ─── 학식 메뉴 ────────────────────────────────────
  const cafeteria = await prisma.facility.findFirst({ where: { type: '학식' } });
  const todayDate = new Date();
  todayDate.setHours(12, 0, 0, 0);
  if (cafeteria) {
    await prisma.cafeteriaMenu.createMany({
      data: [
        { facilityId: cafeteria.id, menuDate: todayDate, name: '된장찌개 정식', price: 4500 },
        { facilityId: cafeteria.id, menuDate: todayDate, name: '제육볶음 정식', price: 5000 },
        { facilityId: cafeteria.id, menuDate: todayDate, name: '순두부찌개 정식', price: 4500 },
      ],
    });
  }

  // ─── 캠퍼스 엣지 (이동 경로) ──────────────────────
  await prisma.campusEdge.createMany({
    data: [
      { fromBuildingId: b1.id, toBuildingId: b2.id, walkingMinutes: 3 },
      { fromBuildingId: b2.id, toBuildingId: b3.id, walkingMinutes: 5 },
      { fromBuildingId: b1.id, toBuildingId: b3.id, walkingMinutes: 7 },
    ],
  });

  console.log('✅ 전체 시드 데이터 삽입 완료!');
  console.log('테스트 계정 → 학번: 20221001 / 비밀번호: password123');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
