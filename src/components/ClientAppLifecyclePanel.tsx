import { useState } from 'react'
import { Archive, CheckCircle2, Circle, Download, Loader2, AlertTriangle } from 'lucide-react'
import type { Client } from '../lib/types'
import { useStore } from '../context/StoreContext'
import { Button } from './ui/Button'
import { Card } from './ui/Card'
import { evaluateClientClosure, downloadClientArchive } from '../lib/client-closure'
import { closeClientApp, isClientAppActive } from '../lib/client-app-lifecycle'
import { Link } from 'react-router-dom'

type Props = {
  client: Client
}

export function ClientAppLifecyclePanel({ client }: Props) {
  const { state, updateClient, updateClientGuestInvite } = useStore()
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState('')

  const readiness = evaluateClientClosure(state, client.id)
  const archived = client.appLifecycle.status === 'archived'
  const hasApp = isClientAppActive(client)

  const markTaxDocsSaved = () => {
    updateClient(client.id, {
      appLifecycle: {
        ...client.appLifecycle,
        taxDocsSavedLocallyAt: new Date().toISOString(),
      },
    })
    setStatus('Marked tax documentation as saved locally.')
  }

  const handleArchive = async () => {
    if (!client.clientAppToken) return
    if (!readiness.readyToArchive) {
      setStatus('Complete all checklist items before removing the client app.')
      return
    }

    const confirmMsg = readiness.shouldHandoffDeliverables
      ? `Archive ${client.name}'s WorkVault app?\n\nThey are paid up — final deliverables will be sent via email and shared folder links, then the app will be removed.`
      : `Archive ${client.name}'s WorkVault app?\n\nOutstanding invoices detected — the app will be removed WITHOUT sending deliverables.`

    if (!window.confirm(confirmMsg)) return

    setBusy(true)
    setStatus('')
    try {
      const result = await closeClientApp(client.clientAppToken, client, state)

      for (const invite of state.clientGuestInvites.filter((g) => g.clientId === client.id)) {
        updateClientGuestInvite(invite.id, { enabled: false })
      }

      updateClient(client.id, {
        clientAppToken: null,
        appLifecycle: {
          status: 'archived',
          closedAt: new Date().toISOString(),
          closeOutcome: result.outcome,
          taxDocsSavedLocallyAt: client.appLifecycle.taxDocsSavedLocallyAt,
          handoffCompletedAt: result.handoffAttempted ? new Date().toISOString() : null,
        },
      })

      if (result.outcome === 'paid_complete') {
        setStatus(
          result.emailSent
            ? `App removed. Deliverables sent to ${client.email || 'client'} (${result.deliverableCount} files).`
            : `App removed. ${result.deliverableCount} deliverable links saved${client.email ? ' — enable email in Integrations to notify client' : ''}.`,
        )
      } else {
        setStatus('App removed. No deliverables were sent (outstanding invoices).')
      }
    } catch (e) {
      setStatus(e instanceof Error ? e.message : 'Archive failed')
    } finally {
      setBusy(false)
    }
  }

  if (!hasApp && !archived) return null

  const CheckRow = ({ done, label, hint }: { done: boolean; label: string; hint?: string }) => (
    <div className="flex gap-2 text-sm">
      {done ? (
        <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
      ) : (
        <Circle size={16} className="text-surface-300 shrink-0 mt-0.5" />
      )}
      <div>
        <p className={done ? 'text-surface-800' : 'text-surface-600'}>{label}</p>
        {hint && <p className="text-xs text-surface-400 mt-0.5">{hint}</p>}
      </div>
    </div>
  )

  return (
    <Card className="mt-3 p-4 border-surface-200 bg-surface-50/80">
      <div className="flex items-start justify-between gap-2 mb-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-surface-500 flex items-center gap-1.5">
            <Archive size={12} /> Client WorkVault lifecycle
          </p>
          <p className="text-[10px] text-surface-400 mt-0.5">Local device + optional Netlify sync</p>
        </div>
        {archived && (
          <span className="text-[10px] font-medium uppercase tracking-wider text-surface-500 bg-surface-200 px-2 py-0.5 rounded">
            Archived
          </span>
        )}
      </div>

      {archived ? (
        <p className="text-xs text-surface-600">
          Closed {client.appLifecycle.closedAt ? new Date(client.appLifecycle.closedAt).toLocaleDateString() : ''}
          {client.appLifecycle.closeOutcome === 'paid_complete' ? ' · deliverables sent' : ' · no deliverable handoff'}
        </p>
      ) : (
        <>
          <div className="space-y-2.5 mb-4">
            <CheckRow
              done={readiness.projectsComplete}
              label="All projects marked paid"
              hint={readiness.projectCount > 0 ? `${readiness.paidProjectCount}/${readiness.projectCount} on Pipeline` : 'No projects yet'}
            />
            <CheckRow
              done={readiness.taxDocsSavedLocally}
              label="Tax documentation saved locally"
              hint="Export from 1099 hub or Finance, then confirm"
            />
            {readiness.hasOutstandingInvoices && (
              <div className="flex gap-2 text-sm text-amber-800 bg-amber-50 rounded-lg px-2 py-1.5">
                <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                <p>{readiness.outstandingInvoiceCount} outstanding invoice(s) — archive will skip deliverable handoff</p>
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {!readiness.taxDocsSavedLocally && (
              <>
                <Link to="/tax-1099">
                  <Button variant="ghost" size="sm">Export 1099</Button>
                </Link>
                <Button variant="secondary" size="sm" onClick={markTaxDocsSaved}>
                  Confirm tax docs saved
                </Button>
              </>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => downloadClientArchive(state, client)}
            >
              <Download size={14} /> Save local archive
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleArchive}
              disabled={busy || !readiness.readyToArchive}
              title={!readiness.readyToArchive ? 'Complete checklist first' : undefined}
            >
              {busy ? <Loader2 size={14} className="animate-spin" /> : <Archive size={14} />}
              Remove client app
            </Button>
          </div>
        </>
      )}

      {status && <p className="text-xs text-surface-600 mt-3">{status}</p>}
    </Card>
  )
}
