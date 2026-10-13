# [2026.10.13] Supabase 테이블 생성 SQL

## 작업 개요
- Prisma 스키마에 있는 12개 테이블을 Supabase PostgreSQL용 SQL로 작성
- 로그인·시간표·과제·캠퍼스·공지·요약 테스트용 더미 데이터 포함

## 변경 파일
| 파일 | 변경 내용 |
|------|-----------|
| `Back/supabase/schema.sql` | 테이블 생성, RLS, 더미 데이터 |
| `md/folder.md` | SQL 파일 경로 반영 |

## 실행
Supabase SQL Editor에서 `Back/supabase/schema.sql` 전체를 실행한다. `.env`에는 데이터베이스 비밀번호가 없어 이 환경에서 DDL을 원격 실행하지 못했다.

테스트 계정: 학번 `20221001` / 비밀번호 `password123` / 유저 id `mocked_user_id`
