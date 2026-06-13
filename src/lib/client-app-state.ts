import type { AppState } from './types'
import {
  DEFAULT_DEMO_SETTINGS, DEFAULT_INTEGRATIONS, DEFAULT_TAX_SETTINGS,
  DEFAULT_EMAIL_TEMPLATES, DEFAULT_CLIENT_ROOM_CONFIG, DEFAULT_TAX1099_SETTINGS,
} from './types'
import { createInitialState } from './utils'
import { syncClientRoomFromState } from './client-room'
import { fileAccessFlags, resolveClientFileAccess } from './client-file-access'
import { DEFAULT_DEMO_PROJECT_TRANSFER } from './types'

function seedEmailTemplates() {
  const now = new Date().toISOString()
  return DEFAULT_EMAIL_TEMPLATES.map((t) => ({ ...t, id: crypto.randomUUID(), createdAt: now }))
}

/** Build an isolated WorkVault state scoped to one client relationship. */
export function buildClientAppState(clientId: string, state: AppState): AppState {
  const client = state.clients.find((c) => c.id === clientId)
  if (!client) return createInitialState()

  const projectIds = new Set(state.projects.filter((p) => p.clientId === clientId).map((p) => p.id))
  const clientRoom = syncClientRoomFromState(state)
  const fileAccess = resolveClientFileAccess(state.contracts, clientId)
  const flags = fileAccessFlags(fileAccess)
  const transfer = flags.canViewFiles
    ? state.demoSettings.projectTransfer
    : { ...DEFAULT_DEMO_PROJECT_TRANSFER }
  const label = transfer.title || client.company || client.name || 'Your Project'

  return {
    ...createInitialState(),
    profile: {
      name: client.name,
      email: client.email,
      phone: client.phone,
      address: client.address,
      city: '',
      state: '',
      zip: '',
      taxId: '',
      website: state.profile.website,
      logoUrl: state.profile.logoUrl,
      defaultHourlyRate: 0,
      defaultCurrency: state.profile.defaultCurrency,
      invoicePrefix: state.profile.invoicePrefix,
      contractPrefix: state.profile.contractPrefix,
      paymentMethods: state.profile.paymentMethods.filter((m) => m.enabled),
      defaultPaymentInstructions: state.profile.defaultPaymentInstructions,
      industryId: state.profile.industryId,
    },
    clients: [{ ...client }],
    contracts: state.contracts.filter((c) => c.clientId === clientId),
    invoices: state.invoices.filter((i) => i.clientId === clientId),
    proposals: state.proposals.filter((p) => p.clientId === clientId),
    projects: state.projects.filter((p) => p.clientId === clientId),
    milestones: state.milestones.filter((m) => projectIds.has(m.projectId)),
    scopeEntries: state.scopeEntries.filter((s) => s.clientId === clientId),
    vaultDocuments: state.vaultDocuments.filter(
      (d) => d.clientId === clientId || d.type === 'client_asset'
    ),
    workRecords: state.workRecords.filter((w) => w.clientId === clientId),
    hostedProjects: state.hostedProjects.filter((h) => h.clientId === clientId),
    timeEntries: [],
    licenses: [],
    workProtections: [],
    expenses: [],
    recurringInvoices: [],
    subcontractors: [],
    subcontractorPayments: [],
    form1099Records: [],
    tax1099Settings: { ...DEFAULT_TAX1099_SETTINGS },
    availabilityBlocks: state.availabilityBlocks.filter((b) => b.available),
    emailTemplates: seedEmailTemplates(),
    taxSettings: { ...DEFAULT_TAX_SETTINGS },
    integrations: { ...DEFAULT_INTEGRATIONS },
    activeTimer: null,
    syncMeta: { lastSyncedAt: null, autoSync: false, setupComplete: false },
    demoSettings: {
      ...DEFAULT_DEMO_SETTINGS,
      enabled: true,
      token: client.clientAppToken,
      label,
      projectTransfer: { ...transfer },
      allowDownloads: flags.allowDownloads,
      clientRoom: {
        ...DEFAULT_CLIENT_ROOM_CONFIG,
        ...clientRoom,
        clientAssetUploadEnabled: flags.clientAssetUploadEnabled,
      },
    },
  }
}

export function buildClientAppSession(
  token: string,
  clientId: string,
  state: AppState
): import('./types').ClientAppSessionPublic {
  const client = state.clients.find((c) => c.id === clientId)!
  const appState = buildClientAppState(clientId, state)
  const fileAccess = resolveClientFileAccess(state.contracts, clientId)
  const flags = fileAccessFlags(fileAccess)
  const transfer = flags.canViewFiles
    ? state.demoSettings.projectTransfer
    : { ...DEFAULT_DEMO_PROJECT_TRANSFER }
  const label = transfer.title || client.company || client.name || 'Your Project'

  return {
    enabled: true,
    token,
    clientId,
    clientName: client.name,
    clientEmail: client.email,
    clientCompany: client.company,
    contractorName: state.profile.name || 'Your contractor',
    contractorEmail: state.profile.email,
    contractorLogo: state.profile.logoUrl,
    label,
    allowDownloads: flags.allowDownloads,
    clientFileAccess: fileAccess,
    projectTransfer: { ...transfer },
    clientRoom: appState.demoSettings.clientRoom,
    guestInvites: state.clientGuestInvites.filter((i) => i.clientId === clientId && i.enabled),
    publishedAt: new Date().toISOString(),
    appState,
  }
}
