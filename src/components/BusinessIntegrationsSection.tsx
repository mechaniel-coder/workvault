import { useEffect, useState } from 'react'
import {
  BookOpen, CalendarClock, Loader2, Mail, Plug, RefreshCw, Building2, ExternalLink,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { useStore } from '../context/StoreContext'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { maskSecret } from '../lib/integrations-api'
import {
  startQuickBooksOAuth, exchangeQuickBooksOAuthCode, syncQuickBooks,
  startXeroOAuth, exchangeXeroOAuthCode, syncXero,
} from '../lib/accounting-sync'
import { startGmailOAuth, exchangeGmailOAuthCode } from '../lib/integrations-api'
import { fetchCalcomBookingLink, fetchCalendlyBookingLink } from '../lib/scheduling-api'

type Props = {
  onStatus: (msg: string) => void
  oauthCode?: string | null
  oauthProvider?: 'quickbooks' | 'xero' | 'gmail' | null
  onOAuthHandled: () => void
}

export function BusinessIntegrationsSection({ onStatus, oauthCode, oauthProvider, onOAuthHandled }: Props) {
  const {
    state, updateIntegrations, updateIntegrationCredentials,
    updateBookkeepingSyncMeta, updateSchedulingMeta,
  } = useStore()
  const [busy, setBusy] = useState('')
  const creds = state.integrationCredentials
  const ints = state.integrations

  useEffect(() => {
    if (!oauthCode || !oauthProvider) return
    const run = async () => {
      try {
        if (oauthProvider === 'quickbooks') {
          const data = await exchangeQuickBooksOAuthCode(oauthCode)
          updateIntegrationCredentials({
            quickbooksRefreshToken: data.refreshToken,
            quickbooksRealmId: data.realmId,
            quickbooksCompanyName: data.companyName,
          })
          updateIntegrations({ quickbooksLiveSync: true })
          onStatus(`Connected QuickBooks: ${data.companyName}`)
        } else if (oauthProvider === 'xero') {
          const data = await exchangeXeroOAuthCode(oauthCode)
          updateIntegrationCredentials({
            xeroRefreshToken: data.refreshToken,
            xeroTenantId: data.tenantId,
            xeroTenantName: data.tenantName,
          })
          updateIntegrations({ xeroLiveSync: true })
          onStatus(`Connected Xero: ${data.tenantName}`)
        } else if (oauthProvider === 'gmail') {
          const data = await exchangeGmailOAuthCode(oauthCode)
          updateIntegrationCredentials({
            gmailRefreshToken: data.refreshToken,
            gmailAccountEmail: data.email,
          })
          updateIntegrations({ gmailSendEnabled: true, gmailInboxEnabled: true })
          onStatus(`Connected Gmail: ${data.email}`)
        }
      } catch (e) {
        onStatus(e instanceof Error ? e.message : 'Connection failed')
      } finally {
        onOAuthHandled()
      }
    }
    run()
  }, [oauthCode, oauthProvider, onOAuthHandled, onStatus, updateIntegrationCredentials, updateIntegrations])

  const connectQuickBooks = async () => {
    setBusy('qb')
    try {
      window.location.href = await startQuickBooksOAuth()
    } catch (e) {
      onStatus(e instanceof Error ? e.message : 'QuickBooks connect failed')
      setBusy('')
    }
  }

  const connectXero = async () => {
    setBusy('xero')
    try {
      window.location.href = await startXeroOAuth()
    } catch (e) {
      onStatus(e instanceof Error ? e.message : 'Xero connect failed')
      setBusy('')
    }
  }

  const connectGmail = async () => {
    setBusy('gmail')
    try {
      window.location.href = await startGmailOAuth()
    } catch (e) {
      onStatus(e instanceof Error ? e.message : 'Gmail connect failed')
      setBusy('')
    }
  }

  const runQuickBooksSync = async () => {
    setBusy('qb-sync')
    try {
      const result = await syncQuickBooks(state, creds)
      updateBookkeepingSyncMeta({
        quickbooksCustomerMap: result.customerMap,
        quickbooksInvoiceMap: result.invoiceMap,
        quickbooksExpenseMap: result.expenseMap,
        quickbooksLastSyncedAt: result.syncedAt,
      })
      if (result.refreshToken) updateIntegrationCredentials({ quickbooksRefreshToken: result.refreshToken })
      onStatus(`QuickBooks: synced ${result.syncedInvoices} invoices, ${result.syncedExpenses} expenses`)
    } catch (e) {
      onStatus(e instanceof Error ? e.message : 'QuickBooks sync failed')
    } finally {
      setBusy('')
    }
  }

  const runXeroSync = async () => {
    setBusy('xero-sync')
    try {
      const result = await syncXero(state, creds)
      updateBookkeepingSyncMeta({
        xeroContactMap: result.contactMap,
        xeroInvoiceMap: result.invoiceMap,
        xeroExpenseMap: result.expenseMap,
        xeroLastSyncedAt: result.syncedAt,
      })
      if (result.refreshToken) updateIntegrationCredentials({ xeroRefreshToken: result.refreshToken })
      onStatus(`Xero: synced ${result.syncedInvoices} invoices, ${result.syncedExpenses} expenses`)
    } catch (e) {
      onStatus(e instanceof Error ? e.message : 'Xero sync failed')
    } finally {
      setBusy('')
    }
  }

  const refreshScheduling = async () => {
    setBusy('sched')
    try {
      if (ints.calcomScheduling) {
        const data = await fetchCalcomBookingLink(creds)
        updateSchedulingMeta({
          provider: 'calcom',
          bookingUrl: data.bookingUrl,
          eventTypeName: data.eventTypeName,
          lastFetchedAt: new Date().toISOString(),
        })
        onStatus(`Cal.com link ready: ${data.eventTypeName}`)
      } else if (ints.calendlyScheduling) {
        const data = await fetchCalendlyBookingLink(creds)
        updateSchedulingMeta({
          provider: 'calendly',
          bookingUrl: data.bookingUrl,
          eventTypeName: data.eventTypeName,
          lastFetchedAt: new Date().toISOString(),
        })
        if (data.eventUri) updateIntegrationCredentials({ calendlyEventUri: data.eventUri })
        onStatus(`Calendly link ready: ${data.eventTypeName}`)
      }
    } catch (e) {
      onStatus(e instanceof Error ? e.message : 'Scheduling lookup failed')
    } finally {
      setBusy('')
    }
  }

  return (
    <>
      <Card className="p-6 lg:col-span-2">
        <h2 className="text-base font-semibold text-surface-900 mb-1 flex items-center gap-2">
          <BookOpen size={18} className="text-blue-600" /> Bookkeeping (live sync)
        </h2>
        <p className="text-sm text-surface-500 mb-4">Push paid invoices and expenses to QuickBooks or Xero automatically.</p>
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-surface-200 p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <p className="font-medium text-surface-900">QuickBooks Online</p>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={ints.quickbooksLiveSync} onChange={(e) => updateIntegrations({ quickbooksLiveSync: e.target.checked })} className="rounded border-surface-300 text-brand-600" />
                <span className="text-xs text-surface-600">Auto-sync</span>
              </label>
            </div>
            {creds.quickbooksCompanyName && <Badge status="signed">{creds.quickbooksCompanyName}</Badge>}
            <div className="flex flex-wrap gap-2">
              {!creds.quickbooksRefreshToken ? (
                <Button size="sm" onClick={connectQuickBooks} disabled={busy === 'qb'}>
                  {busy === 'qb' ? <Loader2 size={14} className="animate-spin" /> : <Plug size={14} />} Connect
                </Button>
              ) : (
                <>
                  <Button size="sm" onClick={runQuickBooksSync} disabled={busy === 'qb-sync'}>
                    {busy === 'qb-sync' ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />} Sync now
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => updateIntegrationCredentials({ quickbooksRefreshToken: '', quickbooksRealmId: '', quickbooksCompanyName: '' })}>Disconnect</Button>
                </>
              )}
            </div>
            {state.bookkeepingSyncMeta.quickbooksLastSyncedAt && (
              <p className="text-xs text-surface-400">Last synced {new Date(state.bookkeepingSyncMeta.quickbooksLastSyncedAt).toLocaleString()}</p>
            )}
          </div>

          <div className="rounded-xl border border-surface-200 p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <p className="font-medium text-surface-900">Xero</p>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={ints.xeroLiveSync} onChange={(e) => updateIntegrations({ xeroLiveSync: e.target.checked })} className="rounded border-surface-300 text-brand-600" />
                <span className="text-xs text-surface-600">Auto-sync</span>
              </label>
            </div>
            {creds.xeroTenantName && <Badge status="signed">{creds.xeroTenantName}</Badge>}
            <div className="flex flex-wrap gap-2">
              {!creds.xeroRefreshToken ? (
                <Button size="sm" onClick={connectXero} disabled={busy === 'xero'}>
                  {busy === 'xero' ? <Loader2 size={14} className="animate-spin" /> : <Plug size={14} />} Connect
                </Button>
              ) : (
                <>
                  <Button size="sm" onClick={runXeroSync} disabled={busy === 'xero-sync'}>
                    {busy === 'xero-sync' ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />} Sync now
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => updateIntegrationCredentials({ xeroRefreshToken: '', xeroTenantId: '', xeroTenantName: '' })}>Disconnect</Button>
                </>
              )}
            </div>
            {state.bookkeepingSyncMeta.xeroLastSyncedAt && (
              <p className="text-xs text-surface-400">Last synced {new Date(state.bookkeepingSyncMeta.xeroLastSyncedAt).toLocaleString()}</p>
            )}
          </div>
        </div>
        <p className="text-xs text-surface-500 mt-3">
          OAuth requires <code className="bg-surface-100 px-1 rounded text-[10px]">INTUIT_CLIENT_ID</code>/<code className="bg-surface-100 px-1 rounded text-[10px]">SECRET</code> or{' '}
          <code className="bg-surface-100 px-1 rounded text-[10px]">XERO_CLIENT_ID</code>/<code className="bg-surface-100 px-1 rounded text-[10px]">SECRET</code> in Netlify env.
        </p>
      </Card>

      <Card className="p-6">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <h2 className="text-base font-semibold text-surface-900 flex items-center gap-2">
              <Mail size={18} className="text-red-500" /> Gmail
            </h2>
            <p className="text-sm text-surface-500 mt-1">Send from your address and read client threads in Inbox.</p>
          </div>
          <Link to="/inbox"><Button variant="secondary" size="sm">Open Inbox</Button></Link>
        </div>
        <div className="space-y-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={ints.gmailSendEnabled} onChange={(e) => updateIntegrations({ gmailSendEnabled: e.target.checked })} className="rounded border-surface-300 text-brand-600" />
            <span className="text-sm text-surface-700">Send via Gmail (preferred over Resend)</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={ints.gmailInboxEnabled} onChange={(e) => updateIntegrations({ gmailInboxEnabled: e.target.checked })} className="rounded border-surface-300 text-brand-600" />
            <span className="text-sm text-surface-700">Inbox sync</span>
          </label>
          {creds.gmailAccountEmail ? (
            <div className="flex flex-wrap gap-2 items-center">
              <Badge status="signed">{creds.gmailAccountEmail}</Badge>
              <Button size="sm" variant="ghost" onClick={() => updateIntegrationCredentials({ gmailRefreshToken: '', gmailAccountEmail: '' })}>Disconnect</Button>
            </div>
          ) : (
            <Button onClick={connectGmail} disabled={busy === 'gmail'}>
              {busy === 'gmail' ? <Loader2 size={16} className="animate-spin" /> : <Plug size={16} />} Connect Gmail
            </Button>
          )}
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-base font-semibold text-surface-900 flex items-center gap-2 mb-1">
          <CalendarClock size={18} className="text-indigo-600" /> Scheduling
        </h2>
        <p className="text-sm text-surface-500 mb-4">Cal.com or Calendly booking links for discovery calls.</p>
        <div className="space-y-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={ints.calcomScheduling} onChange={(e) => updateIntegrations({ calcomScheduling: e.target.checked, calendlyScheduling: e.target.checked ? false : ints.calendlyScheduling })} className="rounded border-surface-300 text-brand-600" />
            <span className="text-sm">Cal.com</span>
          </label>
          {ints.calcomScheduling && (
            <div className="grid gap-3 sm:grid-cols-2">
              <Input label="Username" value={creds.calcomUsername} onChange={(e) => updateIntegrationCredentials({ calcomUsername: e.target.value })} placeholder="yourname" />
              <Input label="Event slug" value={creds.calcomEventSlug} onChange={(e) => updateIntegrationCredentials({ calcomEventSlug: e.target.value })} placeholder="30min" />
              <Input label="API key (optional)" type="password" value={creds.calcomApiKey} onChange={(e) => updateIntegrationCredentials({ calcomApiKey: e.target.value })} />
            </div>
          )}
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={ints.calendlyScheduling} onChange={(e) => updateIntegrations({ calendlyScheduling: e.target.checked, calcomScheduling: e.target.checked ? false : ints.calcomScheduling })} className="rounded border-surface-300 text-brand-600" />
            <span className="text-sm">Calendly</span>
          </label>
          {ints.calendlyScheduling && (
            <Input label="Personal access token" type="password" value={creds.calendlyApiKey} onChange={(e) => updateIntegrationCredentials({ calendlyApiKey: e.target.value })} placeholder="From Calendly Integrations" />
          )}
          {(ints.calcomScheduling || ints.calendlyScheduling) && (
            <Button onClick={refreshScheduling} disabled={busy === 'sched'}>
              {busy === 'sched' ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />} Refresh booking link
            </Button>
          )}
          {state.schedulingMeta.bookingUrl && (
            <p className="text-xs text-surface-600 break-all">
              {state.schedulingMeta.eventTypeName}:{' '}
              <a href={state.schedulingMeta.bookingUrl} target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:underline inline-flex items-center gap-0.5">
                {state.schedulingMeta.bookingUrl} <ExternalLink size={10} />
              </a>
            </p>
          )}
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-base font-semibold text-surface-900 flex items-center gap-2 mb-1">
          <Building2 size={18} className="text-emerald-600" /> Plaid Bank Match
        </h2>
        <p className="text-sm text-surface-500 mb-4">Import deposits and match them to open invoices.</p>
        <label className="flex items-center gap-2 cursor-pointer mb-2">
          <input type="checkbox" checked={ints.plaidBankMatch} onChange={(e) => updateIntegrations({ plaidBankMatch: e.target.checked })} className="rounded border-surface-300 text-brand-600" />
          <span className="text-sm">Enable bank reconciliation</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer mb-3">
          <input type="checkbox" checked={ints.plaidAutoMatch} onChange={(e) => updateIntegrations({ plaidAutoMatch: e.target.checked })} className="rounded border-surface-300 text-brand-600" />
          <span className="text-sm">Auto-match high-confidence deposits</span>
        </label>
        <Link to="/finance?tab=banking"><Button variant="secondary" size="sm">Open Finance → Banking</Button></Link>
        {creds.plaidAccessToken && <p className="text-xs text-surface-400 mt-2">Token stored: {maskSecret(creds.plaidAccessToken)}</p>}
      </Card>
    </>
  )
}
