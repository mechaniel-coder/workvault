import type { Config } from '@netlify/functions'
import { jsonResponse, storePaymentSession } from './_shared/integrations'
import { cred, parseCheckoutBody } from './_shared/payment-checkout'

export default async (req: Request) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 })

  try {
    const body = parseCheckoutBody(await req.json())
    const accessToken = cred(body.credentials, 'squareAccessToken', 'SQUARE_ACCESS_TOKEN')
    const locationId = cred(body.credentials, 'squareLocationId', 'SQUARE_LOCATION_ID')
    if (!accessToken || !locationId) return jsonResponse({ error: 'Square access token and location ID required' }, 400)

    const sandbox = process.env.SQUARE_ENV !== 'production'
    const base = sandbox ? 'https://connect.squareupsandbox.com' : 'https://connect.squareup.com'
    const { invoice, successUrl } = body

    const res = await fetch(`${base}/v2/online-checkout/payment-links`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Square-Version': '2024-01-18',
      },
      body: JSON.stringify({
        idempotency_key: `${invoice.id}-${Date.now()}`,
        quick_pay: {
          name: `Invoice ${invoice.number}`,
          price_money: {
            amount: Math.round(invoice.total * 100),
            currency: invoice.currency.toUpperCase(),
          },
          location_id: locationId,
        },
        checkout_options: {
          redirect_url: `${successUrl}${successUrl.includes('?') ? '&' : '?'}square_payment=1&payment_id={PAYMENT_LINK_ID}`,
        },
        payment_note: `Invoice ${invoice.number} — ${invoice.clientName}`,
      }),
    })

    const data = await res.json()
    if (!res.ok) throw new Error(data.errors?.[0]?.detail || 'Square payment link failed')

    const link = data.payment_link
    const url = link.url || link.long_url
    const externalId = link.id

    await storePaymentSession(externalId, { invoiceId: invoice.id, processor: 'square', status: 'pending' })

    return jsonResponse({ url, externalId })
  } catch (err) {
    return jsonResponse({ error: err instanceof Error ? err.message : 'Square checkout failed' }, 500)
  }
}

export const config: Config = {
  path: '/api/payments/square/checkout',
}
