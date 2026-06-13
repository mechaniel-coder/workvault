import { useEffect, useState } from 'react'
import { Inbox, Loader2, Mail, RefreshCw, Send, ExternalLink } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useStore } from '../context/StoreContext'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { PageHeader, EmptyState } from '../components/ui/Modal'
import { deliverEmail, fetchGmailInbox } from '../lib/integrations-api'
import type { GmailThreadSummary } from '../lib/types'

export default function InboxPage() {
  const { state, setGmailInboxCache } = useStore()
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState('')
  const [replyTo, setReplyTo] = useState<{ email: string; subject: string } | null>(null)
  const [replyBody, setReplyBody] = useState('')
  const [sending, setSending] = useState(false)

  const threads = state.gmailInboxCache

  const loadInbox = async () => {
    if (!state.integrationCredentials.gmailRefreshToken) {
      setStatus('Connect Gmail in Integrations first')
      return
    }
    setLoading(true)
    setStatus('')
    try {
      const data = await fetchGmailInbox(state)
      const mapped: GmailThreadSummary[] = data.map((t) => {
        const client = state.clients.find((c) => c.email && t.clientEmail?.toLowerCase() === c.email.toLowerCase())
        return {
          id: t.id,
          threadId: t.threadId,
          from: t.from,
          to: t.to,
          subject: t.subject,
          snippet: t.snippet,
          date: t.date,
          clientId: client?.id ?? null,
          clientName: client?.name ?? null,
          unread: t.unread,
        }
      })
      setGmailInboxCache(mapped)
      setStatus(`Loaded ${mapped.length} messages`)
    } catch (e) {
      setStatus(e instanceof Error ? e.message : 'Inbox load failed')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (state.integrations.gmailInboxEnabled && state.integrationCredentials.gmailRefreshToken && threads.length === 0) {
      loadInbox()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleReply = async () => {
    if (!replyTo || !replyBody.trim()) return
    setSending(true)
    try {
      const result = await deliverEmail(state, replyTo.email, `Re: ${replyTo.subject}`, replyBody)
      if (!result.ok) throw new Error(result.error)
      setStatus('Reply sent')
      setReplyTo(null)
      setReplyBody('')
    } catch (e) {
      setStatus(e instanceof Error ? e.message : 'Send failed')
    } finally {
      setSending(false)
    }
  }

  const extractEmail = (from: string) => {
    const match = from.match(/<([^>]+)>/)
    return match?.[1] || from
  }

  return (
    <div>
      <PageHeader
        title="Inbox"
        description="Client email threads from Gmail — send invoices and replies without leaving WorkVault."
        action={
          <div className="flex gap-2">
            <Link to="/integrations">
              <Button variant="secondary"><ExternalLink size={16} /> Integrations</Button>
            </Link>
            <Button onClick={loadInbox} disabled={loading}>
              {loading ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
              Refresh
            </Button>
          </div>
        }
      />

      {status && (
        <Card className="mb-6 p-4 border-brand-200 bg-brand-50/50">
          <p className="text-sm text-brand-800">{status}</p>
        </Card>
      )}

      {!state.integrationCredentials.gmailRefreshToken ? (
        <Card>
          <EmptyState
            icon={<Mail size={24} />}
            title="Gmail not connected"
            description="Connect Gmail in Integrations to read client threads and send replies from your own address."
            action={<Link to="/integrations"><Button>Go to Integrations</Button></Link>}
          />
        </Card>
      ) : threads.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Inbox size={24} />}
            title="No messages loaded"
            description="Refresh to pull recent emails from your clients."
            action={<Button onClick={loadInbox}>Load inbox</Button>}
          />
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
          <Card>
            <div className="divide-y divide-surface-100">
              {threads.map((thread) => (
                <div key={thread.id} className={`p-4 hover:bg-surface-50 ${thread.unread ? 'bg-brand-50/30' : ''}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-surface-900 truncate">{thread.subject || '(no subject)'}</p>
                        {thread.unread && <Badge status="sent">Unread</Badge>}
                        {thread.clientName && <Badge status="signed">{thread.clientName}</Badge>}
                      </div>
                      <p className="text-xs text-surface-500 mt-0.5">{thread.from}</p>
                      <p className="text-sm text-surface-600 mt-2 line-clamp-2">{thread.snippet}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-xs text-surface-400">{new Date(thread.date).toLocaleDateString()}</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="mt-2"
                        onClick={() => setReplyTo({ email: extractEmail(thread.from), subject: thread.subject })}
                      >
                        <Send size={14} /> Reply
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-5 h-fit">
            <h2 className="text-base font-semibold text-surface-900 mb-3">Quick reply</h2>
            {replyTo ? (
              <div className="space-y-3">
                <p className="text-sm text-surface-600">To: {replyTo.email}</p>
                <textarea
                  className="w-full rounded-lg border border-surface-200 p-3 text-sm min-h-[120px]"
                  value={replyBody}
                  onChange={(e) => setReplyBody(e.target.value)}
                  placeholder="Write your reply..."
                />
                <div className="flex gap-2">
                  <Button onClick={handleReply} disabled={sending}>
                    {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                    Send
                  </Button>
                  <Button variant="ghost" onClick={() => setReplyTo(null)}>Cancel</Button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-surface-500">Select Reply on a message to compose a response via Gmail.</p>
            )}
          </Card>
        </div>
      )}
    </div>
  )
}
