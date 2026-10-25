# [2026.10.25] 교원 전화·이메일 FAQ (다학부 검색)

## 문제
「곽노윤 교수님 전화번호」가 컴공 학부사무실로 오답. 첨단IT 등 타 학부 미등록.

## 수정
- `professors.ts` 시드 학부
  - 컴퓨터공학부 — community.bu.ac.kr/info/1768
  - 첨단IT학부 — bu.ac.kr/smartit/6309
  - 관광학부 — community.bu.ac.kr/web/3642
  - 디자인영상학부 — community.bu.ac.kr/web/3654
  - 안경광학과 — bu.ac.kr/opt/1884
- 검색: 성함 / 학부 목록(`첨단IT 교수님 목록`) / 동명 선택
- 라우터: 교수 질의 ↔ 학부사무실 분리

## 파일
- `Back/src/data/professors.ts`
- `Back/src/services/chat/router.ts`
- `Front/src/components/layout/Footer/Footer.jsx`
