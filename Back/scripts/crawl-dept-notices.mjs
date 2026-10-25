/**
 * 학부공지 크롤 (2026) → JSON + optional Supabase Notice upsert
 *
 * 소스:
 *  - 첨단IT학부: https://community.bu.ac.kr/smartit/6301/subview.do
 *  - 컴퓨터공학부: https://community.bu.ac.kr/info/1788/subview.do
 *
 * 사용: node Back/scripts/crawl-dept-notices.mjs
 * env: SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY (또는 SUPABASE_ANON_KEY)
 *      프로젝트 루트 .env 또는 Back/.env
 */
import { createHash } from 'node:crypto'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '../..')
const outJson = resolve(root, 'Back/supabase/dept-notices-2026.json')
const BASE = 'https://community.bu.ac.kr'
const TARGET_YEAR = '2026'
const CATEGORY = '학부공지'

const BOARDS = [
  {
    source: '첨단IT학부',
    subview: `${BASE}/smartit/6301/subview.do`,
    listPathHint: '/bbs/smartit/',
  },
  {
    source: '컴퓨터공학부',
    subview: `${BASE}/info/1788/subview.do`,
    listPathHint: '/bbs/info/',
  },
]

function loadEnvFiles() {
  const env = {}
  for (const p of [resolve(root, '.env'), resolve(root, 'Back/.env')]) {
    let text
    try {
      text = readFileSync(p, 'utf8')
    } catch {
      continue
    }
    if (text.charCodeAt(0) === 0xfeff) text = text.slice(1)
    for (const line of text.split(/\r?\n/)) {
      if (!line || line.trimStart().startsWith('#') || !line.includes('=')) continue
      const i = line.indexOf('=')
      const k = line.slice(0, i).trim()
      let v = line.slice(i + 1).trim()
      if (
        (v.startsWith('"') && v.endsWith('"')) ||
        (v.startsWith("'") && v.endsWith("'"))
      ) {
        v = v.slice(1, -1)
      }
      if (k && env[k] === undefined) env[k] = v
    }
  }
  return env
}

const env = loadEnvFiles()
const SUPABASE_URL = (env.SUPABASE_URL || '').trim()
const SUPABASE_KEY = (
  env.SUPABASE_SERVICE_ROLE_KEY ||
  env.SUPABASE_ANON_KEY ||
  env.SUPABASE_KEY ||
  ''
).trim()

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

async function fetchHtml(url, opts = {}) {
  const res = await fetch(url, {
    ...opts,
    headers: {
      'User-Agent':
        'Mozilla/5.0 (compatible; BU-CaptainNoticeBot/1.0; +campus-demo)',
      Accept: 'text/html,application/xhtml+xml',
      ...(opts.headers || {}),
    },
  })
  if (!res.ok) throw new Error(`HTTP ${res.status} ${url}`)
  return res.text()
}

function decodeBasicEntities(s) {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
}

function stripTags(s) {
  return decodeBasicEntities(s.replace(/<[^>]+>/g, '')).replace(/\s+/g, ' ').trim()
}

/** @returns {{ listAction: string, layout: string, totPage: number }} */
function discoverListMeta(html, listPathHint) {
  const action =
    html.match(
      new RegExp(`action="(${listPathHint.replace(/\//g, '\\/')}\\d+/artclList\\.do)"`),
    )?.[1] ||
    html.match(/action="(\/bbs\/[^"]+\/artclList\.do)"/)?.[1]
  if (!action) throw new Error(`artclList action not found (hint ${listPathHint})`)

  const layout =
    html.match(/name="layout"\s+value="([^"]*)"/)?.[1] ??
    html.match(/name='layout'\s+value='([^']*)'/)?.[1] ??
    ''

  const totPage = Number(html.match(/_totPage">(\d+)/)?.[1] || '1') || 1
  return { listAction: action, layout, totPage }
}

function parseListRows(html) {
  const rows = [...html.matchAll(/<tr class="[^"]*">([\s\S]*?)<\/tr>/g)]
  return rows
    .map((m) => {
      const body = m[1]
      const href = body.match(/href="([^"]*artclView\.do)"/)?.[1]
      if (!href) return null

      const aHtml =
        body.match(/<a[^>]*class="artclLinkView"[^>]*>([\s\S]*?)<\/a>/)?.[1] ?? ''
      const spans = [...aHtml.matchAll(/<span[^>]*>([\s\S]*?)<\/span>/g)].map((s) =>
        stripTags(s[1]),
      )
      // 카테고리 칩 "일반공지" 제외 후 실제 제목 span
      const title =
        spans.filter((t) => t && t !== '일반공지').at(-1) ||
        stripTags(aHtml).replace(/^\[\s*일반공지\s*\]\s*/, '') ||
        ''

      const author = stripTags(
        body.match(/_artclTdWriter">([\s\S]*?)<\/td>/)?.[1] ?? '',
      )
      const dateRaw = body.match(/_artclTdRdate">([^<]+)</)?.[1]?.trim() ?? ''
      const pinned = /_artclNotice/.test(body)
      return { href, title, author, dateRaw, pinned }
    })
    .filter(Boolean)
}

function toIsoDate(dateRaw) {
  // 2026.10.14 or 2026-10-14
  const m = dateRaw.match(/(\d{4})[.\-/](\d{1,2})[.\-/](\d{1,2})/)
  if (!m) return null
  const y = m[1]
  const mo = m[2].padStart(2, '0')
  const d = m[3].padStart(2, '0')
  return `${y}-${mo}-${d}`
}

function absoluteLink(href) {
  if (href.startsWith('http')) return href
  return `${BASE}${href.startsWith('/') ? '' : '/'}${href}`
}

function noticeId(link) {
  const h = createHash('sha1').update(link).digest('hex').slice(0, 16)
  return `dept-${h}`
}

async function crawlBoard(board) {
  console.log(`\n▶ ${board.source}`)
  const firstHtml = await fetchHtml(board.subview)
  const meta = discoverListMeta(firstHtml, board.listPathHint)
  const listUrl = `${BASE}${meta.listAction}`
  console.log(`  list: ${meta.listAction}  totPage≈${meta.totPage}`)

  /** @type {Map<string, object>} */
  const byLink = new Map()
  let page = 1
  let stop = false
  let emptyStreak = 0

  while (!stop && page <= Math.max(meta.totPage, 1) + 2) {
    let html
    if (page === 1) {
      html = firstHtml
    } else {
      await sleep(200)
      html = await fetchHtml(listUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          layout: meta.layout,
          page: String(page),
        }),
      })
    }

    const rows = parseListRows(html)
    if (rows.length === 0) {
      emptyStreak += 1
      console.log(`  page ${page}: empty`)
      if (emptyStreak >= 2) break
      page += 1
      continue
    }
    emptyStreak = 0

    let year2026 = 0
    let year2026NonPinned = 0
    let olderNonPinned = 0
    let kept = 0

    for (const row of rows) {
      const date = toIsoDate(row.dateRaw)
      const year = date?.slice(0, 4)
      const link = absoluteLink(row.href)

      if (year === TARGET_YEAR) {
        year2026 += 1
        if (!row.pinned) year2026NonPinned += 1
        // 고정 일반공지도 날짜가 2026이면 유지, 과거 연도 고정글은 스킵
        if (!byLink.has(link)) {
          byLink.set(link, {
            title: row.title,
            date,
            author: row.author,
            category: CATEGORY,
            source: board.source,
            link,
            pinned: row.pinned,
          })
          kept += 1
        }
      } else if (year && year < TARGET_YEAR) {
        // 상단 고정(일반공지) 과거 연도는 스킵만, 본문 목록이 과거면 페이징 종료
        if (!row.pinned) olderNonPinned += 1
      }
    }

    console.log(
      `  page ${page}: rows=${rows.length} y2026=${year2026} (nonPinned=${year2026NonPinned}) kept+=${kept} olderNonPinned=${olderNonPinned}`,
    )

    // 고정글은 매 페이지 반복되므로, 비고정 목록이 전부 과거 연도면 종료
    if (olderNonPinned > 0 && year2026NonPinned === 0) {
      stop = true
      break
    }
    if (page >= meta.totPage) break
    page += 1
  }

  const list = [...byLink.values()].sort((a, b) => (a.date < b.date ? 1 : -1))
  console.log(`  → ${list.length} unique 2026 posts`)
  return list
}

function toNoticeRow(item) {
  const createdAt = `${item.date}T00:00:00.000Z`
  const content = item.link
  return {
    id: noticeId(item.link),
    title: item.title,
    content,
    category: item.category,
    tags: item.source,
    createdAt,
  }
}

async function supabaseHeaders() {
  return {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
    'Content-Type': 'application/json',
  }
}

async function fetchExistingNotices() {
  const headers = await supabaseHeaders()
  const existing = new Set()
  let offset = 0
  const pageSize = 1000
  while (true) {
    const url = `${SUPABASE_URL}/rest/v1/Notice?select=id,title,content,tags&offset=${offset}&limit=${pageSize}`
    const res = await fetch(url, { headers })
    const text = await res.text()
    if (!res.ok) throw new Error(`Notice select ${res.status} ${text}`)
    const rows = JSON.parse(text)
    for (const row of rows) {
      const link = String(row.content ?? '').match(/https?:\/\/\S+/)?.[0] ?? ''
      if (row.title && link) existing.add(`${row.title}||${link}`)
      if (row.id) existing.add(`id:${row.id}`)
    }
    if (rows.length < pageSize) break
    offset += pageSize
  }
  return existing
}

async function upsertNotices(rows) {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return { skipped: true, reason: 'SUPABASE_URL / KEY missing' }
  }

  // Probe columns: app uses content+tags; schema may also have source/link
  const headers = await supabaseHeaders()
  const probe = await fetch(`${SUPABASE_URL}/rest/v1/Notice?select=*&limit=1`, {
    headers,
  })
  const probeText = await probe.text()
  if (!probe.ok) throw new Error(`Notice probe ${probe.status} ${probeText}`)
  const sample = JSON.parse(probeText)[0] || null
  const cols = sample ? new Set(Object.keys(sample)) : null
  console.log(
    'Notice columns:',
    cols ? [...cols].join(', ') : '(empty table — assuming id,title,content,category,tags,createdAt)',
  )

  const existing = await fetchExistingNotices()
  const fresh = []
  for (const row of rows) {
    const key = `${row.title}||${String(row.content).match(/https?:\/\/\S+/)?.[0] ?? row.content}`
    if (existing.has(key) || existing.has(`id:${row.id}`)) continue
    fresh.push(row)
  }
  console.log(`DB: existing keys≈${existing.size / 2 | 0}, to insert=${fresh.length}, skip=${rows.length - fresh.length}`)

  if (fresh.length === 0) return { skipped: false, inserted: 0, skippedDup: rows.length }

  // Prefer upsert on id (deterministic from link)
  const prefer = { ...headers, Prefer: 'resolution=merge-duplicates,return=minimal' }
  const chunkSize = 50
  let inserted = 0
  for (let i = 0; i < fresh.length; i += chunkSize) {
    const chunk = fresh.slice(i, i + chunkSize)
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/Notice?on_conflict=id`,
      { method: 'POST', headers: prefer, body: JSON.stringify(chunk) },
    )
    const text = await res.text()
    if (!res.ok) {
      // fallback: plain insert without on_conflict
      const res2 = await fetch(`${SUPABASE_URL}/rest/v1/Notice`, {
        method: 'POST',
        headers: { ...headers, Prefer: 'return=minimal' },
        body: JSON.stringify(chunk),
      })
      const text2 = await res2.text()
      if (!res2.ok) {
        throw new Error(`Notice insert failed ${res.status} ${text} | fallback ${res2.status} ${text2}`)
      }
    }
    inserted += chunk.length
  }
  return { skipped: false, inserted, skippedDup: rows.length - fresh.length }
}

async function main() {
  const all = []
  const counts = {}
  for (const board of BOARDS) {
    const items = await crawlBoard(board)
    counts[board.source] = items.length
    all.push(...items)
  }

  // global dedupe by link
  const deduped = [...new Map(all.map((x) => [x.link, x])).values()].sort((a, b) =>
    a.date < b.date ? 1 : a.date > b.date ? -1 : 0,
  )

  mkdirSync(dirname(outJson), { recursive: true })
  writeFileSync(
    outJson,
    JSON.stringify(
      {
        crawledAt: new Date().toISOString(),
        targetYear: TARGET_YEAR,
        counts,
        total: deduped.length,
        notices: deduped,
      },
      null,
      2,
    ),
    'utf8',
  )
  console.log(`\nWrote ${outJson} (${deduped.length} notices)`)
  console.log('Counts:', counts)

  const noticeRows = deduped.map(toNoticeRow)
  try {
    const result = await upsertNotices(noticeRows)
    console.log('DB result:', result)
  } catch (err) {
    console.error('DB upsert error:', err.message || err)
    process.exitCode = 2
  }
}

await main()
