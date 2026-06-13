import type { AppState, Client, ClientAppCloseOutcome, ClientHubDeliverableFile } from './types'
import { computeInvoiceStatus } from './utils'

export type ClientClosureReadiness = {
  clientId: string
  clientName: string
  hasClientApp: boolean
  projectsComplete: boolean
  allInvoicesPaid: boolean
  clientPaidUp: boolean
  hasOutstandingInvoices: boolean
  outstandingInvoiceCount: number
  taxDocsSavedLocally: boolean
  readyToArchive: boolean
  /** True when client paid everything — deliverables handoff runs on archive */
  shouldHandoffDeliverables: boolean
  projectCount: number
  paidProjectCount: number
}

export function evaluateClientClosure(state: AppState, clientId: string): ClientClosureReadiness {
  const client = state.clients.find((c) => c.id === clientId)
  const projects = state.projects.filter((p) => p.clientId === clientId)
  const invoices = state.invoices.filter((i) => i.clientId === clientId)

  const projectsComplete = projects.length === 0 || projects.every((p) => p.stage === 'paid')
  const paidProjectCount = projects.filter((p) => p.stage === 'paid').length

  const activeInvoices = invoices.filter((i) => i.status !== 'cancelled')
  const hasOutstandingInvoices = activeInvoices.some((i) => {
    const status = computeInvoiceStatus(i)
    return status === 'sent' || status === 'overdue' || status === 'draft'
  })
  const allInvoicesPaid = activeInvoices.length === 0
    || activeInvoices.every((i) => computeInvoiceStatus(i) === 'paid')
  const clientPaidUp = allInvoicesPaid && !hasOutstandingInvoices
  const outstandingInvoiceCount = activeInvoices.filter((i) => {
    const s = computeInvoiceStatus(i)
    return s === 'sent' || s === 'overdue'
  }).length

  const taxDocsSavedLocally = !!client?.appLifecycle?.taxDocsSavedLocallyAt
  const readyToArchive = projectsComplete && taxDocsSavedLocally

  return {
    clientId,
    clientName: client?.name || 'Client',
    hasClientApp: !!client?.clientAppToken && client.appLifecycle.status === 'active',
    projectsComplete,
    allInvoicesPaid,
    clientPaidUp,
    hasOutstandingInvoices,
    outstandingInvoiceCount,
    taxDocsSavedLocally,
    readyToArchive,
    shouldHandoffDeliverables: clientPaidUp,
    projectCount: projects.length,
    paidProjectCount,
  }
}

export function collectClientDeliverableLinks(state: AppState, clientId: string): {
  files: ClientHubDeliverableFile[]
  folderUrls: string[]
} {
  const projectIds = new Set(state.projects.filter((p) => p.clientId === clientId).map((p) => p.id))
  const folderUrls = state.cloudStorageMeta.projectFolders
    .filter((f) => projectIds.has(f.projectId))
    .map((f) => f.folderUrl)

  const files: ClientHubDeliverableFile[] = []
  for (const projectId of projectIds) {
    const cached = state.cloudStorageMeta.fileCache[projectId] || []
    for (const file of cached) {
      files.push({
        name: file.name,
        url: file.url,
        mimeType: file.mimeType,
        modifiedAt: file.modifiedAt,
      })
    }
  }

  return { files, folderUrls: [...new Set(folderUrls)] }
}

export function buildClientArchiveExport(state: AppState, clientId: string): Blob {
  const payload = {
    exportedAt: new Date().toISOString(),
    client: state.clients.find((c) => c.id === clientId),
    projects: state.projects.filter((p) => p.clientId === clientId),
    contracts: state.contracts.filter((c) => c.clientId === clientId),
    invoices: state.invoices.filter((i) => i.clientId === clientId),
    proposals: state.proposals.filter((p) => p.clientId === clientId),
    scopeEntries: state.scopeEntries.filter((e) => e.clientId === clientId),
    deliverables: collectClientDeliverableLinks(state, clientId),
  }
  return new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
}

export function downloadClientArchive(state: AppState, client: Client): void {
  const blob = buildClientArchiveExport(state, client.id)
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `workvault-${client.name.replace(/\s+/g, '-').toLowerCase()}-archive.json`
  a.click()
  URL.revokeObjectURL(url)
}

export function closureMessage(outcome: ClientAppCloseOutcome, contractorName: string): string {
  if (outcome === 'paid_complete') {
    return `Thank you for working with ${contractorName}. Your project is complete — final deliverables are linked below. This workspace has been removed from your device.`
  }
  return `This project workspace with ${contractorName} has been closed. Access is no longer available.`
}
