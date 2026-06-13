import type { Config, Context } from '@netlify/functions'
import { getPaymentSession, jsonResponse } from './_shared/integrations'

export default async (req: Request, context: Context) => {
  const { externalId } = context.params
  if (!externalId) return jsonResponse({ error: 'Missing payment ID' }, 400)

  const stored = await getPaymentSession(externalId)
  if (stored?.status === 'paid') {
    return jsonResponse({ paid: true, invoiceId: stored.invoiceId, paidAt: stored.paidAt })
  }

  // Wise returns via redirect; auto-verify is limited without webhooks
  return jsonResponse({
    paid: false,
    invoiceId: stored?.invoiceId,
    status: 'pending_confirmation',
  })
}

export const config: Config = {
  path: '/api/payments/wise/verify/:externalId',
}
