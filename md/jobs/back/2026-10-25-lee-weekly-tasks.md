# [2026.10.25] 이승빈 수강 과목 주간 과제 시드

## 요약
- `mocked_user_id` 기준 수강 8과목 × 1~9주차 = **72건** Task 삽입
- 제목 형식: `{수업명} · {N}주차: {진도 과제}` (연계 조회용)
- `GET /schedules/:id/tasks`는 optional auth로 토큰 없이도 조회 가능

## 주차·상태
| 주차 | 마감 | status |
|------|------|--------|
| 1~7 | 09-05 ~ 10-17 | COMPLETED |
| 8 | 10-24 | IN_PROGRESS |
| 9 | 10-31 | PENDING |

## 변경·산출
| 파일 | 내용 |
|------|------|
| `Back/scripts/seed-lee-tasks.mjs` | 시드 스크립트 |
| `Back/src/services/schedule.service.ts` | 수업명 prefix(`·`)로 과제 매칭 |
| `Back/src/routes/schedules.routes.ts` | `GET /:id/tasks` optional auth |

## 재실행
```bash
cd Back && node scripts/seed-lee-tasks.mjs
```
