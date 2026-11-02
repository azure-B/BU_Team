-- ==============================================================================
-- 백석AI (BU_Team) — 공지 북마크 테이블 (NoticeBookmark) DDL
-- 파일 경로: Back/supabase/notice_bookmark.sql
-- 용도: Supabase SQL Editor에서 실행하여 공지 북마크 테이블, 제약조건, 인덱스, 권한 설정
-- 네이밍 규칙: 기존 핵심 테이블(User, Notice 등)과 일치하는 PascalCase("NoticeBookmark")
-- ==============================================================================

-- [주의사항]
-- 1. 본 SQL은 과거 Git 스키마 문서상의 "User"("id" TEXT) 및 "Notice"("id" TEXT)를 기준으로 작성되었습니다.
--    실제 운영 Supabase DB의 라이브 스키마 상태는 미확인이므로, 실행 전 외래키 대상 컬럼의 실제 타입/존재 여부를 확인해야 합니다.
-- 2. CREATE TABLE IF NOT EXISTS는 테이블이 이미 존재할 경우 새로 생성하지 않을 뿐,
--    기존 테이블의 컬럼 구성이나 제약조건 차이를 검증·동기화하지 않습니다.

-- 1. NoticeBookmark 테이블 생성
CREATE TABLE IF NOT EXISTS "NoticeBookmark" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "noticeId" TEXT NOT NULL REFERENCES "Notice"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  -- 동일 사용자의 동일 공지 중복 북마크 방지 복합 유니크 제약조건
  -- (PostgreSQL은 이 제약조건에 대해 ("userId", "noticeId") B-tree 복합 인덱스를 자동 생성함)
  CONSTRAINT "NoticeBookmark_userId_noticeId_key" UNIQUE ("userId", "noticeId")
);

-- 2. 인덱스 설계
-- [참고 1] "userId" 단독 인덱스는 생성하지 않음:
-- UNIQUE 제약조건으로 자동 생성된 ("userId", "noticeId") 복합 인덱스의 선두 컬럼(leading column)이
-- "userId"이므로, WHERE "userId" = ? 조건의 조회는 별도 단독 인덱스 없이도 O(log N) 탐색 성능을 발휘합니다.
-- 따라서 중복 인덱스에 따른 저장 공간 및 쓰기 오버헤드를 방지하기 위해 단독 userId 인덱스는 제외합니다.

-- [참고 2] "noticeId" 단독 인덱스:
-- ("userId", "noticeId") 복합 인덱스는 선두 컬럼이 아니더라도 테이블 통계나 쿼리에 따라 Index Full Scan 등으로
-- 사용될 여지는 있으나, WHERE "noticeId" = ? 단독 조건에 대해 가장 효율적인 B-tree Index Scan을 보장하기 어렵습니다.
-- 따라서 공지별 북마크 집계/조회 성능을 확보하고, 부모 공지 삭제 시(ON DELETE CASCADE) 자식 테이블 풀 스캔(Seq Scan)을
-- 방지하기 위해 noticeId 단독 인덱스를 명시적으로 생성합니다.
CREATE INDEX IF NOT EXISTS "NoticeBookmark_noticeId_idx" ON "NoticeBookmark" ("noticeId");

-- 3. Row Level Security (RLS) 설정
-- RLS를 활성화하여 PostgREST API를 통한 무단 접근 시 기본 차단(Default Deny) 동작을 유도합니다.
-- (단, RLS 설정만으로 모든 DB 접근이 완전히 차단되는 것은 아니므로, 아래 4번의 테이블 권한 제어(DCL)를 병행하여 심층 방어를 구성합니다.)
ALTER TABLE "NoticeBookmark" ENABLE ROW LEVEL SECURITY;

-- [RLS 정책 안내]
-- 현재 프로젝트는 Express 자체 JWT 인증 시스템을 사용하며, 백엔드 서버는 Supabase service_role 키를
-- 사용하여 DB에 접근하므로 RLS를 자동 바이패스(Bypass)합니다.
-- Supabase Auth(auth.uid())를 사용하는 직접 클라이언트 호출 경로가 없으므로 불필요한 auth.uid() 정책은 생성하지 않으며,
-- 사용자별 권한 검사는 Express 백엔드 Service 계층에서 수행합니다.

-- 4. 테이블 권한 제어 (DCL - 심층 방어)
-- Supabase 공개 역할(anon, authenticated)에 부여된 직접 접근 권한을 명시적으로 회수합니다.
REVOKE ALL ON TABLE "NoticeBookmark" FROM anon, authenticated;

-- 백엔드 서버 전용 역할(service_role)에 북마크 조회·등록·삭제·수정에 필요한 권한을 명시적으로 부여합니다.
GRANT SELECT, INSERT, DELETE, UPDATE ON TABLE "NoticeBookmark" TO service_role;

-- 5. PostgREST 스키마 캐시 리로드 알림
NOTIFY pgrst, 'reload schema';
