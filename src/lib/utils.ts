import type { AppState, Contract } from './types'
import {
  DEFAULT_PROFILE, DEFAULT_TAX_SETTINGS, DEFAULT_INTEGRATIONS, DEFAULT_EMAIL_TEMPLATES,
  DEFAULT_DEMO_SETTINGS, DEFAULT_DEMO_PROJECT_TRANSFER, DEFAULT_CLIENT_ROOM_CONFIG,
  DEFAULT_CURSOR_CLI, DEFAULT_INTEGRATION_CREDENTIALS, DEFAULT_CALENDAR_SYNC_META, DEFAULT_TAX1099_SETTINGS,
  DEFAULT_BOOKKEEPING_SYNC_META, DEFAULT_SCHEDULING_META, DEFAULT_PLAID_SYNC_META,
} from './types'
import { defaultSubcontractorTaxFields } from './tax-1099'

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
    subcontractorPayments: [],
    form1099Records: [],
    tax1099Settings: { ...DEFAULT_TAX1099_SETTINGS },
    emailTemplates: seedEmailTemplates(),
    availabilityBlocks: [],
    milestones: [],
    taxSettings: { ...DEFAULT_TAX_SETTINGS },
    integrations: { ...DEFAULT_INTEGRATIONS },
    integrationCredentials: { ...DEFAULT_INTEGRATION_CREDENTIALS },
    calendarSyncMeta: { ...DEFAULT_CALENDAR_SYNC_META },
    bookkeepingSyncMeta: { ...DEFAULT_BOOKKEEPING_SYNC_META },
    schedulingMeta: { ...DEFAULT_SCHEDULING_META },
    plaidSyncMeta: { ...DEFAULT_PLAID_SYNC_META },
    bankTransactions: [],
    gmailInboxCache: [],
    activeTimer: null,
    syncMeta: { lastSyncedAt: null, autoSync: false },
    demoSettings: { ...DEFAULT_DEMO_SETTINGS },
    teamMembers: [],
    clientGuestInvites: [],
    cursorCli: structuredClone(DEFAULT_CURSOR_CLI),
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
        clientFileAccess: c.clientFileAccess ?? 'none',
      })),
      invoices: (parsed.invoices || []).map((inv) => ({
        ...inv,
        paymentMethodIds: inv.paymentMethodIds || [],
        paymentInstructions: inv.paymentInstructions || '',
        stripeCheckoutUrl: inv.stripeCheckoutUrl ?? null,
        stripeSessionId: inv.stripeSessionId ?? null,
        paymentLinks: inv.paymentLinks || (
          inv.stripeCheckoutUrl
            ? [{
              processor: 'stripe' as const,
              url: inv.stripeCheckoutUrl,
              externalId: inv.stripeSessionId ?? null,
              createdAt: inv.sentAt || inv.createdAt,
            }]
            : []
        ),
      })),
      clients: (parsed.clients || []).map((c) => ({
        ...c,
        portalToken: c.portalToken ?? null,
        clientAppToken: c.clientAppToken ?? null,
      })),
      projects: parsed.projects || [],
      proposals: parsed.proposals || [],
      expenses: parsed.expenses || [],
      recurringInvoices: parsed.recurringInvoices || [],
      scopeEntries: parsed.scopeEntries || [],
      vaultDocuments: parsed.vaultDocuments || [],
      subcontractors: (parsed.subcontractors || []).map((s) => ({
        ...defaultSubcontractorTaxFields(),
        ...s,
        w9OnFile: s.w9OnFile ?? false,
        w9ReceivedAt: s.w9ReceivedAt ?? null,
        requires1099: s.requires1099 ?? true,
        entityType: s.entityType ?? 'individual',
      })),
      subcontractorPayments: parsed.subcontractorPayments || [],
      form1099Records: parsed.form1099Records || [],
      tax1099Settings: { ...DEFAULT_TAX1099_SETTINGS, ...parsed.tax1099Settings },
      emailTemplates: parsed.emailTemplates?.length ? parsed.emailTemplates : seedEmailTemplates(),
      availabilityBlocks: parsed.availabilityBlocks || [],
      milestones: parsed.milestones || [],
      taxSettings: { ...DEFAULT_TAX_SETTINGS, ...parsed.taxSettings },
      integrations: { ...DEFAULT_INTEGRATIONS, ...parsed.integrations },
      integrationCredentials: {
        ...DEFAULT_INTEGRATION_CREDENTIALS,
        ...parsed.integrationCredentials,
        emailFrom: parsed.integrationCredentials?.emailFrom || parsed.profile?.email || '',
        emailFromName: parsed.integrationCredentials?.emailFromName || parsed.profile?.name || '',
      },
      calendarSyncMeta: {
        ...DEFAULT_CALENDAR_SYNC_META,
        ...parsed.calendarSyncMeta,
        eventMap: parsed.calendarSyncMeta?.eventMap || {},
      },
      bookkeepingSyncMeta: {
        ...DEFAULT_BOOKKEEPING_SYNC_META,
        ...parsed.bookkeepingSyncMeta,
        quickbooksCustomerMap: parsed.bookkeepingSyncMeta?.quickbooksCustomerMap || {},
        quickbooksInvoiceMap: parsed.bookkeepingSyncMeta?.quickbooksInvoiceMap || {},
        quickbooksExpenseMap: parsed.bookkeepingSyncMeta?.quickbooksExpenseMap || {},
        xeroContactMap: parsed.bookkeepingSyncMeta?.xeroContactMap || {},
        xeroInvoiceMap: parsed.bookkeepingSyncMeta?.xeroInvoiceMap || {},
        xeroExpenseMap: parsed.bookkeepingSyncMeta?.xeroExpenseMap || {},
      },
      schedulingMeta: { ...DEFAULT_SCHEDULING_META, ...parsed.schedulingMeta },
      plaidSyncMeta: { ...DEFAULT_PLAID_SYNC_META, ...parsed.plaidSyncMeta },
      bankTransactions: parsed.bankTransactions || [],
      gmailInboxCache: parsed.gmailInboxCache || [],
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
      teamMembers: (parsed.teamMembers || []).map((m) => ({
        ...m,
        cursorCliAccess: m.cursorCliAccess ?? false,
      })),
      clientGuestInvites: parsed.clientGuestInvites || [],
      cursorCli: {
        settings: { ...DEFAULT_CURSOR_CLI.settings, ...parsed.cursorCli?.settings },
        workflows: parsed.cursorCli?.workflows?.length
          ? parsed.cursorCli.workflows
          : DEFAULT_CURSOR_CLI.workflows,
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
