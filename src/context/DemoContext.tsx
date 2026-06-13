import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import type { DemoRoomMode, DemoProjectTransfer, ClientFileAccess } from '../lib/types'
import { DEFAULT_DEMO_PROJECT_TRANSFER } from '../lib/types'

export type DemoContextValue = {
  token: string
  mode: DemoRoomMode
  label: string
  contractorName: string
  basePath: string
  projectTransfer: DemoProjectTransfer
  allowDownloads: boolean
  /** When set (client app), overrides demo download behavior for project files */
  clientFileAccess?: ClientFileAccess
  isDemoSession: true
  isReadOnly: boolean
  blockedMessage: string | null
  notifyBlocked: () => void
  clearBlocked: () => void
}

const DemoContext = createContext<DemoContextValue | null>(null)

type DemoProviderProps = {
  token: string
  mode: DemoRoomMode
  label: string
  contractorName: string
  projectTransfer?: DemoProjectTransfer
  allowDownloads?: boolean
  clientFileAccess?: ClientFileAccess
  children: ReactNode
}

export function DemoProvider({ token, mode, label, contractorName, projectTransfer, allowDownloads = false, clientFileAccess, children }: DemoProviderProps) {
  const [blockedMessage, setBlockedMessage] = useState<string | null>(null)

  const notifyBlocked = useCallback(() => {
    setBlockedMessage(
      mode === 'review'
        ? 'Review mode is read-only. Your client can explore but not change data.'
        : 'This action is disabled in the preview environment.'
    )
  }, [mode])

  const clearBlocked = useCallback(() => setBlockedMessage(null), [])

  return (
    <DemoContext.Provider
      value={{
        token,
        mode,
        label,
        contractorName,
        basePath: `/demo/${token}`,
        projectTransfer: projectTransfer || { ...DEFAULT_DEMO_PROJECT_TRANSFER },
        allowDownloads,
        clientFileAccess,
        isDemoSession: true,
        isReadOnly: mode === 'review',
        blockedMessage,
        notifyBlocked,
        clearBlocked,
      }}
    >
      {children}
    </DemoContext.Provider>
  )
}

export function useDemo() {
  const ctx = useContext(DemoContext)
  if (!ctx) throw new Error('useDemo must be used within DemoProvider')
  return ctx
}

export function useDemoOptional() {
  return useContext(DemoContext)
}

/** True when client is in a demo/review room with downloads disabled. */
export function useDemoDownloadsBlocked(): boolean {
  const demo = useDemoOptional()
  return demo != null && !demo.allowDownloads
}
