# [2026.10.25] 수업 중 집중 체크인 카드

## 노출 조건
1. 오늘 투영 일정 중 **진행 중**인 수업
2. 구간: 시작 ~ **종료 30분 전** (예: 10:00–12:00 → 10:00–11:30)
3. GPS가 해당 `buildingId` 좌표 **150m 이내**

## 멘트
사용자 예시 문구 미사용. Harvard Bok Center Quick Write, Yale Poorvu metacognition, Columbia CTL engaged lecturing, ASU Pose-a-Question 계열을 한국어로 재구성 (6종, 7분 슬롯 순환).

## 미리보기
수업 밖·GPS 없을 때 UI 확인: `/dashboard?checkin=1`

## 파일
- `Front/src/utils/classEngagement.js`
- `Front/src/components/dashboard/DashboardSections.jsx` (`ClassEngagementCard`)
- `Front/src/components/dashboard/DashboardSections.css`
- `Front/src/pages/HomePage.jsx`
