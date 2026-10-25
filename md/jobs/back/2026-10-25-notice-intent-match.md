# [2026.10.25] 공지 의도 코드(4) + Notice DB 매칭

## 변경
- GPT 의도 분류에 `4` = 대회·모집·특강·인턴·학부/학교 공지
- `tryHandleNoticeIntent`: Notice 테이블에서 키워드·학부 태그 스코어링 후 자연어 안내 + 원문 링크
- 라우터 `route: notice`, 프론트 칩 클릭 시 바로 재질문

## 학부공지 크롤 (2026)
- 스크립트: `Back/scripts/crawl-dept-notices.mjs`
- JSON: `Back/supabase/dept-notices-2026.json` (첨단IT 55 + 컴공 20 = 75)
- 소스: [첨단IT 학부공지](https://community.bu.ac.kr/smartit/6301/subview.do), [컴퓨터공학부 학부공지](https://community.bu.ac.kr/info/1788/subview.do)

## 파일
- `Back/src/services/chat/llm.ts`
- `Back/src/services/chat/scheduleIntent.ts`
- `Back/src/services/chat/noticeIntent.ts`
- `Back/src/services/chat/router.ts`
- `Front/src/components/layout/Footer/Footer.jsx`
