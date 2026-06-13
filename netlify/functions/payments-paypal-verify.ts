import type { Config, Context } from '@netlify/functions'
import { getPaymentSession, jsonResponse } from './_shared/integrations'
import { cred } from './_shared/payment-checkout'

async function getPayPalToken(clientId: string, clientSecret: string, sandbox: boolean) {
  const base = sandbox ? 'https://api-m.sandbox.paypal.com' : 'https://api-m.paypal.com'
  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')
  const res = await fetch(`${base}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error_description || 'PayPal auth failed')
  return { token: data.access_token as string, base }
}

export default async (req: Request, context: Context) => {
  const { externalId } = context.params
  if (!externalId) return jsonResponse({ error: 'Missing order ID' }, 400)

  const stored = await getPaymentSession(externalId)
  if (stored?.status === 'paid') {
    return jsonResponse({ paid: true, invoiceId: stored.invoiceId, paidAt: stored.paidAt })
  }

  const body = req.method === 'POST'
    ? await req.json().catch(() => ({})) as { credentials?: Record<string, string> }
    : { credentials: undefined }

  const clientId = cred(body.credentials, 'paypalClientId', 'PAYPAL_CLIENT_ID')
  const clientSecret = cred(body.credentials, 'paypalClientSecret', 'PAYPAL_CLIENT_SECRET')
  if (!clientId || !clientSecret) return jsonResponse({ paid: false, status: 'missing_credentials' })

  const mode = body.credentials?.paypalMode || process.env.PAYPAL_MODE || 'sandbox'
  const sandbox = mode !== 'live'

  try {
    const { token, base } = await getPayPalToken(clientId, clientSecret, sandbox)
    const res = await fetch(`${base}/v2/checkout/orders/${externalId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    const order = await res.json()
    const paid = order.status === 'COMPLETED' || order.status === 'APPROVED'
    return jsonResponse({
      paid,
      invoiceId: order.purchase_units?.[0]?.custom_id || stored?.invoiceId,
      paidAt: paid ? new Date().toISOString() : undefined,
      status: order.status,
    })
  } catch {
    return jsonResponse({ paid: false, status: 'error' })
  }
}

export const config: Config = {
  path: '/api/payments/paypal/verify/:externalId',
}
