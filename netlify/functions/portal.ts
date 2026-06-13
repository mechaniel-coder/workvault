import type { Config, Context } from '@netlify/functions'
import { getStore } from '@netlify/blobs'
import { getUser } from '@netlify/identity'

interface PortalRecord {
  clientName: string
  contractorName: string
  invoices: { number: string; title: string; total: number; status: string; dueDate: string; currency: string }[]
  contracts: { number: string; title: string; status: string; value: number; currency: string }[]
  updatedAt: string
  ownerId: string
}

export default async (req: Request, context: Context) => {
  const store = getStore({ name: 'workvault-portals', consistency: 'strong' })
  const { token } = context.params

  if (!token) {
    return new Response(JSON.stringify({ error: 'Missing token' }), { status: 400 })
  }

  const key = `portal/${token}`

  if (req.method === 'GET') {
    const record = (await store.get(key, { type: 'json' })) as PortalRecord | null
    if (!record) {
      return new Response(JSON.stringify({ error: 'Portal not found' }), { status: 404 })
    }
    return Response.json({
      clientName: record.clientName,
      contractorName: record.contractorName,
      invoices: record.invoices,
      contracts: record.contracts,
      updatedAt: record.updatedAt,
    })
  }

  if (req.method === 'POST') {
    const user = getUser(req)
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
    }

    const body = (await req.json()) as Omit<PortalRecord, 'ownerId' | 'updatedAt'>
    const record: PortalRecord = {
      ...body,
      ownerId: user.sub,
      updatedAt: new Date().toISOString(),
    }
    await store.setJSON(key, record)
    return Response.json({ ok: true, updatedAt: record.updatedAt })
  }

  return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 })
}

export const config: Config = {
  path: '/api/portal/:token',
}
