import path from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(__dirname, '../../.env') })

const key = process.env.OPENAI_API_KEY?.trim()
const res = await fetch('https://api.openai.com/v1/responses', {
  method: 'POST',
  headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({
    model: process.env.OPENAI_MODEL || 'gpt-5-mini',
    instructions: 'Answer briefly in Korean using only the evidence.',
    input: '[근거]\n성적우수장학금: 직전 학기 15학점 이상(4학년 12학점 이상).\n\n질문: 성적장학금 받으려면 몇 학점 들어야 해?',
    max_output_tokens: 800,
  }),
})
const json = await res.json()
const types = (json.output || []).map((p) => ({ type: p.type, status: p.status, keys: Object.keys(p) }))
let text = json.output_text || ''
for (const p of json.output || []) {
  if (p.type === 'message') {
    for (const c of p.content || []) {
      if (c.type === 'output_text' || c.type === 'text') text += c.text || c.value || ''
    }
  }
}
console.log(JSON.stringify({
  status: res.status,
  ok: res.ok,
  error: json.error,
  usage: json.usage,
  incomplete: json.incomplete_details,
  output_types: types,
  text: String(text).slice(0, 300),
}, null, 2))
