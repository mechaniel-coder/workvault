import type { Config, Context } from '@netlify/functions'
import { getStore } from '@netlify/blobs'
import { getUser } from '@netlify/identity'

interface DemoRecord {
  enabled: boolean
  expiresAt: string | null
  ownerId: string
}

function isExpired(expiresAt: string | null): boolean {
  if (!expiresAt) return false
  return new Date(expiresAt) < new Date()
}

async function assertDemoAccess(store: ReturnType<typeof getStore>, token: string) {
  const record = (await store.get(`demo/${token}`, { type: 'json' })) as DemoRecord | null
  if (!record || !record.enabled || isExpired(record.expiresAt)) {
    return null
  }
  return record
}

export default async (req: Request, context: Context) => {
  const demoStore = getStore({ name: 'workvault-demos', consistency: 'strong' })
  const assetStore = getStore({ name: 'workvault-demo-assets', consistency: 'strong' })
  const { token, fileId } = context.params

  if (!token) {
    return new Response(JSON.stringify({ error: 'Missing token' }), { status: 400 })
  }

  if (req.method === 'POST' && !fileId) {
    const user = getUser(req)
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
    }

    const record = (await demoStore.get(`demo/${token}`, { type: 'json' })) as DemoRecord | null
    if (!record || record.ownerId !== user.sub) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 })
    }

    const body = (await req.json()) as {
      fileId: string
      name: string
      mimeType: string
      size: number
      data: string
    }

    if (!body.fileId || !body.data) {
      return new Response(JSON.stringify({ error: 'Invalid payload' }), { status: 400 })
    }

    if (body.size > 50 * 1024 * 1024) {
      return new Response(JSON.stringify({ error: 'File too large (max 50MB)' }), { status: 413 })
    }

    const binary = Uint8Array.from(atob(body.data), (c) => c.charCodeAt(0))
    await assetStore.set(`demo/${token}/files/${body.fileId}`, binary, {
      metadata: { name: body.name, mimeType: body.mimeType, size: String(body.size) },
    })

    return Response.json({ ok: true, fileId: body.fileId })
  }

  if (req.method === 'GET' && fileId) {
    const record = await assertDemoAccess(demoStore, token)
    if (!record) {
      return new Response(JSON.stringify({ error: 'Demo not available' }), { status: 404 })
    }

    const blob = await assetStore.get(`demo/${token}/files/${fileId}`, { type: 'blob' })
    if (!blob) {
      return new Response(JSON.stringify({ error: 'File not found' }), { status: 404 })
    }

    const meta = await assetStore.getMetadata(`demo/${token}/files/${fileId}`)
    const mimeType = (meta?.metadata?.mimeType as string) || 'application/octet-stream'

    return new Response(blob, {
      headers: {
        'Content-Type': mimeType,
        'Content-Disposition': 'inline',
        'Cache-Control': 'private, no-store, no-cache',
        'X-Content-Type-Options': 'nosniff',
      },
    })
  }

  if (req.method === 'DELETE' && fileId) {
    const user = getUser(req)
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
    }

    const record = (await demoStore.get(`demo/${token}`, { type: 'json' })) as DemoRecord | null
    if (!record || record.ownerId !== user.sub) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 })
    }

    await assetStore.delete(`demo/${token}/files/${fileId}`)
    return Response.json({ ok: true })
  }

  return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 })
}

export const config: Config = {
  path: '/api/demo/:token/assets/:fileId?',
}
