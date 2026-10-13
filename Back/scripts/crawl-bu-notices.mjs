import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const outDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'supabase')
const listUrl = 'https://www.bu.ac.kr/web/3483/subview.do'
const postUrl = 'https://www.bu.ac.kr/mainNotice/web/artclList.do'
const headers = {
  'User-Agent': 'BU-Team-student-project/1.0',
  'Content-Type': 'application/x-www-form-urlencoded',
}

function decode(text) {
  return text
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function categoryOf(title) {
  if (/장학|등록금/.test(title)) return '학사/장학'
  if (/도서관|학술정보|열람/.test(title)) return '도서관'
  if (/취업|채용|인턴|대플|진로|자격증|잡페어|면접/.test(title)) return '취업/비교과'
  if (/수업|수강|휴학|복학|강의|졸업|폐강|시간표/.test(title)) return '학사'
  return '대학'
}

function sourceOf(title) {
  const match = title.match(/^\[([^\]]+)\]/)
  return match ? match[1] : '백석대학교'
}

function parseRows(html) {
  const rows = []
  const parts = html.split('<td class="_artclTdNum">').slice(1)
  for (const part of parts) {
    const id = part.match(/jf_viewArtcl\('web',\s*'(\d+)'\)/)?.[1]
    const titleRaw = part.match(/class="artclLinkView">([\s\S]*?)<\/a>/)?.[1]
    const date = part.match(/_artclTdRdate">(\d{4}\.\d{2}\.\d{2})/)?.[1]
    if (!id || !titleRaw || !date) continue
    const title = decode(titleRaw)
    if (!title) continue
    rows.push({
      id: `bu-${id}`,
      artclSeq: id,
      title,
      postedAt: date.replace(/\./g, '-') + 'T00:00:00+09:00',
      category: categoryOf(title),
      source: sourceOf(title),
      link: `https://www.bu.ac.kr/mainNotice/web/${id}/artclView.do`,
    })
  }
  return rows
}

function sqlString(value) {
  return `'${String(value).replace(/'/g, "''")}'`
}

const first = await fetch(listUrl, { headers: { 'User-Agent': headers['User-Agent'] } })
const firstHtml = await first.text()
const layout = firstHtml.match(/name="layout" value="([^"]+)"/)?.[1]
if (!layout) throw new Error('layout token missing')

const all = []
const seen = new Set()
let page = 1
while (page <= 40) {
  const html = page === 1
    ? firstHtml
    : await (async () => {
        const body = new URLSearchParams({ layout, page: String(page), srchColumn: '', srchWrd: '' })
        const res = await fetch(postUrl, { method: 'POST', headers, body })
        return res.text()
      })()
  const rows = parseRows(html)
  if (!rows.length) break
  let kept = 0
  for (const row of rows) {
    if (!row.postedAt.startsWith('2026-')) continue
    if (seen.has(row.id)) continue
    seen.add(row.id)
    all.push(row)
    kept += 1
  }
  const oldest = rows[rows.length - 1].postedAt
  console.error(`page ${page}: rows ${rows.length}, kept ${kept}, oldest ${oldest}`)
  if (!oldest.startsWith('2026-')) break
  page += 1
  await new Promise((resolve) => setTimeout(resolve, 400))
}

all.sort((a, b) => (a.postedAt < b.postedAt ? 1 : -1))
fs.writeFileSync(path.join(outDir, 'notices-2026.json'), JSON.stringify(all, null, 2), 'utf8')

const values = all.map((row) => `  (${[
  sqlString(row.id),
  sqlString(row.title),
  sqlString(`${row.source} 공지. 원문: ${row.link}`),
  sqlString(row.category),
  sqlString(row.source),
  sqlString(row.source),
  sqlString(row.link),
  sqlString(row.postedAt),
].join(', ')})`).join(',\n')

const sql = `-- 백석대 전체공지(https://www.bu.ac.kr/web/3483/subview.do) 2026년 목록
-- 제목, 작성일, 분류, 원문 링크만 저장한다.
ALTER TABLE "Notice" ADD COLUMN IF NOT EXISTS "source" TEXT;
ALTER TABLE "Notice" ADD COLUMN IF NOT EXISTS "link" TEXT;

DELETE FROM "NoticeBookmark";
DELETE FROM "Notice";

INSERT INTO "Notice" ("id", "title", "content", "category", "tags", "source", "link", "createdAt")
VALUES
${values};
`
fs.writeFileSync(path.join(outDir, 'notices-2026.sql'), sql, 'utf8')
console.error(`saved ${all.length}`)
