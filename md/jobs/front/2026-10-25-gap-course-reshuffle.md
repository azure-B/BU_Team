# [2026.10.25] 틈새 「다른 코스 추천」 버튼

## 요약
다음 수업 전 추천 카드에 **다른 코스 추천** 버튼을 추가. 누를 때마다 테마·시드를 바꿔 코스를 다시 뽑음.

## 코스 테마 (`planStyle`)
| 키 | 라벨 | 경향 |
|----|------|------|
| `meal` | 식사 여유 | 밥·편의점 체류를 길게 |
| `task` | 과제 집중 | 사이버강의·과제 우선 |
| `leisure` | 산책·휴식 | 공원·산책 위주 |
| `balanced` | 골고루 | 식사→과제→산책 균형 |

버튼 클릭 시 직전 테마와 **다른** 스타일을 고르고 `seedSalt`를 올려 `analyzeGapActivity`를 재호출.

## 변경 파일
- `Front/src/utils/gapActivities.js` — `PLAN_STYLES`, `pickPlanStyle`, `planStyle`/`seedSalt` 인자
- `Front/src/components/dashboard/DashboardSections.jsx` — GapActivityCard 버튼·라벨
- `Front/src/components/dashboard/DashboardSections.css` — `.gap-activity__actions`

## 사용 API
- 기존과 동일 (`getSchedules`, `getBuildings`, `getFacilities`, `getTasks`, 경로 `fetchGapRouteTimes`)
