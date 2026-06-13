import type { Config, Context } from '@netlify/functions'
import { getPaymentSession, jsonResponse } from './_shared/integrations'
import { cred } from './_shared/payment-checkout'

export default async (req: Request, context: Context) => {
  const { externalId } = context.params
  if (!externalId) return jsonResponse({ error: 'Missing session ID' }, 400)

  const stored = await getPaymentSession(externalId)
  if (stored?.status === 'paid') {
    return jsonResponse({ paid: true, invoiceId: stored.invoiceId, paidAt: stored.paidAt })
  }

  let secretKey = ''
  if (req.method === 'POST') {
    const body = await req.json().catch(() => ({})) as { credentials?: Record<string, string> }
    secretKey = cred(body.credentials, 'stripeSecretKey', 'STRIPE_SECRET_KEY')
  }
  secretKey = secretKey || req.headers.get('x-stripe-secret') || process.env.STRIPE_SECRET_KEY || ''

  if (!secretKey) return jsonResponse({ paid: false, status: stored?.status || 'unknown' })

  try {
    const res = await fetch(`https://api.stripe.com/v1/checkout/sessions/${externalId}`, {
      headers: { Authorization: `Bearer ${secretKey}` },
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
  path: '/api/payments/stripe/verify/:externalId',
}
