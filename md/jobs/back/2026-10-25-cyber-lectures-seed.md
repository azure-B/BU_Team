# 사이버강의 마감 시드

## 작업 내용
- `Back/scripts/seed-cyber-lectures.mjs` 추가: 데모 5계정 × 사이버 과목 2개 × 1~10주차를 `Task` 테이블에 upsert (102행)
  - Task에 type 컬럼이 없어 제목 `「과목 · N주차 사이버강의」` + id `cyber-{slug}-{과목}-wNN` 으로 구분
  - 8주차까지 `COMPLETED`, 9주차부터 `PENDING`
  - 9주차 마감 = 2026-10-27 23:59 + 과목별 offset일
- 오늘(10/27) 마감 데모 케이스
  - 이승빈: 선형대수학(전공) + 사람다운 사람의 길(교양) 사이버강의, 인공지능 CNN 과제 → 같은 날 전공/교양 우선순위 확인용
  - 곽두팔: 자료구조 사이버강의 + 스택·큐 퀴즈 과제
  - 김갑순: 컴퓨터네트워크 사이버강의
  - 조박필: 알고리즘 8주차 과제(기존)
  - 엄가영: 없음

## 실행
```
cd Back && node scripts/seed-cyber-lectures.mjs
```

## API 변경
- 없음 (`GET /api/tasks` 응답에 사이버강의 Task가 함께 포함됨)
