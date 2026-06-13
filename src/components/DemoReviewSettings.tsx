import { useState } from 'react'
import {
  Sparkles, Eye, Link2, Copy, Check, Shield, RefreshCw, ExternalLink, Power, Download,
} from 'lucide-react'
import { useStore } from '../context/StoreContext'
import { Button } from './ui/Button'
import { Input } from './ui/Input'
import { Select } from './ui/Select'
import { Card } from './ui/Card'
import type { DemoRoomMode } from '../lib/types'
import {
  computeDemoExpiry, getDemoUrl, isDemoExpired, publishDemoSession, revokeDemoSession,
} from '../lib/demo'
import { getClientHubUrl, publishClientRoomConfig, syncClientRoomFromState } from '../lib/client-room'

const EXPIRY_OPTIONS = [
  { value: '24', label: '24 hours' },
  { value: '168', label: '7 days' },
  { value: '720', label: '30 days' },
  { value: 'never', label: 'No expiry' },
]

export function DemoReviewSettings() {
  const { state, updateDemoSettings } = useStore()
  const { demoSettings } = state
  const [copied, setCopied] = useState(false)
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState('')

  const token = demoSettings.token
  const link = token ? getDemoUrl(token) : ''
  const hubLink = token ? getClientHubUrl(token) : ''
  const [hubCopied, setHubCopied] = useState(false)
  const expired = isDemoExpired(demoSettings.expiresAt)

  const publishBoth = async (t: string, next: typeof demoSettings) => {
    const synced = syncClientRoomFromState(state)
    const withRoom = { ...next, clientRoom: synced }
    updateDemoSettings({ clientRoom: synced })
    const [demoOk, hubOk] = await Promise.all([
      publishDemoSession(t, withRoom, state),
      publishClientRoomConfig(t, withRoom, state),
    ])
    return demoOk || hubOk
  }

  const ensureToken = () => {
    if (demoSettings.token) return demoSettings.token
    const newToken = crypto.randomUUID()
    updateDemoSettings({ token: newToken, createdAt: new Date().toISOString() })
    return newToken
  }

  const handleToggle = async (enabled: boolean) => {
    setBusy(true)
    setStatus('')
    const t = ensureToken()
    const next = {
      ...demoSettings,
      enabled,
      token: t,
      createdAt: demoSettings.createdAt || new Date().toISOString(),
      expiresAt: demoSettings.expiresAt ?? computeDemoExpiry(168),
    }
    updateDemoSettings(next)
    if (enabled) {
      const ok = await publishBoth(t, next)
      setStatus(ok ? 'Demo room and client hub are live. Share either link with your client.' : 'Saved locally. Deploy to Netlify with Identity for remote client access.')
    } else {
      await revokeDemoSession(t)
      updateDemoSettings({ enabled: false })
      setStatus('Demo room turned off. Existing links no longer work.')
    }
    setBusy(false)
  }

  const handleRegenerate = async () => {
    if (!confirm('Regenerate link? Old links will stop working immediately.')) return
    setBusy(true)
    if (token) await revokeDemoSession(token)
    const newToken = crypto.randomUUID()
    const next = {
      ...demoSettings,
      token: newToken,
      createdAt: new Date().toISOString(),
      accessCount: 0,
      lastAccessedAt: null,
    }
    updateDemoSettings(next)
    if (demoSettings.enabled) {
      await publishBoth(newToken, { ...next, enabled: true })
    }
    setStatus('New secure link generated.')
    setBusy(false)
  }

  const copyLink = async () => {
    const t = ensureToken()
    await navigator.clipboard.writeText(getDemoUrl(t))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const openPreview = () => {
    const t = ensureToken()
    if (!demoSettings.enabled) {
      updateDemoSettings({
        enabled: true,
        token: t,
        createdAt: demoSettings.createdAt || new Date().toISOString(),
        expiresAt: demoSettings.expiresAt ?? computeDemoExpiry(168),
      })
    }
    window.open(getDemoUrl(t), '_blank', 'noopener,noreferrer')
  }

  return (
    <Card className="lg:col-span-2">
      <div className="px-6 py-4 border-b border-surface-100">
        <h2 className="text-base font-semibold text-surface-900 flex items-center gap-2">
          <Sparkles size={16} /> Client Demo & Review Room
        </h2>
        <p className="text-xs text-surface-400 mt-1">
          Share a secure demo room and transfer your actual project files, app builds, and preview links to clients.
        </p>
      </div>

      <div className="p-6 space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            label="Room type"
            value={demoSettings.mode}
            onChange={(e) => updateDemoSettings({ mode: e.target.value as DemoRoomMode })}
            options={[
              { value: 'demo', label: 'Interactive Demo — client can click & test features' },
              { value: 'review', label: 'Review Mode — read-only walkthrough' },
            ]}
          />
          <Select
            label="Link expires"
            value={
              !demoSettings.expiresAt ? 'never'
              : demoSettings.expiresAt && new Date(demoSettings.expiresAt).getTime() - Date.now() < 86400000 * 2 ? '24'
              : demoSettings.expiresAt && new Date(demoSettings.expiresAt).getTime() - Date.now() < 86400000 * 10 ? '168'
              : '720'
            }
            onChange={(e) => {
              const v = e.target.value
              updateDemoSettings({
                expiresAt: v === 'never' ? null : computeDemoExpiry(parseInt(v, 10)),
              })
            }}
            options={EXPIRY_OPTIONS}
          />
        </div>

        <Input
          label="Session label (shown to your client)"
          value={demoSettings.label}
          onChange={(e) => updateDemoSettings({ label: e.target.value })}
          placeholder="e.g. Acme Corp Product Review"
        />

        <div className="rounded-xl border border-surface-200 bg-white p-4">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={demoSettings.allowDownloads}
              onChange={async (e) => {
                const allowDownloads = e.target.checked
                const next = { ...demoSettings, allowDownloads }
                updateDemoSettings({ allowDownloads })
                if (next.enabled && next.token) {
                  setBusy(true)
                  const ok = await publishBoth(next.token, next)
                  setStatus(ok ? 'Download setting updated for active room.' : 'Saved locally.')
                  setBusy(false)
                }
              }}
              className="mt-1 rounded border-surface-300 text-brand-600 focus:ring-brand-500"
            />
            <div>
              <p className="text-sm font-medium text-surface-900 flex items-center gap-2">
                <Download size={14} className="text-brand-600" />
                Allow client downloads
              </p>
              <p className="text-xs text-surface-500 mt-1 leading-relaxed">
                Off by default (view-only). Enable before sharing the link if you want clients to download
                project files, PDFs, and CSV exports. You can change this anytime — re-publish by turning the room off and on.
              </p>
            </div>
          </label>
        </div>

        <div className="rounded-xl border border-surface-200 bg-surface-50 p-4 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-surface-500">Security guarantees</p>
          <ul className="text-xs text-surface-600 space-y-1.5">
            <li className="flex items-start gap-2"><Shield size={12} className="mt-0.5 text-brand-500 shrink-0" /> Visitors only see fictional sample data — never your real clients or finances</li>
            <li className="flex items-start gap-2"><Shield size={12} className="mt-0.5 text-brand-500 shrink-0" /> Isolated in-memory session — cannot read your localStorage or cloud backups</li>
            <li className="flex items-start gap-2"><Shield size={12} className="mt-0.5 text-brand-500 shrink-0" /> Downloads {demoSettings.allowDownloads ? 'enabled — clients can save files and exports' : 'disabled by default — clients can preview only'}</li>
            <li className="flex items-start gap-2"><Shield size={12} className="mt-0.5 text-brand-500 shrink-0" /> Revoke access anytime by turning off or regenerating the link</li>
          </ul>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {demoSettings.enabled && !expired ? (
            <Button variant="danger" onClick={() => handleToggle(false)} disabled={busy}>
              <Power size={14} /> Turn Off Demo Room
            </Button>
          ) : (
            <Button onClick={() => handleToggle(true)} disabled={busy}>
              {demoSettings.mode === 'review' ? <Eye size={14} /> : <Sparkles size={14} />}
              Turn On {demoSettings.mode === 'review' ? 'Review' : 'Demo'} Room
            </Button>
          )}
          <Button variant="secondary" onClick={openPreview} disabled={busy}>
            <ExternalLink size={14} /> Open Preview
          </Button>
          <Button variant="secondary" onClick={handleRegenerate} disabled={busy}>
            <RefreshCw size={14} /> Regenerate Link
          </Button>
        </div>

        {token && (
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row gap-2">
              <Input label="Demo link" value={link} readOnly className="flex-1" />
              <Button variant="secondary" className="sm:self-end" onClick={copyLink}>
                {copied ? <><Check size={14} /> Copied</> : <><Copy size={14} /> Copy Demo</>}
              </Button>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Input label="Client hub link (feedback, sign-off, invoices)" value={hubLink} readOnly className="flex-1" />
              <Button variant="secondary" className="sm:self-end" onClick={async () => {
                await navigator.clipboard.writeText(hubLink)
                setHubCopied(true)
                setTimeout(() => setHubCopied(false), 2000)
              }}>
                {hubCopied ? <><Check size={14} /> Copied</> : <><Copy size={14} /> Copy Hub</>}
              </Button>
            </div>
          </div>
        )}

        {demoSettings.enabled && (
          <div className="flex flex-wrap gap-4 text-xs text-surface-500">
            <span className="flex items-center gap-1">
              <Link2 size={12} />
              {demoSettings.accessCount} visit{demoSettings.accessCount !== 1 ? 's' : ''}
            </span>
            {demoSettings.lastAccessedAt && (
              <span>Last accessed {new Date(demoSettings.lastAccessedAt).toLocaleString()}</span>
            )}
            {expired && <span className="text-red-600 font-medium">Link expired — turn on again to refresh</span>}
          </div>
        )}

        {status && <p className="text-sm text-brand-700 bg-brand-50 rounded-lg px-3 py-2">{status}</p>}
      </div>
    </Card>
  )
}
