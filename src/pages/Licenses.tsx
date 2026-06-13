import { useState } from 'react'
import { BadgeCheck, Plus, Trash2, ExternalLink, AlertTriangle } from 'lucide-react'
import { useStore } from '../context/StoreContext'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Textarea } from '../components/ui/Textarea'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Modal, PageHeader, EmptyState } from '../components/ui/Modal'
import { computeLicenseStatus, formatDate } from '../lib/utils'

export default function Licenses() {
  const { state, addLicense, updateLicense, deleteLicense } = useStore()
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({
    name: '',
    number: '',
    issuingBody: '',
    type: '',
    issueDate: '',
    expiryDate: '',
    verificationUrl: '',
    notes: '',
  })

  const handleCreate = () => {
    const status = computeLicenseStatus(form.expiryDate)
    addLicense({
      ...form,
      status,
      documentUrl: '',
    })
    setShowCreate(false)
    setForm({ name: '', number: '', issuingBody: '', type: '', issueDate: '', expiryDate: '', verificationUrl: '', notes: '' })
  }

  const expiring = state.licenses.filter((l) => computeLicenseStatus(l.expiryDate) === 'expiring')
  const expired = state.licenses.filter((l) => computeLicenseStatus(l.expiryDate) === 'expired')

  return (
    <div>
      <PageHeader
        title="License Verification"
        description="Track professional licenses, certifications, and credentials."
        action={
          <Button onClick={() => setShowCreate(true)}>
            <Plus size={16} /> Add License
          </Button>
        }
      />

      {(expiring.length > 0 || expired.length > 0) && (
        <div className="mb-6 space-y-2">
          {expired.map((l) => (
            <div key={l.id} className="flex items-center gap-3 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
              <AlertTriangle size={16} />
              <span><strong>{l.name}</strong> expired on {formatDate(l.expiryDate)}</span>
            </div>
          ))}
          {expiring.map((l) => (
            <div key={l.id} className="flex items-center gap-3 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-700">
              <AlertTriangle size={16} />
              <span><strong>{l.name}</strong> expires on {formatDate(l.expiryDate)}</span>
            </div>
          ))}
        </div>
      )}

      {state.licenses.length === 0 ? (
        <Card>
          <EmptyState
            icon={<BadgeCheck size={24} />}
            title="No licenses tracked"
            description="Add your professional licenses and certifications to monitor expiry dates."
            action={<Button onClick={() => setShowCreate(true)}><Plus size={16} /> Add License</Button>}
          />
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {state.licenses.map((license) => {
            const status = computeLicenseStatus(license.expiryDate)
            return (
              <Card key={license.id} className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <BadgeCheck size={18} className="text-brand-600" />
                      <h3 className="text-base font-semibold text-surface-900">{license.name}</h3>
                    </div>
                    <p className="text-sm text-surface-500 mt-1">{license.issuingBody} · {license.type}</p>
                    <p className="text-xs text-surface-400 mt-1 font-mono">#{license.number}</p>
                  </div>
                  <Badge status={status} />
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-surface-400">Issued</span>
                    <p className="font-medium text-surface-700">{formatDate(license.issueDate)}</p>
                  </div>
                  <div>
                    <span className="text-surface-400">Expires</span>
                    <p className="font-medium text-surface-700">{formatDate(license.expiryDate)}</p>
                  </div>
                </div>
                {license.verificationUrl && (
                  <a
                    href={license.verificationUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex items-center gap-1 text-xs text-brand-600 hover:text-brand-700"
                  >
                    Verify Online <ExternalLink size={12} />
                  </a>
                )}
                <div className="mt-3 flex items-center gap-2">
                  {status === 'expired' && (
                    <Button variant="secondary" size="sm" onClick={() => updateLicense(license.id, { status: 'pending' })}>
                      Mark Renewed
                    </Button>
                  )}
                  <button onClick={() => deleteLicense(license.id)} className="text-surface-400 hover:text-red-500 p-1 ml-auto">
                    <Trash2 size={14} />
                  </button>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Add License">
        <div className="space-y-4">
          <Input label="License Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="General Contractor License" />
          <div className="grid grid-cols-2 gap-4">
            <Input label="License Number" value={form.number} onChange={(e) => setForm({ ...form, number: e.target.value })} />
            <Input label="Type" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} placeholder="State, Trade, etc." />
          </div>
          <Input label="Issuing Body" value={form.issuingBody} onChange={(e) => setForm({ ...form, issuingBody: e.target.value })} placeholder="State Licensing Board" />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Issue Date" type="date" value={form.issueDate} onChange={(e) => setForm({ ...form, issueDate: e.target.value })} />
            <Input label="Expiry Date" type="date" value={form.expiryDate} onChange={(e) => setForm({ ...form, expiryDate: e.target.value })} />
          </div>
          <Input label="Verification URL" value={form.verificationUrl} onChange={(e) => setForm({ ...form, verificationUrl: e.target.value })} placeholder="https://..." />
          <Textarea label="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={!form.name || !form.expiryDate}>Add License</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
