import type { Config, Context } from '@netlify/functions'
import { getEnv, jsonResponse, storePaymentSession } from './_shared/integrations'

export default async (req: Request, _context: Context) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  const webhookSecret = getEnv('STRIPE_WEBHOOK_SECRET')
  if (!webhookSecret) {
    return jsonResponse({ error: 'Webhook not configured' }, 503)
  }

  const signature = req.headers.get('stripe-signature')
  if (!signature) {
    return jsonResponse({ error: 'Missing signature' }, 400)
  }

  const payload = await req.text()

  // Verify signature via Stripe API helper (basic HMAC check)
  const parts = Object.fromEntries(signature.split(',').map((p) => {
    const [k, v] = p.split('=')
    return [k, v]
  })) as { t?: string; v1?: string }

  if (!parts.t || !parts.v1) {
    return jsonResponse({ error: 'Invalid signature format' }, 400)
  }

  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(webhookSecret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const signed = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(`${parts.t}.${payload}`),
  )
  const expected = Array.from(new Uint8Array(signed))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')

  if (expected !== parts.v1) {
    return jsonResponse({ error: 'Invalid signature' }, 400)
  }

  const event = JSON.parse(payload) as {
    type: string
    data: { object: { id: string; metadata?: { invoiceId?: string } } }
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object
    const invoiceId = session.metadata?.invoiceId
    if (invoiceId) {
      await storePaymentSession(session.id, {
        invoiceId,
        status: 'paid',
        paidAt: new Date().toISOString(),
      })
    }
  }

  return jsonResponse({ received: true })
}

export const config: Config = {
  path: '/api/stripe/webhook',
}
