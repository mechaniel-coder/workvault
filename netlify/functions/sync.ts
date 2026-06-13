import type { Config, Context } from '@netlify/functions'
import { getStore } from '@netlify/blobs'
import { getUser } from '@netlify/identity'

export default async (req: Request, _context: Context) => {
  const user = await getUser()
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const store = getStore({ name: 'workvault-sync', consistency: 'strong' })
  const key = `users/${user.id}/state`

  if (req.method === 'HEAD') {
    return new Response(null, { status: 200 })
  }

  if (req.method === 'GET') {
    const record = await store.getWithMetadata(key, { type: 'json' }) as {
      data: { data: string; updatedAt: string } | null
      metadata: Record<string, string>
    } | null

    if (!record?.data) {
      return new Response(JSON.stringify({ error: 'Not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    return Response.json({
      data: record.data.data,
      syncedAt: record.data.updatedAt,
    })
  }

  if (req.method === 'PUT') {
    const body = await req.json() as { data: string; updatedAt: string }
    if (!body.data) {
      return new Response(JSON.stringify({ error: 'Missing data' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const updatedAt = body.updatedAt || new Date().toISOString()
    await store.setJSON(key, { data: body.data, updatedAt }, {
      metadata: { userId: user.id, email: user.email || '' },
    })

    return Response.json({ syncedAt: updatedAt })
  }

  return new Response('Method not allowed', { status: 405 })
}

export const config: Config = {
  path: '/api/sync',
}
