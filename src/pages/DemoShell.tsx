import { useEffect, useState } from 'react'
import { Outlet, useParams } from 'react-router-dom'
import { Loader2, ShieldOff } from 'lucide-react'
import { DemoProvider, useDemo } from '../context/DemoContext'
import { StoreProvider } from '../context/StoreContext'
import { createDemoState } from '../lib/demo-data'
import { fetchDemoSession, validateLocalDemoToken, type DemoSessionPublic } from '../lib/demo'
import { loadState } from '../lib/utils'
import { DemoBanner } from '../components/DemoBanner'
import { DemoLayout } from '../components/layout/DemoLayout'
import { Card } from '../components/ui/Card'

function DemoStoreBridge({ initialState, readOnly, children }: {
  initialState: ReturnType<typeof createDemoState>
  readOnly: boolean
  children: React.ReactNode
}) {
  const demo = useDemo()
  return (
    <StoreProvider
      isolated
      readOnly={readOnly}
      initialState={initialState}
      onBlockedAction={demo.notifyBlocked}
    >
      {children}
    </StoreProvider>
  )
}

export default function DemoShell() {
  const { token } = useParams<{ token: string }>()
  const [session, setSession] = useState<DemoSessionPublic | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!token) {
      setError('Invalid demo link')
      setLoading(false)
      return
    }

    let cancelled = false

    async function load() {
      let info = await fetchDemoSession(token!)
      if (!info) {
        info = validateLocalDemoToken(token!, loadState())
      }
      if (cancelled) return
      if (!info || !info.enabled) {
        setError('This demo or review link is invalid, expired, or has been turned off.')
      } else {
        setSession(info)
      }
      setLoading(false)
    }

    load()
    return () => { cancelled = true }
  }, [token])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-50">
        <Loader2 className="animate-spin text-brand-600" size={32} />
      </div>
    )
  }

  if (error || !session || !token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-50 p-6">
        <Card className="max-w-md w-full p-8 text-center">
          <ShieldOff size={32} className="mx-auto text-surface-400 mb-3" />
          <h1 className="text-xl font-semibold text-surface-900 mb-2">Preview Unavailable</h1>
          <p className="text-sm text-surface-500">{error}</p>
        </Card>
      </div>
    )
  }

  const demoState = createDemoState({
    contractorName: session.contractorName,
    label: session.label,
    mode: session.mode,
  })

  return (
    <DemoProvider
      token={token}
      mode={session.mode}
      label={session.label}
      contractorName={session.contractorName}
      projectTransfer={session.projectTransfer}
      allowDownloads={session.allowDownloads}
    >
      <DemoStoreBridge initialState={demoState} readOnly={session.mode === 'review'}>
        <div className="min-h-screen bg-surface-50">
          <DemoBanner />
          <DemoLayout>
            <Outlet />
          </DemoLayout>
        </div>
      </DemoStoreBridge>
    </DemoProvider>
  )
}
