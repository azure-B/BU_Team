# [2026.10.11] B파트 작업 내역 — 유효성 검증 및 모듈 예외 처리

## 작업 개요
- 일정·과제·캠퍼스 API 전반에 Zod 입력값 유효성 검증 미들웨어 구축 및 적용
- 타인 데이터 접근 차단용 `userId` 소유권 검증 및 예외 응답(404/400) 표준화
- 조장님 계산 모듈(마감 긴급도 + 중요도 가중 스코어링) 연동 및 순위 정렬 로직 고도화
- 백석대 실제 캠퍼스 기반 데모 시드 데이터 구축 및 통합 테스트 완료

---

## 신규 및 변경 파일 목록

| 파일 | 변경 내용 |
|------|-----------|
| `Back/src/middlewares/validate.middleware.ts` | **(신규)** Express용 Zod 스키마 검증 공통 미들웨어 구현 |
| `Back/src/middlewares/error.middleware.ts` | `ZodError` 발생 시 400 상태코드 및 필드별 에러 응답 처리 추가 |
| `Back/src/validations/schedule.validation.ts` | **(신규)** 일정 생성/수정/조회용 Zod 검증 스키마 (시간 역전 검증 등) |
| `Back/src/validations/task.validation.ts` | **(신규)** 과제 생성/수정용 Zod 검증 스키마 (중요도 1~5, 마감일 등) |
| `Back/src/validations/campus.validation.ts` | **(신규)** 동선 및 지각 위험도 계산, 시설/학식 조회 Zod 스키마 |
| `Back/src/routes/schedules.routes.ts` | Zod 유효성 검증 미들웨어 부착 |
| `Back/src/routes/tasks.routes.ts` | Zod 검증 미들웨어 부착 및 라우팅 순서 버그 방지 |
| `Back/src/routes/campus.routes.ts` | 캠퍼스 API Zod 검증 미들웨어 부착 |
| `Back/src/services/schedule.service.ts` | Date 파싱 처리 및 `AppError` 기반 본인 소유권 예외 처리 강화 |
| `Back/src/services/task.service.ts` | Date 파싱 처리, 미완료 과제 대상 점수화 및 `AppError` 예외 처리 |
| `Back/src/utils/captain-calculator.ts` | 마감 임박도(D-Day)와 중요도(1~5) 결합 점수 산출 로직 구현 |
| `Back/prisma/seed.ts` | 백석대 실제 주요 건물, 강의실, 편의시설, 학식, 과제 시나리오 시드 보강 |
| `md/API/README.md` | v1 전체 API 명세 최신화 |

---

## 검증 및 테스트 결과
- TypeScript 컴파일 검사 통과 (`npx tsc --noEmit`)
- JWT 인증 미들웨어 및 소유권(`userId`) 검증 정상 동작 확인
- Zod 검증 실패 케이스(빈 제목, 범위 초과 중요도, 시간 역전 등) 400 에러 및 명확한 오류 필드 반환 확인
- 조장님 계산 모듈 기반 Top 3 과제 우선순위 점수 정상 산출 확인
- 캠퍼스 이동 시간 및 지각 위험도(여유/주의/위험) 산출 정상 확인
