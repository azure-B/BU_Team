# [2026.11.02] 공지 북마크 Service 구현 (A파트 2단계)

## 작업 개요
- 백엔드 A파트 공지 북마크 비즈니스 로직을 담당하는 `notice-bookmark.service.ts` 신규 구현
- 인증된 사용자 ID(`userId`) 기반의 북마크 등록·삭제·목록 조회 함수 작성
- ChatGPT 검토 의견을 수렴하여 Notice 연관 조회 컬럼 최소화(`id`, `title`), PostgREST 에러 코드(`PGRST200`/`PGRST201`) 기반 안전한 fallback, DB 내부 에러 메시지 은닉화 적용

## 작업 내용
1. **`Back/src/services/notice-bookmark.service.ts` 신규 작성**:
   - Supabase `@supabase/supabase-js` 클라이언트 및 `AppError`를 활용한 독립 서비스 모듈 작성
2. **북마크 등록 함수 구현 (`addBookmark` / `createBookmark`)**:
   - 입력 파라미터(`userId`, `noticeId`) 유효성 검증 (누락 시 400 Bad Request)
   - 대상 공지 존재 여부 확인 (`Notice` 테이블 조회, 미존재 시 404 Not Found)
   - 사전 중복 조회 및 동시성 대비 PostgreSQL UNIQUE 제약조건 위반 코드(`23505`) 예외 처리 (중복 시 409 Conflict)
3. **북마크 삭제 함수 구현 (`removeBookmark` / `deleteBookmark`)**:
   - 사용자 ID와 공지 ID(`WHERE "userId" = ? AND "noticeId" = ?`)를 함께 삭제 조건으로 적용하여 사용자별 삭제 범위를 제한하며, 실제 사용자 신원 검증은 추후 JWT 인증 Controller에서 수행 예정
   - 삭제 대상 부재 시 404 Not Found 반환
4. **사용자별 북마크 목록 조회 구현 (`getBookmarks` / `getUserBookmarks`)**:
   - `WHERE "userId" = ?` 조건으로 본인 북마크만 격리 조회 및 `createdAt DESC` 최신순 정렬
   - 빈 목록인 경우 빈 배열(`[]`) 및 `total: 0`을 안전하게 반환
5. **Notice 연관 조회 컬럼 최소화**:
   - 운영 DB 스키마 불일치로 인한 오류를 방지하기 위해 존재가 확실한 최소 컬럼(`id`, `title`)만 `Notice`에서 임베디드 조회하도록 축소
   - TypeScript `NoticeInfo` 인터페이스도 실제 조회 컬럼에 맞게 정돈
6. **PostgREST 관계 오류에 대한 정밀 fallback 처리**:
   - 외래키 관계 미인식(`PGRST200`) 및 관계 모호성(`PGRST201`) 오류 발생 시 북마크 기본 목록을 조회하는 fallback 구현
   - 단순 컬럼 오타나 문법 오류 등 다른 DB 에러를 관계 에러로 오인하지 않도록 조건 분리
7. **DB 내부 에러 메시지 노출 방지 (보안 강화)**:
   - Supabase/PostgreSQL의 내부 오류 원문이 클라이언트 HTTP 응답으로 유출되지 않도록 `console.error`로 서버 로그에만 기록하고, 클라이언트에는 정제된 메시지 반환
8. **TypeScript 빌드 검증 성공**:
   - `Back/tsconfig.json`의 `strict: true` 옵션 환경에서 `npm run build` (`tsc`) 컴파일 성공 (Exit Code 0)

## 변경 파일
| 파일 | 변경 내용 |
|------|-----------|
| `Back/src/services/notice-bookmark.service.ts` | 공지 북마크 등록·삭제·조회 Service 로직 신규 구현 |

## 미완료 사항 (진행 예정)
- **실제 Supabase DB 연동 테스트 미실시**: 운영 Supabase DB에 1단계 DDL이 아직 반영되지 않아 실제 DB 대상 CUD 쿼리 런타임 테스트 미수행
- **Controller 및 Route 미구현**: HTTP 요청 및 응답 처리를 위한 컨트롤러와 라우터 미구현 (3단계 진행 예정)
- **실제 JWT 인증 라우트 연결 미완료**: Express `authenticate` 미들웨어를 통한 인증 라우팅 미연결
- **통합 테스트 미실시**: 프론트엔드 연동 및 E2E 테스트 미실시
- **Git 반영 보류**: Git Commit, Push, Merge 미실행 (ChatGPT 검토 후 반영 예정)
