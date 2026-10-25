# [2026.10.25] 발표용 URL 파라미터 `time` / `account`

## 사용법
```
/?time=0700&account=0
/?time=1230&account=2
/?time=12:30&account=4
/?time=live&demoUser=곽두팔
```

| 파라미터 | 값 | 설명 |
|----------|-----|------|
| `time` (`demoTime` 별칭) | `0700`, `1230`, `7:00`, `12:30` | 데모 화요일(2026-10-27) 시각 고정 |
| `time` | `live` | 실제 시·분을 데모 화요일에 얹음 |
| `account` | `0`~`4` | 데모 계정 인덱스 강제 (새로고침해도 유지) |
| `demoUser` | 이름·학번·slug | 기존 방식 유지 |

## 계정 인덱스
| account | 이름 | 학번 | 기본 12:30 케이스 |
|---------|------|------|-------------------|
| 0 | 이승빈 | 20221001 | 수업 마무리 |
| 1 | 곽두팔 | 20221002 | 수업 중 체크인 |
| 2 | 김갑순 | 20221003 | 공강·식사 |
| 3 | 조박필 | 20221004 | 공강·과제 |
| 4 | 엄가영 | 20221005 | 짧은 이동 |

인사말 아래 `데모 account=N · 10/27(화) HH:MM` 라벨로 현재 파라미터 확인 가능.

## 변경 파일
- `Front/src/utils/demoParams.js` (신규)
- `Front/src/utils/todaySchedules.js`
- `Front/src/utils/demoSession.js`
- `Front/src/data/demoAccounts.js`
- `Front/src/pages/HomePage.jsx`

## Supabase 시드 (재실행함)
- `Back/scripts/seed-demo-students.mjs` — 5계정·시간표·과제
- `Back/scripts/seed-cyber-lectures.mjs` — 사이버강의 102건
- `Back/scripts/seed-campus-edges.mjs` — 캠퍼스 이동 엣지 35건
