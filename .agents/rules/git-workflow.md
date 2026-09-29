---
description: Git 커밋·pull·push 규칙
alwaysApply: true
---

# Git 규칙

## 커밋 메시지 형식 (필수)

```
[YYYY.MM.DD] - 작업내역
```

- 날짜: 점(`.`) 구분 — 예) `[2026.09.23]`
- `-` 뒤: 한국어로 **무엇을 했는지** 한 줄 요약
- `feat:`, `fix:`, `Merge origin/main` 등 다른 형식 사용 **금지**

### 예시

```
[2026.09.23] - Back API userController CRUD 구현
[2026.09.23] - Front HomePage 히어로 섹션 디자인 적용
[2026.09.23] - Front-Back 연동 Health Check 엔드포인트 추가
```

## 커밋 시

- 사용자의 명시적 요청이 없어도 작업 완료 시점 등 필요에 따라 에이전트가 유동적으로 `git commit` 실행
- 메시지는 반드시 위 형식. 당일 날짜 사용 (사용자가 다른 날짜 지정 시 따름)
- 커밋 전 `git status`, `git diff --stat`으로 변경 내용 확인 후 요약을 사용자에게 보여줄 것

## push 시

- 사용자의 명시적 요청이 없어도 주요 작업 단위가 끝나면 에이전트가 유동적으로 `git push` 실행
- 명령: `git push origin main`
- push 전 반드시 커밋이 완료된 상태인지 확인

## pull

- 작업 시작 전 혹은 필요 시 에이전트 판단하에 유동적으로 `git pull origin main` 실행 (상세: `AGENTS.md`)
