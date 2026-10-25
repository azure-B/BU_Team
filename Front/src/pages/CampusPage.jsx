import { MapPin, ForkKnife, Coffee, Books, PersonSimpleWalk } from '@phosphor-icons/react'
import Layout from '../components/layout/Layout'
import SectionCard from '../components/common/SectionCard'
import {
  CAMPUS_ACTIVITIES,
  CAMPUS_SPOTS,
  STUDY_LOUNGES,
} from '../data/campusSpots'
import './CampusPage.css'

function SpotList({ title, icon: Icon, items }) {
  if (!items?.length) return null
  return (
    <SectionCard className="campus-section">
      <div className="campus-section__head">
        <Icon size={20} weight="fill" aria-hidden="true" />
        <h2>{title}</h2>
      </div>
      <ul className="campus-spot-list">
        {items.map((spot) => (
          <li key={spot.id} className="campus-spot">
            <strong>{spot.name}</strong>
            {spot.blurb && <span>{spot.blurb}</span>}
          </li>
        ))}
      </ul>
    </SectionCard>
  )
}

export default function CampusPage() {
  const cafeterias = CAMPUS_SPOTS.filter((s) => s.type === 'cafeteria')
  const cafes = CAMPUS_SPOTS.filter((s) => s.type === 'cafe')

  return (
    <Layout>
      <div className="campus-page">
        <header className="campus-page__header">
          <h1>캠퍼스</h1>
          <p>학식·카페·학습 공간과 활동을 한곳에서 봐요.</p>
        </header>

        <SectionCard className="campus-section campus-section--tip">
          <div className="campus-section__head">
            <PersonSimpleWalk size={20} weight="fill" aria-hidden="true" />
            <h2>이동·셔틀</h2>
          </div>
          <p className="campus-tip">
            AI 비서에 「진리관에서 본부동까지」, 「두정역 다음 셔틀」, 「1교시 본부동이면 몇 시 셔틀」처럼 물어보면
            도보·엘리베이터·통학버스 시드로 안내해요.
          </p>
        </SectionCard>

        <SpotList title="학식·구내식당" icon={ForkKnife} items={cafeterias} />
        <SpotList title="카페" icon={Coffee} items={cafes} />
        <SpotList title="학습 공간" icon={Books} items={STUDY_LOUNGES} />
        <SpotList title="캠퍼스 활동" icon={MapPin} items={CAMPUS_ACTIVITIES} />
      </div>
    </Layout>
  )
}
