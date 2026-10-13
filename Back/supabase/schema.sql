-- Supabase SQL Editor에서 전체 실행
-- 테이블명은 API 필드와 같게 대소문자를 유지한다.
-- 다시 실행하면 기존 데이터를 지우고 더미 데이터를 다시 넣는다.
-- 테스트 계정: 학번 20221001 / 비밀번호 password123

BEGIN;

DROP TABLE IF EXISTS "Summary" CASCADE;
DROP TABLE IF EXISTS "StudyMaterial" CASCADE;
DROP TABLE IF EXISTS "NoticeBookmark" CASCADE;
DROP TABLE IF EXISTS "Notice" CASCADE;
DROP TABLE IF EXISTS "CafeteriaMenu" CASCADE;
DROP TABLE IF EXISTS "Facility" CASCADE;
DROP TABLE IF EXISTS "Classroom" CASCADE;
DROP TABLE IF EXISTS "CampusEdge" CASCADE;
DROP TABLE IF EXISTS "Schedule" CASCADE;
DROP TABLE IF EXISTS "Task" CASCADE;
DROP TABLE IF EXISTS "Building" CASCADE;
DROP TABLE IF EXISTS "User" CASCADE;

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW."updatedAt" = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;

CREATE TABLE "User" (
  "id" TEXT PRIMARY KEY,
  "studentId" TEXT NOT NULL UNIQUE,
  "passwordHash" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "department" TEXT NOT NULL,
  "grade" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "Schedule" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "type" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "startAt" TIMESTAMP(3) NOT NULL,
  "endAt" TIMESTAMP(3) NOT NULL,
  "buildingId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "Task" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "title" TEXT NOT NULL,
  "dueAt" TIMESTAMP(3) NOT NULL,
  "importance" INTEGER NOT NULL,
  "status" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "Notice" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "title" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "tags" TEXT NOT NULL,
  "deadlineAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "NoticeBookmark" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "noticeId" TEXT NOT NULL REFERENCES "Notice"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE ("userId", "noticeId")
);

CREATE TABLE "StudyMaterial" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "courseName" TEXT NOT NULL,
  "rawText" TEXT,
  "filePath" TEXT,
  "processingStatus" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "Summary" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "materialId" TEXT NOT NULL REFERENCES "StudyMaterial"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "content" TEXT NOT NULL,
  "keywords" TEXT NOT NULL,
  "reviewStatus" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "Building" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "name" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "x" DOUBLE PRECISION NOT NULL,
  "y" DOUBLE PRECISION NOT NULL
);

CREATE TABLE "Classroom" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "buildingId" TEXT NOT NULL REFERENCES "Building"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "roomNumber" TEXT NOT NULL,
  "floor" INTEGER NOT NULL
);

CREATE TABLE "Facility" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "buildingId" TEXT NOT NULL REFERENCES "Building"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "name" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "openTime" TEXT NOT NULL,
  "closeTime" TEXT NOT NULL
);

CREATE TABLE "CafeteriaMenu" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "facilityId" TEXT NOT NULL REFERENCES "Facility"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "menuDate" TIMESTAMP(3) NOT NULL,
  "name" TEXT NOT NULL,
  "price" INTEGER NOT NULL
);

CREATE TABLE "CampusEdge" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "fromBuildingId" TEXT NOT NULL REFERENCES "Building"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "toBuildingId" TEXT NOT NULL REFERENCES "Building"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "walkingMinutes" INTEGER NOT NULL
);

CREATE TRIGGER "User_updatedAt" BEFORE UPDATE ON "User"
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER "Schedule_updatedAt" BEFORE UPDATE ON "Schedule"
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER "Task_updatedAt" BEFORE UPDATE ON "Task"
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER "Notice_updatedAt" BEFORE UPDATE ON "Notice"
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER "StudyMaterial_updatedAt" BEFORE UPDATE ON "StudyMaterial"
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER "Summary_updatedAt" BEFORE UPDATE ON "Summary"
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Schedule" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Task" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Notice" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "NoticeBookmark" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "StudyMaterial" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Summary" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Building" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Classroom" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Facility" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CafeteriaMenu" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CampusEdge" ENABLE ROW LEVEL SECURITY;

-- 서비스 롤 키는 RLS를 우회한다. anon 키로는 아래 정책이 있는 테이블만 읽힌다.
CREATE POLICY "public read campus" ON "Building" FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "public read classroom" ON "Classroom" FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "public read facility" ON "Facility" FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "public read menu" ON "CafeteriaMenu" FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "public read edge" ON "CampusEdge" FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "public read notice" ON "Notice" FOR SELECT TO anon, authenticated USING (true);

-- 더미 데이터. 시각은 한국 시간 기준 오늘이다.
INSERT INTO "User" ("id", "studentId", "passwordHash", "name", "department", "grade")
VALUES (
  'mocked_user_id',
  '20221001',
  '$2b$10$9LLrai39tU3HQ9oZPq5vzeIMEpqCMqJYaASb.m7Yv/oVaXI.nC64e',
  '이승빈',
  '컴퓨터공학부',
  3
);

INSERT INTO "Building" ("id", "name", "code", "x", "y") VALUES
  ('bldg-hq', '본부동', 'HQ', 36.8391, 127.1855),
  ('bldg-truth', '진리관', 'TRUTH', 36.8398, 127.1862),
  ('bldg-wisdom', '지혜관', 'WISDOM', 36.8405, 127.1848),
  ('bldg-stu', '학생회관', 'STU', 36.8385, 127.1840),
  ('bldg-lib', '백석학술정보관', 'LIB', 36.8412, 127.1860);

INSERT INTO "Classroom" ("id", "buildingId", "roomNumber", "floor") VALUES
  ('room-truth-204', 'bldg-truth', '204호 (AI실습실)', 2),
  ('room-truth-305', 'bldg-truth', '305호 (소프트웨어랩)', 3),
  ('room-wisdom-101', 'bldg-wisdom', '101호 (대형강의실)', 1),
  ('room-wisdom-402', 'bldg-wisdom', '402호 (네트워크실습실)', 4),
  ('room-hq-501', 'bldg-hq', '501호 (세미나실)', 5);

INSERT INTO "Facility" ("id", "buildingId", "name", "type", "openTime", "closeTime") VALUES
  ('fac-cafeteria', 'bldg-stu', '학생식당', '학식', '08:30', '19:00'),
  ('fac-emart24', 'bldg-stu', '이마트24 학생회관점', '편의점', '08:00', '22:00'),
  ('fac-grazie', 'bldg-truth', '카페 그라찌에 진리관점', '카페', '08:30', '18:00'),
  ('fac-bookcafe', 'bldg-lib', '북카페', '카페', '09:00', '21:00'),
  ('fac-cu', 'bldg-wisdom', 'CU 지혜관점', '편의점', '08:30', '21:00');

INSERT INTO "CafeteriaMenu" ("id", "facilityId", "menuDate", "name", "price") VALUES
  (
    'menu-kimchi',
    'fac-cafeteria',
    (date_trunc('day', timezone('Asia/Seoul', now())) + interval '12 hours'),
    '돼지고기 김치찌개 & 계란말이',
    5000
  ),
  (
    'menu-donkatsu',
    'fac-cafeteria',
    (date_trunc('day', timezone('Asia/Seoul', now())) + interval '12 hours'),
    '치즈 돈까스 정식',
    5500
  ),
  (
    'menu-tuna',
    'fac-cafeteria',
    (date_trunc('day', timezone('Asia/Seoul', now())) + interval '12 hours'),
    '참치마요 덮밥',
    4500
  );

INSERT INTO "CampusEdge" ("id", "fromBuildingId", "toBuildingId", "walkingMinutes") VALUES
  ('edge-stu-truth', 'bldg-stu', 'bldg-truth', 4),
  ('edge-truth-wisdom', 'bldg-truth', 'bldg-wisdom', 6),
  ('edge-truth-lib', 'bldg-truth', 'bldg-lib', 3),
  ('edge-wisdom-lib', 'bldg-wisdom', 'bldg-lib', 5),
  ('edge-hq-stu', 'bldg-hq', 'bldg-stu', 3),
  ('edge-hq-truth', 'bldg-hq', 'bldg-truth', 5);

INSERT INTO "Task" ("id", "userId", "title", "dueAt", "importance", "status") VALUES
  ('task-proposal', 'mocked_user_id', '인공지능 캡스톤 프로젝트 1차 제안서 제출', now() + interval '12 hours', 5, 'PENDING'),
  ('task-cloud', 'mocked_user_id', '클라우드 컴퓨팅 중간 실습 보고서', now() + interval '36 hours', 4, 'PENDING'),
  ('task-algo', 'mocked_user_id', '컴퓨터 알고리즘 백준 문제 풀이 과제', now() + interval '5 days', 3, 'IN_PROGRESS'),
  ('task-db', 'mocked_user_id', '데이터베이스 정규화 연습문제', now() + interval '7 days', 2, 'PENDING'),
  ('task-oss', 'mocked_user_id', '오픈소스 SW 라이선스 정리 레포트', now() - interval '24 hours', 3, 'COMPLETED');

INSERT INTO "Schedule" ("id", "userId", "type", "title", "startAt", "endAt", "buildingId") VALUES
  (
    'sch-ai',
    'mocked_user_id',
    'CLASS',
    '인공지능 개론 (진리관 204호)',
    (date_trunc('day', timezone('Asia/Seoul', now())) + interval '10 hours'),
    (date_trunc('day', timezone('Asia/Seoul', now())) + interval '12 hours'),
    'bldg-truth'
  ),
  (
    'sch-os',
    'mocked_user_id',
    'CLASS',
    '운영체제 및 시스템 (지혜관 402호)',
    (date_trunc('day', timezone('Asia/Seoul', now())) + interval '14 hours'),
    (date_trunc('day', timezone('Asia/Seoul', now())) + interval '16 hours'),
    'bldg-wisdom'
  ),
  (
    'sch-study',
    'mocked_user_id',
    'PERSONAL',
    '팀 프로젝트 스터디 (학술정보관 북카페)',
    (date_trunc('day', timezone('Asia/Seoul', now())) + interval '17 hours'),
    (date_trunc('day', timezone('Asia/Seoul', now())) + interval '19 hours'),
    'bldg-lib'
  );

INSERT INTO "Notice" ("id", "title", "content", "category", "tags", "deadlineAt") VALUES
  (
    'notice-capstone',
    '캡스톤 디자인 1차 제안서 제출 안내',
    '제안서는 학과 사무실로 제출하거나 LMS에 업로드합니다.',
    '학사',
    '캡스톤,제안서',
    now() + interval '12 hours'
  ),
  (
    'notice-library',
    '학술정보관 야간 연장 운영',
    '시험 기간 동안 학술정보관을 22시까지 연장 운영합니다.',
    '시설',
    '도서관,운영시간',
    NULL
  );

INSERT INTO "NoticeBookmark" ("id", "userId", "noticeId") VALUES
  ('bookmark-capstone', 'mocked_user_id', 'notice-capstone');

INSERT INTO "StudyMaterial" ("id", "userId", "courseName", "rawText", "processingStatus") VALUES
  (
    'material-ai',
    'mocked_user_id',
    '인공지능 개론',
    '탐색 알고리즘, 휴리스틱, A* 알고리즘의 기본 개념.',
    'COMPLETED'
  );

INSERT INTO "Summary" ("id", "materialId", "userId", "content", "keywords", "reviewStatus") VALUES
  (
    'summary-ai',
    'material-ai',
    'mocked_user_id',
    'A*는 실제 비용과 휴리스틱 추정치를 더해 경로를 고른다.',
    '["A*","휴리스틱","탐색"]',
    'REVIEWED'
  );

NOTIFY pgrst, 'reload schema';

COMMIT;
