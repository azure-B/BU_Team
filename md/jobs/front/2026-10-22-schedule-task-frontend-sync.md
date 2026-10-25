# [2026.10.22] 일정 ↔ 과제 연계 뷰 및 시간표 서버 동기화 구현

## 작업 개요
- 프론트엔드 일정 페이지(`ScheduleContext`)와 백엔드 서버 DB 일정 API 동기화 연동
- 일정 상세 컴포넌트(`ScheduleDetails.jsx`)에 특정 수업 일정 클릭 시 연계 과제 목록(`GET /api/schedules/:id/tasks`)을 바로 조회·표시하는 뷰 추가
- 대시보드 `NextClassCard`의 '이동 경로 보기' 버튼에 캠퍼스 동선 및 지각 위험도 API(`getRouteAndLateness`) 이벤트 연동
- `dashboardApi.js`에 과제 및 일정 CRUD, 연계 과제 조회 API 함수 확장

---

## 사용된 백엔드 API 엔드포인트

| Method | Endpoint | 설명 |
|--------|----------|------|
| `GET` | `/api/schedules` | 서버 DB의 전체 일정 목록 동기화 |
| `POST` | `/api/schedules` | 신규 수업/일정 서버 등록 |
| `DELETE` | `/api/schedules/:id` | 일정 서버 삭제 |
| `GET` | `/api/schedules/:id/tasks` | 특정 수업 일정에 연계된 과제 목록 조회 |
| `POST` | `/api/campus/route/lateness` | 이동 동선 및 지각 위험도 계산 |

---

## 변경 파일 목록

| 파일 | 변경 내용 |
|------|-----------|
| `Front/src/api/dashboardApi.js` | `createSchedule`, `deleteSchedule`, `getScheduleTasks`, `getTasks`, `createTask` 함수 추가 |
| `Front/src/components/schedule/ScheduleContext.jsx` | 마운트 시 서버 DB 일정(`GET /api/schedules`)을 동기화하고 로컬 스토리지와 병합 처리 |
| `Front/src/components/schedule/ScheduleDetails.jsx` | 각 수업별 연계 과제 확인 버튼 및 아코디언 과제 목록(`getScheduleTasks`) 뷰 추가 |
| `Front/src/components/dashboard/DashboardSections.jsx` | '이동 경로 보기' 클릭 시 백석대 동선 계산 및 지각 위험도 안내 연동 |
| `Front/publish/` | Vite 프로덕션 빌드 번들 최신화 |

---

## 검증 결과
- `npm run build` 정상 통과 (0 error)
- 일정 상세 뷰에서 수업별 연계 과제 펼치기/접기 동작 검증
- 대시보드 이동 경로 버튼 클릭 시 예상 도보 시간/지각 위험도 안내 동작 검증
