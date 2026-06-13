import type { Config, Context } from '@netlify/functions'
import { getStore } from '@netlify/blobs'
import { getUser } from '@netlify/identity'

export default async (req: Request, context: Context) => {
  const store = getStore({ name: 'workvault-client-apps', consistency: 'strong' })
  const { token } = context.params

  if (!token) {
    return new Response(JSON.stringify({ error: 'Missing token' }), { status: 400 })
  }

  const key = `client-app/${token}`

  if (req.method === 'GET') {
    const session = await store.get(key, { type: 'json' })
    if (!session) {
      return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 })
    }
    return Response.json(session)
  }

  if (req.method === 'PUT') {
    const user = getUser(req)
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
    }

    const body = await req.json()
    const record = {
      ...body,
      enabled: true,
      token,
      ownerId: user.sub,
      publishedAt: new Date().toISOString(),
    }
    await store.setJSON(key, record)
    return Response.json({ ok: true })
  }

  if (req.method === 'DELETE') {
    const user = getUser(req)
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
    }
    await store.delete(key)
    return Response.json({ ok: true })
  }

  return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 })
}

export const config: Config = {
  path: '/api/client-app/:token',
}
