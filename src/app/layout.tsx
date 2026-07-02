import { Suspense } from 'react'
import type { Metadata } from 'next'
import './globals.css'
import { AuthProvider } from '@/context/auth'
import { ThemeProvider } from '@/context/theme'
import { WorkflowProvider } from '@/context/workflow'
import { IntegrationsProvider } from '@/context/integrations'
import DisclaimerBanner from '@/components/DisclaimerBanner'
import PortfolioBar from '@/components/PortfolioBar'


export const metadata: Metadata = {
  title: 'AI SDLC Orchestrator',
  description: 'AI-powered end-to-end SDLC artifact generator for every phase of the software development lifecycle.',
  authors: [{ name: "Atul Sharma", url: "https://atulsharma8790.github.io" }],
  creator: "Atul Sharma",
}
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <Suspense fallback={null}><PortfolioBar /></Suspense>
        <ThemeProvider>
          <AuthProvider>
            <IntegrationsProvider>
              <WorkflowProvider>
                <DisclaimerBanner />
                {children}
              </WorkflowProvider>
            </IntegrationsProvider>
          </AuthProvider>
        </ThemeProvider>
      <Suspense fallback={null}><PortfolioBar /></Suspense></body>
    </html>
  )
}
