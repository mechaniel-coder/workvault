import { useMemo, useState } from 'react'
import { FileArchive, Plus, Trash2, PencilLine } from 'lucide-react'
import { useStore } from '../context/StoreContext'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { Textarea } from '../components/ui/Textarea'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Modal, PageHeader, EmptyState } from '../components/ui/Modal'
import { formatDate } from '../lib/utils'
import type { VaultDocType } from '../lib/types'

const documentTypes: { value: VaultDocType | ''; label: string }[] = [
  { value: '', label: 'All types' },
  { value: 'w9', label: 'W-9' },
  { value: 'insurance', label: 'Insurance' },
  { value: 'license', label: 'License' },
  { value: 'contract', label: 'Contract' },
  { value: 'nda', label: 'NDA' },
  { value: 'receipt', label: 'Receipt' },
  { value: 'client_asset', label: 'Client asset' },
  { value: 'other', label: 'Other' },
]

const documentTypeLabels: Record<VaultDocType, string> = {
  w9: 'W-9',
  insurance: 'Insurance',
  license: 'License',
  contract: 'Contract',
  nda: 'NDA',
  receipt: 'Receipt',
  client_asset: 'Client asset',
  other: 'Other',
}

const emptyForm = {
  name: '',
  type: 'other' as VaultDocType,
  clientId: '',
  projectId: '',
  notes: '',
  expiryDate: '',
}

export default function Documents() {
  const { state, addVaultDocument, updateVaultDocument, deleteVaultDocument } = useStore()
  const [filterType, setFilterType] = useState<VaultDocType | ''>('')
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)

  const clientOptions = [
    { value: '', label: 'No client' },
    ...state.clients.map((client) => ({ value: client.id, label: client.name })),
  ]

  const projectOptions = [
    { value: '', label: 'No project' },
    ...state.projects.map((project) => ({ value: project.id, label: project.title })),
  ]

  const documents = useMemo(() => {
    return [...state.vaultDocuments]
      .filter((doc) => !filterType || doc.type === filterType)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }, [filterType, state.vaultDocuments])

  const openCreate = () => {
    setEditingId(null)
    setForm(emptyForm)
    setShowModal(true)
  }

  const openEdit = (id: string) => {
    const document = state.vaultDocuments.find((item) => item.id === id)
    if (!document) return
    setEditingId(id)
    setForm({
      name: document.name,
      type: document.type,
      clientId: document.clientId,
      projectId: document.projectId,
      notes: document.notes,
      expiryDate: document.expiryDate,
    })
    setShowModal(true)
  }

  const handleSave = () => {
    const client = state.clients.find((item) => item.id === form.clientId)
    const payload = {
      name: form.name,
      type: form.type,
      clientId: form.clientId,
      clientName: client?.name || '',
      projectId: form.projectId,
      notes: form.notes,
      expiryDate: form.expiryDate,
    }

    if (editingId) {
      updateVaultDocument(editingId, payload)
    } else {
      addVaultDocument(payload)
    }

    setShowModal(false)
    setEditingId(null)
    setForm(emptyForm)
  }

  return (
    <div>
      <PageHeader
        title="Document Vault"
        description="Store client paperwork, assets, and compliance files in one place."
        action={
          <Button onClick={openCreate}>
            <Plus size={16} /> Add Document
          </Button>
        }
      />

      <div className="mb-6 flex items-center gap-3">
        <Select
          label="Filter by type"
          options={documentTypes}
          value={filterType}
          onChange={(e) => setFilterType(e.target.value as VaultDocType | '')}
          className="max-w-xs"
        />
      </div>

      {documents.length === 0 ? (
        <Card>
          <EmptyState
            icon={<FileArchive size={24} />}
            title={filterType ? 'No matching documents' : 'No documents yet'}
            description="Add client documents, insurance, licenses, contracts, and reference files to your vault."
            action={!filterType ? <Button onClick={openCreate}><Plus size={16} /> Add Document</Button> : undefined}
          />
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {documents.map((document) => {
            const client = state.clients.find((item) => item.id === document.clientId)
            const project = state.projects.find((item) => item.id === document.projectId)

            return (
              <Card key={document.id} className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="truncate text-base font-semibold text-surface-900">{document.name}</h3>
                      <Badge status={document.type}>{documentTypeLabels[document.type]}</Badge>
                    </div>
                    <p className="mt-1 text-sm text-surface-500">
                      {client?.name || 'No client'} · {project?.title || 'No project'}
                    </p>
                    <p className="mt-1 text-xs text-surface-400">
                      Expires {formatDate(document.expiryDate)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(document.id)} title="Edit">
                      <PencilLine size={14} />
                    </Button>
                    <button
                      onClick={() => deleteVaultDocument(document.id)}
                      className="rounded-lg p-1.5 text-surface-400 hover:text-red-500"
                      title="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                {document.notes && <p className="mt-3 text-sm leading-6 text-surface-600">{document.notes}</p>}
              </Card>
            )
          })}
        </div>
      )}

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editingId ? 'Edit Document' : 'Add Document'} wide>
        <div className="space-y-4">
          <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Insurance Certificate" />
          <div className="grid gap-4 sm:grid-cols-2">
            <Select
              label="Type"
              options={documentTypes.filter((option) => option.value !== '') as { value: VaultDocType; label: string }[]}
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value as VaultDocType })}
            />
            <Input label="Expiry Date" type="date" value={form.expiryDate} onChange={(e) => setForm({ ...form, expiryDate: e.target.value })} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Select label="Client" options={clientOptions} value={form.clientId} onChange={(e) => setForm({ ...form, clientId: e.target.value })} />
            <Select label="Project" options={projectOptions} value={form.projectId} onChange={(e) => setForm({ ...form, projectId: e.target.value })} />
          </div>
          <Textarea label="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="File storage location, renewal reminders, or context..." />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={!form.name}>Save Document</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
