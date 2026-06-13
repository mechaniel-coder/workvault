import { useEffect, useState } from 'react'
import {
  FolderOpen, Loader2, Plug, MessageSquare, Clock, FileSignature,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { useStore } from '../context/StoreContext'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { maskSecret } from '../lib/integrations-api'
import {
  startGoogleDriveOAuth, exchangeGoogleDriveOAuthCode,
  startDropboxOAuth, exchangeDropboxOAuthCode,
} from '../lib/cloud-storage'

type Props = {
  onStatus: (msg: string) => void
  oauthCode?: string | null
  oauthProvider?: 'google_drive' | 'dropbox' | null
  onOAuthHandled: () => void
}

export function DeliveryIntegrationsSection({ onStatus, oauthCode, oauthProvider, onOAuthHandled }: Props) {
  const { state, updateIntegrations, updateIntegrationCredentials } = useStore()
  const [busy, setBusy] = useState('')
  const creds = state.integrationCredentials
  const ints = state.integrations

  useEffect(() => {
    if (!oauthCode || !oauthProvider) return
    const run = async () => {
      try {
        if (oauthProvider === 'google_drive') {
          const data = await exchangeGoogleDriveOAuthCode(oauthCode)
          updateIntegrationCredentials({
            googleDriveRefreshToken: data.refreshToken,
            googleDriveEmail: data.email,
          })
          updateIntegrations({ googleDriveDeliverables: true })
          onStatus(`Connected Google Drive: ${data.email}`)
        } else if (oauthProvider === 'dropbox') {
          const data = await exchangeDropboxOAuthCode(oauthCode)
          updateIntegrationCredentials({
            dropboxRefreshToken: data.refreshToken,
            dropboxAccountEmail: data.email,
          })
          updateIntegrations({ dropboxDeliverables: true })
          onStatus(`Connected Dropbox: ${data.email}`)
        }
      } catch (e) {
        onStatus(e instanceof Error ? e.message : 'Connection failed')
      } finally {
        onOAuthHandled()
      }
    }
    run()
  }, [oauthCode, oauthProvider, onOAuthHandled, onStatus, updateIntegrationCredentials, updateIntegrations])

  return (
    <>
      <Card className="p-6 lg:col-span-2">
        <h2 className="text-base font-semibold text-surface-900 flex items-center gap-2 mb-1">
          <FolderOpen size={18} className="text-amber-600" /> Cloud deliverables
        </h2>
        <p className="text-sm text-surface-500 mb-4">
          Link Google Drive or Dropbox folders to projects. Clients see files in their hub.
        </p>
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-surface-200 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="font-medium text-surface-900">Google Drive</p>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={ints.googleDriveDeliverables} onChange={(e) => updateIntegrations({ googleDriveDeliverables: e.target.checked })} className="rounded border-surface-300 text-brand-600" />
                <span className="text-xs">Enabled</span>
              </label>
            </div>
            {creds.googleDriveEmail && <Badge status="signed">{creds.googleDriveEmail}</Badge>}
            {!creds.googleDriveRefreshToken ? (
              <Button size="sm" onClick={async () => { setBusy('gd'); window.location.href = await startGoogleDriveOAuth() }} disabled={busy === 'gd'}>
                {busy === 'gd' ? <Loader2 size={14} className="animate-spin" /> : <Plug size={14} />} Connect
              </Button>
            ) : (
              <Button size="sm" variant="ghost" onClick={() => updateIntegrationCredentials({ googleDriveRefreshToken: '', googleDriveEmail: '' })}>Disconnect</Button>
            )}
          </div>
          <div className="rounded-xl border border-surface-200 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="font-medium text-surface-900">Dropbox</p>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={ints.dropboxDeliverables} onChange={(e) => updateIntegrations({ dropboxDeliverables: e.target.checked })} className="rounded border-surface-300 text-brand-600" />
                <span className="text-xs">Enabled</span>
              </label>
            </div>
            {creds.dropboxAccountEmail && <Badge status="signed">{creds.dropboxAccountEmail}</Badge>}
            {!creds.dropboxRefreshToken ? (
              <Button size="sm" onClick={async () => { setBusy('db'); window.location.href = await startDropboxOAuth() }} disabled={busy === 'db'}>
                {busy === 'db' ? <Loader2 size={14} className="animate-spin" /> : <Plug size={14} />} Connect
              </Button>
            ) : (
              <Button size="sm" variant="ghost" onClick={() => updateIntegrationCredentials({ dropboxRefreshToken: '', dropboxAccountEmail: '' })}>Disconnect</Button>
            )}
          </div>
        </div>
        <p className="text-xs text-surface-500 mt-3">
          Attach folders on <Link to="/pipeline" className="text-brand-600 hover:underline">Pipeline</Link> projects.
          Requires <code className="bg-surface-100 px-1 rounded text-[10px]">GOOGLE_CLIENT_ID</code> or{' '}
          <code className="bg-surface-100 px-1 rounded text-[10px]">DROPBOX_APP_KEY</code> in Netlify env.
        </p>
      </Card>

      <Card className="p-6">
        <h2 className="text-base font-semibold text-surface-900 flex items-center gap-2 mb-1">
          <MessageSquare size={18} className="text-purple-600" /> Slack notifications
        </h2>
        <p className="text-sm text-surface-500 mb-4">Post to Slack when invoices are paid, contracts signed, or scope changes logged.</p>
        <label className="flex items-center gap-2 cursor-pointer mb-3">
          <input type="checkbox" checked={ints.slackNotifications} onChange={(e) => updateIntegrations({ slackNotifications: e.target.checked })} className="rounded border-surface-300 text-brand-600" />
          <span className="text-sm">Enable Slack notifications</span>
        </label>
        <div className="space-y-3">
          <Input label="Incoming webhook URL" type="password" value={creds.slackWebhookUrl} onChange={(e) => updateIntegrationCredentials({ slackWebhookUrl: e.target.value })} placeholder="https://hooks.slack.com/..." />
          <div className="grid gap-3 sm:grid-cols-2">
            <Input label="Bot token (optional)" type="password" value={creds.slackBotToken} onChange={(e) => updateIntegrationCredentials({ slackBotToken: e.target.value })} placeholder="xoxb-..." />
            <Input label="Channel (with bot)" value={creds.slackChannel} onChange={(e) => updateIntegrationCredentials({ slackChannel: e.target.value })} placeholder="#general" />
          </div>
          {creds.slackWebhookUrl && <p className="text-xs text-surface-400">Webhook: {maskSecret(creds.slackWebhookUrl)}</p>}
          <div className="flex flex-wrap gap-3 text-sm">
            <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={ints.slackNotifyInvoicePaid} onChange={(e) => updateIntegrations({ slackNotifyInvoicePaid: e.target.checked })} className="rounded" /> Invoice paid</label>
            <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={ints.slackNotifyContractSigned} onChange={(e) => updateIntegrations({ slackNotifyContractSigned: e.target.checked })} className="rounded" /> Contract signed</label>
            <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={ints.slackNotifyScopeChange} onChange={(e) => updateIntegrations({ slackNotifyScopeChange: e.target.checked })} className="rounded" /> Scope change</label>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-base font-semibold text-surface-900 flex items-center gap-2 mb-1">
          <Clock size={18} className="text-teal-600" /> Time import
        </h2>
        <p className="text-sm text-surface-500 mb-4">Import entries from Toggl or Harvest into Time Tracker.</p>
        <label className="flex items-center gap-2 cursor-pointer mb-2"><input type="checkbox" checked={ints.togglImport} onChange={(e) => updateIntegrations({ togglImport: e.target.checked })} className="rounded border-surface-300 text-brand-600" /><span className="text-sm">Toggl</span></label>
        {ints.togglImport && (
          <div className="grid gap-3 sm:grid-cols-2 mb-3">
            <Input label="Toggl API token" type="password" value={creds.togglApiToken} onChange={(e) => updateIntegrationCredentials({ togglApiToken: e.target.value })} />
            <Input label="Workspace ID (optional)" value={creds.togglWorkspaceId} onChange={(e) => updateIntegrationCredentials({ togglWorkspaceId: e.target.value })} />
          </div>
        )}
        <label className="flex items-center gap-2 cursor-pointer mb-2"><input type="checkbox" checked={ints.harvestImport} onChange={(e) => updateIntegrations({ harvestImport: e.target.checked })} className="rounded border-surface-300 text-brand-600" /><span className="text-sm">Harvest</span></label>
        {ints.harvestImport && (
          <div className="grid gap-3 sm:grid-cols-2 mb-3">
            <Input label="Harvest access token" type="password" value={creds.harvestAccessToken} onChange={(e) => updateIntegrationCredentials({ harvestAccessToken: e.target.value })} />
            <Input label="Account ID" value={creds.harvestAccountId} onChange={(e) => updateIntegrationCredentials({ harvestAccountId: e.target.value })} />
          </div>
        )}
        <Link to="/time"><Button variant="secondary" size="sm">Open Time Tracker</Button></Link>
      </Card>

      <Card className="p-6">
        <h2 className="text-base font-semibold text-surface-900 flex items-center gap-2 mb-1">
          <FileSignature size={18} className="text-blue-700" /> DocuSign
        </h2>
        <p className="text-sm text-surface-500 mb-4">Send contracts via DocuSign for enterprise clients.</p>
        <label className="flex items-center gap-2 cursor-pointer mb-3">
          <input type="checkbox" checked={ints.docusignEnabled} onChange={(e) => updateIntegrations({ docusignEnabled: e.target.checked })} className="rounded border-surface-300 text-brand-600" />
          <span className="text-sm">Enable DocuSign</span>
        </label>
        <div className="space-y-3">
          <Input label="Integration key" value={creds.docusignIntegrationKey} onChange={(e) => updateIntegrationCredentials({ docusignIntegrationKey: e.target.value })} />
          <div className="grid gap-3 sm:grid-cols-2">
            <Input label="Account ID" value={creds.docusignAccountId} onChange={(e) => updateIntegrationCredentials({ docusignAccountId: e.target.value })} />
            <Input label="User ID" value={creds.docusignUserId} onChange={(e) => updateIntegrationCredentials({ docusignUserId: e.target.value })} />
          </div>
          <Input label="Access token" type="password" value={creds.docusignAccessToken} onChange={(e) => updateIntegrationCredentials({ docusignAccessToken: e.target.value })} placeholder="From DocuSign OAuth or JWT" />
          <Input label="API base URL" value={creds.docusignBaseUrl} onChange={(e) => updateIntegrationCredentials({ docusignBaseUrl: e.target.value })} placeholder="https://demo.docusign.net/restapi" />
        </div>
        <p className="text-xs text-surface-500 mt-3">
          Use <strong>Send with DocuSign</strong> on Contracts. Set <code className="bg-surface-100 px-1 rounded text-[10px]">DOCUSIGN_ACCESS_TOKEN</code> and{' '}
          <code className="bg-surface-100 px-1 rounded text-[10px]">DOCUSIGN_ACCOUNT_ID</code> in Netlify for server-side signing.
        </p>
        <Link to="/contracts" className="inline-flex mt-3"><Button variant="secondary" size="sm">Open Contracts</Button></Link>
      </Card>
    </>
  )
}
