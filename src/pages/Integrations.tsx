import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  CreditCard, Mail, Calendar, ExternalLink, Loader2, Plug, RefreshCw, Download, FileSpreadsheet,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { useStore } from '../context/StoreContext'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { PageHeader } from '../components/ui/Modal'
import {
  exchangeGoogleOAuthCode, maskSecret, startGoogleOAuth, syncGoogleCalendar, downloadIcsFeed,
} from '../lib/integrations-api'
import { PAYMENT_PROCESSORS } from '../lib/payment-processors'
import { Select } from '../components/ui/Select'
import { BusinessIntegrationsSection } from '../components/BusinessIntegrationsSection'
import { DeliveryIntegrationsSection } from '../components/DeliveryIntegrationsSection'

export default function Integrations() {
  const {
    state, updateIntegrations, updateIntegrationCredentials, updateCalendarSyncMeta,
  } = useStore()
  const [params, setParams] = useSearchParams()
  const [status, setStatus] = useState('')
  const [syncing, setSyncing] = useState(false)
  const [connecting, setConnecting] = useState(false)

  const creds = state.integrationCredentials
  const ints = state.integrations

  const [oauthHandled, setOauthHandled] = useState(false)

  const [deliveryOauthHandled, setDeliveryOauthHandled] = useState(false)

  const deliveryOauthProvider = params.get('google_drive') === 'connected' ? 'google_drive'
    : params.get('dropbox') === 'connected' ? 'dropbox'
      : null
  const deliveryOauthCode = deliveryOauthProvider && !deliveryOauthHandled ? params.get('code') : null

  const clearDeliveryOauthParams = () => {
    params.delete('google_drive')
    params.delete('dropbox')
    if (!params.get('quickbooks') && !params.get('xero') && !params.get('gmail')) {
      params.delete('code')
    }
    setParams(params, { replace: true })
    setDeliveryOauthHandled(true)
  }

  const oauthProvider = params.get('quickbooks') === 'connected' ? 'quickbooks'
    : params.get('xero') === 'connected' ? 'xero'
      : params.get('gmail') === 'connected' ? 'gmail'
        : null
  const oauthCode = oauthProvider && !oauthHandled && !deliveryOauthProvider ? params.get('code') : null

  const clearOauthParams = () => {
    params.delete('quickbooks')
    params.delete('xero')
    params.delete('gmail')
    params.delete('code')
    setParams(params, { replace: true })
    setOauthHandled(true)
  }

  useEffect(() => {
    const google = params.get('google')
    const code = params.get('code')
    if (google === 'connected' && code && !params.get('google_drive') && !params.get('dropbox')) {
      exchangeGoogleOAuthCode(code)
        .then((data) => {
          updateIntegrationCredentials({
            googleRefreshToken: data.refreshToken,
            googleAccountEmail: data.email,
            googleCalendarId: data.calendarId || 'primary',
          })
          updateIntegrations({ googleCalendarSync: true })
          setStatus(`Connected Google Calendar as ${data.email}`)
        })
        .catch((e) => setStatus(e instanceof Error ? e.message : 'Google connection failed'))
        .finally(() => {
          params.delete('google')
          params.delete('code')
          setParams(params, { replace: true })
        })
    } else if (google === 'error') {
      setStatus('Google sign-in was cancelled or failed.')
      params.delete('google')
      setParams(params, { replace: true })
    }
  }, [params, setParams, updateIntegrationCredentials, updateIntegrations])

  const connectGoogle = async () => {
    setConnecting(true)
    setStatus('')
    try {
      const url = await startGoogleOAuth()
      window.location.href = url
    } catch (e) {
      setStatus(e instanceof Error ? e.message : 'Could not start Google sign-in')
      setConnecting(false)
    }
  }

  const handleCalendarSync = async () => {
    if (!creds.googleRefreshToken) {
      setStatus('Connect Google Calendar first')
      return
    }
    setSyncing(true)
    setStatus('')
    try {
      const result = await syncGoogleCalendar(state, creds, state.calendarSyncMeta.eventMap)
      updateCalendarSyncMeta({
        eventMap: result.eventMap,
        lastSyncedAt: result.syncedAt,
      })
      setStatus(`Synced ${result.synced} events to Google Calendar`)
    } catch (e) {
      setStatus(e instanceof Error ? e.message : 'Sync failed')
    } finally {
      setSyncing(false)
    }
  }

  const disconnectGoogle = () => {
    updateIntegrationCredentials({
      googleRefreshToken: '',
      googleAccountEmail: '',
    })
    updateIntegrations({ googleCalendarSync: false })
    updateCalendarSyncMeta({ eventMap: {}, lastSyncedAt: null })
    setStatus('Google Calendar disconnected')
  }

  return (
    <div>
      <PageHeader
        title="Integrations"
        description="Connect payments, bookkeeping, email, scheduling, and bank matching."
      />

      {status && (
        <Card className="mb-6 p-4 border-brand-200 bg-brand-50/50">
          <p className="text-sm text-brand-800">{status}</p>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Payment processors */}
        {PAYMENT_PROCESSORS.map((processor) => (
          <Card key={processor.id} className="p-6">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <h2 className="text-base font-semibold text-surface-900 flex items-center gap-2">
                  <CreditCard size={18} className="text-violet-600" /> {processor.name}
                </h2>
                <p className="text-sm text-surface-500 mt-1">{processor.description}</p>
              </div>
              <label className="flex items-center gap-2 shrink-0 cursor-pointer">
                <input
                  type="checkbox"
                  checked={ints[processor.integrationKey]}
                  onChange={(e) => updateIntegrations({ [processor.integrationKey]: e.target.checked })}
                  className="rounded border-surface-300 text-brand-600 focus:ring-brand-500"
                />
                <span className="text-xs font-medium text-surface-600">Enabled</span>
              </label>
            </div>

            <div className="space-y-4">
              {processor.credentialFields.map((field) => (
                <Input
                  key={field.key}
                  label={field.label}
                  type={field.secret ? 'password' : 'text'}
                  value={String(creds[field.key] ?? '')}
                  onChange={(e) => updateIntegrationCredentials({ [field.key]: e.target.value })}
                  placeholder={field.placeholder}
                />
              ))}
              {processor.id === 'paypal' && (
                <Select
                  label="Environment"
                  value={creds.paypalMode}
                  onChange={(e) => updateIntegrationCredentials({ paypalMode: e.target.value as 'sandbox' | 'live' })}
                  options={[
                    { value: 'sandbox', label: 'Sandbox (testing)' },
                    { value: 'live', label: 'Live (production)' },
                  ]}
                />
              )}
              {processor.credentialFields.some((f) => creds[f.key]) && (
                <p className="text-xs text-surface-400">
                  Stored locally:{' '}
                  {processor.credentialFields
                    .filter((f) => creds[f.key])
                    .map((f) => `${f.label} ${maskSecret(String(creds[f.key]))}`)
                    .join(' · ')}
                </p>
              )}
              <p className="text-xs text-surface-500">
                Get credentials from{' '}
                <a href={processor.url} target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:underline inline-flex items-center gap-0.5">
                  {processor.name} <ExternalLink size={10} />
                </a>
                . Checkout links are generated when you send invoices.
              </p>
            </div>
          </Card>
        ))}

        <BusinessIntegrationsSection
          onStatus={setStatus}
          oauthCode={oauthCode}
          oauthProvider={oauthProvider}
          onOAuthHandled={clearOauthParams}
        />

        <DeliveryIntegrationsSection
          onStatus={setStatus}
          oauthCode={deliveryOauthCode}
          oauthProvider={deliveryOauthProvider}
          onOAuthHandled={clearDeliveryOauthParams}
        />

        {/* Email */}
        <Card className="p-6">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div>
              <h2 className="text-base font-semibold text-surface-900 flex items-center gap-2">
                <Mail size={18} className="text-sky-600" /> Email (Resend)
              </h2>
              <p className="text-sm text-surface-500 mt-1">
                Send invoices and payment reminders directly — replaces mailto: links.
              </p>
            </div>
            <label className="flex items-center gap-2 shrink-0 cursor-pointer">
              <input
                type="checkbox"
                checked={ints.emailSendEnabled}
                onChange={(e) => updateIntegrations({ emailSendEnabled: e.target.checked })}
                className="rounded border-surface-300 text-brand-600 focus:ring-brand-500"
              />
              <span className="text-xs font-medium text-surface-600">Enabled</span>
            </label>
          </div>

          <div className="space-y-4">
            <Input
              label="Resend API key"
              type="password"
              value={creds.resendApiKey}
              onChange={(e) => updateIntegrationCredentials({ resendApiKey: e.target.value })}
              placeholder="re_..."
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="From email"
                type="email"
                value={creds.emailFrom}
                onChange={(e) => updateIntegrationCredentials({ emailFrom: e.target.value })}
                placeholder={state.profile.email || 'hello@yourbusiness.com'}
              />
              <Input
                label="From name"
                value={creds.emailFromName}
                onChange={(e) => updateIntegrationCredentials({ emailFromName: e.target.value })}
                placeholder={state.profile.name || 'Your Business'}
              />
            </div>
            <p className="text-xs text-surface-500">
              Sign up at{' '}
              <a href="https://resend.com" target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:underline inline-flex items-center gap-0.5">
                resend.com <ExternalLink size={10} />
              </a>
              {' '}and verify your sending domain. Fallback: set <code className="text-[10px] bg-surface-100 px-1 rounded">RESEND_API_KEY</code> in Netlify env.
            </p>
          </div>
        </Card>

        {/* Google Calendar */}
        <Card className="p-6 lg:col-span-2">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div>
              <h2 className="text-base font-semibold text-surface-900 flex items-center gap-2">
                <Calendar size={18} className="text-emerald-600" /> Google Calendar
              </h2>
              <p className="text-sm text-surface-500 mt-1">
                Push availability blocks and milestone due dates to your calendar.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 shrink-0">
              {creds.googleAccountEmail && (
                <Badge status="signed">{creds.googleAccountEmail}</Badge>
              )}
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={ints.googleCalendarSync}
                  onChange={(e) => updateIntegrations({ googleCalendarSync: e.target.checked })}
                  className="rounded border-surface-300 text-brand-600 focus:ring-brand-500"
                />
                <span className="text-xs font-medium text-surface-600">Enabled</span>
              </label>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 mb-4">
            {!creds.googleRefreshToken ? (
              <Button onClick={connectGoogle} disabled={connecting}>
                {connecting ? <Loader2 size={16} className="animate-spin" /> : <Plug size={16} />}
                Connect Google Calendar
              </Button>
            ) : (
              <>
                <Button onClick={handleCalendarSync} disabled={syncing || !ints.googleCalendarSync}>
                  {syncing ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
                  Sync now
                </Button>
                <Button variant="secondary" onClick={() => downloadIcsFeed(state)}>
                  <Download size={16} /> Export .ics
                </Button>
                <Button variant="ghost" onClick={disconnectGoogle}>Disconnect</Button>
              </>
            )}
          </div>

          {state.calendarSyncMeta.lastSyncedAt && (
            <p className="text-xs text-surface-400 mb-3">
              Last synced: {new Date(state.calendarSyncMeta.lastSyncedAt).toLocaleString()}
              {' · '}{Object.keys(state.calendarSyncMeta.eventMap).length} events tracked
            </p>
          )}

          <p className="text-xs text-surface-500">
            OAuth requires <code className="bg-surface-100 px-1 rounded text-[10px]">GOOGLE_CLIENT_ID</code> and{' '}
            <code className="bg-surface-100 px-1 rounded text-[10px]">GOOGLE_CLIENT_SECRET</code> in Netlify env.
            Without OAuth, use <strong>Export .ics</strong> to import into Google Calendar manually.
          </p>
        </Card>

        {/* 1099 filing services */}
        <Card className="p-6 lg:col-span-2">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <h2 className="text-base font-semibold text-surface-900 flex items-center gap-2">
                <FileSpreadsheet size={18} className="text-rose-600" /> 1099 Filing Services
              </h2>
              <p className="text-sm text-surface-500 mt-1">
                Export payee data for Track1099, Tax1099.com, QuickBooks 1099, or IRS FIRE e-file.
              </p>
            </div>
            <Link to="/tax-1099">
              <Button variant="secondary" size="sm">Open 1099 Hub</Button>
            </Link>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 mb-4">
            {([
              ['track1099Export', 'Track1099 (Avalara)', 'E-file 1099-NEC with W-9 collection'],
              ['tax1099ComExport', 'Tax1099.com', 'Bulk import and electronic filing'],
              ['quickBooks1099Export', 'QuickBooks 1099', 'Contractor payment import for QB'],
              ['irsFire1099Export', 'IRS FIRE format', 'Info Return Electronic Filing export'],
            ] as const).map(([key, label, desc]) => (
              <label key={key} className="flex items-start gap-3 p-3 rounded-xl border border-surface-100 hover:bg-surface-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={ints[key]}
                  onChange={(e) => updateIntegrations({ [key]: e.target.checked })}
                  className="mt-1 rounded border-surface-300 text-brand-600 focus:ring-brand-500"
                />
                <div>
                  <p className="text-sm font-medium text-surface-900">{label}</p>
                  <p className="text-xs text-surface-400">{desc}</p>
                </div>
              </label>
            ))}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Track1099 API key (optional)"
              type="password"
              value={creds.track1099ApiKey}
              onChange={(e) => updateIntegrationCredentials({ track1099ApiKey: e.target.value })}
              placeholder="For future direct e-file"
            />
            <Input
              label="Tax1099.com API key (optional)"
              type="password"
              value={creds.tax1099ComApiKey}
              onChange={(e) => updateIntegrationCredentials({ tax1099ComApiKey: e.target.value })}
              placeholder="For future direct e-file"
            />
          </div>
        </Card>

        {/* Other toggles */}
        <Card className="p-6 lg:col-span-2">
          <h2 className="text-base font-semibold text-surface-900 mb-3">Export formats</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {([
              ['quickbooksExport', 'QuickBooks CSV', 'Finance → Reports'],
              ['xeroExport', 'Xero CSV', 'Finance → Reports'],
              ['wiseMultiCurrency', 'Wise multi-currency', 'Payment methods on invoices'],
            ] as const).map(([key, label, hint]) => (
              <label key={key} className="flex items-start gap-3 p-3 rounded-xl border border-surface-100 hover:bg-surface-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={ints[key]}
                  onChange={(e) => updateIntegrations({ [key]: e.target.checked })}
                  className="mt-1 rounded border-surface-300 text-brand-600 focus:ring-brand-500"
                />
                <div>
                  <p className="text-sm font-medium text-surface-900">{label}</p>
                  <p className="text-xs text-surface-400">{hint}</p>
                </div>
              </label>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
