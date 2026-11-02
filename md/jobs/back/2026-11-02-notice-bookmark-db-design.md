# [2026.11.02] 공지 북마크 DB SQL 설계 (A파트 1단계)

## 작업 개요
- 백엔드 A파트 공지 북마크 기능을 위한 PostgreSQL DDL 및 테이블 권한 제어 SQL 설계
- ChatGPT 검토 의견을 수렴하여 복합 인덱스 중복 제거, 인덱스 성능 설명 정정, RLS 및 테이블 레벨 권한(REVOKE/GRANT) 심층 방어 설정 반영

## 작업 내용
1. **`Back/supabase/notice_bookmark.sql` 신규 작성**:
   - Supabase SQL Editor에서 실행 가능한 독립 DDL 스크립트 작성
2. **`NoticeBookmark` 테이블 및 PK/FK 설계**:
   - `id`: `TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text`
   - `userId`: `TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE`
   - `noticeId`: `TEXT NOT NULL REFERENCES "Notice"("id") ON DELETE CASCADE ON UPDATE CASCADE`
   - `createdAt`: `TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP`
   - 부모 엔티티(`User`, `Notice`) 삭제 시 고아 데이터 방지 및 무결성을 위해 `ON DELETE CASCADE` 적용
3. **사용자별 공지 중복 북마크 방지 UNIQUE 제약조건**:
   - `CONSTRAINT "NoticeBookmark_userId_noticeId_key" UNIQUE ("userId", "noticeId")`
4. **인덱스 최적화**:
   - `("userId", "noticeId")` UNIQUE 제약조건으로 생성되는 복합 B-tree 인덱스의 선두 컬럼이 `userId`이므로, 별도의 단독 `userId` 인덱스는 중복(Redundant)으로 판단하여 제외 (저장 공간 및 쓰기 오버헤드 방지)
   - `noticeId` 단독 인덱스(`NoticeBookmark_noticeId_idx`) 생성: 공지별 북마크 집계/조회 성능 확보 및 부모 공지 삭제 시 자식 테이블 풀 스캔(Seq Scan) 방지
   - 인덱스 탐색 성능 설명을 O(1)에서 B-tree 구조에 맞는 O(log N)으로 정정
5. **RLS 및 테이블 접근 권한 설정**:
   - `ALTER TABLE "NoticeBookmark" ENABLE ROW LEVEL SECURITY;` 활성화
   - `REVOKE ALL ON TABLE "NoticeBookmark" FROM anon, authenticated;`: 공개 역할의 직접 테이블 접근 차단
   - `GRANT SELECT, INSERT, DELETE, UPDATE ON TABLE "NoticeBookmark" TO service_role;`: 백엔드 전용 `service_role`에 필요한 DML 권한만 명시적으로 부여 (심층 방어)
   - Express 자체 JWT 및 `service_role` 바이패스 구조에 따라 불필요한 `auth.uid()` RLS 정책은 배제하고, 사용자 권한 검증은 Service 계층에서 수행하도록 분리

## 변경 파일
| 파일 | 변경 내용 |
|------|-----------|
| `Back/supabase/notice_bookmark.sql` | NoticeBookmark 테이블 DDL, 인덱스, RLS 및 DCL 권한 설정 신규 작성 |

## 미완료 사항 (진행 예정)
- **운영 DB 미반영**: 본 SQL은 실제 운영 Supabase DB에 적용(실행)하지 않았음
- **운영 DB 스키마 미검증**: 과거 Git 스키마 문서 기준으로 호환성을 검토하였으며, 실제 운영 DB의 `User`/`Notice` 라이브 스키마와의 일치 여부는 아직 미검증 상태임
- **백엔드 애플리케이션 코드 미구현**: NoticeBookmark 관련 Service, Controller, Route 로직은 미구현
- **실제 DB 연동 테스트 미실시**: 데이터베이스 CUD 및 예외 처리 연동 테스트 미실시
- **Git 반영 보류**: Git Commit 및 Push 미실행 (ChatGPT 검토 후 반영 여부 결정 예정)
