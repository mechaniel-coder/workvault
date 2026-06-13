import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import type { ClientRoomConfig, DemoProjectTransfer, ClientFileAccess, ClientGuestRole } from '../lib/types'
import { guestAllowedPaths } from '../lib/guest-invites'

export type ClientAppContextValue = {
  token: string
  clientName: string
  clientCompany: string
  contractorName: string
  contractorEmail: string
  label: string
  basePath: string
  projectTransfer: DemoProjectTransfer
  allowDownloads: boolean
  clientFileAccess: ClientFileAccess
  canViewFiles: boolean
  clientRoom: ClientRoomConfig
  isClientSession: true
  isGuest: boolean
  guestName: string | null
  guestRole: ClientGuestRole | null
  allowedPaths: string[]
  isReadOnly: boolean
  blockedMessage: string | null
  notifyBlocked: () => void
  clearBlocked: () => void
}

const ClientAppContext = createContext<ClientAppContextValue | null>(null)

type ClientAppProviderProps = {
  token: string
  clientName: string
  clientCompany: string
  contractorName: string
  contractorEmail: string
  label: string
  projectTransfer: DemoProjectTransfer
  allowDownloads: boolean
  clientFileAccess: ClientFileAccess
  clientRoom: ClientRoomConfig
  guest?: { name: string; role: ClientGuestRole; inviteId: string }
  children: ReactNode
}

export function ClientAppProvider({
  token,
  clientName,
  clientCompany,
  contractorName,
  contractorEmail,
  label,
  projectTransfer,
  allowDownloads,
  clientFileAccess,
  clientRoom,
  guest,
  children,
}: ClientAppProviderProps) {
  const [blockedMessage, setBlockedMessage] = useState<string | null>(null)

  const notifyBlocked = useCallback(() => {
    setBlockedMessage('This action is managed by your contractor. Use Review or Messages to respond.')
  }, [])

  const clearBlocked = useCallback(() => setBlockedMessage(null), [])

  return (
    <ClientAppContext.Provider
      value={{
        token,
        clientName,
        clientCompany,
        contractorName,
        contractorEmail,
        label,
        basePath: guest ? `/guest/${token}` : `/client/${token}`,
        projectTransfer,
        allowDownloads,
        clientFileAccess,
        canViewFiles: clientFileAccess !== 'none',
        clientRoom,
        isClientSession: true,
        isGuest: Boolean(guest),
        guestName: guest?.name ?? null,
        guestRole: guest?.role ?? null,
        allowedPaths: guest ? guestAllowedPaths(guest.role) : [],
        isReadOnly: true,
        blockedMessage,
        notifyBlocked,
        clearBlocked,
      }}
    >
      {children}
    </ClientAppContext.Provider>
  )
}

export function useClientApp() {
  const ctx = useContext(ClientAppContext)
  if (!ctx) throw new Error('useClientApp must be used within ClientAppProvider')
  return ctx
}

export function useClientAppOptional() {
  return useContext(ClientAppContext)
}

/** True when client is in their WorkVault session with downloads disabled. */
export function useClientDownloadsBlocked(): boolean {
  const client = useClientAppOptional()
  return client != null && !client.allowDownloads
}
