import type { Config, Context } from '@netlify/functions'
import { getStore } from '@netlify/blobs'
import { getUser } from '@netlify/identity'

interface ClientRoomConfig {
  versionLabel: string
  ndaRequired: boolean
  ndaText: string
  linkPassword: string | null
  watermarkText: string
  notifyClientEmail: string | null
  checklist: { id: string; label: string; required: boolean }[]
  guidedTourEnabled: boolean
  milestones: { id: string; title: string; status: string; date: string }[]
  hubWelcomeMessage: string
  clientAssetUploadEnabled: boolean
  availabilitySlots: { date: string; startTime: string; endTime: string; notes: string }[]
}

interface ClientRoomData {
  feedback: unknown[]
  signOff: unknown | null
  messages: unknown[]
  checklistProgress: { itemId: string; checked: boolean; checkedAt: string | null }[]
  auditLog: { type: string; detail: string; at: string }[]
  clientAssets: unknown[]
  survey: unknown | null
  ndaAcceptedAt: string | null
  ndaAcceptedName: string | null
}

interface ClientRoomRecord {
  contractorName: string
  clientName: string
  label: string
  allowDownloads: boolean
  config: ClientRoomConfig
  projectTransfer: unknown
  invoices: unknown[]
  contracts: unknown[]
  demoUrl: string | null
  ownerId: string
  enabled: boolean
}

const DEFAULT_CONFIG: ClientRoomConfig = {
  versionLabel: '',
  ndaRequired: false,
  ndaText: 'Confidential review materials.',
  linkPassword: null,
  watermarkText: 'Confidential — Client Review',
  notifyClientEmail: null,
  checklist: [],
  guidedTourEnabled: true,
  milestones: [],
  hubWelcomeMessage: '',
  clientAssetUploadEnabled: true,
  availabilitySlots: [],
}

const DEFAULT_DATA: ClientRoomData = {
  feedback: [],
  signOff: null,
  messages: [],
  checklistProgress: [],
  auditLog: [],
  clientAssets: [],
  survey: null,
  ndaAcceptedAt: null,
  ndaAcceptedName: null,
}

function dataKey(token: string) {
  return `client-room/${token}/data`
}

function recordKey(token: string) {
  return `client-room/${token}/meta`
}

export default async (req: Request, context: Context) => {
  const store = getStore({ name: 'workvault-client-rooms', consistency: 'strong' })
  const { token } = context.params

  if (!token) {
    return new Response(JSON.stringify({ error: 'Missing token' }), { status: 400 })
  }

  if (req.method === 'GET') {
    const meta = (await store.get(recordKey(token), { type: 'json' })) as ClientRoomRecord | null
    if (!meta || !meta.enabled) {
      return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 })
    }

    const data = (await store.get(dataKey(token), { type: 'json' })) as ClientRoomData | null

    return Response.json({
      token,
      contractorName: meta.contractorName,
      clientName: meta.clientName,
      label: meta.label,
      allowDownloads: meta.allowDownloads,
      config: meta.config || DEFAULT_CONFIG,
      data: data || DEFAULT_DATA,
      projectTransfer: meta.projectTransfer,
      invoices: meta.invoices || [],
      contracts: meta.contracts || [],
      demoUrl: meta.demoUrl,
    })
  }

  if (req.method === 'PUT') {
    const user = getUser(req)
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
    }

    const body = (await req.json()) as Record<string, unknown>
    const existing = (await store.get(recordKey(token), { type: 'json' })) as ClientRoomRecord | null

    const config = {
      ...DEFAULT_CONFIG,
      ...(body.config as ClientRoomConfig),
      availabilitySlots: (body.availabilitySlots as ClientRoomConfig['availabilitySlots']) ||
        (body.config as ClientRoomConfig)?.availabilitySlots || [],
    }

    const origin = new URL(req.url).origin

    const record: ClientRoomRecord = {
      contractorName: body.contractorName as string,
      clientName: body.clientName as string,
      label: body.label as string,
      allowDownloads: Boolean(body.allowDownloads),
      config,
      projectTransfer: body.projectTransfer,
      invoices: (body.invoices as unknown[]) || [],
      contracts: (body.contracts as unknown[]) || [],
      demoUrl: `${origin}/demo/${token}`,
      ownerId: user.sub,
      enabled: true,
    }

    await store.setJSON(recordKey(token), record)
    if (!existing) {
      await store.setJSON(dataKey(token), DEFAULT_DATA)
    }

    return Response.json({ ok: true })
  }

  if (req.method === 'POST') {
    const meta = (await store.get(recordKey(token), { type: 'json' })) as ClientRoomRecord | null
    if (!meta || !meta.enabled) {
      return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 })
    }

    const data: ClientRoomData = {
      ...DEFAULT_DATA,
      ...((await store.get(dataKey(token), { type: 'json' })) as ClientRoomData | null),
    }

    const body = (await req.json()) as { action: string; entry?: unknown; itemId?: string; checked?: boolean; name?: string }
    const now = new Date().toISOString()

    switch (body.action) {
      case 'audit':
        data.auditLog = [...data.auditLog.slice(-199), body.entry as ClientRoomData['auditLog'][0]]
        break
      case 'feedback':
        data.feedback = [body.entry, ...data.feedback]
        break
      case 'message':
        data.messages = [...data.messages, body.entry]
        break
      case 'signoff':
        data.signOff = body.entry
        data.auditLog = [...data.auditLog, { type: 'signoff', detail: (body.entry as { clientName: string }).clientName, at: now }]
        break
      case 'checklist':
        data.checklistProgress = [
          ...data.checklistProgress.filter((p) => p.itemId !== body.itemId),
          { itemId: body.itemId!, checked: Boolean(body.checked), checkedAt: body.checked ? now : null },
        ]
        break
      case 'survey':
        data.survey = body.entry
        data.auditLog = [...data.auditLog, { type: 'survey', detail: `Rating ${(body.entry as { rating: number }).rating}`, at: now }]
        break
      case 'nda':
        data.ndaAcceptedAt = now
        data.ndaAcceptedName = body.name || ''
        break
      case 'asset':
        data.clientAssets = [...data.clientAssets, { ...(body.entry as object), uploadedAt: now }]
        break
      default:
        return new Response(JSON.stringify({ error: 'Unknown action' }), { status: 400 })
    }

    await store.setJSON(dataKey(token), data)
    return Response.json({ data })
  }

  return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 })
}

export const config: Config = {
  path: '/api/client-room/:token',
}
