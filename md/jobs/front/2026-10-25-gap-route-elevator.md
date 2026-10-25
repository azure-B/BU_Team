# [2026.10.25] 틈새 추천 이동시간 — 이동&강의 안내와 같은 기준 + 엘리베이터

## 변경
- 학습존 「이동 N분」: 출발점 → 라운지 건물을 서버 경로 계산(CampusEdge·날씨 보정)으로 구하고 실내 +2분
- 「다음 강의 N분」·「강의실까진 N분」·캠퍼스 스팟 복귀: **도보 + 엘리베이터** 포함
- 표시 여유 = 다음 수업까지 − (다음 강의실 도보 + 엘리베이터)
- 「이동 & 강의 안내」와 「다음 수업 전 추천」이 같은 출발점 사용
  - 진행 중 수업 건물 → 오늘 마지막으로 끝난 수업 건물 → 본부동 (데모 시계)
  - 실시계에서는 GPS 우선
- 경로 응답은 5분 메모리 캐시

## 사용 API
- `POST /api/campus/route/lateness` (`travelMinutes`, `elevatorMinutes`, `totalMinutes`)

## 파일
- `Front/src/utils/campusRouteTimes.js` (신규)
- `Front/src/utils/gapActivities.js`
- `Front/src/components/dashboard/DashboardSections.jsx`
