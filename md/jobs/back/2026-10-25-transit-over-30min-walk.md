# [2026.10.25] 도보 30분↑ → 대중교통 안내

## 규칙
- 산정 도보 분 ≥ 30이면 `travelMode: transit`
- 표기: `현재 위치에서 대중교통 이용시 약 N분`
- 카카오 대중교통 통합 길찾기 호출, 제휴 미승인(403) 시 도보·거리 추정 폴백
- 지각·엘리베이터 총 소요는 `travelMinutes` 기준

## 파일
- `Back/src/utils/kakao-transit.ts`
- `Back/src/utils/captain-route-calculator.ts`
- `Front/src/components/dashboard/DashboardSections.jsx`
