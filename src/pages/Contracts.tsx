import { useState, useEffect } from 'react'
import { FileText, Plus, Send, Download, Trash2, Eye, PenLine, Link2, RefreshCw, Copy, Check, FileSignature, Loader2 } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import { useStore } from '../context/StoreContext'
import { useDemoDownloadsBlocked } from '../context/DemoContext'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { Textarea } from '../components/ui/Textarea'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Modal, PageHeader, EmptyState } from '../components/ui/Modal'
import { SignaturePad, SignatureDisplay } from '../components/SignaturePad'
import { CONTRACT_TEMPLATES, type Contract, type ContractSignature, type ClientFileAccess } from '../lib/types'
import { fillContractTemplate, formatCurrency, formatDate, getNextNumber, hasSignature } from '../lib/utils'
import { CLIENT_FILE_ACCESS_OPTIONS, clientFileAccessLabel } from '../lib/client-file-access'
import { generateContractPDF } from '../lib/pdf'
import { createSigningLink, fetchSigningStatus } from '../lib/sync'
import { createDocuSignEnvelope } from '../lib/docusign-api'
import { notifySlackEvent } from '../lib/slack-notify'

export default function Contracts() {
  const { state, addContract, updateContract, signContract, deleteContract } = useStore()
  const [searchParams, setSearchParams] = useSearchParams()
  const downloadsBlocked = useDemoDownloadsBlocked()
  const [showCreate, setShowCreate] = useState(false)
  const [viewContract, setViewContract] = useState<Contract | null>(null)
  const [signContractTarget, setSignContractTarget] = useState<Contract | null>(null)
  const [signingLink, setSigningLink] = useState('')
  const [copied, setCopied] = useState(false)
  const [docusignBusy, setDocusignBusy] = useState('')
  const [form, setForm] = useState({
    title: '',
    clientId: '',
    template: 'freelance',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    value: '',
    terms: '',
    clientFileAccess: 'none' as ClientFileAccess,
  })

  const clientOptions = [
    { value: '', label: 'Select client...' },
    ...state.clients.map((c) => ({ value: c.id, label: c.name })),
  ]

  const templateOptions = Object.entries(CONTRACT_TEMPLATES).map(([key, t]) => ({
    value: key,
    label: t.name,
  }))

  useEffect(() => {
    const envelopeId = searchParams.get('docusign_envelope')
    if (!envelopeId) return
    const contract = state.contracts.find((c) => c.docusignEnvelopeId === envelopeId)
    if (contract && contract.status !== 'signed') {
      updateContract(contract.id, { status: 'awaiting_signature' })
    }
    searchParams.delete('docusign_envelope')
    setSearchParams(searchParams, { replace: true })
  }, [searchParams, setSearchParams, state.contracts, updateContract])

  const notifyContractSigned = (contract: Contract, signer: string) => {
    void notifySlackEvent(state, 'contract_signed', {
      number: contract.number,
      title: contract.title,
      clientName: contract.clientName,
      signer,
    })
  }

  const handleCreate = () => {
    const client = state.clients.find((c) => c.id === form.clientId)
    const template = CONTRACT_TEMPLATES[form.template as keyof typeof CONTRACT_TEMPLATES]
    const number = getNextNumber(
      state.profile.contractPrefix,
      state.contracts.map((c) => c.number)
    )
    const content = fillContractTemplate(template.content, {
      startDate: formatDate(form.startDate),
      endDate: formatDate(form.endDate),
      businessName: state.profile.name || 'Contractor',
      businessEmail: state.profile.email,
      businessAddress: `${state.profile.address}, ${state.profile.city} ${state.profile.state}`,
      clientName: client?.name || '',
      clientEmail: client?.email || '',
      clientCompany: client?.company || '',
      title: form.title,
      value: form.value,
      currency: state.profile.defaultCurrency,
      hourlyRate: state.profile.defaultHourlyRate,
    })

    addContract({
      number,
      title: form.title,
      clientId: form.clientId,
      clientName: client?.name || 'Unknown',
      status: 'draft',
      template: form.template,
      content,
      startDate: form.startDate,
      endDate: form.endDate,
      value: parseFloat(form.value) || 0,
      terms: form.terms,
      clientFileAccess: form.clientFileAccess,
      sentAt: null,
      signedAt: null,
    })
    setShowCreate(false)
    setForm({ title: '', clientId: '', template: 'freelance', startDate: new Date().toISOString().split('T')[0], endDate: '', value: '', terms: '', clientFileAccess: 'none' })
  }

  const handleContractorSign = (signatureImage: string) => {
    if (!signContractTarget) return
    const signature: ContractSignature = {
      role: 'contractor',
      name: state.profile.name || 'Contractor',
      signatureImage,
      signedAt: new Date().toISOString(),
    }
    signContract(signContractTarget.id, signature)
    setSignContractTarget(null)
  }

  const handleCreateSigningLink = async (contract: Contract) => {
    const result = await createSigningLink({
      id: contract.id,
      number: contract.number,
      title: contract.title,
      content: contract.content,
      clientName: contract.clientName,
      contractorName: state.profile.name || 'Contractor',
      value: contract.value,
      currency: state.profile.defaultCurrency,
      signatures: contract.signatures,
    })
    if (result.ok && result.token && result.url) {
      updateContract(contract.id, {
        signingToken: result.token,
        status: 'awaiting_signature',
        sentAt: contract.sentAt || new Date().toISOString(),
      })
      setSigningLink(result.url)
    } else {
      alert(result.error || 'Could not create signing link')
    }
  }

  const handleRefreshSignature = async (contract: Contract) => {
    if (!contract.signingToken) return
    const result = await fetchSigningStatus(contract.signingToken)
    if (result.ok && result.clientSignature) {
      signContract(contract.id, {
        role: 'client',
        name: result.clientSignature.name,
        signatureImage: result.clientSignature.signatureImage,
        signedAt: result.clientSignature.signedAt,
      })
      notifyContractSigned(contract, result.clientSignature.name)
    } else if (!result.clientSignature) {
      alert('No client signature yet')
    } else {
      alert(result.error || 'Could not refresh')
    }
  }

  const handleDocuSign = async (contract: Contract) => {
    const client = state.clients.find((c) => c.id === contract.clientId)
    if (!client?.email) {
      alert('Add a client email before sending via DocuSign.')
      return
    }
    setDocusignBusy(contract.id)
    try {
      const returnUrl = `${window.location.origin}/contracts?docusign_envelope=`
      const result = await createDocuSignEnvelope(contract, {
        credentials: state.integrationCredentials,
        clientEmail: client.email,
        contractorEmail: state.profile.email,
        contractorName: state.profile.name || 'Contractor',
        returnUrl: `${returnUrl}{envelopeId}`,
      })
      updateContract(contract.id, {
        docusignEnvelopeId: result.envelopeId,
        docusignSigningUrl: result.signingUrl,
        status: 'awaiting_signature',
        sentAt: contract.sentAt || new Date().toISOString(),
      })
      if (result.signingUrl) {
        setSigningLink(result.signingUrl)
      }
    } catch (e) {
      alert(e instanceof Error ? e.message : 'DocuSign failed')
    } finally {
      setDocusignBusy('')
    }
  }

  const handleSend = (contract: Contract) => {
    const client = state.clients.find((c) => c.id === contract.clientId)
    const signUrl = contract.signingToken ? `${window.location.origin}/sign/${contract.signingToken}` : ''
    const subject = encodeURIComponent(`Contract ${contract.number}: ${contract.title}`)
    const body = encodeURIComponent(
      `Hi ${client?.name || 'there'},\n\nPlease review and sign contract ${contract.number} for "${contract.title}".${signUrl ? `\n\nSign here: ${signUrl}` : ''}\n\nBest regards,\n${state.profile.name}`
    )
    window.open(`mailto:${client?.email}?subject=${subject}&body=${body}`)
    updateContract(contract.id, { status: contract.status === 'draft' ? 'sent' : contract.status, sentAt: new Date().toISOString() })
  }

  const copyLink = (url: string) => {
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div>
      <PageHeader
        title="Contracts"
        description="Generate, e-sign, and send client agreements."
        action={
          <Button onClick={() => setShowCreate(true)}>
            <Plus size={16} /> New Contract
          </Button>
        }
      />

      {state.contracts.length === 0 ? (
        <Card>
          <EmptyState
            icon={<FileText size={24} />}
            title="No contracts yet"
            description="Create your first contract from a professional template."
            action={<Button onClick={() => setShowCreate(true)}><Plus size={16} /> Create Contract</Button>}
          />
        </Card>
      ) : (
        <div className="grid gap-4">
          {state.contracts.map((contract) => (
            <Card key={contract.id} className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h3 className="text-base font-semibold text-surface-900">{contract.title}</h3>
                    <Badge status={contract.status} />
                  </div>
                  <p className="text-sm text-surface-500 mt-1">
                    {contract.number} · {contract.clientName} · {formatCurrency(contract.value, state.profile.defaultCurrency)}
                  </p>
                  <p className="text-xs text-surface-400 mt-1">
                    {formatDate(contract.startDate)} — {formatDate(contract.endDate)}
                    · Files: {clientFileAccessLabel(contract.clientFileAccess ?? 'none')}
                    {contract.status === 'signed' ? '' : ' (after signing)'}
                  </p>
                  <div className="flex gap-3 mt-2 text-xs">
                    <span className={hasSignature(contract, 'contractor') ? 'text-emerald-600' : 'text-surface-400'}>
                      Contractor {hasSignature(contract, 'contractor') ? '✓' : '○'}
                    </span>
                    <span className={hasSignature(contract, 'client') ? 'text-emerald-600' : 'text-surface-400'}>
                      Client {hasSignature(contract, 'client') ? '✓' : '○'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-wrap justify-end">
                  <Button variant="ghost" size="sm" onClick={() => setViewContract(contract)} title="View">
                    <Eye size={14} />
                  </Button>
                  {!downloadsBlocked && (
                    <Button variant="ghost" size="sm" onClick={() => generateContractPDF(contract, state.profile)} title="Download PDF">
                      <Download size={14} />
                    </Button>
                  )}
                  {!hasSignature(contract, 'contractor') && (
                    <Button variant="secondary" size="sm" onClick={() => setSignContractTarget(contract)}>
                      <PenLine size={14} /> Sign
                    </Button>
                  )}
                  {hasSignature(contract, 'contractor') && !contract.signingToken && !contract.docusignEnvelopeId && (
                    <Button variant="secondary" size="sm" onClick={() => handleCreateSigningLink(contract)}>
                      <Link2 size={14} /> Sign Link
                    </Button>
                  )}
                  {state.integrations.docusignEnabled && contract.status !== 'signed' && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleDocuSign(contract)}
                      disabled={docusignBusy === contract.id}
                      title="Send via DocuSign"
                    >
                      {docusignBusy === contract.id ? <Loader2 size={14} className="animate-spin" /> : <FileSignature size={14} />}
                      DocuSign
                    </Button>
                  )}
                  {contract.docusignSigningUrl && !hasSignature(contract, 'client') && (
                    <Button variant="ghost" size="sm" onClick={() => copyLink(contract.docusignSigningUrl!)} title="Copy DocuSign link">
                      {copied ? <Check size={14} /> : <Copy size={14} />}
                    </Button>
                  )}
                  {contract.signingToken && !hasSignature(contract, 'client') && (
                    <>
                      <Button variant="ghost" size="sm" onClick={() => copyLink(`${window.location.origin}/sign/${contract.signingToken}`)} title="Copy link">
                        {copied ? <Check size={14} /> : <Copy size={14} />}
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleRefreshSignature(contract)} title="Check for client signature">
                        <RefreshCw size={14} />
                      </Button>
                    </>
                  )}
                  <Button variant="ghost" size="sm" onClick={() => handleSend(contract)} title="Send email">
                    <Send size={14} />
                  </Button>
                  <button onClick={() => deleteContract(contract.id)} className="text-surface-400 hover:text-red-500 p-1">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create Contract" wide>
        <div className="space-y-4">
          <Input label="Contract Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Website Redesign Project" />
          <div className="grid grid-cols-2 gap-4">
            <Select label="Client" options={clientOptions} value={form.clientId} onChange={(e) => setForm({ ...form, clientId: e.target.value })} />
            <Select label="Template" options={templateOptions} value={form.template} onChange={(e) => setForm({ ...form, template: e.target.value })} />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Input label="Start Date" type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
            <Input label="End Date" type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
            <Input label="Contract Value" type="number" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} />
          </div>
          <Textarea label="Additional Terms" value={form.terms} onChange={(e) => setForm({ ...form, terms: e.target.value })} placeholder="Any special terms or conditions..." />
          <Select
            label="Client file access (Client WorkVault)"
            value={form.clientFileAccess}
            onChange={(e) => setForm({ ...form, clientFileAccess: e.target.value as ClientFileAccess })}
            options={CLIENT_FILE_ACCESS_OPTIONS.map((o) => ({
              value: o.value,
              label: o.label,
            }))}
          />
          <p className="text-xs text-surface-500 -mt-2">
            {CLIENT_FILE_ACCESS_OPTIONS.find((o) => o.value === form.clientFileAccess)?.description}
            {' '}Access takes effect only after both parties have signed this contract.
          </p>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={!form.title || !form.clientId}>Create Contract</Button>
          </div>
        </div>
      </Modal>

      <Modal open={!!viewContract} onClose={() => setViewContract(null)} title={viewContract?.title || ''} wide>
        {viewContract && (
          <div className="space-y-4">
            <pre className="whitespace-pre-wrap text-sm text-surface-700 font-sans leading-relaxed max-h-[40vh] overflow-y-auto">
              {viewContract.content}
            </pre>
            {viewContract.signatures.length > 0 && (
              <div className="grid gap-3 sm:grid-cols-2 border-t border-surface-100 pt-4">
                {viewContract.signatures.map((sig) => (
                  <div key={sig.role}>
                    <p className="text-xs font-medium text-surface-500 mb-1 capitalize">{sig.role}</p>
                    <SignatureDisplay signature={sig} />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </Modal>

      <Modal open={!!signContractTarget} onClose={() => setSignContractTarget(null)} title="Sign Contract" wide>
        {signContractTarget && (
          <div className="space-y-4">
            <p className="text-sm text-surface-600">
              Sign as <strong>{state.profile.name || 'Contractor'}</strong> for contract {signContractTarget.number}
            </p>
            <SignaturePad
              defaultName={state.profile.name}
              onSignature={handleContractorSign}
            />
          </div>
        )}
      </Modal>

      <Modal open={!!signingLink} onClose={() => setSigningLink('')} title="Client Signing Link">
        <div className="space-y-4">
          <p className="text-sm text-surface-600">Share this link with your client to collect their e-signature:</p>
          <div className="flex gap-2">
            <input
              readOnly
              value={signingLink}
              className="flex-1 rounded-lg border border-surface-200 bg-surface-50 px-3 py-2 text-sm font-mono"
            />
            <Button onClick={() => copyLink(signingLink)}>
              {copied ? <Check size={16} /> : <Copy size={16} />}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
