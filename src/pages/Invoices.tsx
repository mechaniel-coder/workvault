import { useState } from 'react'
import { Receipt, Plus, Send, Download, Trash2, CheckCircle } from 'lucide-react'
import { useStore } from '../context/StoreContext'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { Textarea } from '../components/ui/Textarea'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Modal, PageHeader, EmptyState } from '../components/ui/Modal'
import type { InvoiceLineItem } from '../lib/types'
import { formatCurrency, formatDate, getNextNumber, computeInvoiceStatus } from '../lib/utils'
import { generateInvoicePDF } from '../lib/pdf'

export default function Invoices() {
  const { state, addInvoice, updateInvoice, deleteInvoice } = useStore()
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({
    clientId: '',
    dueDate: '',
    taxRate: '0',
    notes: '',
    lineItems: [{ description: '', quantity: '1', rate: '' }] as { description: string; quantity: string; rate: string }[],
  })

  const clientOptions = [
    { value: '', label: 'Select client...' },
    ...state.clients.map((c) => ({ value: c.id, label: c.name })),
  ]

  const addLineItem = () => {
    setForm({ ...form, lineItems: [...form.lineItems, { description: '', quantity: '1', rate: '' }] })
  }

  const updateLineItem = (index: number, field: string, value: string) => {
    const items = [...form.lineItems]
    items[index] = { ...items[index], [field]: value }
    setForm({ ...form, lineItems: items })
  }

  const removeLineItem = (index: number) => {
    setForm({ ...form, lineItems: form.lineItems.filter((_, i) => i !== index) })
  }

  const handleCreate = () => {
    const client = state.clients.find((c) => c.id === form.clientId)
    const lineItems: InvoiceLineItem[] = form.lineItems
      .filter((li) => li.description)
      .map((li) => ({
        id: crypto.randomUUID(),
        description: li.description,
        quantity: parseFloat(li.quantity) || 1,
        rate: parseFloat(li.rate) || 0,
        amount: (parseFloat(li.quantity) || 1) * (parseFloat(li.rate) || 0),
      }))

    const subtotal = lineItems.reduce((s, li) => s + li.amount, 0)
    const taxRate = parseFloat(form.taxRate) || 0
    const taxAmount = subtotal * (taxRate / 100)
    const total = subtotal + taxAmount

    addInvoice({
      number: getNextNumber(state.profile.invoicePrefix, state.invoices.map((i) => i.number)),
      clientId: form.clientId,
      clientName: client?.name || 'Unknown',
      status: 'draft',
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: form.dueDate,
      lineItems,
      subtotal,
      taxRate,
      taxAmount,
      total,
      notes: form.notes,
      sentAt: null,
      paidAt: null,
    })
    setShowCreate(false)
    setForm({ clientId: '', dueDate: '', taxRate: '0', notes: '', lineItems: [{ description: '', quantity: '1', rate: '' }] })
  }

  const handleSend = (invoice: typeof state.invoices[0]) => {
    const client = state.clients.find((c) => c.id === invoice.clientId)
    const subject = encodeURIComponent(`Invoice ${invoice.number} — ${formatCurrency(invoice.total, state.profile.defaultCurrency)}`)
    const body = encodeURIComponent(
      `Hi ${client?.name || 'there'},\n\nPlease find invoice ${invoice.number} for ${formatCurrency(invoice.total, state.profile.defaultCurrency)}.\n\nDue date: ${formatDate(invoice.dueDate)}\n\nThank you for your business!\n\n${state.profile.name}`
    )
    window.open(`mailto:${client?.email}?subject=${subject}&body=${body}`)
    updateInvoice(invoice.id, { status: 'sent', sentAt: new Date().toISOString() })
  }

  const handleImportTime = () => {
    const unbilled = state.timeEntries.filter((e) => e.billable && !e.invoiced)
    if (unbilled.length === 0) return
    setForm({
      ...form,
      lineItems: unbilled.map((e) => ({
        description: `${e.projectName}${e.description ? ` — ${e.description}` : ''} (${(e.durationMinutes / 60).toFixed(1)}h)`,
        quantity: String((e.durationMinutes / 60).toFixed(2)),
        rate: String(e.hourlyRate),
      })),
    })
    setShowCreate(true)
  }

  const totalOutstanding = state.invoices
    .filter((i) => {
      const s = computeInvoiceStatus(i)
      return s === 'sent' || s === 'overdue'
    })
    .reduce((s, i) => s + i.total, 0)

  const totalPaid = state.invoices
    .filter((i) => i.status === 'paid')
    .reduce((s, i) => s + i.total, 0)

  return (
    <div>
      <PageHeader
        title="Invoices"
        description="Create, send, and track payments."
        action={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={handleImportTime}>
              Import Time
            </Button>
            <Button onClick={() => setShowCreate(true)}>
              <Plus size={16} /> New Invoice
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 mb-8">
        <Card className="p-5">
          <p className="text-sm text-surface-500">Outstanding</p>
          <p className="text-2xl font-bold text-amber-600 mt-1">{formatCurrency(totalOutstanding, state.profile.defaultCurrency)}</p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-surface-500">Total Collected</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{formatCurrency(totalPaid, state.profile.defaultCurrency)}</p>
        </Card>
      </div>

      {state.invoices.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Receipt size={24} />}
            title="No invoices yet"
            description="Create an invoice or import unbilled time entries."
            action={<Button onClick={() => setShowCreate(true)}><Plus size={16} /> Create Invoice</Button>}
          />
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-100 text-left text-surface-500">
                  <th className="px-6 py-3 font-medium">Invoice</th>
                  <th className="px-6 py-3 font-medium">Client</th>
                  <th className="px-6 py-3 font-medium">Amount</th>
                  <th className="px-6 py-3 font-medium">Due</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100">
                {state.invoices.map((invoice) => {
                  const status = computeInvoiceStatus(invoice)
                  return (
                    <tr key={invoice.id} className="hover:bg-surface-50">
                      <td className="px-6 py-3.5 font-medium text-surface-800">{invoice.number}</td>
                      <td className="px-6 py-3.5 text-surface-600">{invoice.clientName}</td>
                      <td className="px-6 py-3.5 font-medium">{formatCurrency(invoice.total, state.profile.defaultCurrency)}</td>
                      <td className="px-6 py-3.5 text-surface-500">{formatDate(invoice.dueDate)}</td>
                      <td className="px-6 py-3.5"><Badge status={status} /></td>
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="sm" onClick={() => generateInvoicePDF(invoice, state.profile)}>
                            <Download size={14} />
                          </Button>
                          {(status === 'draft' || status === 'sent' || status === 'overdue') && status !== 'draft' && (
                            <Button variant="ghost" size="sm" onClick={() => handleSend(invoice)}>
                              <Send size={14} />
                            </Button>
                          )}
                          {status === 'draft' && (
                            <Button variant="secondary" size="sm" onClick={() => handleSend(invoice)}>
                              <Send size={14} /> Send
                            </Button>
                          )}
                          {status !== 'paid' && status !== 'cancelled' && (
                            <Button variant="ghost" size="sm" onClick={() => updateInvoice(invoice.id, { status: 'paid', paidAt: new Date().toISOString() })}>
                              <CheckCircle size={14} />
                            </Button>
                          )}
                          <button onClick={() => deleteInvoice(invoice.id)} className="text-surface-400 hover:text-red-500 p-1">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create Invoice" wide>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Select label="Client" options={clientOptions} value={form.clientId} onChange={(e) => setForm({ ...form, clientId: e.target.value })} />
            <Input label="Due Date" type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-surface-700">Line Items</label>
              <Button variant="ghost" size="sm" onClick={addLineItem}><Plus size={14} /> Add Item</Button>
            </div>
            <div className="space-y-2">
              {form.lineItems.map((item, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 items-end">
                  <div className="col-span-6">
                    <Input placeholder="Description" value={item.description} onChange={(e) => updateLineItem(i, 'description', e.target.value)} />
                  </div>
                  <div className="col-span-2">
                    <Input placeholder="Qty" type="number" value={item.quantity} onChange={(e) => updateLineItem(i, 'quantity', e.target.value)} />
                  </div>
                  <div className="col-span-3">
                    <Input placeholder="Rate" type="number" value={item.rate} onChange={(e) => updateLineItem(i, 'rate', e.target.value)} />
                  </div>
                  <div className="col-span-1">
                    {form.lineItems.length > 1 && (
                      <button onClick={() => removeLineItem(i)} className="text-surface-400 hover:text-red-500 p-2">
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input label="Tax Rate (%)" type="number" value={form.taxRate} onChange={(e) => setForm({ ...form, taxRate: e.target.value })} />
          </div>
          <Textarea label="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={!form.clientId || !form.dueDate}>Create Invoice</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
