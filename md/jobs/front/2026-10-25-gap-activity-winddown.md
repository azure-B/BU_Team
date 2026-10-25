# [2026.10.25] 수업 종료 30분 전 · 틈새 활동 추천

## 동작
1. **집중 체크인**: 수업 시작 ~ 종료 30분 전
2. **종료 30분 전**: 「수업이 일찍 끝났나요?」→ 확인 시 early-end 기록
3. **이동&강의 안내**: wind-down / early-end 시 **다음 수업** 기준으로 동선
4. **다음 수업 전 추천**: 틈 분석
   - 점심(11–14시) + 여유 충분 → 캠퍼스 식당 (성별 식사시간 + 제공 10분)
   - 아니면 마감 임박 과제
   - 아니면 베데스다공원·카페뷰리 등 캠퍼스 스팟 동선

## 식사 시간
| 성별 | 식사 | 음식 제공 | 합계 |
|------|------|-----------|------|
| 남 | 28분 | 10분 | 38분 |
| 여 | 38분 | 10분 | 48분 |

(대학생 외식 31–60분대·여학생이 식사 시간이 더 길다는 연구 경향 반영. 성별은 `localStorage.userGender` 또는 기본 남)

## 미리보기
- `/dashboard?winddown=1` — 일찍 끝났나요 버튼
- `/dashboard?gap=1` — 틈새 추천 카드

## 파일
- `Front/src/utils/classEngagement.js`, `classSession.js`, `gapActivities.js`, `todaySchedules.js`
- `Front/src/data/campusSpots.js`
- `Front/src/components/dashboard/DashboardSections.jsx` (`GapActivityCard`)
- `Front/src/pages/HomePage.jsx`
