# [2026.10.25] 캠퍼스 언덕·날씨 기반 도보 속도

## 변경
- 맑은 날 기본 속도 **67 → 50 m/min** (경사 캠퍼스)
- Open-Meteo 현재 강수/weather_code로 속도 배율 적용 (5분 캐시)
  | 구간 | 배율 | 근거 요약 |
  |------|------|-----------|
  | clear | 1.0 | 언덕 기준 속도 |
  | drizzle | 0.9 | 이슬비·미끄러움 |
  | rain | 0.8 | 중강도 비 |
  | heavy | 0.7 | Chang et al. 맑음 1.22→비 0.85 m/s(≈−30%); Deng/Lam 15 mm/h free-flow ↓ |

## 파일
- `Back/src/utils/walk-speed.ts` (신규)
- `Back/src/utils/kakao-walking.ts`
- `Back/src/utils/captain-route-calculator.ts`
