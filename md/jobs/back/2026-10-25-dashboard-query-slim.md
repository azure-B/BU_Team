# [2026.10.25] 대시보드·공지 쿼리 슬림

## 변경
- `GET /dashboard/today`: Notice 미조회 (홈에서 공지 섹션 없음)
- Schedule/Building select 컬럼 축소
- Notice list: exact count 제거, limit 상한 50
- 챗봇 공지 검색 최근 80건만

## 통신
- Front는 동일 GET을 카드마다 치던 것을 캐시로 합침 → Render 왕복 감소
