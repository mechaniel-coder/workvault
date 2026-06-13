import { useEffect, useRef, useState } from 'react'
import { Sparkles, X, Send, Loader2, Trash2, Minimize2 } from 'lucide-react'
import { useAiAssistant, STARTER_PROMPTS } from '../context/AiAssistantContext'
import { Button } from './ui/Button'

export function AiAssistantPanel() {
  const {
    open, setOpen, messages, busy, error, sendMessage, clearChat,
  } = useAiAssistant()
  const [input, setInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (open) {
      inputRef.current?.focus()
    }
  }, [open])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, open])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen(true)
        inputRef.current?.focus()
      }
      if (e.key === 'Escape' && open) {
        setOpen(false)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, setOpen])

  const submit = async () => {
    const text = input.trim()
    if (!text) return
    setInput('')
    await sendMessage(text)
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full gradient-brand px-4 py-3 text-sm font-medium text-white shadow-lg shadow-brand-600/30 hover:opacity-95 transition-opacity"
        title="Open AI assistant (⌘K)"
      >
        <Sparkles size={18} />
        Assistant
      </button>
    )
  }

  return (
    <div className="fixed bottom-6 right-6 z-40 flex w-[min(420px,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-surface-200 bg-white shadow-2xl shadow-surface-900/10">
      <div className="flex items-center justify-between border-b border-surface-100 bg-gradient-to-r from-brand-50 to-white px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-brand text-white">
            <Sparkles size={16} />
          </div>
          <div>
            <p className="text-sm font-semibold text-surface-900">WorkVault Assistant</p>
            <p className="text-[10px] text-surface-500">Ask me to do anything in the app</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={clearChat}
            className="rounded-lg p-1.5 text-surface-400 hover:bg-surface-100 hover:text-surface-600"
            title="Clear chat"
          >
            <Trash2 size={14} />
          </button>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-lg p-1.5 text-surface-400 hover:bg-surface-100 hover:text-surface-600"
            title="Minimize"
          >
            <Minimize2 size={14} />
          </button>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-lg p-1.5 text-surface-400 hover:bg-surface-100 hover:text-surface-600"
            title="Close"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      <div className="flex-1 max-h-[min(480px,60vh)] overflow-y-auto px-4 py-4 space-y-3">
        {messages.length === 0 && (
          <div className="space-y-3">
            <p className="text-sm text-surface-600 leading-relaxed">
              I can create clients, projects, invoices, log time, move pipeline stages, navigate anywhere, and more — just ask in plain language.
            </p>
            <div className="flex flex-wrap gap-2">
              {STARTER_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => sendMessage(prompt)}
                  className="rounded-full border border-surface-200 bg-surface-50 px-3 py-1.5 text-xs text-surface-700 hover:border-brand-300 hover:bg-brand-50 transition-colors text-left"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[90%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-brand-600 text-white rounded-br-md'
                  : 'bg-surface-100 text-surface-800 rounded-bl-md'
              }`}
            >
              {msg.pending ? (
                <span className="flex items-center gap-2 text-surface-500">
                  <Loader2 size={14} className="animate-spin" /> Working…
                </span>
              ) : (
                <span className="whitespace-pre-wrap">{msg.content}</span>
              )}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {error && (
        <div className="mx-4 mb-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          {error}
        </div>
      )}

      <div className="border-t border-surface-100 p-3">
        <div className="flex gap-2 items-end">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                void submit()
              }
            }}
            rows={2}
            placeholder="Ask me to do something…"
            disabled={busy}
            className="flex-1 resize-none rounded-xl border border-surface-200 bg-surface-50 px-3 py-2 text-sm text-surface-800 placeholder:text-surface-400 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/15 disabled:opacity-60"
          />
          <Button onClick={() => void submit()} disabled={busy || !input.trim()} size="sm" className="shrink-0 mb-0.5">
            {busy ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          </Button>
        </div>
        <p className="mt-2 text-[10px] text-surface-400 text-center">⌘K to open · Enter to send</p>
      </div>
    </div>
  )
}

export function AiAssistantSearchTrigger() {
  const { setOpen } = useAiAssistant()

  return (
    <button
      type="button"
      onClick={() => setOpen(true)}
      className="relative hidden sm:flex w-52 items-center rounded-lg border border-surface-200 bg-surface-50 pl-9 pr-3 py-1.5 text-sm text-surface-400 hover:border-brand-300 hover:bg-white transition-all text-left"
    >
      <Sparkles size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-500" />
      Ask assistant…
      <span className="ml-auto text-[10px] text-surface-300">⌘K</span>
    </button>
  )
}
