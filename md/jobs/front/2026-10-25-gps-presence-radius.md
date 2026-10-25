# [2026.10.25] GPS 출석 반경 축소

## 문제
진리관 데모 GPS인데도 본부동 513 「강의실에 잘 도착하셨네요」 표시.
진리관↔본부동 ≈136m인데 `CLASS_BUILDING_RADIUS_M`이 150m라 옆 건물도 도착으로 판정.

## 수정
- 반경 **150 → 70m**
- 데모 GPS에 `buildingId`가 있으면 **좌표보다 건물 ID 일치** 우선 (`isNearBuilding`)

## 파일
- `Front/src/utils/classEngagement.js`
