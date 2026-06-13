import {
  createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode,
} from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useStore } from './StoreContext'
import { buildAppContext } from '../lib/ai-assistant/context'
import { callAssistantTurn, type AssistantChatMessage } from '../lib/ai-assistant/api'
import { executeAssistantTool, type AssistantStore } from '../lib/ai-assistant/executor'

export type UiMessage = {
  id: string
  role: 'user' | 'assistant'
  content: string
  pending?: boolean
}

type AiAssistantContextType = {
  open: boolean
  setOpen: (open: boolean) => void
  toggle: () => void
  messages: UiMessage[]
  busy: boolean
  error: string | null
  sendMessage: (text: string) => Promise<void>
  clearChat: () => void
}

const AiAssistantContext = createContext<AiAssistantContextType | null>(null)

const MAX_TOOL_ROUNDS = 12

const STARTER_PROMPTS = [
  'What needs my attention today?',
  'Create an invoice for my latest client',
  'Log 2 hours on my active project',
  'Show overdue invoices',
]

export function AiAssistantProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { state, isReadOnly, ...store } = useStore()

  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<UiMessage[]>([])
  const [thread, setThread] = useState<AssistantChatMessage[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const stateRef = useRef(state)
  useEffect(() => { stateRef.current = state }, [state])

  const assistantStore = useMemo((): AssistantStore => ({
    addClient: store.addClient,
    updateClient: store.updateClient,
    addProject: store.addProject,
    updateProject: store.updateProject,
    addTimeEntry: store.addTimeEntry,
    startTimer: store.startTimer,
    stopTimer: store.stopTimer,
    addInvoice: store.addInvoice,
    updateInvoice: store.updateInvoice,
    addScopeEntry: store.addScopeEntry,
    addProposal: store.addProposal,
    addExpense: store.addExpense,
    addContract: store.addContract,
  }), [store])

  const runToolLoop = useCallback(async (
    initialThread: AssistantChatMessage[],
  ): Promise<{ thread: AssistantChatMessage[]; reply: string; error?: string }> => {
    let current = [...initialThread]
    let lastContent = ''

    for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
      const context = buildAppContext(stateRef.current, location.pathname)
      const turn = await callAssistantTurn(current, context)

      if (turn.error) {
        return { thread: current, reply: '', error: turn.error }
      }

      if (turn.toolCalls.length === 0) {
        lastContent = turn.content || 'Done.'
        current = [...current, { role: 'assistant', content: lastContent }]
        return { thread: current, reply: lastContent }
      }

      const assistantMsg: AssistantChatMessage = {
        role: 'assistant',
        content: turn.content || '',
        toolCalls: turn.toolCalls,
      }
      current = [...current, assistantMsg]

      for (const tc of turn.toolCalls) {
        let parsed: Record<string, unknown> = {}
        try {
          parsed = JSON.parse(tc.arguments || '{}')
        } catch {
          parsed = {}
        }
        const result = executeAssistantTool(tc.name, parsed, {
          state: stateRef.current,
          store: assistantStore,
          navigate,
          readOnly: isReadOnly,
        })
        current = [...current, {
          role: 'tool',
          toolCallId: tc.id,
          content: JSON.stringify(result),
        }]
        await new Promise((r) => setTimeout(r, 0))
      }
    }

    return {
      thread: current,
      reply: lastContent || 'I completed several steps. Ask if you need anything else.',
    }
  }, [assistantStore, isReadOnly, location.pathname, navigate])

  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim()
    if (!trimmed || busy) return

    const userUi: UiMessage = { id: crypto.randomUUID(), role: 'user', content: trimmed }
    const pendingUi: UiMessage = { id: crypto.randomUUID(), role: 'assistant', content: '', pending: true }

    setMessages((prev) => [...prev, userUi, pendingUi])
    setBusy(true)
    setError(null)

    const userThread: AssistantChatMessage = { role: 'user', content: trimmed }
    const nextThread = [...thread, userThread]

    try {
      const { thread: updated, reply, error: turnError } = await runToolLoop(nextThread)
      setThread(updated)

      if (turnError) {
        setError(turnError)
        setMessages((prev) => {
          const withoutPending = prev.filter((m) => !m.pending)
          return [
            ...withoutPending,
            { id: crypto.randomUUID(), role: 'assistant', content: turnError },
          ]
        })
        return
      }

      setMessages((prev) => {
        const withoutPending = prev.filter((m) => !m.pending)
        return [...withoutPending, { id: crypto.randomUUID(), role: 'assistant', content: reply }]
      })
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Something went wrong'
      setError(msg)
      setMessages((prev) => prev.filter((m) => !m.pending))
    } finally {
      setBusy(false)
    }
  }, [busy, runToolLoop, thread])

  const clearChat = useCallback(() => {
    setMessages([])
    setThread([])
    setError(null)
  }, [])

  const value = useMemo(() => ({
    open,
    setOpen,
    toggle: () => setOpen((v) => !v),
    messages,
    busy,
    error,
    sendMessage,
    clearChat,
  }), [open, messages, busy, error, sendMessage, clearChat])

  return (
    <AiAssistantContext.Provider value={value}>
      {children}
      {/* expose starters via context if needed later */}
    </AiAssistantContext.Provider>
  )
}

export function useAiAssistant() {
  const ctx = useContext(AiAssistantContext)
  if (!ctx) throw new Error('useAiAssistant must be used within AiAssistantProvider')
  return ctx
}

export { STARTER_PROMPTS }
