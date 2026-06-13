import { useState } from 'react'
import { Users, Plus, Trash2, Mail, Phone, Building2, Pencil, Link2, Check, Download, Cloud } from 'lucide-react'
import { useStore } from '../context/StoreContext'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Textarea } from '../components/ui/Textarea'
import { Card } from '../components/ui/Card'
import { Modal, PageHeader, EmptyState } from '../components/ui/Modal'
import type { Client } from '../lib/types'
import { DEFAULT_CLIENT_APP_LIFECYCLE } from '../lib/types'
import { formatCurrency, formatDate } from '../lib/utils'
import { getPortalUrl, publishClientPortal } from '../lib/portal'
import { getClientAppUrl, publishClientApp, exportClientWorkspaceForClient } from '../lib/client-app'
import { ClientGuestInvitesPanel } from '../components/ClientGuestInvitesPanel'
import { ClientAppLifecyclePanel } from '../components/ClientAppLifecyclePanel'

export default function Clients() {
  const { state, addClient, updateClient, deleteClient, generateClientPortalToken, generateClientAppToken, isIsolated } = useStore()
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Client | null>(null)
  const [form, setForm] = useState({ name: '', email: '', phone: '', company: '', address: '', notes: '' })
  const [copiedId, setCopiedId] = useState('')
  const [copiedAppId, setCopiedAppId] = useState('')
  const [publishStatus, setPublishStatus] = useState('')

  const openCreate = () => {
    setEditing(null)
    setForm({ name: '', email: '', phone: '', company: '', address: '', notes: '' })
    setShowForm(true)
  }

  const openEdit = (client: Client) => {
    setEditing(client)
    setForm({ name: client.name, email: client.email, phone: client.phone, company: client.company, address: client.address, notes: client.notes })
    setShowForm(true)
  }

  const handleSave = () => {
    if (editing) {
      updateClient(editing.id, form)
    } else {
      addClient(form)
    }
    setShowForm(false)
  }

  const getClientStats = (clientId: string) => {
    const contracts = state.contracts.filter((c) => c.clientId === clientId).length
    const invoices = state.invoices.filter((i) => i.clientId === clientId)
    const revenue = invoices.filter((i) => i.status === 'paid').reduce((s, i) => s + i.total, 0)
    const hours = state.timeEntries.filter((e) => e.clientId === clientId).reduce((s, e) => s + e.durationMinutes, 0)
    return { contracts, revenue, hours: (hours / 60).toFixed(1) }
  }

  const handleClientAppLink = async (client: Client) => {
    const token = client.clientAppToken || generateClientAppToken(client.id)
    const updated = {
      ...client,
      clientAppToken: token,
      appLifecycle: client.appLifecycle.status === 'archived'
        ? { ...DEFAULT_CLIENT_APP_LIFECYCLE }
        : client.appLifecycle,
    }
    if (!client.clientAppToken || client.appLifecycle.status === 'archived') {
      updateClient(client.id, {
        clientAppToken: token,
        appLifecycle: updated.appLifecycle,
      })
    }
    const result = await publishClientApp(token, updated, state, { downloadBundle: true })
    const url = getClientAppUrl(token)
    await navigator.clipboard.writeText(url)
    setCopiedAppId(client.id)
    setPublishStatus(
      result.remote
        ? 'Link copied · workspace file downloaded · synced to Netlify'
        : 'Link copied · workspace file downloaded · local only (sign in to Netlify to sync)',
    )
    setTimeout(() => {
      setCopiedAppId('')
      setPublishStatus('')
    }, 4000)
  }

  const handleExportWorkspace = async (client: Client) => {
    const token = client.clientAppToken || generateClientAppToken(client.id)
    if (!client.clientAppToken) {
      updateClient(client.id, { clientAppToken: token })
    }
    await exportClientWorkspaceForClient(token, { ...client, clientAppToken: token }, state)
    setPublishStatus(`Exported .workvault file for ${client.name}`)
    setTimeout(() => setPublishStatus(''), 3000)
  }

  const handlePortalLink = async (client: Client) => {
    const token = client.portalToken || generateClientPortalToken(client.id)
    await publishClientPortal(token, { ...client, portalToken: token }, state)
    const url = getPortalUrl(token)
    await navigator.clipboard.writeText(url)
    setCopiedId(client.id)
    setTimeout(() => setCopiedId(''), 2000)
  }

  return (
    <div>
      <PageHeader
        title="Clients"
        description="Manage your client relationships and contact info."
        action={
          <Button onClick={openCreate}>
            <Plus size={16} /> Add Client
          </Button>
        }
      />

      {state.clients.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Users size={24} />}
            title="No clients yet"
            description="Add your first client to start creating contracts and invoices."
            action={<Button onClick={openCreate}><Plus size={16} /> Add Client</Button>}
          />
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {state.clients.map((client) => {
            const stats = getClientStats(client.id)
            return (
              <Card key={client.id} className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-100 text-brand-700 font-semibold text-sm">
                      {client.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-surface-900">{client.name}</h3>
                      {client.company && (
                        <p className="text-sm text-surface-500 flex items-center gap-1">
                          <Building2 size={12} /> {client.company}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(client)} className="text-surface-400 hover:text-brand-600 p-1">
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => deleteClient(client.id)} className="text-surface-400 hover:text-red-500 p-1">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <div className="mt-4 space-y-1.5 text-sm text-surface-600">
                  {client.email && (
                    <p className="flex items-center gap-2">
                      <Mail size={14} className="text-surface-400" /> {client.email}
                    </p>
                  )}
                  {client.phone && (
                    <p className="flex items-center gap-2">
                      <Phone size={14} className="text-surface-400" /> {client.phone}
                    </p>
                  )}
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2 border-t border-surface-100 pt-4">
                  <div className="text-center">
                    <p className="text-lg font-bold text-surface-900">{stats.contracts}</p>
                    <p className="text-[10px] uppercase tracking-wider text-surface-400">Contracts</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-emerald-600">{formatCurrency(stats.revenue, state.profile.defaultCurrency)}</p>
                    <p className="text-[10px] uppercase tracking-wider text-surface-400">Revenue</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-surface-900">{stats.hours}h</p>
                    <p className="text-[10px] uppercase tracking-wider text-surface-400">Hours</p>
                  </div>
                </div>

                <p className="text-xs text-surface-400 mt-3">Added {formatDate(client.createdAt)}</p>

                {!isIsolated && (
                  <div className="flex flex-col gap-2 mt-3">
                    <Button
                      variant="primary"
                      size="sm"
                      className="w-full"
                      onClick={() => handleClientAppLink(client)}
                    >
                      {copiedAppId === client.id ? (
                        <><Check size={14} /> Link Copied + File Downloaded</>
                      ) : (
                        <><Link2 size={14} /> Send Client WorkVault</>
                      )}
                    </Button>
                    <p className="text-[10px] text-surface-400 flex items-center gap-1 px-0.5">
                      <Cloud size={10} /> Copies hosted link, downloads .workvault file, saves locally &amp; syncs to Netlify
                    </p>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="w-full"
                      onClick={() => handleExportWorkspace(client)}
                    >
                      <Download size={14} /> Export workspace file only
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="w-full"
                      onClick={() => handlePortalLink(client)}
                    >
                      {copiedId === client.id ? (
                        <><Check size={14} /> Portal Link Copied</>
                      ) : (
                        <><Link2 size={14} /> Copy Simple Portal Link</>
                      )}
                    </Button>
                    <ClientAppLifecyclePanel client={client} />
                    {publishStatus && client.clientAppToken && (
                      <p className="text-[10px] text-brand-700">{publishStatus}</p>
                    )}
                  </div>
                )}

                {!isIsolated && <ClientGuestInvitesPanel client={client} />}
              </Card>
            )
          })}
        </div>
      )}

      <Modal open={showForm} onClose={() => setShowForm(false)} title={editing ? 'Edit Client' : 'Add Client'}>
        <div className="space-y-4">
          <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <Input label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <Input label="Company" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
          <Input label="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          <Textarea label="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={!form.name}>{editing ? 'Save Changes' : 'Add Client'}</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
