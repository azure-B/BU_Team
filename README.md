# BU_Team Project 🚀

본 프로젝트는 **React + Vite 기반의 Front-end**와 **Express MVC 기반의 Back-end**로 구성된 협업 웹 서비스 프로젝트입니다. 효율적인 작업과 일관된 결과물을 위해 컴포넌트 재사용성을 높이고 명확한 규칙을 기반으로 진행합니다.

---

## 📂 전체 프로젝트 구조

프로젝트는 명확한 역할 분담을 위해 크게 세 가지 폴더로 나뉩니다.

- **`Front/`** : 클라이언트 사이드 (React + Vite + Framer Motion)
- **`Back/`** : 서버 사이드 (Node.js + Express + MongoDB)
- **`md/`** : 프로젝트 전체의 문서, 명세, 작업 기록 (SSOT)

> 💡 파일이나 폴더 구조가 변경될 때는 항상 `md/folder.md` 문서를 최신화합니다.

---

## 🎨 Front-end 작업 방식

Front-end는 컴포넌트 기반으로 설계되어 UI의 재사용성과 유지보수성을 극대화합니다.

### 1. 컴포넌트 모듈화 및 자동 조립
- **`src/components/layout/`**: `Header`, `Footer` 등 모든 페이지에서 공통으로 쓰이는 레이아웃 컴포넌트들이 위치합니다.
- **`Layout.jsx`**: 페이지 진입 시 해당 Layout 래퍼(Wrapper)가 Header와 Footer를 **자동으로 감싸주어(조립하여)** 중복 코드를 방지합니다.
- **`src/components/common/`**: `Button`, `Card` 등 자주 쓰이는 범용 UI 컴포넌트들을 모아두고 재사용합니다.

### 2. 정적 파일 생성 (`publish/`)
- 개발이 완료된 후 `npm run build`를 실행하면, **`publish/`** 폴더에 배포용 정적 파일(HTML, CSS, JS)이 생성됩니다.
- 서버에 배포할 때는 이 `publish/` 폴더 내의 결과물을 사용합니다.

### 3. 실행 방법
```bash
cd Front
npm install
npm run dev     # 개발 서버 실행 (기본 3000포트)
npm run build   # publish/ 폴더에 정적 HTML 배포본 생성
```

---

## ⚙️ Back-end 작업 방식

Back-end는 명확한 로직 분리를 위해 **MVC 패턴**을 준수합니다.

### 1. 아키텍처 (라우트 → 컨트롤러 → 모델)
- **`routes/`**: 엔드포인트 URL과 컨트롤러를 매핑하는 역할만 수행합니다. (비즈니스 로직 ❌)
- **`controllers/`**: 클라이언트 요청을 받아 비즈니스 로직을 처리하고 응답(`utils/response.js`)을 반환합니다. 에러는 `next(error)`로 넘겨 전역 에러 핸들러가 일괄 처리합니다.
- **`models/`**: Mongoose 스키마를 정의하고 데이터베이스와 직접 통신합니다.

### 2. 실행 방법
```bash
cd Back
npm install
npm run dev     # nodemon을 활용한 개발 서버 실행 (기본 5000포트)
npm start       # 프로덕션 실행
```
*(실행 전 반드시 `Back/.env.example`을 참고하여 `.env` 파일을 생성하고 환경변수를 설정하세요.)*

---

## 📝 문서 작성 및 동기화 (SSOT)

문서의 파편화를 막기 위해 모든 핵심 내용은 `md/` 폴더를 기준으로 관리합니다.

- **API 명세**: `md/API/README.md` (API가 변경되면 즉시 업데이트)
- **폴더 구조**: `md/folder.md` (파일/폴더 변경 시 즉시 업데이트)
- **작업 내역 기록**: `md/jobs/front/`, `md/jobs/back/`에 날짜별로 작업한 내역과 사용한 API를 꼼꼼하게 기록합니다.

---

## 🔄 Git 및 연동 규칙

1. **Pull First**: 작업 시작 전 반드시 `git pull origin main`을 실행하여 원격 저장소와 동기화합니다.
2. **Commit Convention**: 커밋 메시지는 오직 `[YYYY.MM.DD] - 작업내역 한 줄 요약` 형식만 사용합니다. (예: `[2026.09.23] - 로그인 API 구현 및 문서화 업데이트`)
3. **Front & Back 연동 테스트**: 개발 서버 구동 시 Front의 Vite Proxy가 `/api` 요청을 Back-end(`localhost:5000`)로 자동 전달하므로 손쉽게 로컬 통합 테스트가 가능합니다.

---
> 상세한 에이전트(AI) 가이드 및 작업 규율은 최상위 폴더의 `AGENTS.md` 및 `.agents/rules/` 폴더를 참고하세요.
