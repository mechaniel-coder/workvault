import type { Config, Context } from '@netlify/functions'
import { getPaymentSession, jsonResponse } from './_shared/integrations'
import { cred } from './_shared/payment-checkout'

export default async (req: Request, context: Context) => {
  const { externalId } = context.params
  if (!externalId) return jsonResponse({ error: 'Missing payment link ID' }, 400)

  const stored = await getPaymentSession(externalId)
  if (stored?.status === 'paid') {
    return jsonResponse({ paid: true, invoiceId: stored.invoiceId, paidAt: stored.paidAt })
  }

  const body = req.method === 'POST'
    ? await req.json().catch(() => ({})) as { credentials?: Record<string, string> }
    : { credentials: undefined }

  const accessToken = cred(body.credentials, 'squareAccessToken', 'SQUARE_ACCESS_TOKEN')
  if (!accessToken) return jsonResponse({ paid: false, status: 'missing_credentials' })

  const sandbox = process.env.SQUARE_ENV !== 'production'
  const base = sandbox ? 'https://connect.squareupsandbox.com' : 'https://connect.squareup.com'

  try {
    const res = await fetch(`${base}/v2/online-checkout/payment-links/${externalId}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Square-Version': '2024-01-18',
      },
    })
    const data = await res.json()
    const link = data.payment_link
    const paid = link?.order_id != null || link?.version === 2
    // Square doesn't expose paid status on link directly — rely on return URL + manual webhook in production
    return jsonResponse({
      paid: stored?.status === 'paid',
      invoiceId: stored?.invoiceId,
      status: link?.version ? 'created' : 'unknown',
    })
  } catch {
    return jsonResponse({ paid: false, status: 'error' })
  }
}

export const config: Config = {
  path: '/api/payments/square/verify/:externalId',
}
