# [2026.10.13] Prisma 제거, Supabase 조회로 교체

## 작업 개요
- SQLite/Prisma 의존을 제거하고 인증·일정·과제·대시보드·캠퍼스 조회를 Supabase 클라이언트로 변경
- Render 빌드가 타입 패키지를 설치한 뒤 컴파일하도록 수정

## 변경 파일
| 파일 | 변경 내용 |
|------|-----------|
| `Back/package.json` | `prisma`, `@prisma/client` 제거. `build`/`start` 분리 |
| `Back/src/config/supabase.ts` | Supabase 클라이언트 |
| `Back/src/services/*.ts` | Prisma 호출을 Supabase 조회로 교체 |
| `Back/src/utils/captain-route-calculator.ts` | 동선 조회를 Supabase로 교체 |
| `Back/src/utils/prisma.ts` | 삭제 |
| `Back/prisma/` | 스키마, 시드, SQLite 파일 삭제 |
| `Back/supabase/schema.sql` | 테이블 생성 SQL 위치 이동 |
| `render.yaml` | `npm install --include=dev && npm run build` |
| `md/folder.md` | 폴더 구조 반영 |

## 사용 API
- 엔드포인트 경로는 그대로. 데이터 저장소만 Supabase `User`, `Schedule`, `Task`, `Building`, `Classroom`, `Facility`, `CafeteriaMenu`, `CampusEdge`
