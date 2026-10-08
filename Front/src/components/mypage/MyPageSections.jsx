import {
  CalendarPlus,
  CaretRight,
  Folder,
  ListChecks,
  PencilSimpleLine,
} from '@phosphor-icons/react'
import SectionCard from '../common/SectionCard'
import './MyPageSections.css'

const ACTIVITIES = [
  {
    icon: CalendarPlus,
    title: '시간표 직접 등록 및 수정',
    desc: '이번 학기 6개 과목 수동 입력 완료',
    badge: '직접 관리',
  },
  {
    icon: ListChecks,
    title: '수강 과목 및 과제 관리',
    desc: '진행 중인 과제 3개 · 수동 체크리스트',
    badge: '14건',
  },
]

export function ActivityArchiveCard() {
  return (
    <SectionCard className="mypage-card">
      <div className="mypage-section-head">
        <div className="mypage-section-head__title">
          <span className="mypage-section-head__icon">
            <Folder size={16} weight="fill" aria-hidden="true" />
          </span>
          <h3>나의 활동 및 보관함</h3>
        </div>
        <button type="button" className="mypage-text-action">
          <span>전체보기</span>
          <CaretRight size={14} weight="bold" aria-hidden="true" />
        </button>
      </div>

      <div className="activity-list">
        {ACTIVITIES.map((act) => {
          const Icon = act.icon
          return (
            <button className="activity-item" type="button" key={act.title}>
              <div className="activity-item__left">
                <span className="activity-item__icon">
                  <Icon size={18} weight="fill" aria-hidden="true" />
                </span>
                <div className="activity-item__text">
                  <p className="activity-item__title">{act.title}</p>
                  <span className="activity-item__desc">{act.desc}</span>
                </div>
              </div>

              <div className="activity-item__right">
                <span className="mypage-badge mypage-badge--semester">{act.badge}</span>
                <CaretRight size={15} weight="bold" className="activity-item__arrow" aria-hidden="true" />
              </div>
            </button>
          )
        })}
      </div>
    </SectionCard>
  )
}

export function IntegrationUtilityCard() {
  return (
    <SectionCard className="mypage-card">
      <div className="direct-manage-banner">
        <div className="direct-manage-banner__body">
          <div className="direct-manage-banner__left">
            <span className="direct-manage-banner__icon">
              <PencilSimpleLine size={16} weight="bold" aria-hidden="true" />
            </span>
            <div className="direct-manage-banner__text">
              <p className="direct-manage-banner__title">내 학사 정보 직접 입력 및 관리</p>
              <p className="direct-manage-banner__desc">시간표 및 과제 직접 등록됨 (직접 입력 모드)</p>
            </div>
          </div>
          <button type="button" className="direct-manage-banner__btn">
            <span>정보 수정</span>
            <CaretRight size={13} weight="bold" aria-hidden="true" />
          </button>
        </div>

        <div className="direct-manage-banner__footer">
          <span>* 학교 포털 연동 없이 기기에 안전하게 직접 저장됩니다</span>
          <strong>최근 수정 14:02</strong>
        </div>
      </div>
    </SectionCard>
  )
}
