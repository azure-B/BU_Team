# [2026.10.25] 데모 시간표를 Course 테이블 기준으로 재시드

## 작업
- `seed-demo-students.mjs`: 컴퓨터공학부 `Course`에서 실제 title·room·start/end 조회 후 Schedule 생성
- 기존 데모 계정 Schedule 삭제 후 30건 재삽입 (~18학점)
- `seed-cyber-lectures.mjs`: 과목명을 Course 명칭으로 변경 (자료구조론, 운영체제론, 정보보안컨설팅, 채플과 섬김 등)

## 화 12:30 케이스
| 계정 | Course 기준 |
|------|-------------|
| 이승빈 | 정보보안컨설팅 10:00–12:50 |
| 곽두팔 | C언어프로그래밍 12:00–14:50 |
| 김갑순 | 자료구조론 10:00–11:50 → 14:00–15:50 |
| 조박필 | 자료구조론 10:00–11:50 → 정보보호관리체계 14:00–16:50 |
| 엄가영 | 자료구조론 10:00–11:50 → C언어프로그래밍 12:00–14:50 |

## 실행
```
cd Back
node scripts/seed-demo-students.mjs
node scripts/seed-cyber-lectures.mjs
```
