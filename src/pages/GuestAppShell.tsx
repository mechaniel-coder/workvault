import { useEffect, useState } from 'react'
import { Outlet, useParams, Navigate, useLocation } from 'react-router-dom'
import { Loader2, ShieldOff } from 'lucide-react'
import { ClientAppProvider, useClientApp } from '../context/ClientAppContext'
import { DemoProvider } from '../context/DemoContext'
import { ClientRoomProvider } from '../context/ClientRoomContext'
import { StoreProvider } from '../context/StoreContext'
import { resolveGuestInvite, guestCanAccessPath } from '../lib/guest-invites'
import { loadState } from '../lib/utils'
import { ClientAppBanner } from '../components/ClientAppBanner'
import { ClientAppLayout } from '../components/layout/ClientAppLayout'
import { Card } from '../components/ui/Card'
import type { ClientAppSessionPublic, ClientGuestInvite } from '../lib/types'

function GuestRouteGuard({ children }: { children: React.ReactNode }) {
  const app = useClientApp()
  const location = useLocation()
  const base = app.isGuest ? `/guest/${app.token}` : app.basePath
  const pathInApp = location.pathname.replace(base, '') || '/'

  if (app.isGuest && app.guestRole && !guestCanAccessPath(app.guestRole, pathInApp)) {
    return <Navigate to={base} replace />
  }

  return <>{children}</>
}

function GuestStoreInner({
  session,
  children,
}: {
  session: ClientAppSessionPublic
  children: React.ReactNode
}) {
  const { notifyBlocked } = useClientApp()

  return (
    <StoreProvider isolated readOnly initialState={session.appState} onBlockedAction={notifyBlocked}>
      <GuestRouteGuard>{children}</GuestRouteGuard>
    </StoreProvider>
  )
}

function GuestStoreBridge({
  session,
  guest,
  invite,
  inviteToken,
  children,
}: {
  session: ClientAppSessionPublic
  guest: { name: string; role: ClientGuestInvite['role']; inviteId: string }
  invite: ClientGuestInvite
  inviteToken: string
  children: React.ReactNode
}) {
  return (
    <ClientAppProvider
      token={inviteToken}
      clientName={session.clientName}
      clientCompany={session.clientCompany}
      contractorName={session.contractorName}
      contractorEmail={session.contractorEmail}
      label={invite.label || session.label}
      projectTransfer={session.projectTransfer}
      allowDownloads={false}
      clientFileAccess={session.clientFileAccess}
      clientRoom={session.clientRoom}
      guest={guest}
    >
      <DemoProvider
        token={session.token}
        mode="review"
        label={invite.label || session.label}
        contractorName={session.contractorName}
        projectTransfer={session.projectTransfer}
        allowDownloads={false}
        clientFileAccess={session.clientFileAccess}
      >
        <GuestStoreInner session={session}>{children}</GuestStoreInner>
      </DemoProvider>
    </ClientAppProvider>
  )
}

export default function GuestAppShell() {
  const { inviteToken } = useParams<{ inviteToken: string }>()
  const [payload, setPayload] = useState<{
    invite: ClientGuestInvite
    session: ClientAppSessionPublic
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!inviteToken) {
      setError('Invalid invitation link')
      setLoading(false)
      return
    }

    let cancelled = false

    async function load() {
      const result = await resolveGuestInvite(inviteToken!, loadState())
      if (cancelled) return
      if (!result?.invite?.enabled) {
        setError('This invitation is invalid, expired, or has been revoked.')
      } else {
        setPayload(result)
      }
      setLoading(false)
    }

    load()
    return () => { cancelled = true }
  }, [inviteToken])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-50">
        <Loader2 className="animate-spin text-brand-600" size={32} />
      </div>
    )
  }

  if (error || !payload || !inviteToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-50 p-6">
        <Card className="max-w-md w-full p-8 text-center">
          <ShieldOff size={32} className="mx-auto text-surface-400 mb-3" />
          <h1 className="text-xl font-semibold text-surface-900 mb-2">Invitation Unavailable</h1>
          <p className="text-sm text-surface-500">{error}</p>
        </Card>
      </div>
    )
  }

  const { invite, session } = payload

  return (
    <GuestStoreBridge
      session={session}
      invite={invite}
      inviteToken={inviteToken}
      guest={{ name: invite.name, role: invite.role, inviteId: invite.id }}
    >
      <ClientRoomProvider token={session.token}>
        <div className="min-h-screen bg-surface-50">
          <ClientAppBanner guestLabel={invite.label} />
          <ClientAppLayout>
            <Outlet />
          </ClientAppLayout>
        </div>
      </ClientRoomProvider>
    </GuestStoreBridge>
  )
}
