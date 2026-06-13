import type { Config } from '@netlify/functions'
import { jsonResponse, storePaymentSession } from './_shared/integrations'
import { appendPaymentId, cred, parseCheckoutBody } from './_shared/payment-checkout'

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

export default async (req: Request) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 })

  try {
    const body = parseCheckoutBody(await req.json())
    const clientId = cred(body.credentials, 'paypalClientId', 'PAYPAL_CLIENT_ID')
    const clientSecret = cred(body.credentials, 'paypalClientSecret', 'PAYPAL_CLIENT_SECRET')
    if (!clientId || !clientSecret) return jsonResponse({ error: 'PayPal client ID and secret required' }, 400)

    const mode = body.credentials?.paypalMode || process.env.PAYPAL_MODE || 'sandbox'
    const sandbox = mode !== 'live'
    const { token, base } = await getPayPalToken(clientId, clientSecret, sandbox)
    const { invoice, successUrl, cancelUrl } = body

    const res = await fetch(`${base}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [{
          reference_id: invoice.id,
          description: `Invoice ${invoice.number} — ${invoice.clientName}`,
          custom_id: invoice.id,
          amount: {
            currency_code: invoice.currency.toUpperCase(),
            value: invoice.total.toFixed(2),
          },
        }],
        application_context: {
          brand_name: 'WorkVault',
          return_url: appendPaymentId(successUrl, 'payment_id', '{ORDER_ID}'),
          cancel_url: cancelUrl,
          user_action: 'PAY_NOW',
        },
      }),
    })

    const order = await res.json()
    if (!res.ok) throw new Error(order.message || order.details?.[0]?.description || 'PayPal order failed')

    const approveLink = (order.links as { rel: string; href: string }[]).find((l) => l.rel === 'approve')?.href
    if (!approveLink) throw new Error('PayPal approval link missing')

    await storePaymentSession(order.id, { invoiceId: invoice.id, processor: 'paypal', status: 'pending' })

    return jsonResponse({ url: approveLink, externalId: order.id })
  } catch (err) {
    return jsonResponse({ error: err instanceof Error ? err.message : 'PayPal checkout failed' }, 500)
  }
}

export const config: Config = {
  path: '/api/payments/paypal/checkout',
}
