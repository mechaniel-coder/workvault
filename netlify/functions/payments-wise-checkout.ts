import type { Config } from '@netlify/functions'
import { jsonResponse, storePaymentSession } from './_shared/integrations'
import { cred, parseCheckoutBody } from './_shared/payment-checkout'

export default async (req: Request) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 })

  try {
    const body = parseCheckoutBody(await req.json())
    const apiToken = cred(body.credentials, 'wiseApiToken', 'WISE_API_TOKEN')
    const profileId = cred(body.credentials, 'wiseProfileId', 'WISE_PROFILE_ID')
    if (!apiToken || !profileId) return jsonResponse({ error: 'Wise API token and profile ID required' }, 400)

    const { invoice, successUrl } = body

    const res = await fetch(`https://api.wise.com/v3/profiles/${profileId}/acquiring/payment-requests`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: {
          value: invoice.total,
          currency: invoice.currency.toUpperCase(),
        },
        description: `Invoice ${invoice.number} — ${invoice.clientName}`,
        reference: invoice.number,
        redirectUrl: `${successUrl}${successUrl.includes('?') ? '&' : '?'}wise_payment=1`,
      }),
    })

    const data = await res.json()
    if (!res.ok) {
      // Fallback: Wise payment request page for profile
      const fallbackUrl = `https://wise.com/pay/me/${profileId}?amount=${invoice.total}&currency=${invoice.currency}&description=${encodeURIComponent(`Invoice ${invoice.number}`)}`
      const externalId = `wise-${invoice.id}-${Date.now()}`
      await storePaymentSession(externalId, { invoiceId: invoice.id, processor: 'wise', status: 'pending' })
      return jsonResponse({ url: fallbackUrl, externalId, fallback: true })
    }

    const url = data.paymentLink || data.url || data.hostedPaymentUrl
    const externalId = String(data.id || data.paymentRequestId || `wise-${invoice.id}`)
    if (!url) throw new Error('Wise payment link missing from response')

    await storePaymentSession(externalId, { invoiceId: invoice.id, processor: 'wise', status: 'pending' })

    return jsonResponse({ url, externalId })
  } catch (err) {
    return jsonResponse({ error: err instanceof Error ? err.message : 'Wise checkout failed' }, 500)
  }
}

export const config: Config = {
  path: '/api/payments/wise/checkout',
}
