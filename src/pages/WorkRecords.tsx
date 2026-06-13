import { useState } from 'react'
import { Archive, Plus, Trash2, Search, Filter } from 'lucide-react'
import { useStore } from '../context/StoreContext'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { Textarea } from '../components/ui/Textarea'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Modal, PageHeader, EmptyState } from '../components/ui/Modal'
import type { WorkRecordType } from '../lib/types'
import { formatDateTime, formatDuration } from '../lib/utils'

const recordTypes: { value: WorkRecordType; label: string }[] = [
  { value: 'deliverable', label: 'Deliverable' },
  { value: 'milestone', label: 'Milestone' },
  { value: 'revision', label: 'Revision' },
  { value: 'meeting', label: 'Meeting' },
  { value: 'note', label: 'Note' },
]

export default function WorkRecords() {
  const { state, addWorkRecord, deleteWorkRecord } = useStore()
  const [showCreate, setShowCreate] = useState(false)
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('')
  const [form, setForm] = useState({
    type: 'deliverable' as WorkRecordType,
    title: '',
    description: '',
    projectName: '',
    clientId: '',
    hoursSpent: '',
    tags: '',
  })

  const clientOptions = [
    { value: '', label: 'No client' },
    ...state.clients.map((c) => ({ value: c.id, label: c.name })),
  ]

  const filtered = state.workRecords.filter((r) => {
    const matchesSearch =
      !search ||
      r.title.toLowerCase().includes(search.toLowerCase()) ||
      r.description.toLowerCase().includes(search.toLowerCase()) ||
      r.projectName.toLowerCase().includes(search.toLowerCase()) ||
      r.clientName.toLowerCase().includes(search.toLowerCase())
    const matchesType = !filterType || r.type === filterType
    return matchesSearch && matchesType
  })

  const handleCreate = () => {
    const client = state.clients.find((c) => c.id === form.clientId)
    addWorkRecord({
      type: form.type,
      title: form.title,
      description: form.description,
      projectId: '',
      projectName: form.projectName,
      clientId: form.clientId,
      clientName: client?.name || 'N/A',
      hoursSpent: parseFloat(form.hoursSpent) || 0,
      attachments: [],
      tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
    })
    setShowCreate(false)
    setForm({ type: 'deliverable', title: '', description: '', projectName: '', clientId: '', hoursSpent: '', tags: '' })
  }

  const totalHours = state.workRecords.reduce((s, r) => s + r.hoursSpent, 0)

  return (
    <div>
      <PageHeader
        title="Work Records"
        description="Your complete local archive of all work performed."
        action={
          <Button onClick={() => setShowCreate(true)}>
            <Plus size={16} /> Add Record
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-6">
        <Card className="p-5">
          <p className="text-sm text-surface-500">Total Records</p>
          <p className="text-2xl font-bold text-surface-900 mt-1">{state.workRecords.length}</p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-surface-500">Hours Documented</p>
          <p className="text-2xl font-bold text-surface-900 mt-1">{totalHours.toFixed(1)}h</p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-surface-500">Deliverables</p>
          <p className="text-2xl font-bold text-surface-900 mt-1">
            {state.workRecords.filter((r) => r.type === 'deliverable').length}
          </p>
        </Card>
      </div>

      <div className="flex gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
          <input
            type="text"
            placeholder="Search records..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-surface-200 bg-white pl-9 pr-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-surface-400" />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="rounded-lg border border-surface-200 bg-white px-3 py-2 text-sm"
          >
            <option value="">All types</option>
            {recordTypes.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Archive size={24} />}
            title={search || filterType ? 'No matching records' : 'No work records yet'}
            description="Document every deliverable, milestone, and revision for your records."
            action={!search && !filterType ? <Button onClick={() => setShowCreate(true)}><Plus size={16} /> Add Record</Button> : undefined}
          />
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((record) => (
            <Card key={record.id} className="p-5">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="text-base font-semibold text-surface-900">{record.title}</h3>
                    <Badge status={record.type === 'deliverable' ? 'active' : 'draft'}>{record.type}</Badge>
                  </div>
                  <p className="text-sm text-surface-500 mt-1">
                    {record.projectName} · {record.clientName}
                    {record.hoursSpent > 0 && ` · ${formatDuration(record.hoursSpent * 60)}`}
                  </p>
                  {record.description && (
                    <p className="text-sm text-surface-600 mt-2">{record.description}</p>
                  )}
                  {record.tags.length > 0 && (
                    <div className="flex gap-1.5 mt-2">
                      {record.tags.map((tag) => (
                        <span key={tag} className="rounded-md bg-surface-100 px-2 py-0.5 text-xs text-surface-500">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-surface-400 mt-2">{formatDateTime(record.createdAt)}</p>
                </div>
                <button onClick={() => deleteWorkRecord(record.id)} className="text-surface-400 hover:text-red-500 p-1">
                  <Trash2 size={14} />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Add Work Record">
        <div className="space-y-4">
          <Select label="Type" options={recordTypes} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as WorkRecordType })} />
          <Input label="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <Input label="Project" value={form.projectName} onChange={(e) => setForm({ ...form, projectName: e.target.value })} />
          <Select label="Client" options={clientOptions} value={form.clientId} onChange={(e) => setForm({ ...form, clientId: e.target.value })} />
          <Textarea label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Hours Spent" type="number" step="0.25" value={form.hoursSpent} onChange={(e) => setForm({ ...form, hoursSpent: e.target.value })} />
            <Input label="Tags (comma-separated)" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={!form.title}>Add Record</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
