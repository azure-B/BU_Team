import { useEffect, useRef, useState } from 'react'
import { flushSync } from 'react-dom'

/** Reveal the live theme through a widening hole in an inert snapshot of the old one. */
export function useAssistantMode({ sheetRef, open, expanded, reducedMotion, onModeChange }) {
  const [languageMode, setLanguageMode] = useState(false)
  const transitionRef = useRef(null)

  useEffect(() => {
    const cancel = () => transitionRef.current?.()
    window.addEventListener('resize', cancel)
    window.visualViewport?.addEventListener('resize', cancel)
    return () => {
      cancel()
      window.removeEventListener('resize', cancel)
      window.visualViewport?.removeEventListener('resize', cancel)
    }
  }, [open, expanded, reducedMotion])

  const toggleMode = (event) => {
    if (transitionRef.current) return
    const sheet = sheetRef.current
    if (!sheet || reducedMotion) {
      setLanguageMode((current) => !current)
      onModeChange?.(!languageMode)
      return
    }

    const rect = sheet.getBoundingClientRect()
    const button = event.currentTarget.getBoundingClientRect()
    const x = button.left + button.width / 2 - rect.left
    const y = button.top + button.height / 2 - rect.top
    const radius = Math.hypot(Math.max(x, rect.width - x), Math.max(y, rect.height - y)) + 8
    const snapshot = sheet.cloneNode(true)
    snapshot.classList.add('assistant-mode-snapshot')
    snapshot.inert = true
    snapshot.setAttribute('aria-hidden', 'true')
    for (const element of [snapshot, ...snapshot.querySelectorAll('[id], [role], [aria-live]')]) {
      element.removeAttribute('id')
      element.removeAttribute('role')
      element.removeAttribute('aria-live')
    }
    // cloneNode does not retain a scroll container's current position.
    const originalHistory = sheet.querySelector('.assistant-history')
    const clonedHistory = snapshot.querySelector('.assistant-history')
    const wave = document.createElement('div')
    wave.className = 'assistant-mode-wave'
    wave.setAttribute('aria-hidden', 'true')
    for (const surface of [snapshot, wave]) {
      Object.assign(surface.style, {
        left: `${rect.left}px`, top: `${rect.top}px`,
        width: `${rect.width}px`, height: `${rect.height}px`,
        borderRadius: getComputedStyle(sheet).borderRadius,
      })
      sheet.parentElement.append(surface)
    }
    if (clonedHistory) clonedHistory.scrollTop = originalHistory.scrollTop

    let frame
    const finish = () => {
      cancelAnimationFrame(frame)
      snapshot.remove()
      wave.remove()
      transitionRef.current = null
    }
    transitionRef.current = finish
    const color = languageMode ? '37, 99, 235' : '147, 51, 234'
    const paint = (progress) => {
      const r = radius * (1 - (1 - progress) ** 2)
      const mask = `radial-gradient(circle at ${x}px ${y}px, transparent ${r}px, #000 ${r + 2}px)`
      snapshot.style.maskImage = mask
      snapshot.style.webkitMaskImage = mask
      wave.style.background = `radial-gradient(circle at ${x}px ${y}px, transparent ${Math.max(0, r - 12)}px, rgba(${color}, ${0.2 * (1 - progress)}) ${r}px, transparent ${r + 5}px)`
    }
    paint(0)
    flushSync(() => setLanguageMode((current) => !current))
    const start = performance.now()
    const tick = (now) => {
      const progress = Math.min((now - start) / 780, 1)
      paint(progress)
      if (progress < 1) frame = requestAnimationFrame(tick)
      else {
        finish()
        onModeChange?.(!languageMode)
      }
    }
    frame = requestAnimationFrame(tick)
  }

  return { languageMode, toggleMode }
}
