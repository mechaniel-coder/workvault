import type { Config, Context } from '@netlify/functions'
import { getStore } from '@netlify/blobs'
import { getUser } from '@netlify/identity'

interface DemoProjectTransferPayload {
  title: string
  description: string
  clientNotes: string
  appPreviewUrl: string | null
  deliverables: {
    id: string
    name: string
    size: number
    mimeType: string
    kind: string
    uploadedAt: string
    remote: boolean
  }[]
  updatedAt: string | null
}

interface DemoRecord {
  enabled: boolean
  mode: 'demo' | 'review'
  expiresAt: string | null
  contractorName: string
  label: string
  ownerId: string
  createdAt: string
  lastAccessedAt: string | null
  accessCount: number
  projectTransfer: DemoProjectTransferPayload
  allowDownloads: boolean
}

function isExpired(expiresAt: string | null): boolean {
  if (!expiresAt) return false
  return new Date(expiresAt) < new Date()
}

export default async (req: Request, context: Context) => {
  const store = getStore({ name: 'workvault-demos', consistency: 'strong' })
  const { token } = context.params

  if (!token) {
    return new Response(JSON.stringify({ error: 'Missing token' }), { status: 400 })
  }

  const key = `demo/${token}`

  if (req.method === 'GET') {
    const record = (await store.get(key, { type: 'json' })) as DemoRecord | null
    if (!record || !record.enabled || isExpired(record.expiresAt)) {
      return new Response(JSON.stringify({ error: 'Demo session not available' }), { status: 404 })
    }

    const updated: DemoRecord = {
      ...record,
      lastAccessedAt: new Date().toISOString(),
      accessCount: record.accessCount + 1,
    }
    await store.setJSON(key, updated)

    return Response.json({
      enabled: updated.enabled,
      mode: updated.mode,
      expiresAt: updated.expiresAt,
      contractorName: updated.contractorName,
      label: updated.label,
      lastAccessedAt: updated.lastAccessedAt,
      accessCount: updated.accessCount,
      projectTransfer: updated.projectTransfer || {
        title: '',
        description: '',
        clientNotes: '',
        appPreviewUrl: null,
        deliverables: [],
        updatedAt: null,
      },
      allowDownloads: updated.allowDownloads ?? false,
    })
  }

  if (req.method === 'POST') {
    const user = getUser(req)
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
    }

    const body = (await req.json()) as Omit<DemoRecord, 'ownerId' | 'createdAt' | 'lastAccessedAt' | 'accessCount'>

    const existing = (await store.get(key, { type: 'json' })) as DemoRecord | null

    const record: DemoRecord = {
      enabled: body.enabled,
      mode: body.mode,
      expiresAt: body.expiresAt,
      contractorName: body.contractorName,
      label: body.label,
      projectTransfer: body.projectTransfer || existing?.projectTransfer || {
        title: '',
        description: '',
        clientNotes: '',
        appPreviewUrl: null,
        deliverables: [],
        updatedAt: null,
      },
      allowDownloads: body.allowDownloads ?? existing?.allowDownloads ?? false,
      ownerId: user.sub,
      createdAt: existing?.createdAt || new Date().toISOString(),
      lastAccessedAt: existing?.lastAccessedAt || null,
      accessCount: existing?.accessCount || 0,
    }
    await store.setJSON(key, record)
    return Response.json({ ok: true })
  }

  if (req.method === 'DELETE') {
    const user = getUser(req)
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
    }

    const record = (await store.get(key, { type: 'json' })) as DemoRecord | null
    if (record && record.ownerId !== user.sub) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 })
    }

    await store.delete(key)
    return Response.json({ ok: true })
  }

  return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 })
}

export const config: Config = {
  path: '/api/demo/:token',
}
