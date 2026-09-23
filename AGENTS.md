# 프로젝트 Agent 가이드

Antigravity 에이전트가 이 프로젝트에서 작업할 때 참조하는 진입점 문서입니다.

## 폴더 역할

| 폴더 | 역할 |
|------|------|
| `Back/` | Express MVC 서버 (routes → controllers → models) |
| `Front/` | React (Vite) 클라이언트 |
| `md/` | 문서 — API 명세, 작업 내역, 폴더 구조 |

## 작업 시작 전 — Git 동기화 (필수)

코드·문서 수정에 들어가기 **전**, 이번 대화에서 `git pull origin main`을 하지 않았으면 먼저 실행한다.

- pull **성공** → 이어서 본 작업 진행
- pull **실패** (충돌·네트워크) → 작업 중단, 원인과 해결 방법 안내
- 사용자가 *"pull 하지 마"*, *"로컬 그대로 진행"* 등으로 명시하면 pull 생략
- Git 저장소가 없거나 remote `origin/main`이 없으면 → 사용자에게 알리고 pull 없이 진행

### pull 생략 가능한 경우

- 같은 대화에서 이미 `git pull origin main`을 실행·성공한 경우
- 사용자가 pull 완료를 명시한 경우

## 작업 영역별 규칙 파일

| 규칙 파일 | 적용 범위 |
|-----------|-----------|
| `project-overview.md` | 전역 공통 |
| `git-workflow.md` | 전역 (Git 커밋·pull 규칙) |
| `back-workflow.md` | `Back/**` |
| `front-workflow.md` | `Front/**` |
| `md-documentation.md` | `md/**` |

## 작업 완료 시 필수 행동

### Back 작업 시

1. `md/API/README.md` — 변경된 엔드포인트 반영
2. `md/jobs/back/` — 작업 내역 기록
3. 폴더 구조 변경 시 `md/folder.md` 갱신

### Front 작업 시

1. `md/jobs/front/` — 작업 내역 기록 (사용 API 엔드포인트·변경 파일명 포함)
2. 폴더 구조 변경 시 `md/folder.md` 갱신

## 문서 SSOT

- **API 명세**: `md/API/README.md`
- **폴더 구조**: `md/folder.md`
- **작업 내역**: `md/jobs/back/`, `md/jobs/front/`

작업 종료 전 위 문서 갱신 여부를 반드시 확인하세요.

## Git 커밋 메시지 형식 (필수)

```
[YYYY.MM.DD] - 작업내역
```

- 날짜: 점(`.`) 구분 — 예) `[2026.09.23]`
- `-` 뒤: 한국어로 무엇을 했는지 한 줄 요약
- `feat:`, `fix:`, `Merge origin/main` 등 다른 형식 **사용 금지**
- **커밋**: 사용자가 명시적으로 요청했을 때만 실행
- **push**: 사용자가 명시적으로 요청했을 때만 실행 (`git push origin main`)
