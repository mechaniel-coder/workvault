import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useStore } from '../context/StoreContext'
import { callAssistantTurn, type AssistantChatMessage } from '../lib/ai-assistant/api'
import { executeAssistantTool, type AssistantStore } from '../lib/ai-assistant/executor'
import {
  buildCursorCliChatContext,
  loadCursorCliChatHistory,
  saveCursorCliChatHistory,
  clearCursorCliChatHistory,
  type CursorCliChatMessage,
} from '../lib/cursor-cli-chat'
import type { CursorCliMode } from '../lib/types'

const MAX_TOOL_ROUNDS = 8

export function useCursorCliChat(mode: CursorCliMode, model: string) {
  const location = useLocation()
  const { state, isReadOnly, ...store } = useStore()

  const [messages, setMessages] = useState<CursorCliChatMessage[]>(() => loadCursorCliChatHistory())
  const [thread, setThread] = useState<AssistantChatMessage[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const stateRef = useRef(state)
  useEffect(() => { stateRef.current = state }, [state])

  useEffect(() => {
    saveCursorCliChatHistory(messages)
  }, [messages])

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
      const context = buildCursorCliChatContext(stateRef.current, location.pathname, mode, model)
      const turn = await callAssistantTurn(current, context, 'cursor-cli')

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
          navigate: () => {},
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
      reply: lastContent || 'I gathered context from WorkVault. Ask for a specific agent command if you need one.',
    }
  }, [assistantStore, isReadOnly, location.pathname, mode, model])

  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim()
    if (!trimmed || busy) return
    if (!state.cursorCli.settings.enabled) {
      setError('Enable Cursor CLI integration on the Setup tab first.')
      return
    }

    const userUi: CursorCliChatMessage = { id: crypto.randomUUID(), role: 'user', content: trimmed }
    const pendingUi: CursorCliChatMessage = { id: crypto.randomUUID(), role: 'assistant', content: '', pending: true }

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
          return [...withoutPending, { id: crypto.randomUUID(), role: 'assistant', content: turnError }]
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
  }, [busy, runToolLoop, state.cursorCli.settings.enabled, thread])

  const clearChat = useCallback(() => {
    setMessages([])
    setThread([])
    setError(null)
    clearCursorCliChatHistory()
  }, [])

  return { messages, busy, error, sendMessage, clearChat }
}
