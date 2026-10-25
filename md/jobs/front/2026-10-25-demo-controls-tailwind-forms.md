# [2026.10.25] 데모 인풋 로컬≠배포 CSS 원인

## 원인
- `index.html` Tailwind CDN에 `plugins=forms` 포함
- **forms**가 전역 `input[type=time]` / `select` / `button` 스타일을 주입
- 로컬(Vite HMR): 모듈 CSS가 늦게 붙어 DemoControls가 이기는 경우 많음
- 배포(Netlify): 번들 CSS `<link>` 후 CDN 스크립트가 실행 → **forms가 DemoControls를 덮음**
  → 테두리·높이·너비·appearance가 달라 보이거나 「오후 12:3」처럼 잘림

## 수정
- CDN을 `plugins=container-queries`만 사용 (로그인 페이지는 utility class로 이미 스타일)
- `.demo-controls …` 스코프 + `appearance` 리셋으로 인풋/셀렉트/칩 고정

## 파일
- `Front/index.html`
- `Front/src/components/dashboard/DemoControls.css`
