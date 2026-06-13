import { useMemo, useState } from 'react'
import { ArrowRightLeft, Eye, FileText, Plus, Send, Trash2, CheckCircle2 } from 'lucide-react'
import { useStore } from '../context/StoreContext'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { Textarea } from '../components/ui/Textarea'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Modal, PageHeader, EmptyState } from '../components/ui/Modal'
import type { Proposal, ProposalLineItem } from '../lib/types'
import { formatCurrency, formatDate, getNextNumber } from '../lib/utils'

function getDefaultValidUntil() {
  const date = new Date()
  date.setDate(date.getDate() + 30)
  return date.toISOString().split('T')[0]
}

function buildProposalContent(
  proposalNumber: string,
  title: string,
  clientName: string,
  total: number,
  validUntil: string,
  lineItems: ProposalLineItem[],
  notes: string,
  businessName: string
) {
  const itemLines = lineItems
    .map((item) => `- ${item.description}: ${item.quantity} x ${item.rate} = ${item.amount}`)
    .join('\n')

  return `PROPOSAL ${proposalNumber}

Project: ${title}
Client: ${clientName}
Prepared by: ${businessName}

Scope:
${itemLines}

Total: ${total}
Valid Until: ${formatDate(validUntil)}

Notes:
${notes || 'None'}
`
}

export default function Proposals() {
  const { state, addProposal, updateProposal, deleteProposal, addContract, addProject } = useStore()
  const [showModal, setShowModal] = useState(false)
  const [viewProposal, setViewProposal] = useState<Proposal | null>(null)
  const [editingProposalId, setEditingProposalId] = useState<string | null>(null)
  const [form, setForm] = useState({
    title: '',
    clientId: '',
    validUntil: getDefaultValidUntil(),
    notes: '',
    lineItems: [{ description: '', quantity: '1', rate: '' }] as { description: string; quantity: string; rate: string }[],
  })

  const clientOptions = useMemo(
    () => [
      { value: '', label: 'Select client...' },
      ...state.clients.map((client) => ({ value: client.id, label: client.name })),
    ],
    [state.clients]
  )

  const lineItems = useMemo(
    () =>
      form.lineItems
        .filter((item) => item.description.trim())
        .map((item) => {
          const quantity = parseFloat(item.quantity) || 1
          const rate = parseFloat(item.rate) || 0
          return {
            id: crypto.randomUUID(),
            description: item.description,
            quantity,
            rate,
            amount: quantity * rate,
          } as ProposalLineItem
        }),
    [form.lineItems]
  )

  const subtotal = useMemo(() => lineItems.reduce((sum, item) => sum + item.amount, 0), [lineItems])

  const resetForm = () => {
    setEditingProposalId(null)
    setForm({
      title: '',
      clientId: '',
      validUntil: getDefaultValidUntil(),
      notes: '',
      lineItems: [{ description: '', quantity: '1', rate: '' }],
    })
  }

  const openCreate = () => {
    resetForm()
    setShowModal(true)
  }

  const openEdit = (proposal: Proposal) => {
    setEditingProposalId(proposal.id)
    setForm({
      title: proposal.title,
      clientId: proposal.clientId,
      validUntil: proposal.validUntil,
      notes: proposal.notes,
      lineItems: proposal.lineItems.map((item) => ({
        description: item.description,
        quantity: String(item.quantity),
        rate: String(item.rate),
      })),
    })
    setShowModal(true)
  }

  const addLineItem = () => {
    setForm((current) => ({
      ...current,
      lineItems: [...current.lineItems, { description: '', quantity: '1', rate: '' }],
    }))
  }

  const updateLineItem = (index: number, field: 'description' | 'quantity' | 'rate', value: string) => {
    setForm((current) => {
      const items = [...current.lineItems]
      items[index] = { ...items[index], [field]: value }
      return { ...current, lineItems: items }
    })
  }

  const removeLineItem = (index: number) => {
    setForm((current) => ({
      ...current,
      lineItems: current.lineItems.filter((_, itemIndex) => itemIndex !== index),
    }))
  }

  const handleSave = () => {
    const client = state.clients.find((item) => item.id === form.clientId)
    const proposalLineItems = lineItems
    const total = proposalLineItems.reduce((sum, item) => sum + item.amount, 0)
    const existingProposal = editingProposalId
      ? state.proposals.find((item) => item.id === editingProposalId)
      : null
    const number = editingProposalId
      ? existingProposal?.number || getNextNumber('PRO', state.proposals.map((item) => item.number))
      : getNextNumber('PRO', state.proposals.map((item) => item.number))

    const proposalData = {
      number,
      title: form.title.trim(),
      clientId: form.clientId,
      clientName: client?.name || 'Unknown',
      status: existingProposal?.status || ('draft' as const),
      lineItems: proposalLineItems,
      subtotal: total,
      total,
      validUntil: form.validUntil,
      notes: form.notes,
    }

    if (editingProposalId) {
      updateProposal(editingProposalId, proposalData)
    } else {
      addProposal(proposalData)
    }

    setShowModal(false)
    resetForm()
  }

  const handleSend = (proposal: Proposal) => {
    const client = state.clients.find((item) => item.id === proposal.clientId)
    const subject = encodeURIComponent(`Proposal ${proposal.number}: ${proposal.title}`)
    const body = encodeURIComponent(
      `Hi ${client?.name || 'there'},\n\nPlease review proposal ${proposal.number} for ${formatCurrency(proposal.total, state.profile.defaultCurrency)}.\n\nValid until: ${formatDate(proposal.validUntil)}\n\nBest,\n${state.profile.name || 'WorkVault'}`
    )
    window.open(`mailto:${client?.email}?subject=${subject}&body=${body}`)
    updateProposal(proposal.id, { status: 'sent' })
  }

  const handleConvertToContract = (proposal: Proposal) => {
    const client = state.clients.find((item) => item.id === proposal.clientId)
    const contractNumber = getNextNumber(state.profile.contractPrefix, state.contracts.map((item) => item.number))
    const contractContent = buildProposalContent(
      proposal.number,
      proposal.title,
      proposal.clientName,
      proposal.total,
      proposal.validUntil,
      proposal.lineItems,
      proposal.notes,
      state.profile.name || 'Contractor'
    )

    addContract({
      number: contractNumber,
      title: proposal.title,
      clientId: proposal.clientId,
      clientName: client?.name || proposal.clientName,
      status: 'draft',
      template: 'proposal',
      content: contractContent,
      startDate: new Date().toISOString().split('T')[0],
      endDate: proposal.validUntil,
      value: proposal.total,
      terms: proposal.notes,
      sentAt: null,
      signedAt: null,
    })
    updateProposal(proposal.id, { status: 'accepted' })
    setViewProposal(null)
  }

  const handleConvertToProject = (proposal: Proposal) => {
    const client = state.clients.find((item) => item.id === proposal.clientId)
    addProject({
      title: proposal.title,
      clientId: proposal.clientId,
      clientName: client?.name || proposal.clientName,
      stage: 'active',
      value: proposal.total,
      description: proposal.notes || proposal.lineItems.map((item) => item.description).join(', '),
      startDate: new Date().toISOString().split('T')[0],
      dueDate: proposal.validUntil,
    })
    updateProposal(proposal.id, { status: 'accepted' })
    setViewProposal(null)
  }

  const openProposal = (proposal: Proposal) => {
    setViewProposal(proposal)
  }

  return (
    <div>
      <PageHeader
        title="Proposals"
        description="Build quotes, send them to clients, and turn them into contracts or projects."
        action={
          <Button onClick={openCreate}>
            <Plus size={16} /> New Proposal
          </Button>
        }
      />

      {state.proposals.length === 0 ? (
        <Card>
          <EmptyState
            icon={<FileText size={24} />}
            title="No proposals yet"
            description="Create a proposal with line items and send it to a client."
            action={<Button onClick={openCreate}><Plus size={16} /> Create Proposal</Button>}
          />
        </Card>
      ) : (
        <div className="grid gap-4">
          {state.proposals.map((proposal) => (
            <Card key={proposal.id} className="p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-semibold text-surface-900">{proposal.title}</h3>
                    <Badge status={proposal.status} />
                  </div>
                  <p className="text-sm text-surface-500 mt-1">
                    {proposal.number} · {proposal.clientName}
                  </p>
                  <p className="text-sm text-brand-600 font-medium mt-1">
                    {formatCurrency(proposal.total, state.profile.defaultCurrency)}
                  </p>
                  <p className="text-xs text-surface-400 mt-1">Valid until {formatDate(proposal.validUntil)}</p>
                  <p className="text-xs text-surface-400 mt-1">
                    {proposal.lineItems.length} line item{proposal.lineItems.length === 1 ? '' : 's'}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={() => openProposal(proposal)} title="View proposal">
                    <Eye size={14} />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => openEdit(proposal)}>
                    Edit
                  </Button>
                  <Button variant="secondary" size="sm" onClick={() => handleSend(proposal)}>
                    <Send size={14} /> Send
                  </Button>
                  <Button variant="secondary" size="sm" onClick={() => handleConvertToContract(proposal)}>
                    <CheckCircle2 size={14} /> Convert to Contract
                  </Button>
                  <Button variant="secondary" size="sm" onClick={() => handleConvertToProject(proposal)}>
                    <ArrowRightLeft size={14} /> Convert to Project
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => deleteProposal(proposal.id)}>
                    <Trash2 size={14} />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={showModal}
        onClose={() => {
          setShowModal(false)
          resetForm()
        }}
        title={editingProposalId ? 'Edit Proposal' : 'New Proposal'}
        wide
      >
        <div className="space-y-4">
          <Input
            label="Proposal Title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="Brand Refresh and Website Update"
          />
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Client"
              options={clientOptions}
              value={form.clientId}
              onChange={(e) => setForm({ ...form, clientId: e.target.value })}
            />
            <Input
              label="Valid Until"
              type="date"
              value={form.validUntil}
              onChange={(e) => setForm({ ...form, validUntil: e.target.value })}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-surface-700">Line Items</label>
              <Button variant="ghost" size="sm" onClick={addLineItem}>
                <Plus size={14} /> Add Item
              </Button>
            </div>
            <div className="space-y-2">
              {form.lineItems.map((item, index) => (
                <div key={index} className="grid grid-cols-12 gap-2 items-end">
                  <div className="col-span-6">
                    <Input
                      placeholder="Description"
                      value={item.description}
                      onChange={(e) => updateLineItem(index, 'description', e.target.value)}
                    />
                  </div>
                  <div className="col-span-2">
                    <Input
                      placeholder="Qty"
                      type="number"
                      value={item.quantity}
                      onChange={(e) => updateLineItem(index, 'quantity', e.target.value)}
                    />
                  </div>
                  <div className="col-span-3">
                    <Input
                      placeholder="Rate"
                      type="number"
                      value={item.rate}
                      onChange={(e) => updateLineItem(index, 'rate', e.target.value)}
                    />
                  </div>
                  <div className="col-span-1">
                    {form.lineItems.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeLineItem(index)}
                        className="p-2 text-surface-400 hover:text-red-500"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Textarea
            label="Notes"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            placeholder="Add extra context, assumptions, or scope notes..."
          />

          <div className="rounded-lg border border-surface-200 bg-surface-50 p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-surface-500">Subtotal</span>
              <span className="font-medium">{formatCurrency(subtotal, state.profile.defaultCurrency)}</span>
            </div>
            <div className="mt-1 flex items-center justify-between text-sm">
              <span className="text-surface-500">Estimated Total</span>
              <span className="font-semibold text-brand-600">{formatCurrency(subtotal, state.profile.defaultCurrency)}</span>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="secondary"
              onClick={() => {
                setShowModal(false)
                resetForm()
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!form.title || !form.clientId}>
              {editingProposalId ? 'Save Proposal' : 'Create Proposal'}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal open={!!viewProposal} onClose={() => setViewProposal(null)} title={viewProposal?.title || ''} wide>
        {viewProposal && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 text-sm">
              <div>
                <p className="text-xs text-surface-400">Proposal</p>
                <p className="font-medium">{viewProposal.number}</p>
              </div>
              <div>
                <p className="text-xs text-surface-400">Client</p>
                <p className="font-medium">{viewProposal.clientName}</p>
              </div>
              <div>
                <p className="text-xs text-surface-400">Valid Until</p>
                <p className="font-medium">{formatDate(viewProposal.validUntil)}</p>
              </div>
              <div>
                <p className="text-xs text-surface-400">Total</p>
                <p className="font-semibold text-brand-600">{formatCurrency(viewProposal.total, state.profile.defaultCurrency)}</p>
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
                  {viewProposal.lineItems.map((item) => (
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

            {viewProposal.notes && (
              <div className="rounded-lg bg-surface-50 border border-surface-200 p-4">
                <p className="text-xs font-medium text-surface-500 mb-1">Notes</p>
                <p className="text-sm text-surface-700 whitespace-pre-wrap">{viewProposal.notes}</p>
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" onClick={() => handleSend(viewProposal)}>
                <Send size={14} /> Send to Client
              </Button>
              <Button variant="secondary" onClick={() => handleConvertToContract(viewProposal)}>
                <CheckCircle2 size={14} /> Convert to Contract
              </Button>
              <Button variant="secondary" onClick={() => handleConvertToProject(viewProposal)}>
                <ArrowRightLeft size={14} /> Convert to Project
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
