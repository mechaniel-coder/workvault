import type {
  AppState, ClientAuditEntry, ClientFeedbackEntry, ClientHubSession,
  ClientMessage, ClientRoomConfig, ClientRoomData, ClientSignOff, ClientSurveyResponse,
  DemoSettings,
} from './types'
import { DEFAULT_CLIENT_ROOM_DATA } from './types'
import { getPaymentLink } from './payments'

const LOCAL_DATA_PREFIX = 'workvault-client-room-data-'

export function getClientHubUrl(token: string): string {
  return `${window.location.origin}/hub/${token}`
}

export function getDemoUrl(token: string): string {
  return `${window.location.origin}/demo/${token}`
}

function loadLocalData(token: string): ClientRoomData {
  try {
    const raw = localStorage.getItem(`${LOCAL_DATA_PREFIX}${token}`)
    if (!raw) return { ...DEFAULT_CLIENT_ROOM_DATA, checklistProgress: [], auditLog: [] }
    return { ...DEFAULT_CLIENT_ROOM_DATA, ...JSON.parse(raw) }
  } catch {
    return { ...DEFAULT_CLIENT_ROOM_DATA }
  }
}

function saveLocalData(token: string, data: ClientRoomData): void {
  localStorage.setItem(`${LOCAL_DATA_PREFIX}${token}`, JSON.stringify(data))
}

function buildSessionFromLocal(token: string, state: AppState): ClientHubSession | null {
  const { demoSettings } = state
  if (!demoSettings.enabled || demoSettings.token !== token) return null

  const client = state.clients[0]
  const invoices = state.invoices.slice(0, 5).map((inv) => ({
    number: inv.number,
    title: inv.lineItems[0]?.description || 'Invoice',
    total: inv.total,
    status: inv.status,
    dueDate: inv.dueDate,
    currency: state.profile.defaultCurrency,
    paymentLinks: state.profile.paymentMethods
      .filter((m) => m.enabled)
      .map((m) => ({ label: m.label, url: getPaymentLink(m) || m.details }))
      .filter((l) => l.url),
  }))

  return {
    token,
    contractorName: state.profile.name || 'Your contractor',
    clientName: client?.name || demoSettings.label,
    label: demoSettings.label,
    allowDownloads: demoSettings.allowDownloads,
    config: demoSettings.clientRoom,
    data: loadLocalData(token),
    projectTransfer: demoSettings.projectTransfer,
    invoices,
    contracts: state.contracts.slice(0, 5).map((c) => ({
      number: c.number,
      title: c.title,
      status: c.status,
      value: c.value,
      currency: state.profile.defaultCurrency,
    })),
    demoUrl: getDemoUrl(token),
  }
}

export async function fetchClientHubSession(token: string): Promise<ClientHubSession | null> {
  try {
    const res = await fetch(`/api/client-room/${token}`)
    if (!res.ok) return null
    return (await res.json()) as ClientHubSession
  } catch {
    return null
  }
}

export function fetchClientHubSessionLocal(token: string, state: AppState): ClientHubSession | null {
  return buildSessionFromLocal(token, state)
}

export async function resolveClientHubSession(token: string, state?: AppState): Promise<ClientHubSession | null> {
  const remote = await fetchClientHubSession(token)
  if (remote) return remote
  if (state) return buildSessionFromLocal(token, state)
  try {
    const { loadState } = await import('./utils')
    return buildSessionFromLocal(token, loadState())
  } catch {
    return null
  }
}

type ClientAction =
  | { action: 'audit'; entry: ClientAuditEntry }
  | { action: 'feedback'; entry: ClientFeedbackEntry }
  | { action: 'message'; entry: ClientMessage }
  | { action: 'signoff'; entry: ClientSignOff }
  | { action: 'checklist'; itemId: string; checked: boolean }
  | { action: 'survey'; entry: ClientSurveyResponse }
  | { action: 'nda'; name: string }
  | { action: 'asset'; entry: { id: string; name: string; size: number; mimeType: string } }

async function postAction(token: string, body: ClientAction): Promise<ClientRoomData | null> {
  try {
    const res = await fetch(`/api/client-room/${token}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (!res.ok) return null
    const json = (await res.json()) as { data: ClientRoomData }
    return json.data
  } catch {
    return null
  }
}

function applyLocalAction(token: string, body: ClientAction): ClientRoomData {
  const data = loadLocalData(token)
  const now = new Date().toISOString()

  switch (body.action) {
    case 'audit':
      data.auditLog = [...data.auditLog.slice(-199), body.entry]
      break
    case 'feedback':
      data.feedback = [body.entry, ...data.feedback]
      break
    case 'message':
      data.messages = [...data.messages, body.entry]
      break
    case 'signoff':
      data.signOff = body.entry
      data.auditLog = [...data.auditLog, { type: 'signoff', detail: body.entry.clientName, at: now }]
      break
    case 'checklist': {
      const rest = data.checklistProgress.filter((p) => p.itemId !== body.itemId)
      data.checklistProgress = [...rest, { itemId: body.itemId, checked: body.checked, checkedAt: body.checked ? now : null }]
      break
    }
    case 'survey':
      data.survey = body.entry
      data.auditLog = [...data.auditLog, { type: 'survey', detail: `Rating ${body.entry.rating}`, at: now }]
      break
    case 'nda':
      data.ndaAcceptedAt = now
      data.ndaAcceptedName = body.name
      break
    case 'asset':
      data.clientAssets = [...data.clientAssets, { ...body.entry, uploadedAt: now }]
      break
  }

  saveLocalData(token, data)
  return data
}

export async function clientRoomAction(token: string, body: ClientAction): Promise<ClientRoomData> {
  const remote = await postAction(token, body)
  if (remote) return remote
  return applyLocalAction(token, body)
}

export async function publishClientRoomConfig(token: string, settings: DemoSettings, state: AppState): Promise<boolean> {
  try {
    const res = await fetch(`/api/client-room/${token}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        config: settings.clientRoom,
        allowDownloads: settings.allowDownloads,
        label: settings.label,
        contractorName: state.profile.name || 'WorkVault User',
        projectTransfer: settings.projectTransfer,
        clientName: settings.label,
        invoices: state.invoices.filter((i) => i.status !== 'cancelled').slice(0, 20).map((inv) => ({
          number: inv.number,
          title: inv.lineItems[0]?.description || 'Invoice',
          total: inv.total,
          status: inv.status,
          dueDate: inv.dueDate,
          currency: state.profile.defaultCurrency,
          paymentLinks: state.profile.paymentMethods
            .filter((m) => m.enabled)
            .map((m) => ({ label: m.label, url: getPaymentLink(m) || m.details }))
            .filter((l) => l.url),
        })),
        contracts: state.contracts.slice(0, 20).map((c) => ({
          number: c.number,
          title: c.title,
          status: c.status,
          value: c.value,
          currency: state.profile.defaultCurrency,
        })),
        availabilitySlots: state.availabilityBlocks.filter((b) => b.available).map((b) => ({
          date: b.date,
          startTime: b.startTime,
          endTime: b.endTime,
          notes: b.notes,
        })),
      }),
    })
    return res.ok
  } catch {
    return false
  }
}

export function notifyClientByEmail(email: string, subject: string, body: string): void {
  window.open(`mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`)
}

export function sendClientUpdateNotification(session: ClientHubSession, reason: string): void {
  const email = session.config.notifyClientEmail
  if (!email) return
  notifyClientByEmail(
    email,
    `${session.contractorName} — ${reason}`,
    `Hi,\n\n${session.contractorName} has updated your review room.\n\n${reason}\n\nOpen your hub: ${getClientHubUrl(session.token)}\n\nThank you.`
  )
}

export function syncClientRoomFromState(state: AppState): ClientRoomConfig {
  const { clientRoom } = state.demoSettings
  const milestones = state.milestones.length > 0
    ? state.milestones.map((m) => ({
        id: m.id,
        title: m.title,
        status: (m.completed ? 'done' : 'active') as 'done' | 'active' | 'upcoming',
        date: m.dueDate,
      }))
    : state.projects.slice(0, 5).map((p) => ({
        id: p.id,
        title: p.title,
        status: (p.stage === 'paid' ? 'done' : p.stage === 'active' ? 'active' : 'upcoming') as 'done' | 'active' | 'upcoming',
        date: p.dueDate,
      }))

  const availabilitySlots = state.availabilityBlocks
    .filter((b) => b.available)
    .map((b) => ({ date: b.date, startTime: b.startTime, endTime: b.endTime, notes: b.notes }))

  return { ...clientRoom, milestones, availabilitySlots }
}

export function verifyLinkPassword(config: ClientRoomConfig, password: string): boolean {
  if (!config.linkPassword) return true
  return config.linkPassword === password
}

export type { ClientRoomConfig, ClientRoomData }
