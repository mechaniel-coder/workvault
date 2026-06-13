import { useMemo, useState } from 'react'
import { Clock3, Pencil, Plus, Trash2 } from 'lucide-react'
import { useStore } from '../context/StoreContext'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { Textarea } from '../components/ui/Textarea'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Modal, PageHeader, EmptyState } from '../components/ui/Modal'
import type { ScopeEntry } from '../lib/types'
import { formatDate } from '../lib/utils'
import { notifySlackEvent } from '../lib/slack-notify'

type ScopeForm = {
  title: string
  description: string
  clientId: string
  projectId: string
  requestedBy: string
  estimatedHours: string
  billable: boolean
}

function createEmptyScopeForm(): ScopeForm {
  return {
    title: '',
    description: '',
    clientId: '',
    projectId: '',
    requestedBy: '',
    estimatedHours: '',
    billable: true,
  }
}

function createScopeForm(entry: ScopeEntry | null): ScopeForm {
  if (!entry) return createEmptyScopeForm()
  return {
    title: entry.title,
    description: entry.description,
    clientId: entry.clientId,
    projectId: entry.projectId,
    requestedBy: entry.requestedBy,
    estimatedHours: String(entry.estimatedHours),
    billable: entry.billable,
  }
}

export default function ScopeLogPage() {
  const { state, addScopeEntry, updateScopeEntry, deleteScopeEntry } = useStore()
  const [modalOpen, setModalOpen] = useState(false)
  const [editingEntry, setEditingEntry] = useState<ScopeEntry | null>(null)
  const [form, setForm] = useState<ScopeForm>(createEmptyScopeForm())

  const totalUnbilledHours = useMemo(
    () => state.scopeEntries.filter((entry) => entry.billable && !entry.invoiced).reduce((sum, entry) => sum + entry.estimatedHours, 0),
    [state.scopeEntries]
  )

  const clientOptions = [
    { value: '', label: 'Select client...' },
    ...state.clients.map((client) => ({ value: client.id, label: client.name })),
  ]

  const projectOptions = [
    { value: '', label: 'Select project...' },
    ...state.projects.map((project) => ({ value: project.id, label: project.title })),
  ]

  const openForm = (entry: ScopeEntry | null = null) => {
    setEditingEntry(entry)
    setForm(createScopeForm(entry))
    setModalOpen(true)
  }

  const saveEntry = () => {
    const client = state.clients.find((item) => item.id === form.clientId)
    const project = state.projects.find((item) => item.id === form.projectId)
    const payload = {
      title: form.title,
      description: form.description,
      clientId: form.clientId,
      clientName: client?.name || 'Unassigned',
      projectId: form.projectId,
      projectName: project?.title || 'Unassigned',
      requestedBy: form.requestedBy,
      estimatedHours: parseFloat(form.estimatedHours) || 0,
      billable: form.billable,
      invoiced: editingEntry?.invoiced ?? false,
    }

    if (editingEntry) {
      updateScopeEntry(editingEntry.id, payload)
    } else {
      addScopeEntry(payload)
      void notifySlackEvent(state, 'scope_change', {
        title: payload.title,
        clientName: payload.clientName,
        estimatedHours: payload.estimatedHours,
        billable: payload.billable,
      })
    }

    setModalOpen(false)
    setEditingEntry(null)
    setForm(createEmptyScopeForm())
  }

  return (
    <div>
      <PageHeader
        title="Scope Log"
        description="Track out-of-scope requests before they become unpaid work."
        action={
          <Button onClick={() => openForm()}>
            <Plus size={16} /> Add Scope Entry
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 mb-6">
        <Card className="p-5">
          <p className="text-sm text-surface-500">Unbilled Scope Hours</p>
          <p className="mt-1 text-2xl font-bold text-surface-900">{totalUnbilledHours.toFixed(1)}</p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-surface-500">Open Requests</p>
          <p className="mt-1 text-2xl font-bold text-surface-900">
            {state.scopeEntries.filter((entry) => !entry.invoiced).length}
          </p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-surface-500">Invoiced Requests</p>
          <p className="mt-1 text-2xl font-bold text-surface-900">
            {state.scopeEntries.filter((entry) => entry.invoiced).length}
          </p>
        </Card>
      </div>

      {state.scopeEntries.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Clock3 size={24} />}
            title="No scope entries yet"
            description="Capture requests, add estimates, and decide whether they should be billable."
            action={<Button onClick={() => openForm()}><Plus size={16} /> Add First Entry</Button>}
          />
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-100 text-left text-surface-500">
                  <th className="px-6 py-3 font-medium">Request</th>
                  <th className="px-6 py-3 font-medium">Client / Project</th>
                  <th className="px-6 py-3 font-medium">Requested By</th>
                  <th className="px-6 py-3 font-medium">Estimate</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100">
                {state.scopeEntries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-surface-50">
                    <td className="px-6 py-4">
                      <p className="font-medium text-surface-900">{entry.title}</p>
                      <p className="text-xs text-surface-500 mt-1">{entry.description}</p>
                      <p className="text-[11px] text-surface-400 mt-1">{formatDate(entry.createdAt)}</p>
                    </td>
                    <td className="px-6 py-4 text-surface-600">
                      <p>{entry.clientName}</p>
                      <p className="text-xs text-surface-400">{entry.projectName}</p>
                    </td>
                    <td className="px-6 py-4 text-surface-600">{entry.requestedBy}</td>
                    <td className="px-6 py-4 font-medium">
                      {entry.estimatedHours.toFixed(1)}h
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-2">
                        <Badge status={entry.billable ? 'active' : 'cancelled'}>
                          {entry.billable ? 'Billable' : 'Non-billable'}
                        </Badge>
                        <Badge status={entry.invoiced ? 'paid' : 'draft'}>
                          {entry.invoiced ? 'Invoiced' : 'Open'}
                        </Badge>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm" onClick={() => openForm(entry)} title="Edit scope entry">
                          <Pencil size={14} />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => deleteScopeEntry(entry.id)} title="Delete scope entry">
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Modal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false)
          setEditingEntry(null)
        }}
        title={editingEntry ? 'Edit Scope Entry' : 'Add Scope Entry'}
        wide
      >
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Input
              label="Title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
            <Input
              label="Requested By"
              value={form.requestedBy}
              onChange={(e) => setForm({ ...form, requestedBy: e.target.value })}
            />
          </div>

          <Textarea
            label="Description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Describe the requested work or change"
          />

          <div className="grid gap-4 md:grid-cols-2">
            <Select
              label="Client"
              options={clientOptions}
              value={form.clientId}
              onChange={(e) => setForm({ ...form, clientId: e.target.value })}
            />
            <Select
              label="Project"
              options={projectOptions}
              value={form.projectId}
              onChange={(e) => setForm({ ...form, projectId: e.target.value })}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Input
              label="Estimated Hours"
              type="number"
              step="0.1"
              value={form.estimatedHours}
              onChange={(e) => setForm({ ...form, estimatedHours: e.target.value })}
            />
            <label className="flex items-center gap-3 rounded-lg border border-surface-200 px-3 py-2 text-sm text-surface-700">
              <input
                type="checkbox"
                checked={form.billable}
                onChange={(e) => setForm({ ...form, billable: e.target.checked })}
                className="rounded border-surface-300 text-brand-600"
              />
              Billable request
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="secondary"
              onClick={() => {
                setModalOpen(false)
                setEditingEntry(null)
              }}
            >
              Cancel
            </Button>
            <Button onClick={saveEntry} disabled={!form.title || !form.requestedBy || !form.estimatedHours}>
              {editingEntry ? 'Save Changes' : 'Add Scope Entry'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
