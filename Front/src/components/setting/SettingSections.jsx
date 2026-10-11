import {
  Bell,
  CaretRight,
  ChatCircleDots,
  IdentificationCard,
  NavigationArrow,
  ShieldCheck,
} from '@phosphor-icons/react'
import { useRef, useState } from 'react'
import SectionCard from '../common/SectionCard'
import './SettingSections.css'

const PROFILE_AVATAR =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuC7bq76F-IIQaZYUY_LwRfTT1W2ZGsFo7RTz-bWTsLD_dit8j15K9_GTK06hVhaBububojMzrdVnugQTlbeM7IWlmT2XrsFvyeA_H9N8LVaxMkjCcu0Jtcj2jazG3btt75lV4jg0a_QQK1_WPHexjTKohS6lwzk1jXKzTqUBjAUQr0OMincgu6kCv4K3mSxqVqAZzYDuUmaucu725bSz7Lva7DOZlmVA63jOqLnYIj7x7V9LYroa890mA'

const PROFILE_STORAGE_KEY = 'baekseok.profile.v1'
const DEFAULT_PROFILE = { department: '컴퓨터공학부 (소프트웨어학)', grade: '3', studentId: '20221340', avatar: PROFILE_AVATAR }

function readProfile() {
  try {
    const saved = JSON.parse(window.localStorage.getItem(PROFILE_STORAGE_KEY) || 'null')
    if (!saved || typeof saved !== 'object') return DEFAULT_PROFILE
    return {
      department: typeof saved.department === 'string' ? saved.department : DEFAULT_PROFILE.department,
      grade: /^[1-6]$/.test(String(saved.grade)) ? String(saved.grade) : DEFAULT_PROFILE.grade,
      studentId: /^\d{6,12}$/.test(saved.studentId) ? saved.studentId : DEFAULT_PROFILE.studentId,
      avatar: typeof saved.avatar === 'string' && saved.avatar.startsWith('data:image/jpeg;base64,') && saved.avatar.length <= 250_000 ? saved.avatar : DEFAULT_PROFILE.avatar,
    }
  } catch {
    return DEFAULT_PROFILE
  }
}

function resizeProfileImage(file) {
  return createImageBitmap(file).then((bitmap) => {
    const side = Math.min(bitmap.width, bitmap.height)
    const canvas = document.createElement('canvas')
    canvas.width = 256
    canvas.height = 256
    canvas.getContext('2d').drawImage(bitmap, (bitmap.width - side) / 2, (bitmap.height - side) / 2, side, side, 0, 0, 256, 256)
    bitmap.close()
    return new Promise((resolve, reject) => canvas.toBlob((blob) => {
      if (!blob) { reject(new Error('사진을 변환할 수 없어요.')); return }
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result)
      reader.onerror = () => reject(new Error('사진을 불러오지 못했어요.'))
      reader.readAsDataURL(blob)
    }, 'image/jpeg', 0.82))
  })
}

function ToggleSwitch({ checked, onChange, ariaLabel }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      className={`setting-toggle ${checked ? 'setting-toggle--checked' : ''}`}
      onClick={() => onChange(!checked)}
    >
      <span className="setting-toggle__thumb" />
    </button>
  )
}

export function ProfileSettingCard() {
  const dialogRef = useRef(null)
  const [profile, setProfile] = useState(readProfile)
  const [draft, setDraft] = useState(profile)
  const [photoError, setPhotoError] = useState('')

  const openProfileEditor = () => {
    setDraft(profile)
    setPhotoError('')
    dialogRef.current?.showModal()
  }

  const saveProfile = (event) => {
    event.preventDefault()
    const trimmed = draft.department.trim()
    if (!trimmed) {
      setPhotoError('전공을 입력해 주세요.')
      return
    }
    if (!/^\d{6,12}$/.test(draft.studentId)) {
      setPhotoError('학번은 숫자 6~12자리로 입력해 주세요.')
      return
    }
    const nextProfile = { ...draft, department: trimmed }
    try {
      window.localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(nextProfile))
      setProfile(nextProfile)
      dialogRef.current?.close()
    } catch {
      setPhotoError('기기에 저장 공간이 부족해요. 사진 크기를 줄이거나 다른 사진을 선택해 주세요.')
    }
  }

  const choosePhoto = async (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setPhotoError('이미지 파일을 선택해 주세요.')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setPhotoError('사진은 5MB 이하로 선택해 주세요.')
      return
    }
    try {
      const avatar = await resizeProfileImage(file)
      if (avatar.length > 250_000) throw new Error('다른 사진을 선택해 주세요.')
      setDraft((previous) => ({ ...previous, avatar }))
      setPhotoError('')
    } catch (error) {
      setPhotoError(error.message || '사진을 불러오지 못했어요.')
    }
  }

  return (
    <section className="setting-group">
      <div className="setting-group__label-row">
        <span className="setting-group__label">내 프로필 및 학적 정보 (직접 입력)</span>
        <span className="setting-badge-pill">
          <ShieldCheck size={12} weight="fill" aria-hidden="true" />
          로컬 저장
        </span>
      </div>

      <SectionCard className="setting-card">
        <div className="profile-setting">
          <div className="profile-setting__avatar-wrap">
            <img src={profile.avatar} alt="홍길동 학우 프로필" className="profile-setting__avatar" />
          </div>

          <div className="profile-setting__info">
            <div className="profile-setting__name-row">
              <span className="profile-setting__name">홍길동 학우</span>
              <span className="setting-role-badge">학부생</span>
            </div>
            <div className="profile-setting__details">
              <div className="profile-setting__detail-item">
                <span className="profile-setting__detail-label">전공</span>
                <span className="profile-setting__detail-value">{profile.department}</span>
              </div>
              <div className="profile-setting__meta-line">
                <span>학년: <strong>{profile.grade}학년</strong></span>
                <span>·</span>
                <span>학번: <strong>{profile.studentId}</strong></span>
              </div>
            </div>
          </div>

        </div>

        <button type="button" className="setting-list-row setting-list-row--interactive" onClick={openProfileEditor}>
          <div className="setting-list-row__left">
            <span className="setting-row-icon">
              <IdentificationCard size={18} weight="fill" aria-hidden="true" />
            </span>
            <div className="setting-list-row__text">
              <div className="setting-list-row__title-line">
                <span className="setting-row-title">학적 정보 직접 수정</span>
                <span className="setting-row-subtext">(전공, 학년, 학번, 프로필 사진)</span>
              </div>
              <span className="setting-row-desc">
                이 항목을 눌러 학적 정보와 프로필 사진을 수정할 수 있어요
              </span>
            </div>
          </div>
          <CaretRight size={17} weight="bold" className="setting-row-arrow" aria-hidden="true" />
        </button>
      </SectionCard>
      <dialog ref={dialogRef} className="profile-edit-dialog" aria-labelledby="profile-edit-title">
        <form onSubmit={saveProfile}>
          <div className="profile-edit-dialog__header">
            <div><h2 id="profile-edit-title">프로필 및 학적 정보 수정</h2><p>변경 내용은 이 기기에 저장됩니다.</p></div>
            <button type="button" className="profile-edit-dialog__close" aria-label="프로필 수정 닫기" onClick={() => dialogRef.current?.close()}>×</button>
          </div>

          <div className="profile-edit-photo">
            <img src={draft.avatar} alt="변경할 프로필 미리보기" />
            <div><strong>프로필 사진</strong><span>정사각형으로 잘라 저장합니다.</span></div>
            <label className="profile-edit-photo__button" htmlFor="profile-photo-input">사진 선택</label>
            <input id="profile-photo-input" className="profile-edit-photo__input" type="file" accept="image/*" onChange={choosePhoto} />
          </div>

          <label className="profile-edit-field">전공<input required maxLength={100} value={draft.department} onChange={(event) => setDraft((previous) => ({ ...previous, department: event.target.value }))} /></label>
          <div className="profile-edit-dialog__row">
            <label className="profile-edit-field">학년<select value={draft.grade} onChange={(event) => setDraft((previous) => ({ ...previous, grade: event.target.value }))}>{[1, 2, 3, 4, 5, 6].map((grade) => <option key={grade} value={grade}>{grade}학년</option>)}</select></label>
            <label className="profile-edit-field">학번<input required inputMode="numeric" pattern="[0-9]{6,12}" maxLength={12} value={draft.studentId} onChange={(event) => setDraft((previous) => ({ ...previous, studentId: event.target.value.replace(/\D/g, '') }))} /></label>
          </div>

          {photoError && <p className="profile-edit-dialog__error" role="alert">{photoError}</p>}
          <button type="submit" className="profile-edit-dialog__save">변경 내용 저장</button>
        </form>
      </dialog>
    </section>
  )
}

export function NotificationSettingCard() {
  const [academicNotice, setAcademicNotice] = useState(true)
  const [scheduleNotice, setScheduleNotice] = useState(true)

  return (
    <section className="setting-group">
      <span className="setting-group__label">알림 및 캠퍼스 안내</span>
      <SectionCard className="setting-card">
        <div className="setting-list-row">
          <div className="setting-list-row__left">
            <span className="setting-row-icon"><Bell size={18} weight="fill" aria-hidden="true" /></span>
            <div className="setting-list-row__text">
              <span className="setting-row-title">수업 및 과제 알림</span>
              <span className="setting-row-desc">예정된 수업과 과제 마감 알림</span>
            </div>
          </div>
          <ToggleSwitch checked={scheduleNotice} onChange={setScheduleNotice} ariaLabel="수업 및 과제 알림 토글" />
        </div>
        <div className="setting-list-row">
          <div className="setting-list-row__left">
            <span className="setting-row-icon"><ChatCircleDots size={18} weight="fill" aria-hidden="true" /></span>
            <div className="setting-list-row__text">
              <span className="setting-row-title">학사 / 장학 공지 알림</span>
              <span className="setting-row-desc">학부 및 학교 공지 알림</span>
            </div>
          </div>
          <ToggleSwitch checked={academicNotice} onChange={setAcademicNotice} ariaLabel="학사 / 장학 공지 알림 토글" />
        </div>
        <button type="button" className="setting-list-row setting-list-row--interactive">
          <div className="setting-list-row__left">
            <span className="setting-row-icon"><NavigationArrow size={18} weight="fill" aria-hidden="true" /></span>
            <div className="setting-list-row__text">
              <span className="setting-row-title">강의실 이동 경로 안내</span>
              <span className="setting-row-desc">현재 위치와 다음 수업을 기준으로 경로 안내</span>
            </div>
          </div>
          <CaretRight size={16} weight="bold" className="setting-row-arrow" aria-hidden="true" />
        </button>
      </SectionCard>
    </section>
  )
}

export function SettingAccountActions() {
  return (
    <div className="setting-account-box">
      <button type="button" className="setting-logout-btn">
        로그아웃
      </button>
      <div className="setting-sub-links">
        <button type="button" className="setting-sub-link setting-sub-link--danger">회원 탈퇴</button>
      </div>
    </div>
  )
}
