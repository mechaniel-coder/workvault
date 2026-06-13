import type { Config, Context } from '@netlify/functions'
import { getPaymentSession, jsonResponse } from './_shared/integrations'
import { cred } from './_shared/payment-checkout'

export default async (req: Request, context: Context) => {
  const { externalId } = context.params
  if (!externalId) return jsonResponse({ error: 'Missing transaction ID' }, 400)

  const stored = await getPaymentSession(externalId)
  if (stored?.status === 'paid') {
    return jsonResponse({ paid: true, invoiceId: stored.invoiceId, paidAt: stored.paidAt })
  }

  const body = req.method === 'POST'
    ? await req.json().catch(() => ({})) as { credentials?: Record<string, string> }
    : { credentials: undefined }

  const apiKey = cred(body.credentials, 'paddleApiKey', 'PADDLE_API_KEY')
  if (!apiKey) return jsonResponse({ paid: false, status: 'missing_credentials' })

  try {
    const res = await fetch(`https://api.paddle.com/transactions/${externalId}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    })
    const data = await res.json()
    const txn = data.data
    const paid = txn?.status === 'completed' || txn?.status === 'paid'
    const invoiceId = txn?.custom_data?.invoice_id || stored?.invoiceId
    return jsonResponse({
      paid,
      invoiceId,
      paidAt: paid ? new Date().toISOString() : undefined,
      status: txn?.status,
    })
  } catch {
    return jsonResponse({ paid: false, status: 'error' })
  }
}

export const config: Config = {
  path: '/api/payments/paddle/verify/:externalId',
}
