import type { Config, Context } from '@netlify/functions'
import { getPaymentSession, jsonResponse } from './_shared/integrations'
import { cred } from './_shared/payment-checkout'

export default async (req: Request, context: Context) => {
  const { externalId } = context.params
  if (!externalId) return jsonResponse({ error: 'Missing checkout ID' }, 400)

  const stored = await getPaymentSession(externalId)
  if (stored?.status === 'paid') {
    return jsonResponse({ paid: true, invoiceId: stored.invoiceId, paidAt: stored.paidAt })
  }

  const body = req.method === 'POST'
    ? await req.json().catch(() => ({})) as { credentials?: Record<string, string> }
    : { credentials: undefined }

  const apiKey = cred(body.credentials, 'lemonSqueezyApiKey', 'LEMON_SQUEEZY_API_KEY')
  if (!apiKey) return jsonResponse({ paid: false, status: 'missing_credentials' })

  try {
    const res = await fetch(`https://api.lemonsqueezy.com/v1/checkouts/${externalId}`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: 'application/vnd.api+json',
      },
    })
    const data = await res.json()
    const attrs = data.data?.attributes
    const paid = attrs?.status === 'paid' || attrs?.status === 'completed'
    const invoiceId = attrs?.checkout_data?.custom?.invoice_id || stored?.invoiceId
    return jsonResponse({
      paid,
      invoiceId,
      paidAt: paid ? new Date().toISOString() : undefined,
      status: attrs?.status,
    })
  } catch {
    return jsonResponse({ paid: false, status: 'error' })
  }
}

export const config: Config = {
  path: '/api/payments/lemon_squeezy/verify/:externalId',
}
