import { useEffect, useState } from 'react'
import { Outlet, useParams } from 'react-router-dom'
import { Loader2, ShieldOff } from 'lucide-react'
import { ClientAppProvider, useClientApp } from '../context/ClientAppContext'
import { DemoProvider } from '../context/DemoContext'
import { ClientRoomProvider } from '../context/ClientRoomContext'
import { StoreProvider } from '../context/StoreContext'
import { resolveClientAppSession } from '../lib/client-app'
import { loadState } from '../lib/utils'
import { ClientAppBanner } from '../components/ClientAppBanner'
import { ClientAppLayout } from '../components/layout/ClientAppLayout'
import { Card } from '../components/ui/Card'
import type { ClientAppSessionPublic } from '../lib/types'

function ClientStoreInner({
  session,
  children,
}: {
  session: ClientAppSessionPublic
  children: React.ReactNode
}) {
  const { notifyBlocked } = useClientApp()

  return (
    <StoreProvider
      isolated
      readOnly
      initialState={session.appState}
      onBlockedAction={notifyBlocked}
    >
      {children}
    </StoreProvider>
  )
}

function ClientStoreBridge({
  session,
  children,
}: {
  session: ClientAppSessionPublic
  children: React.ReactNode
}) {
  return (
    <ClientAppProvider
      token={session.token}
      clientName={session.clientName}
      clientCompany={session.clientCompany}
      contractorName={session.contractorName}
      contractorEmail={session.contractorEmail}
      label={session.label}
      projectTransfer={session.projectTransfer}
      allowDownloads={session.allowDownloads}
      clientFileAccess={session.clientFileAccess}
      clientRoom={session.clientRoom}
    >
      <DemoProvider
        token={session.token}
        mode="review"
        label={session.label}
        contractorName={session.contractorName}
        projectTransfer={session.projectTransfer}
        allowDownloads={session.allowDownloads}
        clientFileAccess={session.clientFileAccess}
      >
        <ClientStoreInner session={session}>{children}</ClientStoreInner>
      </DemoProvider>
    </ClientAppProvider>
  )
}

export default function ClientAppShell() {
  const { token } = useParams<{ token: string }>()
  const [session, setSession] = useState<ClientAppSessionPublic | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!token) {
      setError('Invalid client app link')
      setLoading(false)
      return
    }

    let cancelled = false

    async function load() {
      const info = await resolveClientAppSession(token!, loadState())
      if (cancelled) return
      if (!info?.enabled) {
        setError('This client app link is invalid or has been revoked.')
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
          <h1 className="text-xl font-semibold text-surface-900 mb-2">App Unavailable</h1>
          <p className="text-sm text-surface-500">{error}</p>
        </Card>
      </div>
    )
  }

  return (
    <ClientStoreBridge session={session}>
      <ClientRoomProvider token={token}>
        <div className="min-h-screen bg-surface-50">
          <ClientAppBanner />
          <ClientAppLayout>
            <Outlet />
          </ClientAppLayout>
        </div>
      </ClientRoomProvider>
    </ClientStoreBridge>
  )
}
