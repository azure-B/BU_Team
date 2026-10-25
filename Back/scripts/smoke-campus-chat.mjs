const { looksLikeCampusCandidate, tryHandleCampusIntent } = await import('../src/services/chat/campusIntent.ts')

const qs = [
  '진리관',
  '진리관에서 본부동까지',
  '진리관에서 본부동 뛰어가면?',
  '진리관에서 본부동까지 비 오면?',
  '본부동 정보',
]

for (const q of qs) {
  console.log('\n===', q, 'cand=', looksLikeCampusCandidate(q))
  const r = await tryHandleCampusIntent({ question: q })
  console.log(r.badge)
  console.log(r.answer)
  console.log('choices:', r.choices)
}
