# 실시간 모드: 수업 종료 후에도 「이미 시작」 표시

날짜: 2026-10-25

## 원인
- `pickUpcomingClass`가 끝난 수업만 있을 때 `sorted[0]`(지난 수업)으로 폴백
- 경로 API LATE 팁(「수업이 이미 시작했어요」)이 `classOngoing === false`여도 그대로 노출

## 수정
- `todaySchedules.js`: 끝난 수업 폴백 제거, naive 벽시계 시·분으로 투영
- `NextClassCard`: 종료·시작 전엔 LATE 팁 무시, 실시간 15초 갱신
