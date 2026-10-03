import { createContext, useContext, useEffect, useState } from 'react'
import { readSchedule, saveSchedule } from './scheduleModel'

const ScheduleContext = createContext(null)

function browserStorage() {
  try { return typeof window === 'undefined' ? undefined : window.localStorage } catch { return undefined }
}

export function ScheduleProvider({ children }) {
  const [state, setState] = useState(() => readSchedule(browserStorage()))
  useEffect(() => saveSchedule(browserStorage(), state), [state])
  return <ScheduleContext.Provider value={{ state, setState }}>{children}</ScheduleContext.Provider>
}

export function useSchedule() {
  return useContext(ScheduleContext)
}
