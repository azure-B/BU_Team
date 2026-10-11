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

  // ─── 1. 유저 (데모용 테스트 계정) ─────────────────────────
  const user = await prisma.user.create({
    data: {
      id: 'mocked_user_id',
      studentId: '20221001',
      passwordHash,
      name: '이승빈',
      department: '컴퓨터공학부',
      grade: 3,
    },
  });

  // ─── 2. 캠퍼스 건물 (백석대학교 실제 캠퍼스 기반) ─────────
  const bHead = await prisma.building.create({ data: { name: '본부동', code: 'HQ', x: 36.8391, y: 127.1855 } });
  const bTruth = await prisma.building.create({ data: { name: '진리관', code: 'TRUTH', x: 36.8398, y: 127.1862 } });
  const bWisdom = await prisma.building.create({ data: { name: '지혜관', code: 'WISDOM', x: 36.8405, y: 127.1848 } });
  const bStudent = await prisma.building.create({ data: { name: '학생회관', code: 'STU', x: 36.8385, y: 127.1840 } });
  const bLibrary = await prisma.building.create({ data: { name: '백석학술정보관', code: 'LIB', x: 36.8412, y: 127.1860 } });

  // ─── 3. 강의실 ──────────────────────────────────────────
  await prisma.classroom.createMany({
    data: [
      { buildingId: bTruth.id, roomNumber: '204호 (AI실습실)', floor: 2 },
      { buildingId: bTruth.id, roomNumber: '305호 (소프트웨어랩)', floor: 3 },
      { buildingId: bWisdom.id, roomNumber: '101호 (대형강의실)', floor: 1 },
      { buildingId: bWisdom.id, roomNumber: '402호 (네트워크실습실)', floor: 4 },
      { buildingId: bHead.id, roomNumber: '501호 (세미나실)', floor: 5 },
    ],
  });

  // ─── 4. 편의시설 ────────────────────────────────────────
  const fCafeteria = await prisma.facility.create({
    data: { buildingId: bStudent.id, name: '학생식당', type: '학식', openTime: '08:30', closeTime: '19:00' },
  });
  await prisma.facility.createMany({
    data: [
      { buildingId: bStudent.id, name: '이마트24 학생회관점', type: '편의점', openTime: '08:00', closeTime: '22:00' },
      { buildingId: bTruth.id, name: '카페 그라찌에 진리관점', type: '카페', openTime: '08:30', closeTime: '18:00' },
      { buildingId: bLibrary.id, name: '북카페', type: '카페', openTime: '09:00', closeTime: '21:00' },
      { buildingId: bWisdom.id, name: 'CU 지혜관점', type: '편의점', openTime: '08:30', closeTime: '21:00' },
    ],
  });

  // ─── 5. 학식 메뉴 ───────────────────────────────────────
  const todayDate = new Date();
  todayDate.setHours(12, 0, 0, 0);
  await prisma.cafeteriaMenu.createMany({
    data: [
      { facilityId: fCafeteria.id, menuDate: todayDate, name: '돼지고기 김치찌개 & 계란말이', price: 5000 },
      { facilityId: fCafeteria.id, menuDate: todayDate, name: '치즈 돈까스 정식', price: 5500 },
      { facilityId: fCafeteria.id, menuDate: todayDate, name: '참치마요 덮밥', price: 4500 },
    ],
  });

  // ─── 6. 캠퍼스 도보 이동 경로 (동선 계산용 엣지) ─────────
  await prisma.campusEdge.createMany({
    data: [
      { fromBuildingId: bStudent.id, toBuildingId: bTruth.id, walkingMinutes: 4 },
      { fromBuildingId: bTruth.id, toBuildingId: bWisdom.id, walkingMinutes: 6 },
      { fromBuildingId: bTruth.id, toBuildingId: bLibrary.id, walkingMinutes: 3 },
      { fromBuildingId: bWisdom.id, toBuildingId: bLibrary.id, walkingMinutes: 5 },
      { fromBuildingId: bHead.id, toBuildingId: bStudent.id, walkingMinutes: 3 },
      { fromBuildingId: bHead.id, toBuildingId: bTruth.id, walkingMinutes: 5 },
    ],
  });

  // ─── 7. 과제 (긴급도/중요도 엣지케이스별 데이터) ───────────
  const now = Date.now();
  await prisma.task.createMany({
    data: [
      {
        userId: user.id,
        title: '인공지능 캡스톤 프로젝트 1차 제안서 제출',
        dueAt: new Date(now + 12 * 3600000), // 12시간 후 마감 (매우 긴급)
        importance: 5,
        status: 'PENDING',
      },
      {
        userId: user.id,
        title: '클라우드 컴퓨팅 중간 실습 보고서',
        dueAt: new Date(now + 36 * 3600000), // 1.5일 후 마감 (긴급)
        importance: 4,
        status: 'PENDING',
      },
      {
        userId: user.id,
        title: '컴퓨터 알고리즘 백준 문제 풀이 과제',
        dueAt: new Date(now + 5 * 86400000), // 5일 후 마감
        importance: 3,
        status: 'IN_PROGRESS',
      },
      {
        userId: user.id,
        title: '데이터베이스 정규화 연습문제',
        dueAt: new Date(now + 7 * 86400000), // 7일 후 마감
        importance: 2,
        status: 'PENDING',
      },
      {
        userId: user.id,
        title: '오픈소스 SW 라이선스 정리 레포트',
        dueAt: new Date(now - 24 * 3600000), // 이미 제출 완료
        importance: 3,
        status: 'COMPLETED',
      },
    ],
  });

  // ─── 8. 오늘 및 주간 수업 시간표 ─────────────────────────
  const class1Start = new Date(todayDate);
  class1Start.setHours(10, 0, 0, 0);
  const class1End = new Date(todayDate);
  class1End.setHours(12, 0, 0, 0);

  const class2Start = new Date(todayDate);
  class2Start.setHours(14, 0, 0, 0);
  const class2End = new Date(todayDate);
  class2End.setHours(16, 0, 0, 0);

  await prisma.schedule.createMany({
    data: [
      {
        userId: user.id,
        type: 'CLASS',
        title: '인공지능 개론 (진리관 204호)',
        startAt: class1Start,
        endAt: class1End,
        buildingId: bTruth.id,
      },
      {
        userId: user.id,
        type: 'CLASS',
        title: '운영체제 및 시스템 (지혜관 402호)',
        startAt: class2Start,
        endAt: class2End,
        buildingId: bWisdom.id,
      },
      {
        userId: user.id,
        type: 'PERSONAL',
        title: '팀 프로젝트 스터디 (학술정보관 북카페)',
        startAt: new Date(todayDate.getTime() + 17 * 3600000),
        endAt: new Date(todayDate.getTime() + 19 * 3600000),
        buildingId: bLibrary.id,
      },
    ],
  });

  console.log('✅ 백석대 데모용 시드 데이터 구축 완료!');
  console.log('   - 학번: 20221001 / 비밀번호: password123');
  console.log('   - 건물: 본부동, 진리관, 지혜관, 학생회관, 백석학술정보관');
  console.log('   - 시간표 & 과제(Top 3 우선순위 계산용) & 학식 메뉴 탑재 완료');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
