# [2026.10.25] GPS·카카오 도보·엘리베이터 반영 동선 API

## 변경
- `POST /campus/route/lateness`가 GPS(`lat`,`lng`)를 받고, 카카오 도보(서버 전용)·CampusEdge·엘리베이터 슬롯으로 권장 도착·상황 멘트를 계산
- `KAKAO_REST_API_KEY` (`Back/.env.example`) — 없으면 haversine 추정
- 지도 SDK/맵 UI는 사용하지 않음

## 파일
| 파일 | 내용 |
|------|------|
| `Back/src/utils/kakao-walking.ts` | 카카오 도보 / 폴백 |
| `Back/src/utils/captain-route-calculator.ts` | 통합 계산 + 6상황 멘트 |
| `Back/src/validations/campus.validation.ts` | GPS 스키마 |
| `Back/src/data/elevatorWaitSlots.ts` | 엘리베이터 분 (기존) |
