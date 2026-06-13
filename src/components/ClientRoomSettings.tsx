import { useState } from 'react'
import {
  Users, Shield, ListChecks, Map, MessageSquare,
  Upload, Sparkles, Plus, Trash2, RefreshCw, Activity, Bell,
} from 'lucide-react'
import { useStore } from '../context/StoreContext'
import { Card } from './ui/Card'
import { Input } from './ui/Input'
import { Textarea } from './ui/Textarea'
import { Button } from './ui/Button'
import type { ClientRoomChecklistItem } from '../lib/types'
import {
  getClientHubUrl, notifyClientByEmail, publishClientRoomConfig,
  syncClientRoomFromState,
} from '../lib/client-room'
import { formatDate } from '../lib/utils'

function loadOwnerRoomData(token: string) {
  try {
    const raw = localStorage.getItem(`workvault-client-room-data-${token}`)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function ClientRoomSettings() {
  const { state, updateDemoSettings } = useStore()
  const { demoSettings } = state
  const room = demoSettings.clientRoom
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState('')
  const [newCheckItem, setNewCheckItem] = useState('')

  const token = demoSettings.token
  const hubLink = token ? getClientHubUrl(token) : ''

  const patchRoom = (patch: Partial<typeof room>) => {
    updateDemoSettings({ clientRoom: { ...room, ...patch } })
  }

  const addChecklistItem = () => {
    if (!newCheckItem.trim()) return
    const item: ClientRoomChecklistItem = {
      id: crypto.randomUUID(),
      label: newCheckItem.trim(),
      required: false,
    }
    patchRoom({ checklist: [...room.checklist, item] })
    setNewCheckItem('')
  }

  const removeChecklistItem = (id: string) => {
    patchRoom({ checklist: room.checklist.filter((c) => c.id !== id) })
  }

  const syncFromProjects = () => {
    const synced = syncClientRoomFromState(state)
    updateDemoSettings({ clientRoom: synced })
    setStatus('Timeline and availability synced from your projects & calendar.')
  }

  const publishHub = async () => {
    if (!token) {
      setStatus('Turn on the demo room first to generate a link.')
      return
    }
    setBusy(true)
    const synced = syncClientRoomFromState(state)
    updateDemoSettings({ clientRoom: synced })
    const ok = await publishClientRoomConfig(token, { ...demoSettings, clientRoom: synced }, state)
    setStatus(ok ? 'Client hub published.' : 'Saved locally — deploy to Netlify for remote clients.')
    setBusy(false)
  }

  const notifyClient = () => {
    const email = room.notifyClientEmail
    if (!email || !token) return
    notifyClientByEmail(
      email,
      `${state.profile.name || 'Your contractor'} — review room ready`,
      `Hi,\n\nYour project review hub is ready.\n\nOpen: ${hubLink}\n\n${room.hubWelcomeMessage || 'Looking forward to your feedback.'}\n\nThank you.`,
    )
    setStatus('Email draft opened — send when ready.')
  }

  const activity = token ? loadOwnerRoomData(token) : null

  return (
    <Card className="lg:col-span-2">
      <div className="px-6 py-4 border-b border-surface-100">
        <h2 className="text-base font-semibold text-surface-900 flex items-center gap-2">
          <Users size={16} /> Client Review Hub
        </h2>
        <p className="text-xs text-surface-400 mt-1">
          Branded mobile-first room for feedback, sign-off, Q&amp;A, invoices, and more — share the hub link instead of (or alongside) the demo link.
        </p>
      </div>

      <div className="p-6 space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Version label"
            placeholder="e.g. v2 — Homepage redesign"
            value={room.versionLabel}
            onChange={(e) => patchRoom({ versionLabel: e.target.value })}
          />
          <Input
            label="Notify client email"
            type="email"
            placeholder="client@company.com"
            value={room.notifyClientEmail || ''}
            onChange={(e) => patchRoom({ notifyClientEmail: e.target.value || null })}
          />
        </div>

        <Textarea
          label="Welcome message"
          value={room.hubWelcomeMessage}
          onChange={(e) => patchRoom({ hubWelcomeMessage: e.target.value })}
          placeholder="Brief intro for your client…"
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Link password (optional)"
            type="password"
            placeholder="Leave blank for open access"
            value={room.linkPassword || ''}
            onChange={(e) => patchRoom({ linkPassword: e.target.value || null })}
          />
          <Input
            label="Preview watermark"
            value={room.watermarkText}
            onChange={(e) => patchRoom({ watermarkText: e.target.value })}
          />
        </div>

        <div className="rounded-xl border border-surface-200 p-4 space-y-3">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={room.ndaRequired}
              onChange={(e) => patchRoom({ ndaRequired: e.target.checked })}
              className="mt-1 rounded text-brand-600"
            />
            <div>
              <p className="text-sm font-medium text-surface-900 flex items-center gap-2"><Shield size={14} /> Require NDA before access</p>
            </div>
          </label>
          {room.ndaRequired && (
            <Textarea
              label="NDA / confidentiality text"
              value={room.ndaText}
              onChange={(e) => patchRoom({ ndaText: e.target.value })}
            />
          )}
        </div>

        <div className="rounded-xl border border-surface-200 p-4 space-y-3">
          <p className="text-sm font-medium text-surface-900 flex items-center gap-2"><ListChecks size={14} /> Review checklist</p>
          <div className="space-y-2">
            {room.checklist.map((item) => (
              <div key={item.id} className="flex items-center gap-2">
                <Input value={item.label} className="flex-1" onChange={(e) => {
                  patchRoom({
                    checklist: room.checklist.map((c) => c.id === item.id ? { ...c, label: e.target.value } : c),
                  })
                }} />
                <label className="text-xs text-surface-500 flex items-center gap-1 shrink-0">
                  <input
                    type="checkbox"
                    checked={item.required}
                    onChange={(e) => patchRoom({
                      checklist: room.checklist.map((c) => c.id === item.id ? { ...c, required: e.target.checked } : c),
                    })}
                  />
                  Required
                </label>
                <button type="button" onClick={() => removeChecklistItem(item.id)} className="text-surface-400 hover:text-red-600 p-1">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <Input value={newCheckItem} onChange={(e) => setNewCheckItem(e.target.value)} placeholder="Add checklist item…" className="flex-1" />
            <Button variant="secondary" onClick={addChecklistItem}><Plus size={14} /> Add</Button>
          </div>
        </div>

        <div className="flex flex-wrap gap-4">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={room.guidedTourEnabled} onChange={(e) => patchRoom({ guidedTourEnabled: e.target.checked })} className="rounded text-brand-600" />
            <Sparkles size={14} /> Guided tour on first visit
          </label>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={room.clientAssetUploadEnabled} onChange={(e) => patchRoom({ clientAssetUploadEnabled: e.target.checked })} className="rounded text-brand-600" />
            <Upload size={14} /> Client can upload files
          </label>
        </div>

        <div className="flex flex-wrap gap-3 items-end">
          <Button variant="secondary" onClick={notifyClient} disabled={!room.notifyClientEmail}>
            <Bell size={14} /> Send update email
          </Button>
          <Button variant="secondary" onClick={syncFromProjects}>
            <RefreshCw size={14} /> Sync timeline &amp; slots
          </Button>
        </div>

        {room.milestones.length > 0 && (
          <div className="text-xs text-surface-500 flex items-center gap-2">
            <Map size={12} /> {room.milestones.length} milestone{room.milestones.length !== 1 ? 's' : ''} · {room.availabilitySlots.length} availability slot{room.availabilitySlots.length !== 1 ? 's' : ''}
          </div>
        )}

        <div className="flex flex-wrap gap-3">
          <Button onClick={publishHub} disabled={busy || !token}>
            Publish client hub
          </Button>
          {hubLink && (
            <Input label="Hub link (share with client)" value={hubLink} readOnly className="flex-1 min-w-[200px]" />
          )}
        </div>

        {activity && (activity.feedback?.length > 0 || activity.signOff || activity.messages?.length > 0) && (
          <div className="rounded-xl border border-surface-200 bg-surface-50 p-4 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-surface-500 flex items-center gap-2">
              <Activity size={12} /> Client activity (local)
            </p>
            {activity.signOff && (
              <p className="text-sm text-emerald-700">Signed off by {activity.signOff.clientName} · {formatDate(activity.signOff.signedAt)}</p>
            )}
            {activity.feedback?.slice(0, 3).map((f: { id: string; clientName: string; status: string; comment: string }) => (
              <div key={f.id} className="text-xs p-2 bg-white rounded-lg">
                <span className="font-medium">{f.clientName}</span> — {f.status}: {f.comment || '—'}
              </div>
            ))}
            {activity.messages?.length > 0 && (
              <p className="text-xs text-surface-500 flex items-center gap-1"><MessageSquare size={12} /> {activity.messages.length} Q&amp;A message(s)</p>
            )}
            {activity.auditLog?.length > 0 && (
              <p className="text-xs text-surface-400">{activity.auditLog.length} audit events logged</p>
            )}
          </div>
        )}

        {status && <p className="text-sm text-brand-700 bg-brand-50 rounded-lg px-3 py-2">{status}</p>}
      </div>
    </Card>
  )
}
