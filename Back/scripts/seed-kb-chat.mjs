/**
 * 채팅 KB 시드 → Supabase
 * 사전: Back/supabase/kb_chat.sql 을 SQL Editor에서 실행
 * 사용: cd Back && npx tsx scripts/seed-kb-chat.mjs
 */
import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const envText = readFileSync(resolve(root, '.env'), 'utf8')
const env = Object.fromEntries(
  envText
    .split(/\r?\n/)
    .filter((line) => line && !line.trimStart().startsWith('#') && line.includes('='))
    .map((line) => {
      const i = line.indexOf('=')
      return [line.slice(0, i).trim(), line.slice(i + 1).trim()]
    }),
)

const URL = env.SUPABASE_URL
const KEY = env.SUPABASE_SERVICE_ROLE_KEY
if (!URL || !KEY) {
  console.error('SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY 필요')
  process.exit(1)
}

const headers = {
  apikey: KEY,
  Authorization: `Bearer ${KEY}`,
  'Content-Type': 'application/json',
  Prefer: 'resolution=merge-duplicates,return=minimal',
}

async function upsert(table, rows, onConflict) {
  const res = await fetch(
    `${URL}/rest/v1/${table}?on_conflict=${encodeURIComponent(onConflict)}`,
    { method: 'POST', headers, body: JSON.stringify(rows) },
  )
  const text = await res.text()
  if (!res.ok) throw new Error(`${table} upsert ${res.status} ${text}`)
  console.log(`${table}: ${rows.length} rows`)
}

const { DEPARTMENT_OFFICES } = await import('../src/data/departmentOffices.ts')
const { PROFESSORS } = await import('../src/data/professors.ts')
const { FAQ_SEEDS, GLOSSARY } = await import('../src/data/faqSeeds.ts')

await upsert(
  'department_offices',
  DEPARTMENT_OFFICES.map((o) => ({
    department: o.department,
    aliases: o.aliases || [],
    building: o.building,
    room: o.room,
    phones: o.phones || [],
    source_url: o.source_url,
    needs_review: true,
    review_note: o.review_note || null,
  })),
  'department',
)

await upsert(
  'professors',
  PROFESSORS.map((p) => ({
    name: p.name,
    aliases: p.aliases || [],
    department: p.department,
    phone: p.phone || null,
    email: p.email || null,
    source_url: p.source_url,
  })),
  'name,department',
)

await upsert(
  'kb_faq',
  FAQ_SEEDS.map((f) => ({
    id: f.id,
    title: f.title,
    keywords: f.keywords || [],
    required_any: f.required_any || [],
    slots: f.slots || [],
    answer_template: f.answer_template,
    source_url: f.source_url,
    priority: f.priority ?? 0,
    academic_year: f.academic_year ?? null,
    needs_review: Boolean(f.review_note),
    review_note: f.review_note || null,
  })),
  'id',
)

await upsert(
  'kb_glossary',
  GLOSSARY.map((g) => ({
    term: g.term,
    official: g.official,
    category: null,
    note: null,
  })),
  'term',
)

console.log('KB seed done')
