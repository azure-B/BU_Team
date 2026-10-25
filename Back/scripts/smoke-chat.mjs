import path from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'
import { createRequire } from 'module'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(__dirname, '../../.env') })

// tsx로 TS 라우터 로드
const require = createRequire(import.meta.url)

async function main() {
  const { register } = await import('node:module')
  // use dynamic import via tsx runtime: run with npx tsx
  const { routeChat } = await import('../src/services/chat/router.ts')
  const cases = [
    '곽노윤 교수님 전화번호가 궁금해',
    '곽노윤 교수님',
    '보건학부 사무실 어디야?',
    '기말고사 언제야?',
  ]
  for (const q of cases) {
    const r = await routeChat({ question: q, department: '컴퓨터공학부' })
    console.log(JSON.stringify({
      q,
      route: r.route,
      badge: r.badge,
      answer: String(r.answer).slice(0, 140),
      ms: r.latencyMs,
      model: r.model || null,
    }))
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
