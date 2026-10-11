import { createContext, useContext, useState } from 'react'

const AssistantPreferences = createContext(null)

// Keep the last size in app memory across route changes; a fresh app starts collapsed.
export function AssistantPreferencesProvider({ children }) {
  const [mode, setMode] = useState('collapsed')
  return (
    <AssistantPreferences.Provider value={{ mode, setMode }}>
      {children}
    </AssistantPreferences.Provider>
  )
}

export function useAssistantPreferences() {
  return useContext(AssistantPreferences)
}
