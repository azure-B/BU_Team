import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import Layout from '../components/layout/Layout'
import SectionCard from '../components/common/SectionCard'
import {
  avgLatencyMs,
  estimatedCostKrw,
  llmFreePercent,
  readChatStats,
} from '../utils/chatStats'
import './ChatStatsPage.css'

const ROUTE_LABEL = {
  faq: 'FAQ 즉시응답',
  faq_clarify: 'FAQ 확인질문',
  engine: '학사일정 엔진',
  campus: '캠퍼스',
  shuttle: '셔틀',
  gap: '공강 추천',
  notice: '공지 검색',
  schedule: '일정',
  rag_llm: 'GPT(LLM)',
  no_source: '근거 없음',
}

export default function ChatStatsPage() {
  const stats = useMemo(() => readChatStats(), [])
  const freePct = llmFreePercent(stats)
  const avgMs = avgLatencyMs(stats)
  const cost = estimatedCostKrw(stats)
  const routes = Object.entries(stats.byRoute || {}).sort((a, b) => b[1] - a[1])

  return (
    <Layout>
      <div className="chat-stats-page">
        <header className="chat-stats-page__header">
          <h1>비서 처리 통계</h1>
          <p>질문이 어떤 경로로 처리됐는지 비율·응답 시간·추정 비용을 보여요.</p>
        </header>

        <SectionCard className="chat-stats-card">
          <div className="chat-stats-grid">
            <div>
              <strong>{freePct}%</strong>
              <span>LLM 없이 처리</span>
            </div>
            <div>
              <strong>{stats.total}</strong>
              <span>총 질문</span>
            </div>
            <div>
              <strong>{avgMs == null ? '—' : `${avgMs}ms`}</strong>
              <span>평균 응답</span>
            </div>
            <div>
              <strong>₩{cost}</strong>
              <span>LLM 추정 비용</span>
            </div>
          </div>
          <p className="chat-stats-note">
            FAQ·캠퍼스·셔틀·공지·일정 등 규칙 엔진이 GPT 호출 없이 답한 비율입니다.
            비용은 데모용 대략치(호출당 ₩5)예요.
          </p>
        </SectionCard>

        <SectionCard className="chat-stats-card">
          <h2>경로별 건수</h2>
          {routes.length === 0 ? (
            <p className="chat-stats-empty">아직 기록이 없어요. AI 비서에 질문을 남겨 보세요.</p>
          ) : (
            <ul className="chat-stats-routes">
              {routes.map(([route, count]) => (
                <li key={route}>
                  <span>{ROUTE_LABEL[route] || route}</span>
                  <strong>{count}</strong>
                  <em>{stats.total ? Math.round((count / stats.total) * 100) : 0}%</em>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        <p className="chat-stats-back">
          <Link to="/mypage">← MY로 돌아가기</Link>
        </p>
      </div>
    </Layout>
  )
}
