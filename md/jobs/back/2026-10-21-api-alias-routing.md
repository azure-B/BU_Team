# [2026.10.21] 프론트엔드 연동을 위한 API 라우트 별칭(/api/*) 지원

- 일시: 2026-10-21
- 담당자: B파트 (jhj600)
- 영역: Back

## 작업 개요
- 프론트엔드 배포 환경(`VITE_API_URL`)이 `/api` 경로를 기본 Base URL로 호출함에 따라, 기존 `/api/v1/*` 엔드포인트에 더해 `/api/*` 경로를 함께 매핑함
- 인증(`auth`), 일정(`schedules`), 과제(`tasks`), 대시보드(`dashboard`), 캠퍼스(`campus`) 라우터에 별칭 등록
- 프론트엔드(`dashboardApi.js`, `authApi.js`)에서 발생하는 404 라우팅 오류 사전 방지

## 변경 파일
| 파일 | 변경 내용 |
|------|-----------|
| `Back/src/app.ts` | `/api/auth`, `/api/schedules`, `/api/tasks`, `/api/dashboard`, `/api/campus` 라우터 별칭 추가 |
| `md/API/README.md` | API Base URL 및 전역 `/api/*` 별칭 지원 명시 |

## 사용 및 영향 API
- `/api/auth/*` (기존 `/api/v1/auth/*` 병행)
- `/api/schedules/*` (기존 `/api/v1/schedules/*` 병행)
- `/api/tasks/*` (기존 `/api/v1/tasks/*` 병행)
- `/api/dashboard/*` (기존 `/api/v1/dashboard/*` 병행)
- `/api/campus/*` (기존 `/api/v1/campus/*` 병행)

## 검증
- TypeScript 전체 컴파일 검사 통과 (`npx tsc --noEmit`)
