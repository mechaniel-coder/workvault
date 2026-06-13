import type { Config, Context } from '@netlify/functions'
import { getPaymentSession, getEnv, jsonResponse } from './_shared/integrations'

export default async (req: Request, context: Context) => {
  const { sessionId } = context.params
  if (!sessionId) {
    return jsonResponse({ error: 'Missing session ID' }, 400)
  }

  const stored = await getPaymentSession(sessionId)
  if (stored?.status === 'paid') {
    return jsonResponse({
      paid: true,
      invoiceId: stored.invoiceId,
      paidAt: stored.paidAt,
    })
  }

  const secretKey = getEnv('STRIPE_SECRET_KEY') || new URL(req.url).searchParams.get('key') || ''
  if (req.headers.get('x-stripe-key')) {
    // Allow contractor-provided key via header for local-first
  }

  const keyFromHeader = req.headers.get('x-stripe-secret') || secretKey
  if (!keyFromHeader) {
    return jsonResponse({ paid: false, status: stored?.status || 'unknown' })
  }

  try {
    const res = await fetch(`https://api.stripe.com/v1/checkout/sessions/${sessionId}`, {
      headers: { Authorization: `Bearer ${keyFromHeader}` },
    })
    const session = await res.json()
    if (session.payment_status === 'paid') {
      return jsonResponse({
        paid: true,
        invoiceId: session.metadata?.invoiceId || stored?.invoiceId,
        paidAt: new Date().toISOString(),
      })
    }
    return jsonResponse({ paid: false, status: session.payment_status })
  } catch {
    return jsonResponse({ paid: false, status: 'error' })
  }
}

export const config: Config = {
  path: '/api/stripe/verify/:sessionId',
}
