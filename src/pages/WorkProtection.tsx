import { useState } from 'react'
import { Shield, Plus, Download, Trash2, Lock, Fingerprint } from 'lucide-react'
import { useStore } from '../context/StoreContext'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { Textarea } from '../components/ui/Textarea'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Modal, PageHeader, EmptyState } from '../components/ui/Modal'
import type { ProtectionType } from '../lib/types'
import { generateHash, formatDateTime } from '../lib/utils'
import { generateWorkProtectionCertificate } from '../lib/pdf'

const protectionTypes: { value: ProtectionType; label: string }[] = [
  { value: 'copyright', label: 'Copyright Claim' },
  { value: 'watermark', label: 'Watermark Registry' },
  { value: 'nda', label: 'NDA Protection' },
  { value: 'ip_claim', label: 'IP Ownership' },
  { value: 'timestamp', label: 'Timestamp Proof' },
]

export default function WorkProtection() {
  const { state, addWorkProtection, deleteWorkProtection } = useStore()
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({
    title: '',
    type: 'copyright' as ProtectionType,
    projectName: '',
    clientId: '',
    description: '',
    evidence: '',
  })

  const clientOptions = [
    { value: '', label: 'No client' },
    ...state.clients.map((c) => ({ value: c.id, label: c.name })),
  ]

  const handleRegister = async () => {
    const client = state.clients.find((c) => c.id === form.clientId)
    const content = `${form.title}|${form.description}|${form.evidence}|${new Date().toISOString()}`
    const hash = await generateHash(content)
    const timestamp = new Date().toISOString()

    addWorkProtection({
      title: form.title,
      type: form.type,
      projectId: '',
      projectName: form.projectName,
      description: form.description,
      hash,
      timestamp,
      evidence: form.evidence,
      clientId: form.clientId,
      clientName: client?.name || 'N/A',
    })
    setShowCreate(false)
    setForm({ title: '', type: 'copyright', projectName: '', clientId: '', description: '', evidence: '' })
  }

  return (
    <div>
      <PageHeader
        title="Work Protection"
        description="Register, timestamp, and protect your intellectual property."
        action={
          <Button onClick={() => setShowCreate(true)}>
            <Plus size={16} /> Register Work
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-8">
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-brand-50 p-2.5 text-brand-600"><Shield size={20} /></div>
            <div>
              <p className="text-sm text-surface-500">Protected Works</p>
              <p className="text-2xl font-bold text-surface-900">{state.workProtections.length}</p>
            </div>
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-emerald-50 p-2.5 text-emerald-600"><Lock size={20} /></div>
            <div>
              <p className="text-sm text-surface-500">Copyright Claims</p>
              <p className="text-2xl font-bold text-surface-900">
                {state.workProtections.filter((w) => w.type === 'copyright').length}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-amber-50 p-2.5 text-amber-600"><Fingerprint size={20} /></div>
            <div>
              <p className="text-sm text-surface-500">Timestamp Proofs</p>
              <p className="text-2xl font-bold text-surface-900">
                {state.workProtections.filter((w) => w.type === 'timestamp').length}
              </p>
            </div>
          </div>
        </Card>
      </div>

      <Card className="mb-6 p-5 bg-brand-50 border-brand-100">
        <h3 className="text-sm font-semibold text-brand-800">How Work Protection Works</h3>
        <p className="text-sm text-brand-700 mt-1 leading-relaxed">
          When you register work, WorkVault generates a SHA-256 cryptographic hash and timestamp.
          Download the certificate as proof of creation date. All records are stored locally on your device —
          your intellectual property never leaves your control.
        </p>
      </Card>

      {state.workProtections.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Shield size={24} />}
            title="No protected works yet"
            description="Register your deliverables to create timestamped proof of ownership."
            action={<Button onClick={() => setShowCreate(true)}><Plus size={16} /> Register Work</Button>}
          />
        </Card>
      ) : (
        <div className="grid gap-4">
          {state.workProtections.map((item) => (
            <Card key={item.id} className="p-5">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <h3 className="text-base font-semibold text-surface-900">{item.title}</h3>
                    <Badge status={item.type === 'copyright' ? 'active' : 'sent'}>{item.type.replace('_', ' ')}</Badge>
                  </div>
                  <p className="text-sm text-surface-500 mt-1">{item.projectName} · {item.clientName}</p>
                  {item.description && <p className="text-sm text-surface-600 mt-2">{item.description}</p>}
                  <div className="mt-3 flex items-center gap-4 text-xs text-surface-400">
                    <span>Registered: {formatDateTime(item.timestamp)}</span>
                    <span className="font-mono truncate max-w-xs">Hash: {item.hash.substring(0, 16)}...</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => generateWorkProtectionCertificate(item.title, item.hash, item.timestamp, state.profile)}
                  >
                    <Download size={14} /> Certificate
                  </Button>
                  <button onClick={() => deleteWorkProtection(item.id)} className="text-surface-400 hover:text-red-500 p-1">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Register Protected Work">
        <div className="space-y-4">
          <Input label="Work Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Logo Design v2 Final" />
          <Select label="Protection Type" options={protectionTypes} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as ProtectionType })} />
          <Input label="Project Name" value={form.projectName} onChange={(e) => setForm({ ...form, projectName: e.target.value })} />
          <Select label="Client" options={clientOptions} value={form.clientId} onChange={(e) => setForm({ ...form, clientId: e.target.value })} />
          <Textarea label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Describe the work being protected..." />
          <Textarea label="Evidence / Notes" value={form.evidence} onChange={(e) => setForm({ ...form, evidence: e.target.value })} placeholder="File paths, URLs, version numbers, etc." />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={handleRegister} disabled={!form.title}>
              <Shield size={16} /> Register & Hash
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
