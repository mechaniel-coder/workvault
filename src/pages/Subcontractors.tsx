import { useMemo, useState } from 'react'
import { Plus, Trash2, CheckCircle2, Repeat2, FileText, DollarSign } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useStore } from '../context/StoreContext'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { Textarea } from '../components/ui/Textarea'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Modal, PageHeader, EmptyState } from '../components/ui/Modal'
import { formatCurrency } from '../lib/utils'
import { getSubcontractorPaymentsForYear, maskTin } from '../lib/tax-1099'

const emptyForm = {
  name: '',
  email: '',
  phone: '',
  trade: '',
  rate: '',
  projectId: '',
  amountOwed: '',
  notes: '',
  businessName: '',
  tin: '',
  address: '',
  city: '',
  state: '',
  zip: '',
  entityType: 'individual' as const,
  requires1099: true,
}

const entityOptions = [
  { value: 'individual', label: 'Individual / Sole prop' },
  { value: 'llc', label: 'LLC' },
  { value: 'corp', label: 'Corporation' },
  { value: 'partnership', label: 'Partnership' },
  { value: 'other', label: 'Other' },
]

export default function Subcontractors() {
  const {
    state, addSubcontractor, updateSubcontractor, deleteSubcontractor, addSubcontractorPayment,
  } = useStore()
  const [showModal, setShowModal] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState<string | null>(null)
  const [paymentAmount, setPaymentAmount] = useState('')
  const [form, setForm] = useState(emptyForm)
  const taxYear = state.tax1099Settings.filingYear

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
      businessName: form.businessName || form.name,
      tin: form.tin,
      address: form.address,
      city: form.city,
      state: form.state,
      zip: form.zip,
      entityType: form.entityType,
      w9OnFile: false,
      w9ReceivedAt: null,
      requires1099: form.requires1099,
    })
    setShowModal(false)
    setForm(emptyForm)
  }

  const toggleClientPaidUs = (id: string, current: boolean) => {
    updateSubcontractor(id, { clientPaidUs: !current })
  }

  const markPaid = (id: string, amountOwed: number, name: string) => {
    const balance = Math.max(amountOwed - (state.subcontractors.find((s) => s.id === id)?.amountPaid || 0), 0)
    if (balance <= 0) return
    addSubcontractorPayment({
      subcontractorId: id,
      subcontractorName: name,
      amount: balance,
      date: new Date().toISOString().split('T')[0],
      method: 'manual',
      notes: 'Marked paid from subcontractors',
    })
    updateSubcontractor(id, { amountPaid: amountOwed })
  }

  const logPayment = () => {
    if (!showPaymentModal) return
    const sub = state.subcontractors.find((s) => s.id === showPaymentModal)
    if (!sub) return
    const amount = parseFloat(paymentAmount) || 0
    if (amount <= 0) return
    addSubcontractorPayment({
      subcontractorId: sub.id,
      subcontractorName: sub.name,
      amount,
      date: new Date().toISOString().split('T')[0],
      method: 'manual',
      notes: '',
    })
    updateSubcontractor(sub.id, { amountPaid: sub.amountPaid + amount })
    setShowPaymentModal(null)
    setPaymentAmount('')
  }

  return (
    <div>
      <PageHeader
        title="Subcontractors"
        description="Track what you owe, what has been paid, and which jobs are client-funded."
        action={
          <div className="flex gap-2">
            <Link to="/tax-1099">
              <Button variant="secondary"><FileText size={16} /> 1099 Filing</Button>
            </Link>
            <Button onClick={openCreate}>
              <Plus size={16} /> Add Subcontractor
            </Button>
          </div>
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
                      {subcontractor.w9OnFile ? (
                        <Badge status="signed">W-9 on file</Badge>
                      ) : (
                        <Badge status="draft">W-9 needed</Badge>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-surface-500">
                      {subcontractor.trade} · {subcontractor.projectName || 'No project'}
                    </p>
                    <p className="mt-2 text-sm text-surface-600">
                      {subcontractor.email || 'No email'} · {subcontractor.phone || 'No phone'}
                    </p>
                    <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4 text-sm">
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
                      <div className="rounded-lg bg-surface-50 px-3 py-2">
                        <p className="text-xs uppercase tracking-wide text-surface-400">{taxYear} paid (1099)</p>
                        <p className="font-medium text-surface-800">
                          {formatCurrency(getSubcontractorPaymentsForYear(state, subcontractor.id, taxYear), state.profile.defaultCurrency)}
                        </p>
                      </div>
                    </div>
                    {subcontractor.tin && (
                      <p className="mt-2 text-xs text-surface-400 font-mono">TIN: {maskTin(subcontractor.tin)}</p>
                    )}
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
                        variant="ghost"
                        size="sm"
                        onClick={() => { setShowPaymentModal(subcontractor.id); setPaymentAmount('') }}
                      >
                        <DollarSign size={14} /> Log payment
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => markPaid(subcontractor.id, subcontractor.amountOwed, subcontractor.name)}
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
          <p className="text-xs font-semibold text-surface-600 pt-2 border-t border-surface-100">1099 / W-9 info</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Business name (if different)" value={form.businessName} onChange={(e) => setForm({ ...form, businessName: e.target.value })} />
            <Input label="TIN (SSN or EIN)" value={form.tin} onChange={(e) => setForm({ ...form, tin: e.target.value })} placeholder="XX-XXXXXXX" />
          </div>
          <Input label="Street address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          <div className="grid gap-4 sm:grid-cols-3">
            <Input label="City" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
            <Input label="State" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} />
            <Input label="ZIP" value={form.zip} onChange={(e) => setForm({ ...form, zip: e.target.value })} />
          </div>
          <Select label="Entity type" options={entityOptions} value={form.entityType} onChange={(e) => setForm({ ...form, entityType: e.target.value as typeof form.entityType })} />
          <label className="flex items-center gap-2 text-sm text-surface-700">
            <input type="checkbox" checked={form.requires1099} onChange={(e) => setForm({ ...form, requires1099: e.target.checked })} className="rounded border-surface-300 text-brand-600" />
            Requires 1099-NEC if over threshold
          </label>
          <Textarea label="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Scope notes, payment terms, or contacts..." />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={!form.name}>Save Subcontractor</Button>
          </div>
        </div>
      </Modal>

      <Modal open={!!showPaymentModal} onClose={() => setShowPaymentModal(null)} title="Log subcontractor payment">
        <div className="space-y-4">
          <Input label="Amount" type="number" step="0.01" value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} />
          <p className="text-xs text-surface-500">Logged payments count toward 1099-NEC totals for the tax year.</p>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setShowPaymentModal(null)}>Cancel</Button>
            <Button onClick={logPayment} disabled={!paymentAmount}>Save payment</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
