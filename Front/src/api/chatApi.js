import api from './index'

/**
 * 백석AI 비서 — FAQ 우선, 어려우면 GPT
 * @param {{ question: string, department?: string, forceLlm?: boolean }} payload
 */
export const postChat = async ({ question, department, forceLlm = false } = {}) => {
  const res = await api.post('/chat', { question, department, forceLlm })
  return res.data
}
