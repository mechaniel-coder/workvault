import type { Config, Context } from '@netlify/functions'
import { getPaymentSession, getEnv, jsonResponse, storePaymentSession } from './_shared/integrations'

async function stripeRequest(secretKey: string, path: string, body: Record<string, string>) {
  const params = new URLSearchParams(body)
  const res = await fetch(`https://api.stripe.com/v1/${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secretKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  })
  const data = await res.json()
  if (!res.ok) {
    throw new Error(data.error?.message || 'Stripe API error')
  }
  return data
}

export default async (req: Request, context: Context) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  try {
    const body = await req.json() as {
      secretKey?: string
      invoice: {
        id: string
        number: string
        total: number
        currency: string
        clientName: string
        lineItems: { description: string; amount: number }[]
      }
      successUrl: string
      cancelUrl: string
    }

    const secretKey = body.secretKey || getEnv('STRIPE_SECRET_KEY')
    if (!secretKey) {
      return jsonResponse({ error: 'Stripe secret key required' }, 400)
    }

    const { invoice, successUrl, cancelUrl } = body
    const amountCents = Math.round(invoice.total * 100)

    const lineItems: Record<string, string> = {}
    if (invoice.lineItems.length > 0) {
      invoice.lineItems.forEach((item, i) => {
        lineItems[`line_items[${i}][price_data][currency]`] = invoice.currency.toLowerCase()
        lineItems[`line_items[${i}][price_data][product_data][name]`] = item.description.slice(0, 200)
        lineItems[`line_items[${i}][price_data][unit_amount]`] = String(Math.round(item.amount * 100))
        lineItems[`line_items[${i}][quantity]`] = '1'
      })
    } else {
      lineItems['line_items[0][price_data][currency]'] = invoice.currency.toLowerCase()
      lineItems['line_items[0][price_data][product_data][name]'] = `Invoice ${invoice.number}`
      lineItems['line_items[0][price_data][unit_amount]'] = String(amountCents)
      lineItems['line_items[0][quantity]'] = '1'
    }

    const session = await stripeRequest(secretKey, 'checkout/sessions', {
      mode: 'payment',
      success_url: `${successUrl}${successUrl.includes('?') ? '&' : '?'}stripe_session={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl,
      'metadata[invoiceId]': invoice.id,
      'metadata[invoiceNumber]': invoice.number,
      'metadata[clientName]': invoice.clientName,
      'payment_intent_data[metadata][invoiceId]': invoice.id,
      customer_email: '',
      ...lineItems,
    })

    await storePaymentSession(session.id, { invoiceId: invoice.id, status: 'pending' })

    return jsonResponse({
      sessionId: session.id,
      url: session.url,
      publishableKey: getEnv('STRIPE_PUBLISHABLE_KEY') || null,
    })
  } catch (err) {
    return jsonResponse({ error: err instanceof Error ? err.message : 'Checkout failed' }, 500)
  }
}

export const config: Config = {
  path: '/api/stripe/checkout',
}
