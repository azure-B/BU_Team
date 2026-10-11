# [2026.10.11] 우측 상단 알림 패널 기능 구현

## 작업 개요
`Front/designs/alarm.html` (Stitch 디자인 참고) 기반으로, 기존 Header 컴포넌트의 벨 버튼에 실제 알림 패널 기능을 연결함.

## 변경 파일

| 파일 | 변경 종류 |
|---|---|
| `Front/src/components/layout/Header/Header.jsx` | 수정 |
| `Front/src/components/layout/Header/Header.css` | 수정 |
| `Front/src/components/layout/Header/NotificationPanel.jsx` | 신규 생성 |
| `Front/src/components/layout/Header/NotificationPanel.css` | 신규 생성 |

## 구현 내용

### NotificationPanel.jsx
- 테스트용 알림 데이터 4건 (추천, 마감, 수업, 공지)
- 알림 타입별 아이콘 (별/시계/번개/문서)
- 패널 열기/닫기 애니메이션 (opacity + scale + translateY)
- 딤 백드롭 (클릭 시 패널 닫힘)
- 개별 알림 클릭 → 읽음 처리 (빨간 dot 제거, 글자색 변경)
- "모두 읽음" 버튼 (읽지 않은 알림이 있을 때만 노출)
- 외부 클릭 시 자동 닫힘 (벨 버튼 제외)
- `onUnreadCountChange` props로 상위 Header에 미읽은 수 전달

### Header.jsx
- `panelOpen` state로 패널 토글 제어
- `unreadCount` state 수신하여 벨 버튼에 빨간 배지 렌더링
- 패널 열림 시 벨 버튼 active 스타일 전환
- `aria-expanded`, `aria-label` 접근성 적용

### Header.css
- `.icon-button` → `position: relative` 추가 (배지 위치 기준)
- `.icon-button--active` → 패널 열림 시 강조 스타일
- `.notif-badge` → 읽지 않은 수 배지 (pop 애니메이션 포함)

## 사용 API 엔드포인트
- 없음 (백엔드 미연결, 테스트 데이터로 동작)
- 추후 실제 API 연동 시 `NotificationPanel.jsx` 내 `MOCK_NOTIFICATIONS` 배열을 `fetch` 결과로 교체

## 기존 구조 유지
- 라우팅, 페이지, Layout 컴포넌트 변경 없음
- 기존 Header 디자인/브랜드/로고 로직 유지
