import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // 기존 mocked_user_id 유저가 있으면 삭제 후 재생성
  await prisma.task.deleteMany({});
  await prisma.schedule.deleteMany({});
  await prisma.user.deleteMany({});

  const bcrypt = await import('bcryptjs');
  const passwordHash = await bcrypt.hash('password123', 10);

  const user = await prisma.user.upsert({
    where: { studentId: '20221001' },
    update: {},
    create: {
      id: 'mocked_user_id',
      studentId: '20221001',
      passwordHash,
      name: '이승빈',
      department: '컴퓨터공학부',
      grade: 2,
    },
  });

  await prisma.task.createMany({
    data: [
      {
        userId: user.id,
        title: '인공지능 과제 초안 작성',
        dueAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        importance: 5,
        status: 'PENDING',
      },
      {
        userId: user.id,
        title: '운영체제 복습',
        dueAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        importance: 3,
        status: 'PENDING',
      },
    ],
  });

  const today = new Date();
  today.setHours(10, 0, 0, 0);

  await prisma.schedule.create({
    data: {
      userId: user.id,
      type: 'CLASS',
      title: '인공지능 수업',
      startAt: today,
      endAt: new Date(today.getTime() + 2 * 60 * 60 * 1000),
    }
  });

  console.log('Seed data (studentId 기반) 삽입 완료!');
  console.log('테스트 계정 → 학번: 20221001 / 비밀번호: password123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
