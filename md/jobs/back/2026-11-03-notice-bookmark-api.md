# [2026.11.03] 공지 북마크 Controller / Route 구현 및 보안 점검 (A파트 3단계)

## 작업 개요
- 백엔드 A파트 공지 북마크의 API 계층(Zod Validation, Controller, Route) 구현 및 JWT 인증 미들웨어 연결
- 클라이언트 파라미터 유효성 검증, Controller 계층 방어 로직, RESTful 서브 리소스 엔드포인트 구축
- Express 라우터 모의 요청을 통한 토큰 차단(401) 및 유효성 검증 실패(400) 동작 검증
- 기존 인증 시스템의 JWT_SECRET 기본값 사용 현황 조사 및 운영 배포 대비 보안 개선안 수립

## 작업 내용

1. **공지 북마크 Zod 검증 스키마 신규 작성 (`Back/src/validations/notice-bookmark.validation.ts`)**:
   - 공지 북마크 등록 및 삭제 시 경로 파라미터(`:id`)를 검증하는 `noticeBookmarkParamSchema` 작성
   - `.trim().min(1)`을 적용하여 빈 문자열(`""`)뿐만 아니라 공백 문자열(`"   "`)도 엄격히 차단
   - 크롤링 공지 ID(`dept-*`) 및 일반 텍스트 ID와의 호환성을 위해 UUID 전용 검증을 강제하지 않고 범용 문자열로 검증
   - 네이밍 호환성을 위한 별칭 스키마(`noticeIdParamSchema`) 및 TypeScript 타입 추론(`NoticeBookmarkParam`) 제공

2. **공지 북마크 Controller 신규 구현 (`Back/src/controllers/notice-bookmark.controller.ts`)**:
   - 2단계 Service 함수(`getBookmarks`, `addBookmark`, `removeBookmark`)와 1:1 매핑되는 비동기 HTTP 핸들러 3종 구현
   - **사용자 ID 추출 및 심층 방어 검증**:
     - 클라이언트가 Body/Query/Params로 보내는 임의의 `userId`는 배제하고, JWT 인증 결과인 `(req as any).user.id`만 신뢰
     - `getUserId` 헬퍼 함수를 통해 사용자 ID 존재 여부, 문자열 타입, 공백 여부를 방어적으로 2차 검증 (실패 시 401 반환)
   - HTTP 응답 형식 통일:
     - 북마크 목록 조회: `200 OK`, `{ success: true, data: { total, bookmarks } }`
     - 북마크 등록: `201 Created`, `{ success: true, data: NoticeBookmark }`
     - 북마크 삭제: `200 OK`, `{ success: true, data: BookmarkDeleteResult }`

3. **기존 공지 Route 확장 및 미들웨어 체이닝 (`Back/src/routes/notices.routes.ts`)**:
   - 기존 공개 공지 목록 라우트 및 핸들러 연결 유지 (`GET /`, `getNotices`), 전체 회귀 테스트는 미실시
   - 신규 북마크 엔드포인트 3종 등록:
     - `GET /bookmarks`: 본인 북마크 목록 조회 (미들웨어: `authenticate`)
     - `POST /:id/bookmark`: 특정 공지 북마크 등록 (미들웨어: `authenticate` → `validate({ params })`)
     - `DELETE /:id/bookmark`: 특정 공지 북마크 삭제 (미들웨어: `authenticate` → `validate({ params })`)
   - **정적 경로 우선 선언**: 향후 `GET /:id` (공지 상세 조회) 엔드포인트가 추가될 때 발생할 수 있는 라우트 파라미터 충돌을 방지하기 위해 `/bookmarks`를 동적 `/:id` 라우트 상단에 선언
   - 데모용 `optionalAuthenticate`를 배제하고 엄격한 `authenticate` 적용
   - `Back/src/app.ts`에 이미 설정된 `/api/v1/notices` 및 `/api/notices` 이중 마운트를 통해 프론트엔드 배포 호환성 유지

4. **단위 및 인메모리 파이프라인 검증**:
   - TypeScript 빌드 성공: `npm run build` (`tsc`) 컴파일 성공 (Exit Code 0)
   - DB 접근 없이 Express 앱 인메모리 모의 요청을 통한 보안 파이프라인 검증:
     - 토큰 미전송 요청 시: `401 Unauthorized` (`No token provided`) 즉시 차단
     - 잘못된 토큰 전송 시: `401 Unauthorized` (`Invalid or expired token`) 즉시 차단
     - 정상 토큰 + 공백 공지 ID(`/:id/bookmark`) 전송 시: `400 Bad Request` (`입력값 유효성 검증 실패`) 정상 차단
     - 기존 `GET /` 엔드포인트 라우트 및 핸들러 연결 유지 상태 확인

5. **JWT 인증 보안 구조 분석 및 개선 방안 수립**:
   - **현황 확인**:
     - `auth.middleware.ts`, `optional-auth.middleware.ts`, `auth.service.ts` 3개 파일에 하드코딩된 기본 비밀키가 독립적으로 존재함을 확인
     - 현재 개발 환경의 `.env` 파일에 `JWT_SECRET` 환경변수가 설정되어 있지 않아 기본값에 의존 중임을 확인
     - 환경변수 초기화 위치 및 import 평가 순서 의존 가능성을 검토했으며, 실제 오류 발생 여부는 미확정
   - **개선 방안 수립**:
     - `Back/src/config/jwt.ts` 단일 진실 공급원(SSOT) 모듈 도입을 통해 기본값 제거 및 환경변수 누락 시 서버 기동 차단 방안 제시
     - 인증 담당 팀원의 작업 영역 보호를 위해 실제 인증 소스코드 수정은 수행하지 않고 분석 보고서로 공유

## 변경 파일
| 파일 | 상태 | 변경 내용 |
|------|:---:|-----------|
| `Back/src/validations/notice-bookmark.validation.ts` | 신규 | 공지 북마크 경로 파라미터(:id) Zod 유효성 검증 스키마 |
| `Back/src/controllers/notice-bookmark.controller.ts` | 신규 | 북마크 목록 조회·등록·삭제 Controller 핸들러 및 방어적 사용자 ID 검증 |
| `Back/src/routes/notices.routes.ts` | 수정 | 공지 북마크 엔드포인트 3종 등록 및 `authenticate`, `validate` 미들웨어 연결 |
| `md/jobs/back/2026-11-03-notice-bookmark-api.md` | 신규 | A파트 3단계 작업일지 작성 |

## 미완료 사항 및 주의사항 (진행 예정)

1. **실제 Supabase DB 연동 및 북마크 CRUD 통합 테스트 미실시**:
   - 운영 DB 보호 지침에 따라 실제 DB에 대한 북마크 추가/삭제/조회 E2E 통합 테스트는 수행하지 않음 (미들웨어 401/400 단위 테스트만 수행).
2. **운영 Render 환경 JWT_SECRET 설정 여부 미확인**:
   - 로컬 코드베이스만으로는 실제 Render 클라우드 배포 환경의 환경변수 등록 여부를 확인할 수 없음.
3. **JWT 기본 비밀키 문제 미해결 및 인증 담당자 협의 필요**:
   - 하드코딩된 기본 비밀키 제거 및 SSOT 설정 모듈 도입 작업은 인증 담당 팀원의 코드 영역이므로, 운영 배포 전 사전 협의 후 별도 반영 필요.
4. **Git Commit / Push 미실행**:
   - 모든 구현 및 작업일지 작성 후 로컬 상태를 보존하며, ChatGPT 및 사용자 최종 검토 후 커밋 진행 예정.
