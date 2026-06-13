import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  FileSpreadsheet, Download, Send, RefreshCw, AlertTriangle, CheckCircle2, ExternalLink, Users,
} from 'lucide-react'
import { useStore } from '../context/StoreContext'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { PageHeader } from '../components/ui/Modal'
import { formatCurrency } from '../lib/utils'
import { sendEmailViaResend } from '../lib/integrations-api'
import {
  FORM1099_PROVIDERS, IRS_1099_NEC_THRESHOLD, build1099FilingStats, build1099PayeeSummaries,
  buildW9RequestEmail, export1099ByProvider, format1099SummaryReport, maskTin,
} from '../lib/tax-1099'
import type { Form1099FilingStatus, Form1099Provider } from '../lib/types'

const statusBadge = (ready: boolean, w9: boolean): Form1099FilingStatus => {
  if (ready) return 'ready'
  if (!w9) return 'draft'
  return 'draft'
}

export default function Tax1099() {
  const {
    state, updateTax1099Settings, updateSubcontractor, syncForm1099Records, updateForm1099Record,
  } = useStore()
  const [toast, setToast] = useState('')
  const year = state.tax1099Settings.filingYear

  const stats = useMemo(() => build1099FilingStats(state, year), [state, year])
  const payees = useMemo(() => build1099PayeeSummaries(state, year), [state, year])
  const requiredPayees = payees.filter((p) => p.requires1099)

  const handleSyncRecords = () => {
    syncForm1099Records(year)
    setToast('1099 records refreshed from payment data.')
  }

  const handleExport = (provider: Form1099Provider) => {
    export1099ByProvider(state, provider, year)
    setToast(`Exported ${provider} format for ${year}.`)
  }

  const handleW9Request = async (payeeId: string) => {
    const sub = state.subcontractors.find((s) => s.id === payeeId)
    if (!sub?.email) {
      setToast('Add an email address for this payee first.')
      return
    }
    const { subject, text } = buildW9RequestEmail(sub, state.profile.name || 'WorkVault')
    if (state.integrations.emailSendEnabled) {
      const result = await sendEmailViaResend({
        credentials: state.integrationCredentials,
        profileEmail: state.profile.email,
        profileName: state.profile.name,
        to: sub.email,
        subject,
        text,
      })
      setToast(result.ok ? `W-9 request sent to ${sub.email}` : (result.error || 'Send failed'))
    } else {
      window.open(`mailto:${sub.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(text)}`)
      setToast('Opened email client for W-9 request')
    }
  }

  const markW9Received = (payeeId: string) => {
    updateSubcontractor(payeeId, { w9OnFile: true, w9ReceivedAt: new Date().toISOString() })
    setToast('W-9 marked on file')
  }

  const markFiled = (payeeId: string, provider: Form1099Provider) => {
    const record = state.form1099Records.find((r) => r.taxYear === year && r.payeeId === payeeId)
    if (record) {
      updateForm1099Record(record.id, { status: 'filed', filedAt: new Date().toISOString(), provider })
    }
    setToast('Marked as filed')
  }

  const copySummary = async () => {
    await navigator.clipboard.writeText(format1099SummaryReport(state, year))
    setToast('Summary copied to clipboard')
  }

  const yearOptions = [
    { value: String(new Date().getFullYear()), label: String(new Date().getFullYear()) },
    { value: String(new Date().getFullYear() - 1), label: String(new Date().getFullYear() - 1) },
  ]

  return (
    <div>
      <PageHeader
        title="1099 & Tax Filing"
        description="Track subcontractor payments, W-9s, and export to Track1099, Tax1099, QuickBooks, or IRS FIRE."
        action={
          <div className="flex gap-2">
            <Link to="/integrations">
              <Button variant="secondary" size="sm">Integration Settings</Button>
            </Link>
            <Button onClick={handleSyncRecords}>
              <RefreshCw size={16} /> Refresh Records
            </Button>
          </div>
        }
      />

      {toast && (
        <Card className="mb-6 p-4 border-brand-200 bg-brand-50/50">
          <p className="text-sm text-brand-800">{toast}</p>
        </Card>
      )}

      {!state.profile.taxId && (
        <Card className="mb-6 p-4 border-amber-200 bg-amber-50">
          <p className="text-sm text-amber-800 flex items-start gap-2">
            <AlertTriangle size={16} className="shrink-0 mt-0.5" />
            Add your business TIN/EIN in <Link to="/settings" className="underline font-medium">Settings → Tax ID</Link> before filing 1099s.
          </p>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card className="p-5">
          <p className="text-sm text-surface-500">Requires 1099-NEC</p>
          <p className="text-2xl font-bold text-surface-900 mt-1">{stats.requiring1099}</p>
          <p className="text-xs text-surface-400 mt-1">Paid ≥ ${state.tax1099Settings.thresholdAmount || IRS_1099_NEC_THRESHOLD}</p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-surface-500">Ready to file</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{stats.readyToFile}</p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-surface-500">Missing W-9</p>
          <p className="text-2xl font-bold text-amber-600 mt-1">{stats.missingW9}</p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-surface-500">Total reportable</p>
          <p className="text-2xl font-bold text-brand-600 mt-1">{formatCurrency(stats.totalReportable, state.profile.defaultCurrency)}</p>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1fr] mb-8">
        <Card className="p-6">
          <h2 className="text-base font-semibold text-surface-900 mb-4">Filing settings</h2>
          <div className="space-y-4">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={state.tax1099Settings.enabled}
                onChange={(e) => updateTax1099Settings({ enabled: e.target.checked })}
                className="rounded border-surface-300 text-brand-600"
              />
              Enable 1099 tracking
            </label>
            <Select
              label="Tax year"
              value={String(year)}
              onChange={(e) => updateTax1099Settings({ filingYear: parseInt(e.target.value, 10) })}
              options={yearOptions}
            />
            <Input
              label="1099 threshold ($)"
              type="number"
              value={state.tax1099Settings.thresholdAmount}
              onChange={(e) => updateTax1099Settings({ thresholdAmount: parseFloat(e.target.value) || IRS_1099_NEC_THRESHOLD })}
            />
            <Input
              label="File-by reminder date"
              type="date"
              value={state.tax1099Settings.reminderFileBy}
              onChange={(e) => updateTax1099Settings({ reminderFileBy: e.target.value })}
            />
            <Button variant="secondary" size="sm" onClick={copySummary}>Copy filing summary</Button>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-base font-semibold text-surface-900 mb-4 flex items-center gap-2">
            <FileSpreadsheet size={16} /> Export to filing services
          </h2>
          <div className="space-y-3">
            {FORM1099_PROVIDERS.map((provider) => (
              <div key={provider.id} className="flex items-start justify-between gap-3 p-3 rounded-xl border border-surface-100">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-surface-900">{provider.name}</p>
                  <p className="text-xs text-surface-500 mt-0.5">{provider.description}</p>
                  <a href={provider.url} target="_blank" rel="noopener noreferrer" className="text-xs text-brand-600 hover:underline inline-flex items-center gap-0.5 mt-1">
                    Learn more <ExternalLink size={10} />
                  </a>
                </div>
                <Button variant="secondary" size="sm" onClick={() => handleExport(provider.id)}>
                  <Download size={14} /> Export
                </Button>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <div className="flex items-center justify-between gap-4 mb-4">
          <h2 className="text-base font-semibold text-surface-900 flex items-center gap-2">
            <Users size={16} /> Payees — {year}
          </h2>
          <Link to="/subcontractors">
            <Button variant="ghost" size="sm">Manage subcontractors</Button>
          </Link>
        </div>

        {requiredPayees.length === 0 ? (
          <p className="text-sm text-surface-500">
            No subcontractors meet the ${state.tax1099Settings.thresholdAmount} threshold for {year}.
            {' '}<Link to="/subcontractors" className="text-brand-600 hover:underline">Add subcontractors</Link> and log payments.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-100 text-left text-surface-500">
                  <th className="py-2 pr-4 font-medium">Payee</th>
                  <th className="py-2 pr-4 font-medium">TIN</th>
                  <th className="py-2 pr-4 font-medium">Box 1</th>
                  <th className="py-2 pr-4 font-medium">W-9</th>
                  <th className="py-2 pr-4 font-medium">Status</th>
                  <th className="py-2 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100">
                {requiredPayees.map((p) => (
                  <tr key={p.payeeId}>
                    <td className="py-3 pr-4">
                      <p className="font-medium text-surface-900">{p.businessName}</p>
                      <p className="text-xs text-surface-400">{p.email || 'No email'}</p>
                    </td>
                    <td className="py-3 pr-4 font-mono text-xs">{p.tin ? maskTin(p.tin) : '—'}</td>
                    <td className="py-3 pr-4 font-medium">{formatCurrency(p.totalPaid, state.profile.defaultCurrency)}</td>
                    <td className="py-3 pr-4">
                      <Badge status={p.w9OnFile ? 'signed' : 'draft'}>{p.w9OnFile ? 'On file' : 'Missing'}</Badge>
                    </td>
                    <td className="py-3 pr-4">
                      <Badge status={statusBadge(p.readyToFile, p.w9OnFile)}>
                        {p.readyToFile ? 'Ready' : p.missingFields.join(', ') || 'Incomplete'}
                      </Badge>
                    </td>
                    <td className="py-3">
                      <div className="flex flex-wrap gap-1">
                        {!p.w9OnFile && (
                          <>
                            <Button variant="ghost" size="sm" onClick={() => handleW9Request(p.payeeId)} title="Request W-9">
                              <Send size={12} />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => markW9Received(p.payeeId)} title="Mark W-9 received">
                              <CheckCircle2 size={12} />
                            </Button>
                          </>
                        )}
                        {p.readyToFile && (
                          <Button variant="ghost" size="sm" onClick={() => markFiled(p.payeeId, 'manual')} title="Mark filed">
                            Filed
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
