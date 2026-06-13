import type { Config } from '@netlify/functions'
import { jsonResponse, storePaymentSession } from './_shared/integrations'
import { cred, parseCheckoutBody } from './_shared/payment-checkout'

export default async (req: Request) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 })

  try {
    const body = parseCheckoutBody(await req.json())
    const apiKey = cred(body.credentials, 'lemonSqueezyApiKey', 'LEMON_SQUEEZY_API_KEY')
    const storeId = cred(body.credentials, 'lemonSqueezyStoreId', 'LEMON_SQUEEZY_STORE_ID')
    const variantId = cred(body.credentials, 'lemonSqueezyVariantId', 'LEMON_SQUEEZY_VARIANT_ID')
    if (!apiKey || !storeId) return jsonResponse({ error: 'Lemon Squeezy API key and store ID required' }, 400)
    if (!variantId) return jsonResponse({ error: 'Lemon Squeezy variant ID required (create a custom-price variant)' }, 400)

    const { invoice, successUrl } = body
    const amountCents = Math.round(invoice.total * 100)

    const res = await fetch('https://api.lemonsqueezy.com/v1/checkouts', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/vnd.api+json',
        Accept: 'application/vnd.api+json',
      },
      body: JSON.stringify({
        data: {
          type: 'checkouts',
          attributes: {
            custom_price: amountCents,
            product_options: {
              name: `Invoice ${invoice.number}`,
              description: `Payment for ${invoice.clientName}`,
            },
            checkout_options: {
              embed: false,
              media: false,
              logo: false,
            },
            checkout_data: {
              custom: { invoice_id: invoice.id, invoice_number: invoice.number },
            },
            expires_at: null,
            preview: false,
            test_mode: process.env.LEMON_SQUEEZY_TEST_MODE === 'true',
          },
          relationships: {
            store: { data: { type: 'stores', id: storeId } },
            variant: { data: { type: 'variants', id: variantId } },
          },
        },
      }),
    })

    const data = await res.json()
    if (!res.ok) throw new Error(data.errors?.[0]?.detail || 'Lemon Squeezy checkout failed')

    const url = data.data?.attributes?.url
    const externalId = data.data?.id
    if (!url) throw new Error('Lemon Squeezy checkout URL missing')

    await storePaymentSession(String(externalId), { invoiceId: invoice.id, processor: 'lemon_squeezy', status: 'pending' })

    const redirectUrl = `${successUrl}${successUrl.includes('?') ? '&' : '?'}lemon_squeezy_checkout=${externalId}`
    return jsonResponse({ url: `${url}${url.includes('?') ? '&' : '?'}checkout[success_url]=${encodeURIComponent(redirectUrl)}`, externalId: String(externalId) })
  } catch (err) {
    return jsonResponse({ error: err instanceof Error ? err.message : 'Lemon Squeezy checkout failed' }, 500)
  }
}

export const config: Config = {
  path: '/api/payments/lemon_squeezy/checkout',
}
