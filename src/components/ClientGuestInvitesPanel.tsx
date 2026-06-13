import { useState } from 'react'
import { UserPlus, Trash2, Link2, Check, Power, Users } from 'lucide-react'
import { useStore } from '../context/StoreContext'
import { Button } from './ui/Button'
import { Input } from './ui/Input'
import { Select } from './ui/Select'
import type { Client, ClientGuestRole } from '../lib/types'
import {
  CLIENT_GUEST_ROLE_OPTIONS, getGuestInviteUrl, guestRoleLabel, publishGuestInvite,
} from '../lib/guest-invites'
import { buildClientAppSession } from '../lib/client-app-state'

type Props = {
  client: Client
}

export function ClientGuestInvitesPanel({ client }: Props) {
  const {
    state, addClientGuestInvite, updateClientGuestInvite, deleteClientGuestInvite,
    generateClientAppToken, updateClient,
  } = useStore()
  const [showForm, setShowForm] = useState(false)
  const [copiedId, setCopiedId] = useState('')
  const [form, setForm] = useState({
    name: '',
    email: '',
    role: 'viewer' as ClientGuestRole,
    label: '',
    expiresInDays: '30',
  })

  const invites = state.clientGuestInvites.filter((i) => i.clientId === client.id)

  const ensureAppToken = () => {
    if (client.clientAppToken) return client.clientAppToken
    const token = generateClientAppToken(client.id)
    updateClient(client.id, { clientAppToken: token })
    return token
  }

  const handleCreate = async () => {
    const appToken = ensureAppToken()
    const expiresAt = form.expiresInDays === 'never'
      ? null
      : new Date(Date.now() + parseInt(form.expiresInDays, 10) * 86400000).toISOString()

    const invite = addClientGuestInvite({
      clientId: client.id,
      clientAppToken: appToken,
      name: form.name,
      email: form.email,
      role: form.role,
      label: form.label || `${form.name} — ${guestRoleLabel(form.role)}`,
      enabled: true,
      expiresAt,
    })

    const session = buildClientAppSession(appToken, client.id, {
      ...state,
      clients: state.clients.map((c) => (c.id === client.id ? { ...c, clientAppToken: appToken } : c)),
    })
    await publishGuestInvite(invite, session)

    setForm({ name: '', email: '', role: 'viewer', label: '', expiresInDays: '30' })
    setShowForm(false)
  }

  const copyLink = async (inviteId: string, token: string) => {
    await navigator.clipboard.writeText(getGuestInviteUrl(token))
    setCopiedId(inviteId)
    setTimeout(() => setCopiedId(''), 2000)
  }

  return (
    <div className="mt-4 pt-4 border-t border-surface-100">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-semibold text-surface-700 flex items-center gap-1">
          <Users size={12} /> Third-party invites
        </p>
        <Button variant="ghost" size="sm" onClick={() => setShowForm(!showForm)}>
          <UserPlus size={12} /> Invite
        </Button>
      </div>

      {showForm && (
        <div className="space-y-2 mb-3 p-3 rounded-lg bg-surface-50 border border-surface-100">
          <Input label="Name" placeholder="Jane Smith" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <Select
            label="Access role"
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value as ClientGuestRole })}
            options={CLIENT_GUEST_ROLE_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
          />
          <Input label="Label (optional)" placeholder="Legal counsel" value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} />
          <Select
            label="Link expires"
            value={form.expiresInDays}
            onChange={(e) => setForm({ ...form, expiresInDays: e.target.value })}
            options={[
              { value: '7', label: '7 days' },
              { value: '30', label: '30 days' },
              { value: '90', label: '90 days' },
              { value: 'never', label: 'Never' },
            ]}
          />
          <div className="flex gap-2 justify-end">
            <Button variant="secondary" size="sm" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button size="sm" disabled={!form.name.trim()} onClick={handleCreate}>Create link</Button>
          </div>
        </div>
      )}

      {invites.length === 0 ? (
        <p className="text-[11px] text-surface-400">Invite lawyers, PMs, or stakeholders with limited access.</p>
      ) : (
        <ul className="space-y-2">
          {invites.map((inv) => (
            <li key={inv.id} className="flex items-center justify-between gap-2 text-xs p-2 rounded-lg bg-surface-50">
              <div className="min-w-0">
                <p className="font-medium text-surface-800 truncate">{inv.name}</p>
                <p className="text-surface-400">{guestRoleLabel(inv.role)}{!inv.enabled && ' · disabled'}</p>
              </div>
              <div className="flex gap-1 shrink-0">
                <button type="button" onClick={() => copyLink(inv.id, inv.token)} className="p-1 text-brand-600 hover:text-brand-800" title="Copy invite link">
                  {copiedId === inv.id ? <Check size={14} /> : <Link2 size={14} />}
                </button>
                <button type="button" onClick={() => updateClientGuestInvite(inv.id, { enabled: !inv.enabled })} className="p-1 text-surface-400 hover:text-surface-600" title={inv.enabled ? 'Disable invite' : 'Enable invite'}>
                  <Power size={14} className={inv.enabled ? '' : 'opacity-40'} />
                </button>
                <button type="button" onClick={() => deleteClientGuestInvite(inv.id)} className="p-1 text-surface-400 hover:text-red-600">
                  <Trash2 size={14} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
