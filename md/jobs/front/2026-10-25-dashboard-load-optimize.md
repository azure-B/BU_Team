# [2026.10.25] 대시보드·배포 로드 최적화

## 진단
- 홈 카드 5곳이 `getSchedules`를 **각각** 호출 → Render 콜드스타트와 겹쳐 느림
- HomePage가 `/dashboard/today`와 `/schedules`를 중복 호출
- `/dashboard/today`가 UI에 안 쓰는 Notice까지 조회
- Notice 목록 API가 `count: exact` + 본문 포함으로 무거움

## Front
- `dashboardCache.js`: schedules/buildings/facilities/tasks 동시요청 합치기 + 45s TTL
- HomePage: `/dashboard/today`만으로 인사·건수
- Axios timeout 25s (Render 콜드스타트)
- Schedule/MyPage lazy + vite manualChunks (react, motion)

## Back
- dashboard: Notice 조회 제거, Schedule 컬럼 한정
- schedules: `select` 필요한 컬럼만
- notices: exact count 제거, limit≤50
- chat notice 검색: 300 → 80건
- buildings: id/name/code/x/y만

## 파일
- `Front/src/api/dashboardCache.js`, `dashboardApi.js`, `index.js`
- `Front/src/pages/HomePage.jsx`, `App.jsx`, `vite.config.js`
- `Front/src/components/schedule/ScheduleContext.jsx`
- `Back/src/services/dashboard.service.ts`, `schedule.service.ts`, `notice.service.ts`, `campus.service.ts`
- `Back/src/services/chat/noticeIntent.ts`
