import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Create a mock user
  const user = await prisma.user.upsert({
    where: { email: 'student@example.com' },
    update: {},
    create: {
      id: 'mocked_user_id',
      email: 'student@example.com',
      passwordHash: 'hashed_password',
      name: '이승빈',
      department: '컴퓨터공학부',
      grade: 2,
    },
  });

  // Create some tasks
  await prisma.task.createMany({
    data: [
      {
        userId: user.id,
        title: '인공지능 과제 초안 작성',
        dueAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
        importance: 5,
        status: 'PENDING',
      },
      {
        userId: user.id,
        title: '운영체제 복습',
        dueAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
        importance: 3,
        status: 'PENDING',
      },
    ],
  });

  // Create some schedules for today
  const today = new Date();
  today.setHours(10, 0, 0, 0);
  
  await prisma.schedule.create({
    data: {
      userId: user.id,
      type: 'CLASS',
      title: '인공지능 수업',
      startAt: today,
      endAt: new Date(today.getTime() + 2 * 60 * 60 * 1000), // 2 hours later
    }
  });

  console.log('Seed data inserted successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
