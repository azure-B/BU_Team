import { useEffect, useRef, useState } from 'react'
import { Microphone, Stop } from '@phosphor-icons/react'
import { postLanguageEval } from '../../../api/languageApi'
import { blobToWavBase64 } from '../../../utils/audioWav'
import './LanguagePractice.css'

/** UI 모드 → 평가 툴 매핑 (화면에는 한글 라벨만 노출) */
export const PRACTICE_MODES = [
  {
    id: 'read',
    label: '따라 읽기 연습',
    promptLabel: '따라 읽을 문장',
    micIdle: '눌러서 읽고 평가받기',
    tool: 'en_sentence_eval',
    prompt: 'The weather is absolutely gorgeous today.',
  },
  {
    id: 'speak',
    label: '자유 발화 연습',
    promptLabel: '말할 주제',
    micIdle: '눌러서 말하고 평가받기',
    tool: 'en_open_eval',
    prompt: 'Please introduce yourself briefly.',
  },
]

function formatMs(ms) {
  const total = Math.max(0, Math.floor(ms / 1000))
  const m = String(Math.floor(total / 60)).padStart(2, '0')
  const s = String(total % 60).padStart(2, '0')
  return `${m}:${s}`
}

/**
 * @param {{
 *   onFeedback: (payload: { assistantText: string, scores?: object }) => void,
 *   evalReady?: boolean,
 * }} props
 */
export default function LanguagePractice({ onFeedback, evalReady = false }) {
  const [modeId, setModeId] = useState(PRACTICE_MODES[0].id)
  const [recording, setRecording] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [busy, setBusy] = useState(false)
  const mediaRef = useRef(null)
  const chunksRef = useRef([])
  const startedAtRef = useRef(0)
  const timerRef = useRef(0)

  const mode = PRACTICE_MODES.find((item) => item.id === modeId) || PRACTICE_MODES[0]

  useEffect(() => () => {
    window.clearInterval(timerRef.current)
    mediaRef.current?.stream?.getTracks?.().forEach((t) => t.stop())
  }, [])

  const stopTracks = () => {
    mediaRef.current?.stream?.getTracks?.().forEach((t) => t.stop())
    mediaRef.current = null
  }

  const finishRecording = async () => {
    window.clearInterval(timerRef.current)
    setRecording(false)
    const recorder = mediaRef.current
    if (!recorder) return

    const blob = await new Promise((resolve) => {
      recorder.onstop = () => {
        resolve(new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' }))
      }
      try {
        recorder.stop()
      } catch {
        resolve(new Blob(chunksRef.current, { type: 'audio/webm' }))
      }
    })
    stopTracks()

    setBusy(true)
    try {
      const { base64: audioBase64, mimeType } = await blobToWavBase64(blob)
      const result = await postLanguageEval({
        tool: mode.tool,
        refText: mode.prompt,
        audioBase64,
        mimeType,
      })
      onFeedback?.({
        assistantText: result.feedbackKo || '평가 결과를 받지 못했어요.',
        scores: result,
      })
    } catch (err) {
      const msg = err?.message || '평가 요청에 실패했어요.'
      onFeedback?.({
        assistantText: typeof msg === 'string' ? msg : '평가 요청에 실패했어요.',
      })
    } finally {
      setBusy(false)
      setElapsed(0)
    }
  }

  const startRecording = async () => {
    if (!evalReady) {
      onFeedback?.({
        assistantText: '말하기 평가를 준비하지 못했어요. 잠시 후 다시 시도해 주세요.',
      })
      return
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      onFeedback?.({
        assistantText: '이 브라우저는 마이크를 지원하지 않아요.',
      })
      return
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
          ? 'audio/webm'
          : ''
      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream)
      chunksRef.current = []
      recorder.ondataavailable = (ev) => {
        if (ev.data?.size) chunksRef.current.push(ev.data)
      }
      mediaRef.current = recorder
      startedAtRef.current = Date.now()
      setElapsed(0)
      setRecording(true)
      recorder.start(200)
      timerRef.current = window.setInterval(() => {
        const ms = Date.now() - startedAtRef.current
        setElapsed(ms)
        if (ms >= 60_000) {
          window.clearInterval(timerRef.current)
          finishRecording()
        }
      }, 200)
    } catch {
      stopTracks()
      setRecording(false)
      onFeedback?.({
        assistantText: '마이크 권한을 허용해 주세요.',
      })
    }
  }

  const onMicClick = () => {
    if (busy) return
    if (recording) finishRecording()
    else startRecording()
  }

  const selectMode = (nextId) => {
    if (busy || recording || nextId === modeId) return
    setModeId(nextId)
    setElapsed(0)
  }

  const waveHeights = recording
    ? [10, 22, 34, 18, 30, 14, 28, 20, 32, 16].map((h, i) => h + ((elapsed / 120) % 7) * ((i % 3) + 1))
    : [12, 23, 31, 18, 34, 24, 31, 14, 27, 18]

  const micLabel = busy ? '평가 중…' : recording ? '녹음 끝내고 평가' : mode.micIdle

  return (
    <section className="language-practice" aria-label="영어 말하기 연습">
      <div className="language-practice__modes" role="tablist" aria-label="연습 종류">
        {PRACTICE_MODES.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={modeId === item.id}
            className={`language-practice__mode${modeId === item.id ? ' language-practice__mode--active' : ''}`}
            disabled={busy || recording}
            onClick={() => selectMode(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div className="language-practice__sentence">
        <p>{mode.promptLabel}</p>
        <h3 lang="en">{mode.prompt}</h3>
      </div>
      <div className="language-practice__speaking">
        <p
          className={`language-practice__timer ${recording ? 'language-practice__timer--live' : ''}`}
          aria-label={recording ? '녹음 중' : '녹음 대기, 최대 1분'}
        >
          <span aria-hidden="true" /> {formatMs(elapsed)} <span>/ 01:00</span>
        </p>
        <div className={`language-practice__waveform ${recording ? 'language-practice__waveform--live' : ''}`} aria-hidden="true">
          {waveHeights.map((height, index) => (
            <span key={index} style={{ height }} />
          ))}
        </div>
        <button
          className={`language-practice__feedback ${recording ? 'language-practice__feedback--live' : ''}`}
          type="button"
          onClick={onMicClick}
          disabled={busy}
          aria-pressed={recording}
        >
          <span>
            {recording
              ? <Stop size={24} weight="fill" aria-hidden="true" />
              : <Microphone size={24} weight="fill" aria-hidden="true" />}
          </span>
          {micLabel}
        </button>
      </div>
    </section>
  )
}
