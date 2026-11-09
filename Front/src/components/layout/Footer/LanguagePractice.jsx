import { Microphone } from '@phosphor-icons/react'
import './LanguagePractice.css'

export const PRACTICE_SENTENCE = 'I am still hungry.'
export const PRACTICE_LANGUAGES = [
  { code: 'en', label: '영어', sentences: [PRACTICE_SENTENCE, 'I would like a cup of coffee.'] },
  { code: 'ja', label: '일본어', sentences: ['まだお腹が空いています。', 'コーヒーを一杯お願いします。'] },
  { code: 'zh', label: '중국어', sentences: ['我还饿。', '请给我一杯咖啡。'] },
  { code: 'de', label: '독일어', sentences: ['Ich habe immer noch Hunger.', 'Ich hätte gern eine Tasse Kaffee.'] },
]

export default function LanguagePractice({ onPreview, language, sentence }) {
  return (
    <section className="language-practice" aria-label={`${language.label} 말하기 연습 미리보기`}>
      <div className="language-practice__sentence">
        <p>오늘의 문장</p>
        <h3 lang={language.code}>{sentence}</h3>
      </div>
      <div className="language-practice__speaking">
        <p className="language-practice__timer" aria-label="녹음 대기, 최대 1분">
          <span aria-hidden="true" /> 00:00 <span>/ 01:00</span>
        </p>
        <div className="language-practice__waveform" aria-hidden="true">
          {[12, 23, 31, 18, 34, 24, 31, 14, 27, 18].map((height, index) => (
            <span key={index} style={{ height }} />
          ))}
        </div>
        <button className="language-practice__feedback" type="button" onClick={onPreview}>
          <span><Microphone size={24} weight="fill" aria-hidden="true" /></span>
          피드백 예시 보기
        </button>
        <p className="language-practice__note">화면 미리보기 · 실제 음성은 녹음하지 않아요.</p>
      </div>
    </section>
  )
}
