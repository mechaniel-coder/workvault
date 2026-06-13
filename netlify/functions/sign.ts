import type { Config, Context } from '@netlify/functions'
import { getStore } from '@netlify/blobs'
import { getUser } from '@netlify/identity'

interface SigningRecord {
  contractId: string
  number: string
  title: string
  content: string
  clientName: string
  contractorName: string
  value: number
  currency: string
  contractorSignature: { name: string; signatureImage: string; signedAt: string } | null
  clientSignature: { name: string; signatureImage: string; signedAt: string } | null
  createdAt: string
  ownerId: string
}

export default async (req: Request, context: Context) => {
  const store = getStore({ name: 'workvault-signatures', consistency: 'strong' })
  const { token } = context.params

  if (!token) {
    return new Response(JSON.stringify({ error: 'Missing token' }), { status: 400 })
  }

  const key = `sign/${token}`

  if (req.method === 'GET') {
    const record = await store.get(key, { type: 'json' }) as SigningRecord | null
    if (!record) {
      return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 })
    }

    return Response.json({
      number: record.number,
      title: record.title,
      content: record.content,
      clientName: record.clientName,
      contractorName: record.contractorName,
      value: record.value,
      currency: record.currency,
      contractorSignature: record.contractorSignature,
      clientSignature: record.clientSignature,
      alreadySigned: !!record.clientSignature,
    })
  }

  if (req.method === 'POST') {
    const record = await store.get(key, { type: 'json' }) as SigningRecord | null
    if (!record) {
      return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 })
    }
    if (record.clientSignature) {
      return new Response(JSON.stringify({ error: 'Already signed' }), { status: 409 })
    }

    const body = await req.json() as { name: string; signatureImage: string }
    if (!body.name || !body.signatureImage) {
      return new Response(JSON.stringify({ error: 'Name and signature required' }), { status: 400 })
    }

    record.clientSignature = {
      name: body.name,
      signatureImage: body.signatureImage,
      signedAt: new Date().toISOString(),
    }
    await store.setJSON(key, record)
    return Response.json({ success: true, signedAt: record.clientSignature.signedAt })
  }

  return new Response('Method not allowed', { status: 405 })
}

export const config: Config = {
  path: '/api/sign/:token',
}
