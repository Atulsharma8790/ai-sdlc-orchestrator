'use client'
import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'

type Theme = 'dark' | 'light'
interface ThemeCtx { theme: Theme; toggle: () => void }
const ThemeContext = createContext<ThemeCtx | null>(null)
const STORAGE_KEY = 'orchestrator_theme'

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>('dark')

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as Theme | null
    const t = saved ?? 'dark'
    setTheme(t)
    document.documentElement.setAttribute('data-theme', t)
  }, [])

  function toggle() {
    setTheme(prev => {
      const next = prev === 'dark' ? 'light' : 'dark'
      localStorage.setItem(STORAGE_KEY, next)
      document.documentElement.setAttribute('data-theme', next)
      return next
    })
  }

  return <ThemeContext.Provider value={{ theme, toggle }}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}
