import type { Config } from '@netlify/functions'
import { jsonResponse, storePaymentSession } from './_shared/integrations'
import { cred, parseCheckoutBody } from './_shared/payment-checkout'

export default async (req: Request) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 })

  try {
    const body = parseCheckoutBody(await req.json())
    const apiKey = cred(body.credentials, 'paddleApiKey', 'PADDLE_API_KEY')
    if (!apiKey) return jsonResponse({ error: 'Paddle API key required' }, 400)

    const { invoice, successUrl, cancelUrl } = body
    const amountCents = Math.round(invoice.total * 100)

    const res = await fetch('https://api.paddle.com/transactions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        items: [{
          quantity: 1,
          price: {
            description: `Invoice ${invoice.number}`,
            name: `Invoice ${invoice.number}`,
            unit_price: {
              amount: String(amountCents),
              currency_code: invoice.currency.toUpperCase(),
            },
            product: {
              name: `Invoice ${invoice.number}`,
              tax_category: 'standard',
            },
          },
        }],
        custom_data: { invoice_id: invoice.id, invoice_number: invoice.number },
        checkout: {
          url: successUrl,
        },
        settings: {
          success_url: `${successUrl}${successUrl.includes('?') ? '&' : '?'}paddle_transaction={TRANSACTION_ID}`,
          cancel_url: cancelUrl,
        },
      }),
    })

    const data = await res.json()
    if (!res.ok) throw new Error(data.error?.detail || data.error?.message || 'Paddle transaction failed')

    const transaction = data.data
    const url = transaction?.checkout?.url
    const externalId = transaction?.id
    if (!url) throw new Error('Paddle checkout URL missing')

    await storePaymentSession(String(externalId), { invoiceId: invoice.id, processor: 'paddle', status: 'pending' })

    return jsonResponse({ url, externalId: String(externalId) })
  } catch (err) {
    return jsonResponse({ error: err instanceof Error ? err.message : 'Paddle checkout failed' }, 500)
  }
}

export const config: Config = {
  path: '/api/payments/paddle/checkout',
}
