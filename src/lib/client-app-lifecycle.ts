import type {
  AppState, Client, ClientAppCloseOutcome, ClientAppClosureRecord, ClientAppSessionPublic,
} from './types'
import {
  collectClientDeliverableLinks, closureMessage, downloadClientArchive,
} from './client-closure'
import { buildClientDeliverables } from './cloud-storage'
import { deliverEmail } from './integrations-api'
import { saveLocalClientAppSession } from './client-app'
import { downloadClientWorkspaceBundle } from './client-app-bundle'

const LOCAL_ROOM_PREFIX = 'workvault-client-room-data-'

function clearLocalClientData(token: string): void {
  localStorage.removeItem(`${LOCAL_ROOM_PREFIX}${token}`)
}

function buildClosureTombstone(
  token: string,
  client: Client,
  state: AppState,
  outcome: ClientAppCloseOutcome,
  deliverables: ClientAppClosureRecord['deliverables'],
  folderUrls: string[],
): ClientAppSessionPublic {
  const closure: ClientAppClosureRecord = {
    outcome,
    closedAt: new Date().toISOString(),
    clientName: client.name,
    contractorName: state.profile.name || 'Your contractor',
    message: closureMessage(outcome, state.profile.name || 'Your contractor'),
    deliverables,
    folderUrls,
  }

  return {
    enabled: false,
    token,
    clientId: client.id,
    clientName: client.name,
    clientEmail: client.email,
    clientCompany: client.company,
    contractorName: state.profile.name || 'Contractor',
    contractorEmail: state.profile.email,
    contractorLogo: state.profile.logoUrl,
    label: `${client.name} — Archived`,
    allowDownloads: outcome === 'paid_complete',
    projectTransfer: state.demoSettings.projectTransfer,
    clientRoom: state.demoSettings.clientRoom,
    publishedAt: new Date().toISOString(),
    clientFileAccess: 'none',
    guestInvites: [],
    appState: state,
    closure,
  }
}

async function emailDeliverableHandoff(
  state: AppState,
  client: Client,
  files: ClientAppClosureRecord['deliverables'],
  folderUrls: string[],
): Promise<{ ok: boolean; error?: string }> {
  if (!client.email) return { ok: false, error: 'No client email on file' }

  const lines = [
    `Hi ${client.name},`,
    '',
    `Your project with ${state.profile.name || 'us'} is complete. Here are your final deliverables:`,
    '',
  ]

  if (folderUrls.length > 0) {
    lines.push('Shared folders:')
    folderUrls.forEach((url) => lines.push(`  ${url}`))
    lines.push('')
  }

  if (files.length > 0) {
    lines.push('Files:')
    files.forEach((f) => lines.push(`  ${f.name}: ${f.url}`))
    lines.push('')
  }

  lines.push(
    'Your WorkVault client workspace has been removed. Save anything you need from the links above.',
    '',
    `Best regards,`,
    state.profile.name || 'WorkVault',
  )

  return deliverEmail(
    state,
    client.email,
    `Final deliverables — ${state.profile.name || 'Project complete'}`,
    lines.join('\n'),
  )
}

export type CloseClientAppResult = {
  ok: boolean
  outcome: ClientAppCloseOutcome
  handoffAttempted: boolean
  emailSent: boolean
  deliverableCount: number
  error?: string
}

/**
 * Archive the client WorkVault app. Local state is updated first (local-first).
 * Paid clients receive deliverable links; unpaid clients get immediate removal.
 */
export async function closeClientApp(
  token: string,
  client: Client,
  state: AppState,
  options?: { skipLocalArchiveDownload?: boolean },
): Promise<CloseClientAppResult> {
  const activeInvoices = state.invoices.filter(
    (i) => i.clientId === client.id && i.status !== 'cancelled',
  )
  const clientPaidUp = activeInvoices.length === 0
    || activeInvoices.every((i) => i.status === 'paid')
  const outcome: ClientAppCloseOutcome = clientPaidUp ? 'paid_complete' : 'unpaid'

  if (!options?.skipLocalArchiveDownload) {
    downloadClientArchive(state, client)
  }

  let deliverables: ClientAppClosureRecord['deliverables'] = []
  let folderUrls: string[] = []
  let emailSent = false
  let handoffAttempted = false

  if (outcome === 'paid_complete') {
    handoffAttempted = true
    const collected = collectClientDeliverableLinks(state, client.id)
    const hubDeliverables = buildClientDeliverables(state, client.id)
    deliverables = [
      ...collected.files,
      ...hubDeliverables.flatMap((g) => g.files),
    ]
    folderUrls = collected.folderUrls

    const emailResult = await emailDeliverableHandoff(state, client, deliverables, folderUrls)
    emailSent = emailResult.ok
  }

  const tombstone = buildClosureTombstone(token, client, state, outcome, deliverables, folderUrls)
  saveLocalClientAppSession(tombstone)
  if (outcome === 'paid_complete') {
    downloadClientWorkspaceBundle(tombstone)
  }
  clearLocalClientData(token)

  try {
    await fetch(`/api/client-app/${token}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tombstone),
    })
  } catch {
    // local tombstone remains — local-first
  }

  for (const invite of state.clientGuestInvites.filter((g) => g.clientAppToken === token)) {
    try {
      await fetch('/api/guest-invite', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...invite, enabled: false }),
      })
    } catch {
      // ignore
    }
  }

  return {
    ok: true,
    outcome,
    handoffAttempted,
    emailSent,
    deliverableCount: deliverables.length,
  }
}

export function isClientAppArchived(session: ClientAppSessionPublic | null): boolean {
  return !!session && !session.enabled && !!session.closure
}

export function isClientAppActive(client: Client | undefined): boolean {
  return !!client?.clientAppToken && client.appLifecycle.status === 'active'
}
