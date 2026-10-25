# [2026.10.25] 백석AI 비서 · 학사일정 정합

## 배경
RAG 지시 프롬프트·UI 추천 질문이 공식 [학사일정](https://www.bu.ac.kr/web/3443/subview.do)과 어긋남.
공식 일정에 **「중간고사 기간」 없음**(중간 강의평가·기말고사만 표기).

## 적용
- 추천 질문: `중간고사 공부 계획` → **`기말고사 언제야?`**
- `Front/src/data/academicCalendar.js` — 2026 공식 일정 시드 + 질의 응답
- 학사일정·기말·진리축전·중간고사 질문 시 로컬 안내(출처 URL 포함)
- RAG 지시 MD: 출결·수강신청·시스템 프롬프트·학사일정 시드를 2026 공식 기준으로 수정

## 2026-2 핵심 날짜
| 항목 | 기간 |
|------|------|
| 개강 | 9.1 |
| 중간 강의평가 | 9.28~10.2 |
| 진리축전 | 10.27~10.29 |
| 기말고사 | 12.15~12.21 |
| 종강 | 12.21 |

## 파일
- `Front/src/data/academicCalendar.js`
- `Front/src/components/layout/Footer/Footer.jsx`
- `Front/src/components/layout/Footer/Footer.css`
- `백석대학교 RAG 지식베이스 구축 — Cursor 지시 프롬프트 (1).md`
