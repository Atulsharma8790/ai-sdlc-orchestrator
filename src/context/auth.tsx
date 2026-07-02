'use client'
import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'

const SESSION_KEY = 'orchestrator_access_code'

interface AuthCtx {
  passcode: string
  isUnlocked: boolean
  unlock: (code: string) => Promise<{ ok: boolean; error?: string }>
  lock: () => void
  getHeaders: () => Record<string, string>
}

const AuthContext = createContext<AuthCtx>({
  passcode: '',
  isUnlocked: false,
  unlock: async () => ({ ok: false }),
  lock: () => {},
  getHeaders: () => ({}),
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [passcode, setPasscode] = useState('')

  useEffect(() => {
    const stored = sessionStorage.getItem(SESSION_KEY)
    if (stored) setPasscode(stored)
  }, [])

  const unlock = useCallback(async (code: string): Promise<{ ok: boolean; error?: string }> => {
    const res = await fetch('/api/auth/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    })
    if (res.ok) {
      setPasscode(code)
      sessionStorage.setItem(SESSION_KEY, code)
      return { ok: true }
    }
    const data = await res.json().catch(() => ({}))
    return { ok: false, error: data.error ?? 'Invalid passcode.' }
  }, [])

  const lock = useCallback(() => {
    setPasscode('')
    sessionStorage.removeItem(SESSION_KEY)
  }, [])

  const getHeaders = useCallback((): Record<string, string> => {
    return passcode ? { 'x-access-code': passcode } : {}
  }, [passcode])

  return (
    <AuthContext.Provider value={{ passcode, isUnlocked: !!passcode, unlock, lock, getHeaders }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
