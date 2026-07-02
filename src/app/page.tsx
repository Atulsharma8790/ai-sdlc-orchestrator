'use client'
import { useState } from 'react'
import { useWorkflow } from '@/context/workflow'
import Header from '@/components/Header'
import PasscodeModal from '@/components/PasscodeModal'
import DisclaimerModal from '@/components/DisclaimerModal'
import IntegrationsSettings from '@/components/IntegrationsSettings'
import WorkflowSetup from '@/components/WorkflowSetup'
import WorkflowSidebar from '@/components/WorkflowSidebar'
import PhasePanel from '@/components/PhasePanel'
import ExportPanel from '@/components/ExportPanel'
import EditRequirementsModal from '@/components/EditRequirementsModal'

export default function Home() {
  const { workflow } = useWorkflow()
  const [showPasscode, setShowPasscode] = useState(false)
  const [showDisclaimer, setShowDisclaimer] = useState(false)
  const [showIntegrations, setShowIntegrations] = useState(false)
  const [showEditRequirements, setShowEditRequirements] = useState(false)
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null)

  function handleNeedAuth(retryFn?: () => void) {
    if (retryFn) setPendingAction(() => retryFn)
    setShowPasscode(true)
  }

  function handleUnlocked() {
    if (pendingAction) { pendingAction(); setPendingAction(null) }
  }

  return (
    <div className="flex flex-col min-h-screen" style={{ background: 'var(--bg-base)' }}>
      {showPasscode && (
        <PasscodeModal onClose={() => setShowPasscode(false)} onUnlocked={handleUnlocked} />
      )}
      {showDisclaimer && <DisclaimerModal onClose={() => setShowDisclaimer(false)} />}
      {showIntegrations && <IntegrationsSettings onClose={() => setShowIntegrations(false)} />}
      {showEditRequirements && workflow && <EditRequirementsModal onClose={() => setShowEditRequirements(false)} />}

      <Header
        onDisclaimer={() => setShowDisclaimer(true)}
        onShowPasscode={() => setShowPasscode(true)}
        onIntegrations={() => setShowIntegrations(true)}
      />

      <main className="flex-1">
        {!workflow ? (
          <WorkflowSetup />
        ) : (
          <div className="max-w-screen-2xl mx-auto px-4 py-6 flex gap-5 items-start">
            <div className="sticky top-20 flex flex-col gap-4 w-64 shrink-0">
              <WorkflowSidebar onNeedAuth={handleNeedAuth} />
              <ExportPanel />
            </div>
            <PhasePanel onNeedAuth={handleNeedAuth} onOpenIntegrations={() => setShowIntegrations(true)} onEditRequirements={() => setShowEditRequirements(true)} />
          </div>
        )}
      </main>

      <footer className="mt-auto py-4 border-t text-center" style={{ borderColor: 'var(--border-default)' }}>
        <p className="text-xs" style={{ color: 'var(--text-dimmer)' }}>
          AI-generated artifacts · Review before use ·{' '}
          <button onClick={() => setShowDisclaimer(true)} className="underline underline-offset-2 hover:opacity-80">
            Disclaimer & Privacy
          </button>
        </p>
        <p className="text-xs mt-1" style={{ color: 'var(--text-dimmer)' }}>
          Developed by <span style={{ color: 'var(--accent-blue)' }}>Atul Sharma</span>
        </p>
      </footer>
    </div>
  )
}
