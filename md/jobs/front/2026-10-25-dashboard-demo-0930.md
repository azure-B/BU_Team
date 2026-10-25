# [2026.10.25] 대시보드 데모 시계 (화 12:30)

## 현재 기본값
- 날짜: **2026-10-27 (화)**
- 시각: **12:30**
- 계정: 세션 최초 진입 시 5명 중 랜덤 (`md/jobs/front/2026-10-25-demo-accounts-random.md`)

## URL
| 파라미터 | 예 | 효과 |
|----------|-----|------|
| (없음) | `/` | 화 12:30 + 랜덤 계정 |
| `demoUser` | `?demoUser=조박필` | 계정 고정 |
| `demoTime` | `?demoTime=09:30` | 시각만 변경(요일은 화 유지) |
| `demoTime=live` | | 실제 시·분을 화요일에 투영 |
| `winddown` / `gap` / `checkin` | | 카드 강제 미리보기 |

## 파일
- `Front/src/utils/todaySchedules.js`
