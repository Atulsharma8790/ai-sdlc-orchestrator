'use client'
import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import type { IntegrationsConfig } from '@/lib/integrations'

const STORAGE_KEY = 'orchestrator_integrations'

interface IntegrationsCtx {
  config: IntegrationsConfig
  saveConfig: (cfg: IntegrationsConfig) => void
}

const IntegrationsContext = createContext<IntegrationsCtx>({
  config: {},
  saveConfig: () => {},
})

export function IntegrationsProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<IntegrationsConfig>({})

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) setConfig(JSON.parse(raw))
    } catch {}
  }, [])

  const saveConfig = useCallback((cfg: IntegrationsConfig) => {
    setConfig(cfg)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg))
  }, [])

  return (
    <IntegrationsContext.Provider value={{ config, saveConfig }}>
      {children}
    </IntegrationsContext.Provider>
  )
}

export function useIntegrations() {
  return useContext(IntegrationsContext)
}
