# 데모 버그·비서 UX·알림·캠퍼스

날짜: 2026-10-25

## 변경 파일
- `DashboardSections.jsx/css` — GPS 2.5s 타임아웃, 「위치 없이 시간표 기준」, 맞춤 공지+일정 추가
- `HomePage.jsx` — NoticeList(2건) 노출
- `SchedulePage.css` — 주말 펼침 시 평일 과목명 opacity 유지
- `Footer.jsx/css` — 캠퍼스 `/campus` 링크, `sourceUrl`, 「내가 GPT에 보낸 정보」, chatStats 기록
- `App.jsx` — `/campus`, `/chat-stats`
- `CampusPage.jsx/css` — 학식·카페·학습·활동
- `ChatStatsPage.jsx/css`, `utils/chatStats.js` — LLM-free %·경로·비용
- `MyPage.jsx/css` — 통계 바로가기
- `SettingSections.jsx` — 데모 계정과 MY 프로필 동기화
- `NotificationPanel.jsx` — 일정·과제·공지 기반 알림 (v2 키, mock 제거)

## 사용 API
- `POST /api/v1/chat`
- `GET /schedules`, `/tasks`, `/notices`
- `POST /schedules` (공지→일정 추가)
