# 오늘 마감 사이버강의·과제 안내 + 마감 우선 추천

## 사용 API
- `GET /api/tasks` (과제·사이버강의)
- `GET /api/schedules` (수업 중 여부)

## 변경 파일
- `Front/src/utils/courseCategory.js` (신규): 과목명 기반 교양 판별, 사이버강의 판별, 마감 우선 정렬
  - 안 지난 것 → 마감일 빠른 순 → 같은 날이면 **전공 먼저** → 마감 시각 → 사이버강의 먼저
- `Front/src/utils/dueToday.js` (신규): 오늘 마감 항목 추출 + 문구
  - 수업 중: "이런.. 오늘 「과목」 사이버 강의가 마감이에요! / 교수님 몰래.. 한번 들어볼까요?" (과제도 동일 톤)
  - 수업 없음: 신데렐라·1.5배속·호박마차 등 위트 문구 랜덤
- `Front/src/components/dashboard/DashboardSections.jsx`: `DueTodayCard` 추가 (1분 주기 + 일찍 끝남 이벤트 갱신)
- `Front/src/pages/HomePage.jsx`: `ClassEngagementCard` 다음에 `DueTodayCard` 배치
- `Front/src/utils/gapActivities.js`
  - 과제 추천 정렬을 마감 우선(전공 우선) 규칙으로 변경
  - 사이버강의는 "들어보시는/틀어볼까요" 표현
  - 넉넉한 공강 코스: 마감 1·2순위(과제 + 사이버강의)를 같은 학습 공간에서 연달아 배치, 각 항목에 마감 표기
  - 보통 공강 과제 카드: 마감 순서 안내
