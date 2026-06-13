import type { Config } from '@netlify/functions'
import { getStore } from '@netlify/blobs'
import { getUser } from '@netlify/identity'

export default async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  const user = await getUser()
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const body = await req.json() as {
    id: string
    number: string
    title: string
    content: string
    clientName: string
    contractorName: string
    value: number
    currency: string
    signatures: { role: string; name: string; signatureImage: string; signedAt: string }[]
  }

  if (!body.id || !body.title || !body.content) {
    return new Response(JSON.stringify({ error: 'Invalid contract data' }), { status: 400 })
  }

  const token = crypto.randomUUID()
  const store = getStore({ name: 'workvault-signatures', consistency: 'strong' })

  const contractorSig = body.signatures.find((s) => s.role === 'contractor') || null

  await store.setJSON(`sign/${token}`, {
    contractId: body.id,
    number: body.number,
    title: body.title,
    content: body.content,
    clientName: body.clientName,
    contractorName: body.contractorName,
    value: body.value,
    currency: body.currency,
    contractorSignature: contractorSig,
    clientSignature: null,
    createdAt: new Date().toISOString(),
    ownerId: user.id,
  })

  const origin = new URL(req.url).origin
  return Response.json({ token, url: `${origin}/sign/${token}` })
}

export const config: Config = {
  path: '/api/sign-link',
}
