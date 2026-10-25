# [2026.10.25] 틈새 추천 3단계 · 캠퍼스 활동 · 수업 중 안내

## 틈새 추천 (다음 수업 전 추천)
- 여유 25분 미만: 「바로 강의실로 가서 과제부터」 (`move-now`)
- 여유 25~90분: 식사 / 과제(학습 공간) / 캠퍼스 활동 중 하나 랜덤
- 여유 90분 이상: 식사 → 과제(없으면 복습) → 캠퍼스 활동 코스 (`plan`), 시각·이동·체류 표시
- 모든 이동에 엘리베이터 포함
  - 지금 건물에서 내려올 때: 직전 강의실 3층 이상일 때만 (강의실 코드로 층 추정, 예: 본부514 → 5층)
  - 목적지가 3층 이상일 때 올라가는 엘리베이터
  - 식당·카페·공원·기숙사 라운지 가는 길도 동일 적용
- 활동 시간 합계는 `다음 수업까지 − 3분(도착 버퍼)` 안에서 계산

## 캠퍼스 활동 (`CAMPUS_ACTIVITIES`)
출처: 백석대 편의시설 안내(kyojik.bu.ac.kr), 학생홍보기자단 백녹담 기사, 생활관 복지·편의시설 안내
- 학술정보관 열람실 / 자료실, 본부동 창업카페 / 드림자료실, 목양관 5층 스터디룸
- 생활관 휘트니스센터 / 당구장 / 이디야 북카페
- 학생복지관 탁구장, 진리관 서점, 글로벌외식산업관 학생 카페 (운영시간 미확인 → 평일 주간 가정, `hoursAssumed`)

## 이동 & 강의 안내
- 그 건물에서 이미 수업 중이면 「수업 잘 듣고 있나요?」 + 종료 시각 안내 (「이동하세요」 대신)
- 이동 시간 문구: 「도보 약 N분 + 엘리베이터 약 N분」 → 「강의실까지 총 N분 예상되어져요」

## 사용 API
- `POST /api/campus/route/lateness` (`totalMinutes`, `elevatorMinutes`, `fromBuildingId`, 문구 `tipSub`/`travelLabel`)

## 파일
- `Front/src/data/campusSpots.js`
- `Front/src/utils/gapActivities.js`
- `Front/src/utils/campusRouteTimes.js`
- `Front/src/components/dashboard/DashboardSections.jsx`
- `Back/src/utils/captain-route-calculator.ts` (안내 문구)
