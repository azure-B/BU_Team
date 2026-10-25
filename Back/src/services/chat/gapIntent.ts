export type GapIntentResult = {
  handled: boolean
  answer?: string
  badge?: string
  sourceUrl?: string | null
  choices?: string[]
}

const GAP_HINT_RE =
  /다음\s*수업\s*전|공강|틈새|뭐\s*하지|뭐하지|뭐\s*할까|뭐할까|비는\s*시간|빈\s*시간|사이\s*시간|수업\s*사이|남는\s*시간/

export function looksLikeGapCandidate(question: string) {
  const q = String(question || '')
  if (/등록|넣어|추가|잡아|스케줄\s*잡|일정\s*잡/.test(q) && !/공강|뭐\s*하|틈새/.test(q)) {
    return false
  }
  return GAP_HINT_RE.test(q)
}

export async function tryHandleGapIntent(_input: {
  question: string
  now?: Date
}): Promise<GapIntentResult> {
  if (!looksLikeGapCandidate(_input.question)) return { handled: false }

  return {
    handled: true,
    badge: '공강 추천',
    answer:
      '다음 수업 전 틈새는 홈 화면 「다음 수업 전 추천」에서 '
      + '밥·과제·사이버강의·캠퍼스 활동을 시간표·이동 시간 기준으로 바로 볼 수 있어요.\n\n'
      + '홈으로 가서 카드를 확인해 보거나, 아래에서 관심 주제를 골라 주세요.',
    choices: [
      '학식 어디 갈까',
      '과제 남은 거 있어?',
      '진리관에서 본부동까지 얼마나 걸려',
    ],
  }
}
