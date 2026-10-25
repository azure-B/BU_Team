# [2026.10.13] 일정 ↔ 과제 연계 기능 구현 및 계산 모듈 엣지케이스 예외 처리

## 작업 개요
- **일정 ↔ 과제 기능 연동**: 특정 수업 일정(시간표)에 연계된 과제 목록을 함께 조회하는 엔드포인트(`GET /api/v1/schedules/:id/tasks`) 구현
- **과제 등록/수정 스키마 확장**: 과제 생성 및 수정 시 연계 일정 ID(`scheduleId`)를 지정할 수 있도록 Zod 스키마 업데이트
- **조장님 계산 모듈 엣지케이스 대응**:
  - 마감일 경과(연체) 과제, 12시간/24시간 이내 마감 임박 과제 우선순위 점수 검증
  - 동선 계산 모듈의 시작 시간 누락/비정상 날짜 및 시설 빈 목록 안전 폴백(Fallback) 처리
- **Supabase 네트워크 통신 장애 대응**: `unwrap` 함수 내 네트워크 장애(`fetch failed` 등) 발생 시 503 Service Unavailable 및 명확한 에러 메시지 반환

---

## 변경 파일 목록

| 파일 | 변경 내용 |
|------|-----------|
| `Back/src/validations/task.validation.ts` | `createTaskSchema`, `updateTaskSchema`에 `scheduleId` 필드 추가 |
| `Back/src/services/schedule.service.ts` | 특정 일정에 연계된 과제 목록을 조회하는 `getScheduleTasks` 구현 |
| `Back/src/controllers/schedule.controller.ts` | `getScheduleTasks` 컨트롤러 핸들러 추가 |
| `Back/src/routes/schedules.routes.ts` | `GET /:id/tasks` 엔드포인트 라우팅 등록 |
| `Back/src/utils/captain-route-calculator.ts` | 날짜 파싱 방어 코드 및 편의시설 빈 목록 안전 폴백 추가 |
| `Back/src/config/supabase.ts` | Supabase 네트워크 통신 실패 시 503 처리 개선 |
| `md/API/README.md` | `GET /api/v1/schedules/:id/tasks` 엔드포인트 명세 추가 |

---

## 검증 결과
- TypeScript 빌드(`npm run build`) 통과
- 조장님 계산 모듈 엣지케이스(12시간 전 100점, 연체 과제 90점, 10일 후 20점) 정상 점수 산출 확인
- 일정 시간 역전(`endAt < startAt`) 차단 정상 확인
- 과제 등록 시 `scheduleId` 연계 Zod 유효성 검증 확인
