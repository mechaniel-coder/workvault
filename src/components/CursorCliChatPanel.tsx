import { useEffect, useRef, useState } from 'react'
import { Terminal, Send, Loader2, Trash2, Copy, Check } from 'lucide-react'
import { useStore } from '../context/StoreContext'
import { Button } from './ui/Button'
import { Select } from './ui/Select'
import { Card } from './ui/Card'
import { useCursorCliChat } from '../hooks/useCursorCliChat'
import {
  CURSOR_CLI_STARTER_PROMPTS,
  extractAgentCommands,
} from '../lib/cursor-cli-chat'
import { CURSOR_CLI_MODELS, CURSOR_CLI_MODES } from '../lib/cursor-cli'
import type { CursorCliMode } from '../lib/types'

function MessageBody({ content }: { content: string }) {
  const parts = content.split(/(```[\s\S]*?```)/g)
  return (
    <div className="space-y-2 whitespace-pre-wrap break-words">
      {parts.map((part, i) => {
        const codeMatch = part.match(/^```(?:bash|sh|shell|)?\n?([\s\S]*?)```$/i)
        if (codeMatch) {
          return (
            <pre
              key={i}
              className="text-[11px] leading-5 p-3 rounded-lg bg-surface-900 text-emerald-300 overflow-x-auto font-mono"
            >
              {codeMatch[1].trim()}
            </pre>
          )
        }
        return part ? <span key={i}>{part.trim()}</span> : null
      })}
    </div>
  )
}

export function CursorCliChatPanel() {
  const { state } = useStore()
  const { settings } = state.cursorCli
  const [mode, setMode] = useState<CursorCliMode>(settings.defaultMode)
  const [model, setModel] = useState(settings.defaultModel)
  const [input, setInput] = useState('')
  const [copied, setCopied] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const { messages, busy, error, sendMessage, clearChat } = useCursorCliChat(mode, model)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    setMode(settings.defaultMode)
    setModel(settings.defaultModel)
  }, [settings.defaultMode, settings.defaultModel])

  const submit = async () => {
    const text = input.trim()
    if (!text) return
    setInput('')
    await sendMessage(text)
  }

  const copyCommand = async (cmd: string) => {
    await navigator.clipboard.writeText(cmd)
    setCopied(cmd)
    setTimeout(() => setCopied(''), 2000)
  }

  return (
    <div className="flex flex-col min-h-[calc(100vh-16rem)]">
      <div className="flex flex-wrap items-end gap-3 mb-4">
        <Select
          label="Mode"
          value={mode}
          onChange={(e) => setMode(e.target.value as CursorCliMode)}
          options={CURSOR_CLI_MODES.map((m) => ({ value: m.value, label: m.label }))}
          className="w-40"
        />
        <Select
          label="Model"
          value={model}
          onChange={(e) => setModel(e.target.value)}
          options={CURSOR_CLI_MODELS.map((m) => ({ value: m.value, label: m.label }))}
          className="w-52"
        />
        <Button variant="ghost" size="sm" onClick={clearChat} className="ml-auto" disabled={!messages.length}>
          <Trash2 size={14} /> Clear chat
        </Button>
      </div>

      {!settings.enabled && (
        <Card className="mb-4 p-4 border-amber-200 bg-amber-50/60">
          <p className="text-sm text-amber-800">
            Enable Cursor CLI on the Setup tab to use chat. You can still browse prompts, but messages won&apos;t send until it&apos;s on.
          </p>
        </Card>
      )}

      <Card className="flex-1 flex flex-col overflow-hidden border-surface-200">
        <div className="flex items-center gap-2 border-b border-surface-100 bg-surface-900 px-4 py-2.5 rounded-t-xl">
          <Terminal size={14} className="text-emerald-400" />
          <span className="text-xs font-mono text-surface-300">cursor agent — WorkVault context</span>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 min-h-[320px] max-h-[calc(100vh-22rem)]">
          {messages.length === 0 && (
            <div className="space-y-4 py-4">
              <p className="text-sm text-surface-600 leading-relaxed max-w-xl">
                Plan Cursor CLI prompts using your WorkVault data — clients, invoices, contracts, and saved workflows.
                Replies include copy-paste <code className="text-xs bg-surface-100 px-1 rounded">agent</code> commands for your terminal.
              </p>
              <div className="flex flex-wrap gap-2">
                {CURSOR_CLI_STARTER_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => void sendMessage(prompt)}
                    disabled={busy || !settings.enabled}
                    className="rounded-full border border-surface-200 bg-surface-50 px-3 py-1.5 text-xs text-surface-700 hover:border-brand-300 hover:bg-brand-50 transition-colors text-left disabled:opacity-50"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg) => {
            const commands = msg.role === 'assistant' && !msg.pending
              ? extractAgentCommands(msg.content)
              : []

            return (
              <div
                key={msg.id}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[min(640px,92%)] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-brand-600 text-white rounded-br-md'
                      : 'bg-surface-50 border border-surface-100 text-surface-800 rounded-bl-md'
                  }`}
                >
                  {msg.pending ? (
                    <span className="flex items-center gap-2 text-surface-500">
                      <Loader2 size={14} className="animate-spin" /> Drafting prompt…
                    </span>
                  ) : msg.role === 'user' ? (
                    <span className="whitespace-pre-wrap">{msg.content}</span>
                  ) : (
                    <>
                      <MessageBody content={msg.content} />
                      {commands.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {commands.map((cmd) => (
                            <Button
                              key={cmd}
                              variant="secondary"
                              size="sm"
                              onClick={() => void copyCommand(cmd)}
                            >
                              {copied === cmd ? <><Check size={14} /> Copied</> : <><Copy size={14} /> Copy command</>}
                            </Button>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            )
          })}
          <div ref={bottomRef} />
        </div>

        {error && (
          <div className="mx-4 mb-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
            {error}
          </div>
        )}

        <div className="border-t border-surface-100 p-4 bg-white rounded-b-xl">
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
              placeholder={settings.enabled ? 'Describe what you want the Cursor agent to do…' : 'Enable CLI integration to send messages'}
              disabled={busy || !settings.enabled}
              className="flex-1 resize-none rounded-xl border border-surface-200 bg-surface-50 px-3 py-2 text-sm text-surface-800 placeholder:text-surface-400 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/15 disabled:opacity-60 font-mono"
            />
            <Button onClick={() => void submit()} disabled={busy || !input.trim() || !settings.enabled} size="sm" className="shrink-0 mb-0.5">
              {busy ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            </Button>
          </div>
          <p className="mt-2 text-[10px] text-surface-400">
            Uses WorkVault AI to draft CLI prompts · Run commands in your project terminal
          </p>
        </div>
      </Card>
    </div>
  )
}
