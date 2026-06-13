import { useMemo, useState } from 'react'
import { Plus, Trash2, CheckCircle2, Repeat2 } from 'lucide-react'
import { useStore } from '../context/StoreContext'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { Textarea } from '../components/ui/Textarea'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Modal, PageHeader, EmptyState } from '../components/ui/Modal'
import { formatCurrency } from '../lib/utils'

const emptyForm = {
  name: '',
  email: '',
  phone: '',
  trade: '',
  rate: '',
  projectId: '',
  amountOwed: '',
  notes: '',
}

export default function Subcontractors() {
  const { state, addSubcontractor, updateSubcontractor, deleteSubcontractor } = useStore()
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(emptyForm)

  const projectOptions = [
    { value: '', label: 'No project' },
    ...state.projects.map((project) => ({ value: project.id, label: project.title })),
  ]

  const subcontractors = useMemo(() => {
    return [...state.subcontractors].sort((a, b) => {
      const aOutstanding = a.amountOwed - a.amountPaid
      const bOutstanding = b.amountOwed - b.amountPaid
      return bOutstanding - aOutstanding
    })
  }, [state.subcontractors])

  const totals = useMemo(() => {
    const owed = state.subcontractors.reduce((sum, item) => sum + item.amountOwed, 0)
    const paid = state.subcontractors.reduce((sum, item) => sum + item.amountPaid, 0)
    return { owed, paid, balance: Math.max(owed - paid, 0) }
  }, [state.subcontractors])

  const openCreate = () => {
    setForm(emptyForm)
    setShowModal(true)
  }

  const handleCreate = () => {
    const project = state.projects.find((item) => item.id === form.projectId)
    addSubcontractor({
      name: form.name,
      email: form.email,
      phone: form.phone,
      trade: form.trade,
      rate: parseFloat(form.rate) || 0,
      projectId: form.projectId,
      projectName: project?.title || '',
      amountOwed: parseFloat(form.amountOwed) || 0,
      amountPaid: 0,
      clientPaidUs: false,
      notes: form.notes,
    })
    setShowModal(false)
    setForm(emptyForm)
  }

  const toggleClientPaidUs = (id: string, current: boolean) => {
    updateSubcontractor(id, { clientPaidUs: !current })
  }

  const markPaid = (id: string, amountOwed: number) => {
    updateSubcontractor(id, { amountPaid: amountOwed })
  }

  return (
    <div>
      <PageHeader
        title="Subcontractors"
        description="Track what you owe, what has been paid, and which jobs are client-funded."
        action={
          <Button onClick={openCreate}>
            <Plus size={16} /> Add Subcontractor
          </Button>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Card className="p-5">
          <p className="text-sm text-surface-500">Total owed</p>
          <p className="mt-1 text-2xl font-bold text-surface-900">{formatCurrency(totals.owed, state.profile.defaultCurrency)}</p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-surface-500">Total paid</p>
          <p className="mt-1 text-2xl font-bold text-emerald-600">{formatCurrency(totals.paid, state.profile.defaultCurrency)}</p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-surface-500">Outstanding balance</p>
          <p className="mt-1 text-2xl font-bold text-brand-600">{formatCurrency(totals.balance, state.profile.defaultCurrency)}</p>
        </Card>
      </div>

      {subcontractors.length === 0 ? (
        <Card>
          <EmptyState
            icon={<CheckCircle2 size={24} />}
            title="No subcontractors yet"
            description="Add subcontractors, their project assignment, and the amount owed to keep payouts organized."
            action={<Button onClick={openCreate}><Plus size={16} /> Add Subcontractor</Button>}
          />
        </Card>
      ) : (
        <div className="space-y-4">
          {subcontractors.map((subcontractor) => {
            const balance = Math.max(subcontractor.amountOwed - subcontractor.amountPaid, 0)
            const status = subcontractor.amountPaid >= subcontractor.amountOwed ? 'paid' : subcontractor.clientPaidUs ? 'overdue' : 'sent'

            return (
              <Card key={subcontractor.id} className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-semibold text-surface-900">{subcontractor.name}</h3>
                      <Badge status={status}>{subcontractor.amountPaid >= subcontractor.amountOwed ? 'Paid' : 'Owed'}</Badge>
                      <Badge status={subcontractor.clientPaidUs ? 'sent' : 'draft'}>
                        {subcontractor.clientPaidUs ? 'Client paid us' : 'Waiting on client'}
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm text-surface-500">
                      {subcontractor.trade} · {subcontractor.projectName || 'No project'}
                    </p>
                    <p className="mt-2 text-sm text-surface-600">
                      {subcontractor.email || 'No email'} · {subcontractor.phone || 'No phone'}
                    </p>
                    <div className="mt-3 grid gap-2 sm:grid-cols-3 text-sm">
                      <div className="rounded-lg bg-surface-50 px-3 py-2">
                        <p className="text-xs uppercase tracking-wide text-surface-400">Rate</p>
                        <p className="font-medium text-surface-800">{formatCurrency(subcontractor.rate, state.profile.defaultCurrency)}</p>
                      </div>
                      <div className="rounded-lg bg-surface-50 px-3 py-2">
                        <p className="text-xs uppercase tracking-wide text-surface-400">Owed</p>
                        <p className="font-medium text-surface-800">{formatCurrency(subcontractor.amountOwed, state.profile.defaultCurrency)}</p>
                      </div>
                      <div className="rounded-lg bg-surface-50 px-3 py-2">
                        <p className="text-xs uppercase tracking-wide text-surface-400">Paid / Balance</p>
                        <p className="font-medium text-surface-800">
                          {formatCurrency(subcontractor.amountPaid, state.profile.defaultCurrency)} / {formatCurrency(balance, state.profile.defaultCurrency)}
                        </p>
                      </div>
                    </div>
                    {subcontractor.notes && <p className="mt-3 text-sm leading-6 text-surface-600">{subcontractor.notes}</p>}
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <div className="flex flex-wrap justify-end gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => toggleClientPaidUs(subcontractor.id, subcontractor.clientPaidUs)}
                      >
                        <Repeat2 size={14} /> Toggle Client Paid
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => markPaid(subcontractor.id, subcontractor.amountOwed)}
                        disabled={subcontractor.amountPaid >= subcontractor.amountOwed}
                      >
                        <CheckCircle2 size={14} /> Mark Paid
                      </Button>
                    </div>
                    <button
                      onClick={() => deleteSubcontractor(subcontractor.id)}
                      className="rounded-lg p-1.5 text-surface-400 hover:text-red-500"
                      title="Delete subcontractor"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Add Subcontractor" wide>
        <div className="space-y-4">
          <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Jordan Mason" />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <Input label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Trade" value={form.trade} onChange={(e) => setForm({ ...form, trade: e.target.value })} placeholder="Electrical, drywall, plumbing..." />
            <Select label="Project" options={projectOptions} value={form.projectId} onChange={(e) => setForm({ ...form, projectId: e.target.value })} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Rate" type="number" value={form.rate} onChange={(e) => setForm({ ...form, rate: e.target.value })} />
            <Input label="Amount Owed" type="number" value={form.amountOwed} onChange={(e) => setForm({ ...form, amountOwed: e.target.value })} />
          </div>
          <Textarea label="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Scope notes, payment terms, or contacts..." />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={!form.name}>Save Subcontractor</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
