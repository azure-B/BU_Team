# [2026.10.25] 데모 5계정 랜덤 로그인 · 화 12:30

## 변경
- 기본 데모 시각: **화 12:30** (`todaySchedules.js`)
- 최초 진입 시 이승빈·곽두팔·김갑순·조박필·엄가영 중 **랜덤 로그인**
- **새로고침(F5 / Ctrl+F5)** 시 이전과 **다른 계정**으로 전환
- `?demoUser=곽두팔` / `20221002` / `kwak` 으로 계정 고정
- `?demoTime=09:30` 등으로 시각만 덮어쓰기 가능

## 계정별 화 12:30에 보이는 것
| 계정 | 카드 |
|------|------|
| 이승빈 | 수업 마무리 · 일찍 끝났어요? |
| 곽두팔 | 수업 중 체크인 |
| 김갑순 | 다음 수업 전 추천(식사) |
| 조박필 | 다음 수업 전 추천(과제/식사) |
| 엄가영 | 짧은 여유·이동 안내 |

## 파일
- `Front/src/data/demoAccounts.js`
- `Front/src/utils/demoSession.js`
- `Front/src/App.jsx`
- `Front/src/utils/todaySchedules.js`
- `Front/src/pages/HomePage.jsx`
