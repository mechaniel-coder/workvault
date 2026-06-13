import { useState, useEffect } from 'react'
import {
  Receipt, Plus, Send, Download, Trash2, CheckCircle, Eye, CreditCard, ExternalLink, Copy, Check, Bell,
} from 'lucide-react'
import { useStore } from '../context/StoreContext'
import { useDemoDownloadsBlocked } from '../context/DemoContext'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { Textarea } from '../components/ui/Textarea'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Modal, PageHeader, EmptyState } from '../components/ui/Modal'
import type { Invoice, InvoiceLineItem } from '../lib/types'
import { formatCurrency, formatDate, getNextNumber, computeInvoiceStatus } from '../lib/utils'
import {
  buildInvoiceEmailBody,
  getEnabledPaymentMethods,
  getPaymentLink,
  resolveInvoicePaymentMethods,
} from '../lib/payments'
import { generateInvoicePDF } from '../lib/pdf'
import { fillTemplate } from '../lib/reports'

export default function Invoices() {
  const { state, addInvoice, updateInvoice, deleteInvoice } = useStore()
  const downloadsBlocked = useDemoDownloadsBlocked()
  const [showCreate, setShowCreate] = useState(false)
  const [viewInvoice, setViewInvoice] = useState<Invoice | null>(null)
  const [copied, setCopied] = useState('')

  const enabledMethods = getEnabledPaymentMethods(state.profile)

  const [form, setForm] = useState({
    clientId: '',
    dueDate: '',
    taxRate: '0',
    notes: '',
    paymentInstructions: '',
    selectedMethodIds: [] as string[],
    lineItems: [{ description: '', quantity: '1', rate: '' }] as { description: string; quantity: string; rate: string }[],
  })

  useEffect(() => {
    if (showCreate && form.selectedMethodIds.length === 0 && enabledMethods.length > 0) {
      setForm((f) => ({ ...f, selectedMethodIds: enabledMethods.map((m) => m.id) }))
    }
  }, [showCreate, enabledMethods, form.selectedMethodIds.length])

  const clientOptions = [
    { value: '', label: 'Select client...' },
    ...state.clients.map((c) => ({ value: c.id, label: c.name })),
  ]

  const toggleMethod = (id: string) => {
    setForm((f) => ({
      ...f,
      selectedMethodIds: f.selectedMethodIds.includes(id)
        ? f.selectedMethodIds.filter((mid) => mid !== id)
        : [...f.selectedMethodIds, id],
    }))
  }

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

  const resetForm = () => {
    setForm({
      clientId: '',
      dueDate: '',
      taxRate: '0',
      notes: '',
      paymentInstructions: '',
      selectedMethodIds: enabledMethods.map((m) => m.id),
      lineItems: [{ description: '', quantity: '1', rate: '' }],
    })
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
      paymentMethodIds: form.selectedMethodIds,
      paymentInstructions: form.paymentInstructions,
      sentAt: null,
      paidAt: null,
    })
    setShowCreate(false)
    resetForm()
  }

  const handleSend = (invoice: Invoice) => {
    const client = state.clients.find((c) => c.id === invoice.clientId)
    const methods = resolveInvoicePaymentMethods(state.profile, invoice.paymentMethodIds)
    const subject = encodeURIComponent(
      `Invoice ${invoice.number} — ${formatCurrency(invoice.total, state.profile.defaultCurrency)}`
    )
    const body = encodeURIComponent(
      buildInvoiceEmailBody(invoice, state.profile, client?.name || 'there', methods)
    )
    window.open(`mailto:${client?.email}?subject=${subject}&body=${body}`)
    updateInvoice(invoice.id, { status: 'sent', sentAt: new Date().toISOString() })
  }

  const handleSendReminder = (invoice: Invoice) => {
    const client = state.clients.find((c) => c.id === invoice.clientId)
    const status = computeInvoiceStatus(invoice)
    const templateType = status === 'overdue' ? 'payment_overdue' : 'payment_reminder'
    const template = state.emailTemplates.find((t) => t.type === templateType)
    const vars = {
      clientName: client?.name || 'there',
      invoiceNumber: invoice.number,
      amount: formatCurrency(invoice.total, state.profile.defaultCurrency),
      dueDate: formatDate(invoice.dueDate),
      contractorName: state.profile.name || 'Your contractor',
    }
    const subject = encodeURIComponent(
      template ? fillTemplate(template.subject, vars) : `Payment reminder: Invoice ${invoice.number}`
    )
    const body = encodeURIComponent(
      template
        ? fillTemplate(template.body, vars)
        : `Hi ${vars.clientName},\n\nThis is a friendly reminder that invoice ${invoice.number} for ${vars.amount} is due on ${vars.dueDate}.\n\nThank you.`
    )
    window.open(`mailto:${client?.email}?subject=${subject}&body=${body}`)
  }

  const handleImportTime = () => {
    const unbilled = state.timeEntries.filter((e) => e.billable && !e.invoiced)
    if (unbilled.length === 0) return
    setForm({
      ...form,
      selectedMethodIds: enabledMethods.map((m) => m.id),
      lineItems: unbilled.map((e) => ({
        description: `${e.projectName}${e.description ? ` — ${e.description}` : ''} (${(e.durationMinutes / 60).toFixed(1)}h)`,
        quantity: String((e.durationMinutes / 60).toFixed(2)),
        rate: String(e.hourlyRate),
      })),
    })
    setShowCreate(true)
  }

  const copyText = (text: string, key: string) => {
    navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(''), 2000)
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
        description="Create, send, and accept payments."
        action={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={handleImportTime}>
              Import Time
            </Button>
            <Button onClick={() => { resetForm(); setShowCreate(true) }}>
              <Plus size={16} /> New Invoice
            </Button>
          </div>
        }
      />

      {enabledMethods.length === 0 && (
        <Card className="mb-6 p-4 border-amber-200 bg-amber-50">
          <div className="flex items-start gap-3">
            <CreditCard size={18} className="text-amber-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-amber-800">No payment methods configured</p>
              <p className="text-xs text-amber-700 mt-0.5">
                Add PayPal, Stripe, bank transfer, Venmo, or Zelle in{' '}
                <a href="/settings" className="underline font-medium">Settings → Payment Methods</a>{' '}
                so clients know how to pay.
              </p>
            </div>
          </div>
        </Card>
      )}

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
            action={<Button onClick={() => { resetForm(); setShowCreate(true) }}><Plus size={16} /> Create Invoice</Button>}
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
                  const methods = resolveInvoicePaymentMethods(state.profile, invoice.paymentMethodIds)
                  return (
                    <tr key={invoice.id} className="hover:bg-surface-50">
                      <td className="px-6 py-3.5">
                        <p className="font-medium text-surface-800">{invoice.number}</p>
                        {methods.length > 0 && (
                          <p className="text-[10px] text-surface-400 flex items-center gap-1 mt-0.5">
                            <CreditCard size={10} /> {methods.length} payment method{methods.length !== 1 ? 's' : ''}
                          </p>
                        )}
                      </td>
                      <td className="px-6 py-3.5 text-surface-600">{invoice.clientName}</td>
                      <td className="px-6 py-3.5 font-medium">{formatCurrency(invoice.total, state.profile.defaultCurrency)}</td>
                      <td className="px-6 py-3.5 text-surface-500">{formatDate(invoice.dueDate)}</td>
                      <td className="px-6 py-3.5"><Badge status={status} /></td>
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="sm" onClick={() => setViewInvoice(invoice)} title="View">
                            <Eye size={14} />
                          </Button>
                          {!downloadsBlocked && (
                            <Button variant="ghost" size="sm" onClick={() => generateInvoicePDF(invoice, state.profile)} title="Download PDF">
                              <Download size={14} />
                            </Button>
                          )}
                          {status === 'draft' && (
                            <Button variant="secondary" size="sm" onClick={() => handleSend(invoice)}>
                              <Send size={14} /> Send
                            </Button>
                          )}
                          {(status === 'sent' || status === 'overdue') && (
                            <>
                              <Button variant="ghost" size="sm" onClick={() => handleSend(invoice)} title="Resend">
                                <Send size={14} />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => handleSendReminder(invoice)} title="Payment reminder">
                                <Bell size={14} />
                              </Button>
                            </>
                          )}
                          {status !== 'paid' && status !== 'cancelled' && (
                            <Button variant="ghost" size="sm" onClick={() => updateInvoice(invoice.id, { status: 'paid', paidAt: new Date().toISOString() })} title="Mark paid">
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

      {/* Create modal */}
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

          <Input label="Tax Rate (%)" type="number" value={form.taxRate} onChange={(e) => setForm({ ...form, taxRate: e.target.value })} />
          <Textarea label="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />

          {/* Payment methods selection */}
          <div>
            <label className="text-sm font-medium text-surface-700 flex items-center gap-2 mb-2">
              <CreditCard size={14} /> Accept Payment Via
            </label>
            {enabledMethods.length === 0 ? (
              <p className="text-xs text-surface-400 rounded-lg border border-dashed border-surface-200 p-3">
                Configure payment methods in Settings first.
              </p>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2">
                {enabledMethods.map((method) => (
                  <label
                    key={method.id}
                    className={`flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${
                      form.selectedMethodIds.includes(method.id)
                        ? 'border-brand-300 bg-brand-50'
                        : 'border-surface-200 hover:border-surface-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={form.selectedMethodIds.includes(method.id)}
                      onChange={() => toggleMethod(method.id)}
                      className="mt-0.5 rounded border-surface-300 text-brand-600"
                    />
                    <div>
                      <p className="text-sm font-medium text-surface-800">{method.label}</p>
                      <p className="text-xs text-surface-500 truncate">{method.details}</p>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>

          <Textarea
            label="Payment Instructions (optional)"
            value={form.paymentInstructions}
            onChange={(e) => setForm({ ...form, paymentInstructions: e.target.value })}
            placeholder={state.profile.defaultPaymentInstructions || 'e.g. Include invoice number in payment memo'}
          />

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={!form.clientId || !form.dueDate}>Create Invoice</Button>
          </div>
        </div>
      </Modal>

      {/* View modal */}
      <Modal open={!!viewInvoice} onClose={() => setViewInvoice(null)} title={viewInvoice ? `Invoice ${viewInvoice.number}` : ''} wide>
        {viewInvoice && (() => {
          const methods = resolveInvoicePaymentMethods(state.profile, viewInvoice.paymentMethodIds)
          return (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 text-sm">
                <div>
                  <p className="text-surface-400 text-xs">Client</p>
                  <p className="font-medium">{viewInvoice.clientName}</p>
                </div>
                <div>
                  <p className="text-surface-400 text-xs">Issue Date</p>
                  <p className="font-medium">{formatDate(viewInvoice.issueDate)}</p>
                </div>
                <div>
                  <p className="text-surface-400 text-xs">Due Date</p>
                  <p className="font-medium">{formatDate(viewInvoice.dueDate)}</p>
                </div>
                <div>
                  <p className="text-surface-400 text-xs">Total</p>
                  <p className="font-bold text-brand-600 text-lg">{formatCurrency(viewInvoice.total, state.profile.defaultCurrency)}</p>
                </div>
              </div>

              <div className="rounded-lg border border-surface-200 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-surface-50 text-surface-500">
                    <tr>
                      <th className="px-4 py-2 text-left font-medium">Description</th>
                      <th className="px-4 py-2 text-right font-medium">Qty</th>
                      <th className="px-4 py-2 text-right font-medium">Rate</th>
                      <th className="px-4 py-2 text-right font-medium">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-100">
                    {viewInvoice.lineItems.map((item) => (
                      <tr key={item.id}>
                        <td className="px-4 py-2">{item.description}</td>
                        <td className="px-4 py-2 text-right">{item.quantity}</td>
                        <td className="px-4 py-2 text-right">{formatCurrency(item.rate, state.profile.defaultCurrency)}</td>
                        <td className="px-4 py-2 text-right font-medium">{formatCurrency(item.amount, state.profile.defaultCurrency)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {methods.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-surface-900 flex items-center gap-2 mb-3">
                    <CreditCard size={15} /> How to Pay
                  </h3>
                  <div className="space-y-2">
                    {methods.map((method) => {
                      const link = getPaymentLink(method)
                      return (
                        <div key={method.id} className="flex items-center justify-between rounded-xl border border-surface-200 bg-surface-50 p-4">
                          <div>
                            <p className="text-sm font-medium text-surface-900">{method.label}</p>
                            <p className="text-sm text-surface-600 mt-0.5">{method.details}</p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0 ml-4">
                            <button
                              onClick={() => copyText(method.details, method.id)}
                              className="rounded-lg p-2 text-surface-400 hover:bg-white hover:text-surface-600 transition-colors"
                              title="Copy details"
                            >
                              {copied === method.id ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                            </button>
                            {link && (
                              <a href={link} target="_blank" rel="noopener noreferrer">
                                <Button size="sm">
                                  Pay Now <ExternalLink size={12} />
                                </Button>
                              </a>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {(viewInvoice.paymentInstructions || state.profile.defaultPaymentInstructions) && (
                <div className="rounded-lg bg-surface-50 border border-surface-200 p-4">
                  <p className="text-xs font-medium text-surface-500 mb-1">Payment Instructions</p>
                  <p className="text-sm text-surface-700">
                    {viewInvoice.paymentInstructions || state.profile.defaultPaymentInstructions}
                  </p>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                {!downloadsBlocked && (
                  <Button variant="secondary" onClick={() => generateInvoicePDF(viewInvoice, state.profile)}>
                    <Download size={14} /> Download PDF
                  </Button>
                )}
                <Button onClick={() => handleSend(viewInvoice)}>
                  <Send size={14} /> Send to Client
                </Button>
              </div>
            </div>
          )
        })()}
      </Modal>
    </div>
  )
}
