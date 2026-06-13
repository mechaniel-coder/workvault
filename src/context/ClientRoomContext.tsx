import {
  createContext, useContext, useCallback, useEffect, useState, type ReactNode,
} from 'react'
import { Loader2 } from 'lucide-react'
import { Card } from '../components/ui/Card'
import type {
  ClientFeedbackEntry, ClientHubSession, ClientMessage, ClientRoomData,
  ClientSignOff, ClientSurveyResponse,
} from '../lib/types'
import {
  clientRoomAction, resolveClientHubSession, verifyLinkPassword,
} from '../lib/client-room'
import { loadState } from '../lib/utils'

type ClientRoomContextValue = {
  session: ClientHubSession
  data: ClientRoomData
  unlocked: boolean
  ndaAccepted: boolean
  clientName: string
  setClientName: (n: string) => void
  tryPassword: (pw: string) => boolean
  acceptNda: () => Promise<void>
  logAudit: (type: ClientRoomData['auditLog'][0]['type'], detail: string) => Promise<void>
  submitFeedback: (entry: Omit<ClientFeedbackEntry, 'id' | 'createdAt' | 'clientName'>) => Promise<void>
  postMessage: (body: string) => Promise<void>
  submitSignOff: (note: string) => Promise<void>
  toggleChecklist: (itemId: string, checked: boolean) => Promise<void>
  submitSurvey: (rating: number, comment: string) => Promise<void>
  uploadAsset: (file: File) => Promise<void>
  refresh: () => Promise<void>
}

const ClientRoomContext = createContext<ClientRoomContextValue | null>(null)

export function ClientRoomProvider({
  token,
  children,
}: {
  token: string
  children: ReactNode
}) {
  const [session, setSession] = useState<ClientHubSession | null>(null)
  const [data, setData] = useState<ClientRoomData | null>(null)
  const [unlocked, setUnlocked] = useState(false)
  const [clientName, setClientName] = useState('')
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setNotFound(false)
    const s = await resolveClientHubSession(token, loadState())
    if (s) {
      setSession(s)
      setData(s.data)
      if (!s.config.linkPassword) setUnlocked(true)
      if (s.data.ndaAcceptedAt) setUnlocked((u) => u || !s.config.linkPassword)
    } else {
      setNotFound(true)
    }
    setLoading(false)
  }, [token])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    if (!session || !unlocked) return
    clientRoomAction(token, {
      action: 'audit',
      entry: { type: 'visit', detail: 'Hub opened', at: new Date().toISOString() },
    }).then(setData)
  }, [session, unlocked, token])

  const tryPassword = (pw: string) => {
    if (!session) return false
    const ok = verifyLinkPassword(session.config, pw)
    if (ok) setUnlocked(true)
    return ok
  }

  const acceptNda = async () => {
    if (!clientName.trim()) return
    const next = await clientRoomAction(token, { action: 'nda', name: clientName.trim() })
    setData(next)
  }

  const logAudit = async (type: ClientRoomData['auditLog'][0]['type'], detail: string) => {
    const next = await clientRoomAction(token, {
      action: 'audit',
      entry: { type, detail, at: new Date().toISOString() },
    })
    setData(next)
  }

  const submitFeedback = async (entry: Omit<ClientFeedbackEntry, 'id' | 'createdAt' | 'clientName'>) => {
    const full: ClientFeedbackEntry = {
      ...entry,
      id: crypto.randomUUID(),
      clientName: clientName.trim() || 'Client',
      createdAt: new Date().toISOString(),
    }
    const next = await clientRoomAction(token, { action: 'feedback', entry: full })
    setData(next)
  }

  const postMessage = async (body: string) => {
    const msg: ClientMessage = {
      id: crypto.randomUUID(),
      from: 'client',
      authorName: clientName.trim() || 'Client',
      body,
      createdAt: new Date().toISOString(),
    }
    const next = await clientRoomAction(token, { action: 'message', entry: msg })
    setData(next)
  }

  const submitSignOff = async (note: string) => {
    const entry: ClientSignOff = {
      approved: true,
      clientName: clientName.trim() || 'Client',
      signedAt: new Date().toISOString(),
      note,
    }
    const next = await clientRoomAction(token, { action: 'signoff', entry })
    setData(next)
  }

  const toggleChecklist = async (itemId: string, checked: boolean) => {
    const next = await clientRoomAction(token, { action: 'checklist', itemId, checked })
    setData(next)
  }

  const submitSurvey = async (rating: number, comment: string) => {
    const entry: ClientSurveyResponse = {
      rating,
      comment,
      submittedAt: new Date().toISOString(),
    }
    const next = await clientRoomAction(token, { action: 'survey', entry })
    setData(next)
  }

  const uploadAsset = async (file: File) => {
    const next = await clientRoomAction(token, {
      action: 'asset',
      entry: { id: crypto.randomUUID(), name: file.name, size: file.size, mimeType: file.type },
    })
    setData(next)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-50">
        <Loader2 className="animate-spin text-brand-600" size={32} />
      </div>
    )
  }

  if (notFound || !session || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-50 p-4">
        <Card className="max-w-md w-full p-8 text-center">
          <h1 className="text-lg font-semibold text-surface-900 mb-2">Hub unavailable</h1>
          <p className="text-sm text-surface-500">This link is invalid or the review room has been turned off.</p>
        </Card>
      </div>
    )
  }

  const ndaAccepted = Boolean(data.ndaAcceptedAt) || !session.config.ndaRequired

  return (
    <ClientRoomContext.Provider
      value={{
        session,
        data,
        unlocked,
        ndaAccepted,
        clientName,
        setClientName,
        tryPassword,
        acceptNda,
        logAudit,
        submitFeedback,
        postMessage,
        submitSignOff,
        toggleChecklist,
        submitSurvey,
        uploadAsset,
        refresh: load,
      }}
    >
      {children}
    </ClientRoomContext.Provider>
  )
}

export function useClientRoom() {
  const ctx = useContext(ClientRoomContext)
  if (!ctx) throw new Error('useClientRoom must be used within ClientRoomProvider')
  return ctx
}
