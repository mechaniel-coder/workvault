import { useState, type ReactNode } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  Lock, Shield, CheckCircle2, MessageSquare, ListChecks, PenLine,
  Calendar, Upload, Star, FileText, Receipt, Globe, ChevronRight,
  ThumbsUp, AlertCircle, Sparkles,
} from 'lucide-react'
import { ClientRoomProvider, useClientRoom } from '../context/ClientRoomContext'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Textarea } from '../components/ui/Textarea'
import { Badge } from '../components/ui/Badge'
import { formatCurrency, formatDate } from '../lib/utils'
import { formatFileSize } from '../lib/demo-project-store'
import { hasProjectTransferContent } from '../lib/demo'
import { demoViewGuardPropsFor } from '../lib/demo-files'

function Watermark({ text }: { text: string }) {
  if (!text) return null
  return (
    <div
      className="pointer-events-none fixed inset-0 z-[100] flex items-center justify-center overflow-hidden opacity-[0.06]"
      aria-hidden
    >
      <p className="text-4xl sm:text-6xl font-bold rotate-[-24deg] select-none whitespace-nowrap text-surface-900">
        {text}
      </p>
    </div>
  )
}

function GuidedTour() {
  const { session } = useClientRoom()
  const key = `wv-tour-${session.token}`
  const [step, setStep] = useState(() => (localStorage.getItem(key) ? -1 : 0))

  if (!session.config.guidedTourEnabled || step < 0) return null

  const steps = [
    { title: 'Your project hub', body: 'Everything you need to review deliverables, approve work, and stay in sync — in one place.' },
    { title: 'Review & feedback', body: 'Use the checklist, leave comments, and approve or request changes on specific items.' },
    { title: 'Questions & sign-off', body: 'Ask questions in the Q&A thread, book a call, and sign off when you\'re ready.' },
  ]

  if (step >= steps.length) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-4">
      <Card className="max-w-md w-full p-6 shadow-xl">
        <p className="text-xs font-semibold uppercase tracking-wider text-brand-600 mb-1">Step {step + 1} of {steps.length}</p>
        <h3 className="text-lg font-semibold text-surface-900">{steps[step].title}</h3>
        <p className="text-sm text-surface-600 mt-2 leading-relaxed">{steps[step].body}</p>
        <div className="flex justify-end gap-2 mt-6">
          <Button variant="secondary" onClick={() => { localStorage.setItem(key, '1'); setStep(-1) }}>Skip</Button>
          <Button onClick={() => {
            if (step + 1 >= steps.length) { localStorage.setItem(key, '1'); setStep(-1) }
            else setStep(step + 1)
          }}>
            {step + 1 >= steps.length ? 'Get started' : 'Next'}
          </Button>
        </div>
      </Card>
    </div>
  )
}

function AccessGates({ children }: { children: ReactNode }) {
  const { session, unlocked, ndaAccepted, clientName, setClientName, tryPassword, acceptNda } = useClientRoom()
  const [password, setPassword] = useState('')
  const [pwError, setPwError] = useState(false)

  if (session.config.linkPassword && !unlocked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-50 p-4">
        <Card className="max-w-sm w-full p-8">
          <Lock className="mx-auto text-brand-600 mb-3" size={28} />
          <h1 className="text-xl font-semibold text-center text-surface-900">Protected review room</h1>
          <p className="text-sm text-surface-500 text-center mt-2">Enter the password from your contractor.</p>
          <Input label="Password" type="password" value={password} className="mt-4" onChange={(e) => setPassword(e.target.value)} />
          {pwError && <p className="text-xs text-red-600 mt-2">Incorrect password.</p>}
          <Button className="w-full mt-4" onClick={() => setPwError(!tryPassword(password))}>Continue</Button>
        </Card>
      </div>
    )
  }

  if (session.config.ndaRequired && !ndaAccepted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-50 p-4">
        <Card className="max-w-lg w-full p-8">
          <Shield className="mx-auto text-brand-600 mb-3" size={28} />
          <h1 className="text-xl font-semibold text-center text-surface-900">Confidentiality agreement</h1>
          <p className="text-sm text-surface-600 mt-4 whitespace-pre-wrap leading-relaxed">{session.config.ndaText}</p>
          <Input label="Your full name" value={clientName} onChange={(e) => setClientName(e.target.value)} className="mt-4" />
          <Button className="w-full mt-4" disabled={!clientName.trim()} onClick={acceptNda}>I agree — continue to review</Button>
        </Card>
      </div>
    )
  }

  return <>{children}</>
}

function HubContent() {
  const {
    session, data, clientName, setClientName, submitFeedback, postMessage,
    submitSignOff, toggleChecklist, submitSurvey, uploadAsset,
  } = useClientRoom()

  const [msg, setMsg] = useState('')
  const [feedbackComment, setFeedbackComment] = useState('')
  const [feedbackStatus, setFeedbackStatus] = useState<'approve' | 'changes'>('approve')
  const [signOffNote, setSignOffNote] = useState('')
  const [surveyRating, setSurveyRating] = useState(0)
  const [surveyComment, setSurveyComment] = useState('')
  const cfg = session.config
  const transfer = session.projectTransfer
  const guard = demoViewGuardPropsFor(session.allowDownloads)

  const outstanding = session.invoices.filter((i) => i.status === 'sent' || i.status === 'overdue')
  const pendingContracts = session.contracts.filter((c) => c.status !== 'signed')

  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-50/40 to-surface-50 pb-12">
      <Watermark text={cfg.watermarkText} />

      <header className="border-b border-surface-200 bg-white/90 backdrop-blur-xl sticky top-0 z-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
          <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-widest text-brand-600">{session.contractorName}</p>
          <h1 className="text-xl sm:text-2xl font-bold text-surface-900 mt-0.5">{session.label || 'Client Hub'}</h1>
          {cfg.versionLabel && <Badge status="sent">{cfg.versionLabel}</Badge>}
          {cfg.hubWelcomeMessage && (
            <p className="text-sm text-surface-600 mt-2 leading-relaxed">{cfg.hubWelcomeMessage}</p>
          )}
          {!clientName && (
            <Input label="Your name" placeholder="For feedback & sign-off" className="mt-3 max-w-xs" value={clientName} onChange={(e) => setClientName(e.target.value)} />
          )}
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {(outstanding.length > 0 || pendingContracts.length > 0) && (
          <Card className="p-5 border-brand-200 bg-brand-50/50">
            <h2 className="text-sm font-semibold text-surface-900 mb-3">What&apos;s due next</h2>
            <div className="space-y-2 text-sm">
              {outstanding.map((inv) => (
                <div key={inv.number} className="flex justify-between gap-2">
                  <span className="text-surface-700"><Receipt size={14} className="inline mr-1 -mt-0.5" />{inv.number} due {formatDate(inv.dueDate)}</span>
                  <span className="font-medium shrink-0">{formatCurrency(inv.total, inv.currency)}</span>
                </div>
              ))}
              {pendingContracts.map((c) => (
                <div key={c.number} className="flex justify-between gap-2">
                  <span className="text-surface-700"><FileText size={14} className="inline mr-1 -mt-0.5" />{c.title}</span>
                  <Badge status={c.status}>{c.status}</Badge>
                </div>
              ))}
            </div>
          </Card>
        )}

        {cfg.milestones.length > 0 && (
          <Card className="p-5">
            <h2 className="text-sm font-semibold text-surface-900 mb-4">Project timeline</h2>
            <div className="space-y-3">
              {cfg.milestones.map((m) => (
                <div key={m.id} className="flex gap-3">
                  <div className={`mt-1 h-3 w-3 rounded-full shrink-0 ${m.status === 'done' ? 'bg-emerald-500' : m.status === 'active' ? 'bg-brand-500' : 'bg-surface-300'}`} />
                  <div className="flex-1 pb-3 border-b border-surface-100 last:border-0">
                    <p className="text-sm font-medium text-surface-900">{m.title}</p>
                    <p className="text-xs text-surface-400">{formatDate(m.date)} · {m.status}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {hasProjectTransferContent(transfer) && session.demoUrl && (
          <Link to={`/demo/${session.token}/project`} className="flex items-center justify-between p-4 rounded-xl border border-surface-200 bg-white hover:bg-surface-50 transition-colors">
            <div>
              <p className="text-sm font-medium text-surface-900">{transfer.title || 'Project deliverables'}</p>
              <p className="text-xs text-surface-500 mt-0.5">{transfer.deliverables.length} file{transfer.deliverables.length !== 1 ? 's' : ''} · view in review room</p>
            </div>
            <ChevronRight size={18} className="text-surface-400" />
          </Link>
        )}

        {session.contracts.length > 0 && (
          <Card className="p-5">
            <h2 className="text-sm font-semibold text-surface-900 mb-3"><FileText size={16} className="inline mr-1" /> Contracts</h2>
            <div className="space-y-3">
              {session.contracts.map((c) => (
                <div key={c.number} className="p-3 rounded-lg border border-surface-100 flex justify-between gap-2">
                  <div>
                    <p className="font-medium text-sm">{c.number} — {c.title}</p>
                    <p className="text-xs text-surface-400">{formatCurrency(c.value, c.currency)}</p>
                  </div>
                  <Badge status={c.status}>{c.status}</Badge>
                </div>
              ))}
            </div>
          </Card>
        )}

        {transfer.appPreviewUrl && (
          <Card className="overflow-hidden">
            <div className="px-4 py-3 border-b border-surface-100 flex items-center gap-2 text-sm font-medium">
              <Globe size={16} className="text-brand-600" /> Live preview
            </div>
            <div {...guard} className="relative bg-surface-100" style={{ height: 'min(50vh, 400px)' }}>
              <iframe title="Preview" src={transfer.appPreviewUrl} className="absolute inset-0 w-full h-full border-0" sandbox="allow-scripts allow-same-origin allow-forms allow-popups" />
            </div>
          </Card>
        )}

        {cfg.checklist.length > 0 && (
          <Card className="p-5">
            <h2 className="text-sm font-semibold text-surface-900 flex items-center gap-2 mb-3"><ListChecks size={16} /> Review checklist</h2>
            <div className="space-y-2">
              {cfg.checklist.map((item) => {
                const prog = data.checklistProgress.find((p) => p.itemId === item.id)
                return (
                  <label key={item.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-surface-50 cursor-pointer">
                    <input type="checkbox" checked={prog?.checked || false} onChange={(e) => toggleChecklist(item.id, e.target.checked)} className="mt-1 rounded text-brand-600" />
                    <span className="text-sm text-surface-800">{item.label}{item.required && <span className="text-red-500 ml-1">*</span>}</span>
                  </label>
                )
              })}
            </div>
          </Card>
        )}

        <Card className="p-5">
          <h2 className="text-sm font-semibold text-surface-900 flex items-center gap-2 mb-3"><PenLine size={16} /> Feedback</h2>
          <div className="flex gap-2 mb-3">
            <Button variant={feedbackStatus === 'approve' ? 'primary' : 'secondary'} size="sm" onClick={() => setFeedbackStatus('approve')}><ThumbsUp size={14} /> Approve</Button>
            <Button variant={feedbackStatus === 'changes' ? 'primary' : 'secondary'} size="sm" onClick={() => setFeedbackStatus('changes')}><AlertCircle size={14} /> Request changes</Button>
          </div>
          <Textarea placeholder="Your comments…" value={feedbackComment} onChange={(e) => setFeedbackComment(e.target.value)} />
          <Button className="mt-3" size="sm" onClick={() => {
            submitFeedback({ targetType: 'general', targetId: '', targetLabel: 'General', status: feedbackStatus, comment: feedbackComment })
            setFeedbackComment('')
          }}>Submit feedback</Button>
          {data.feedback.length > 0 && (
            <div className="mt-4 space-y-2 border-t border-surface-100 pt-4">
              {data.feedback.slice(0, 5).map((f) => (
                <div key={f.id} className="text-xs p-2 rounded-lg bg-surface-50">
                  <span className="font-medium">{f.clientName}</span> · <Badge status={f.status === 'approve' ? 'paid' : 'overdue'}>{f.status}</Badge>
                  <p className="text-surface-600 mt-1">{f.comment || '—'}</p>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-5">
          <h2 className="text-sm font-semibold text-surface-900 flex items-center gap-2 mb-3"><MessageSquare size={16} /> Q&amp;A</h2>
          <div className="max-h-48 overflow-y-auto space-y-2 mb-3">
            {data.messages.length === 0 ? <p className="text-xs text-surface-400">No messages yet.</p> : data.messages.map((m) => (
              <div key={m.id} className={`text-sm p-2 rounded-lg ${m.from === 'client' ? 'bg-brand-50 ml-4' : 'bg-surface-100 mr-4'}`}>
                <p className="text-[10px] font-semibold text-surface-500">{m.authorName}</p>
                <p className="text-surface-800">{m.body}</p>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <Input value={msg} onChange={(e) => setMsg(e.target.value)} placeholder="Ask a question…" className="flex-1" />
            <Button onClick={() => { if (msg.trim()) { postMessage(msg.trim()); setMsg('') } }}>Send</Button>
          </div>
        </Card>

        {cfg.availabilitySlots.length > 0 && (
          <Card className="p-5">
            <h2 className="text-sm font-semibold text-surface-900 flex items-center gap-2 mb-3"><Calendar size={16} /> Book a review call</h2>
            <div className="space-y-2">
              {cfg.availabilitySlots.slice(0, 8).map((slot, i) => (
                <div key={i} className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-lg border border-surface-100 text-sm">
                  <span>{formatDate(slot.date)} · {slot.startTime}–{slot.endTime}</span>
                  <a href={`mailto:?subject=Review call request&body=I'd like to book ${slot.date} at ${slot.startTime}.`} className="text-brand-600 text-xs font-medium">Request slot</a>
                </div>
              ))}
            </div>
          </Card>
        )}

        {cfg.clientAssetUploadEnabled && (
          <Card className="p-5">
            <h2 className="text-sm font-semibold text-surface-900 flex items-center gap-2 mb-3"><Upload size={16} /> Send files to contractor</h2>
            <p className="text-xs text-surface-500 mb-3">Brand assets, copy, logins, or reference files.</p>
            <input type="file" multiple className="text-sm" onChange={(e) => { Array.from(e.target.files || []).forEach(uploadAsset) }} />
            {data.clientAssets.length > 0 && (
              <ul className="mt-3 text-xs text-surface-600 space-y-1">
                {data.clientAssets.map((a) => <li key={a.id}>{a.name} · {formatFileSize(a.size)}</li>)}
              </ul>
            )}
          </Card>
        )}

        {session.invoices.length > 0 && (
          <Card className="p-5">
            <h2 className="text-sm font-semibold text-surface-900 mb-3"><Receipt size={16} className="inline mr-1" /> Invoices</h2>
            <div className="space-y-3">
              {session.invoices.map((inv) => (
                <div key={inv.number} className="p-3 rounded-lg border border-surface-100">
                  <div className="flex justify-between gap-2">
                    <p className="font-medium text-sm">{inv.number}</p>
                    <Badge status={inv.status}>{inv.status}</Badge>
                  </div>
                  <p className="text-lg font-semibold mt-1">{formatCurrency(inv.total, inv.currency)}</p>
                  {inv.paymentLinks.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {inv.paymentLinks.map((l) => (
                        <a key={l.label} href={l.url} target="_blank" rel="noopener noreferrer" className="text-xs font-medium text-brand-600 underline">{l.label}</a>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>
        )}

        <Card className="p-5 border-emerald-200 bg-emerald-50/30">
          <h2 className="text-sm font-semibold text-surface-900 flex items-center gap-2 mb-2"><CheckCircle2 size={16} className="text-emerald-600" /> Production sign-off</h2>
          {data.signOff ? (
            <p className="text-sm text-emerald-800">Approved by {data.signOff.clientName} on {formatDate(data.signOff.signedAt)}</p>
          ) : (
            <>
              <Textarea placeholder="Optional note…" value={signOffNote} onChange={(e) => setSignOffNote(e.target.value)} />
              <Button className="mt-3" onClick={() => submitSignOff(signOffNote)}>Approve for production</Button>
            </>
          )}
        </Card>

        {!data.survey && (
          <Card className="p-5">
            <h2 className="text-sm font-semibold text-surface-900 flex items-center gap-2 mb-3"><Star size={16} /> How was your experience?</h2>
            <div className="flex gap-1 mb-3">
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} type="button" onClick={() => setSurveyRating(n)} className={`p-2 rounded-lg ${surveyRating >= n ? 'text-amber-500' : 'text-surface-300'}`}>
                  <Star size={24} fill={surveyRating >= n ? 'currentColor' : 'none'} />
                </button>
              ))}
            </div>
            <Textarea placeholder="Optional comment…" value={surveyComment} onChange={(e) => setSurveyComment(e.target.value)} />
            <Button className="mt-3" disabled={surveyRating === 0} onClick={() => submitSurvey(surveyRating, surveyComment)}>Submit</Button>
          </Card>
        )}

        {session.demoUrl && (
          <Link to={session.demoUrl.replace(window.location.origin, '')} className="flex items-center justify-between p-4 rounded-xl border border-brand-200 bg-white hover:bg-brand-50 transition-colors">
            <div className="flex items-center gap-3">
              <Sparkles size={20} className="text-brand-600" />
              <div>
                <p className="text-sm font-medium text-surface-900">Explore full WorkVault demo</p>
                <p className="text-xs text-surface-500">Optional interactive tour of the platform</p>
              </div>
            </div>
            <ChevronRight size={18} className="text-surface-400" />
          </Link>
        )}

        <p className="text-[10px] text-center text-surface-400 pt-4">
          Activity in this room may be logged for security. {data.auditLog.length} events recorded.
        </p>
      </main>

      <GuidedTour />
    </div>
  )
}

function ClientHubInner() {
  return (
    <AccessGates>
      <HubContent />
    </AccessGates>
  )
}

export default function ClientHub() {
  const { token } = useParams<{ token: string }>()

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="p-8 text-center"><p className="text-surface-500">Invalid hub link.</p></Card>
      </div>
    )
  }

  return (
    <ClientRoomProvider token={token}>
      <ClientHubInner />
    </ClientRoomProvider>
  )
}
