import type { AppState, Contract } from './types'
import {
  DEFAULT_PROFILE, DEFAULT_TAX_SETTINGS, DEFAULT_INTEGRATIONS, DEFAULT_EMAIL_TEMPLATES,
  DEFAULT_DEMO_SETTINGS, DEFAULT_DEMO_PROJECT_TRANSFER, DEFAULT_CLIENT_ROOM_CONFIG,
} from './types'

const STORAGE_KEY = 'workvault-state'

function seedEmailTemplates() {
  const now = new Date().toISOString()
  return DEFAULT_EMAIL_TEMPLATES.map((t) => ({ ...t, id: crypto.randomUUID(), createdAt: now }))
}

export function createInitialState(): AppState {
  return {
    profile: { ...DEFAULT_PROFILE },
    clients: [],
    timeEntries: [],
    contracts: [],
    invoices: [],
    licenses: [],
    workProtections: [],
    hostedProjects: [],
    workRecords: [],
    projects: [],
    proposals: [],
    expenses: [],
    recurringInvoices: [],
    scopeEntries: [],
    vaultDocuments: [],
    subcontractors: [],
    emailTemplates: seedEmailTemplates(),
    availabilityBlocks: [],
    milestones: [],
    taxSettings: { ...DEFAULT_TAX_SETTINGS },
    integrations: { ...DEFAULT_INTEGRATIONS },
    activeTimer: null,
    syncMeta: { lastSyncedAt: null, autoSync: false },
    demoSettings: { ...DEFAULT_DEMO_SETTINGS },
  }
}

export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return createInitialState()
    const parsed = JSON.parse(raw) as AppState
    return {
      ...createInitialState(),
      ...parsed,
      profile: {
        ...DEFAULT_PROFILE,
        ...parsed.profile,
        paymentMethods: parsed.profile?.paymentMethods || [],
        defaultPaymentInstructions: parsed.profile?.defaultPaymentInstructions || '',
      },
      syncMeta: { ...createInitialState().syncMeta, ...parsed.syncMeta },
      contracts: (parsed.contracts || []).map((c: Contract) => ({
        ...c,
        signatures: c.signatures || [],
        signingToken: c.signingToken ?? null,
      })),
      invoices: (parsed.invoices || []).map((inv) => ({
        ...inv,
        paymentMethodIds: inv.paymentMethodIds || [],
        paymentInstructions: inv.paymentInstructions || '',
      })),
      clients: (parsed.clients || []).map((c) => ({
        ...c,
        portalToken: c.portalToken ?? null,
      })),
      projects: parsed.projects || [],
      proposals: parsed.proposals || [],
      expenses: parsed.expenses || [],
      recurringInvoices: parsed.recurringInvoices || [],
      scopeEntries: parsed.scopeEntries || [],
      vaultDocuments: parsed.vaultDocuments || [],
      subcontractors: parsed.subcontractors || [],
      emailTemplates: parsed.emailTemplates?.length ? parsed.emailTemplates : seedEmailTemplates(),
      availabilityBlocks: parsed.availabilityBlocks || [],
      milestones: parsed.milestones || [],
      taxSettings: { ...DEFAULT_TAX_SETTINGS, ...parsed.taxSettings },
      integrations: { ...DEFAULT_INTEGRATIONS, ...parsed.integrations },
      demoSettings: { ...DEFAULT_DEMO_SETTINGS, ...parsed.demoSettings,
        uploadSecret: parsed.demoSettings?.uploadSecret ?? null,
        allowDownloads: parsed.demoSettings?.allowDownloads ?? false,
        clientRoom: { ...DEFAULT_CLIENT_ROOM_CONFIG, ...parsed.demoSettings?.clientRoom,
          checklist: parsed.demoSettings?.clientRoom?.checklist || [],
          milestones: parsed.demoSettings?.clientRoom?.milestones || [],
          availabilitySlots: parsed.demoSettings?.clientRoom?.availabilitySlots || [],
        },
        projectTransfer: {
          ...DEFAULT_DEMO_PROJECT_TRANSFER,
          ...parsed.demoSettings?.projectTransfer,
          deliverables: parsed.demoSettings?.projectTransfer?.deliverables || [],
        },
      },
    }
  } catch {
    return createInitialState()
  }
}

export function saveState(state: AppState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

export function exportAllData(state: AppState): string {
  return JSON.stringify(state, null, 2)
}

export function importAllData(json: string): AppState {
  const parsed = JSON.parse(json) as AppState
  saveState(parsed)
  return parsed
}

export async function generateHash(content: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(content)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}

export function generateId(): string {
  return crypto.randomUUID()
}

export function formatCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount)
}

export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}

export function formatDate(date: string | null): string {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function formatDateTime(date: string | null): string {
  if (!date) return '—'
  return new Date(date).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function getNextNumber(prefix: string, existing: string[]): string {
  const year = new Date().getFullYear()
  const pattern = new RegExp(`^${prefix}-${year}-(\\d+)$`)
  let max = 0
  for (const num of existing) {
    const match = num.match(pattern)
    if (match) max = Math.max(max, parseInt(match[1], 10))
  }
  return `${prefix}-${year}-${String(max + 1).padStart(4, '0')}`
}

export function computeLicenseStatus(expiryDate: string): 'active' | 'expiring' | 'expired' {
  const expiry = new Date(expiryDate)
  const now = new Date()
  const daysUntil = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  if (daysUntil < 0) return 'expired'
  if (daysUntil <= 30) return 'expiring'
  return 'active'
}

export function computeInvoiceStatus(invoice: { status: string; dueDate: string }): string {
  if (invoice.status === 'paid' || invoice.status === 'cancelled' || invoice.status === 'draft') {
    return invoice.status
  }
  if (new Date(invoice.dueDate) < new Date()) return 'overdue'
  return invoice.status
}

export function fillContractTemplate(
  template: string,
  vars: Record<string, string | number>
): string {
  let result = template
  for (const [key, value] of Object.entries(vars)) {
    result = result.replace(new RegExp(`{{${key}}}`, 'g'), String(value))
  }
  return result
}

export function hasSignature(contract: Contract, role: 'contractor' | 'client'): boolean {
  return contract.signatures.some((s) => s.role === role)
}

export function deriveContractStatus(contract: Contract): Contract['status'] {
  if (contract.status === 'cancelled' || contract.status === 'expired') return contract.status
  const contractorSigned = hasSignature(contract, 'contractor')
  const clientSigned = hasSignature(contract, 'client')
  if (contractorSigned && clientSigned) return 'signed'
  if (contractorSigned || clientSigned) return 'partially_signed'
  if (contract.signingToken) return 'awaiting_signature'
  if (contract.sentAt) return 'sent'
  return contract.status
}

export function applySignatureToContract(
  contract: Contract,
  signature: Contract['signatures'][0]
): Contract {
  const signatures = [
    ...contract.signatures.filter((s) => s.role !== signature.role),
    signature,
  ]
  const updated = {
    ...contract,
    signatures,
    updatedAt: new Date().toISOString(),
  }
  const status = deriveContractStatus(updated)
  return {
    ...updated,
    status,
    signedAt: status === 'signed' ? signature.signedAt : contract.signedAt,
  }
}
