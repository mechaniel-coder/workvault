import type { Config, Context } from '@netlify/functions'
import { getStore } from '@netlify/blobs'
import { getUser } from '@netlify/identity'

export default async (req: Request, context: Context) => {
  const store = getStore({ name: 'workvault-guest-invites', consistency: 'strong' })
  const { token } = context.params

  if (!token) {
    return new Response(JSON.stringify({ error: 'Missing token' }), { status: 400 })
  }

  const key = `guest/${token}`

  if (req.method === 'GET') {
    const record = await store.get(key, { type: 'json' })
    if (!record) {
      return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 })
    }
    return Response.json(record)
  }

  if (req.method === 'PUT') {
    const user = getUser(req)
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
    }
    const body = await req.json()
    await store.setJSON(key, { ...body, ownerId: user.sub, updatedAt: new Date().toISOString() })
    return Response.json({ ok: true })
  }

  return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 })
}

export const config: Config = {
  path: '/api/guest-invite/:token',
}
