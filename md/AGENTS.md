# Dacon — Agent 가이드

Cursor 에이전트가 이 프로젝트에서 작업할 때 참조하는 진입점 문서입니다.

## 작업 시작 전 — Git 동기화 (필수)

코드·문서 수정에 들어가기 **전**, 사용자가 이미 `git pull origin main`을 했는지 확인한다.

### 에이전트가 자동으로 pull 하는 경우

- 이번 대화에서 pull을 하지 않았고, 사용자도 pull 완료를 밝히지 않았을 때
- 파일 수정, 서버 실행, 의존성 설치 등 **실질 작업**을 시작하기 직전

### 실행

```bash
git pull origin main
```

- pull **성공** → 이어서 본 작업 진행
- pull **실패**(충돌, 네트워크 등) → 작업을 멈추고 사용자에게 원인과 해결 방법 안내
- 사용자가 *"pull 하지 마"*, *"로컬 그대로 진행"* 등으로 명시하면 pull 생략

### pull 생략 가능한 경우

- 같은 대화에서 이미 `git pull origin main`을 실행했거나 성공 결과를 확인한 경우
- 사용자가 pull 완료를 명시한 경우
- Git 저장소가 아니거나 remote `origin`/`main`이 없는 경우 — 사용자에게 알리고 pull 없이 진행

## 폴더 역할

| 폴더 | 역할 |
|------|------|
| `back/` | Express MVC 서버 |
| `front/` | React (Vite) 클라이언트 |
| `python/` | Python 스크립트 |
| `md/` | 문서 — API 명세, 작업 내역, 폴더 구조 |

## 작업 영역별 규칙

규칙은 `.cursor/rules/`에 영역별로 분리되어 있습니다. 해당 폴더 작업 시에만 로드됩니다.

| 규칙 파일 | 적용 범위 |
|-----------|-----------|
| `project-overview.mdc` | 전역 (최소 공통 사항) |
| `git-workflow.mdc` | 전역 (Git 커밋·pull 규칙) |
| `back-workflow.mdc` | `back/**` |
| `front-workflow.mdc` | `front/**` |
| `md-documentation.mdc` | `md/**` |

## 작업 완료 시 필수 행동

### back 작업 시

1. `md/API/README.md` — 변경된 엔드포인트 반영
2. `md/jobs/back/` — 작업 내역 기록
3. 폴더 구조 변경 시 `md/folder.md` 갱신

### front 작업 시

1. `md/jobs/front/` — 작업 내역 기록 (사용 API 엔드포인트·변경 파일명 포함)
2. 폴더 구조 변경 시 `md/folder.md` 갱신

### python 작업 시

- `python/` 코드만 수정. jobs 기록 없음.

## 문서 SSOT

- API 명세: `md/API/README.md`
- 폴더 구조: `md/folder.md`
- 작업 내역: `md/jobs/back/`, `md/jobs/front/`

작업을 종료하기 전 위 문서 갱신 여부를 반드시 확인하세요.

## Git — Cursor 사용 시

상세 규칙: `.cursor/rules/git-workflow.mdc`

### 커밋 메시지 (필수)

```
[YYYY.MM.DD] - 작업내역
```

| 항목 | 규칙 |
|------|------|
| 날짜 | `[2026.09.02]` — 점(`.`) 구분 |
| 요약 | `-` 뒤 한국어 한 줄 (변경 내용) |
| 금지 | `feat:`, `fix:`, `Merge origin/main` 등 |

**예시**

```
[2026.09.02] - Merge 내역 일부 수정 및 pull 강제 로직 추가
[2026.09.01] - Stitch 디자인 JSX 변환 및 프론트 화면 적용
```

### pull · commit

- **pull**: 작업 시작 전 `git pull origin main` (위 「작업 시작 전」 참고)
- **commit**: 사용자가 요청했을 때만 실행. 메시지는 반드시 위 형식

