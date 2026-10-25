-- 백석AI 비서 로컬 지식 (FAQ / 학부사무실 / 교원)
-- Supabase SQL Editor에서 실행 후: npm run kb:seed (Back)

create table if not exists department_offices (
  department   text primary key,
  aliases      text[] not null default '{}',
  building     text not null,
  room         text not null,
  phones       text[] not null default '{}',
  source_url   text not null,
  needs_review boolean default true,
  review_note  text
);

create table if not exists professors (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  aliases      text[] not null default '{}',
  department   text not null,
  phone        text,
  email        text,
  source_url   text not null,
  unique (name, department)
);

create index if not exists professors_department_idx on professors (department);
create index if not exists professors_name_idx on professors (name);

create table if not exists kb_faq (
  id               text primary key,
  title            text not null,
  keywords         text[] not null default '{}',
  required_any     jsonb not null default '[]',
  slots            text[] not null default '{}',
  answer_template  text not null,
  source_url       text not null,
  priority         int default 0,
  academic_year    int,
  needs_review     boolean default true,
  review_note      text
);

create table if not exists kb_glossary (
  term     text primary key,
  official text not null,
  category text,
  note     text
);
