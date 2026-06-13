import type { Config } from '@netlify/functions'
import { getEnv, jsonResponse } from './_shared/integrations'

export default async (req: Request) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 })

  try {
    const body = await req.json() as {
      accessToken: string
      cursor?: string | null
      accountId?: string
    }

    if (!body.accessToken) return jsonResponse({ error: 'Plaid not connected' }, 400)

    const clientId = getEnv('PLAID_CLIENT_ID')
    const secret = getEnv('PLAID_SECRET')
    const env = getEnv('PLAID_ENV') || 'sandbox'
    const base = env === 'production' ? 'https://production.plaid.com' : 'https://sandbox.plaid.com'

    const start = new Date()
    start.setDate(start.getDate() - 90)

    const res = await fetch(`${base}/transactions/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: clientId,
        secret,
        access_token: body.accessToken,
        cursor: body.cursor || undefined,
        options: body.accountId ? { account_ids: [body.accountId] } : undefined,
      }),
    })
    const data = await res.json()
    if (!res.ok) return jsonResponse({ error: data.error_message || 'Transactions fetch failed' }, res.status)

    const transactions = (data.added || []).map((t: {
      transaction_id: string
      date: string
      name: string
      amount: number
      iso_currency_code?: string
    }) => ({
      plaidTransactionId: t.transaction_id,
      date: t.date,
      name: t.name,
      amount: Math.abs(t.amount),
      currency: t.iso_currency_code || 'USD',
      isCredit: t.amount < 0,
    })).filter((t: { isCredit: boolean }) => t.isCredit)

    return jsonResponse({
      transactions,
      cursor: data.next_cursor || null,
      hasMore: data.has_more || false,
      fetchedAt: new Date().toISOString(),
    })
  } catch (err) {
    return jsonResponse({ error: err instanceof Error ? err.message : 'Transactions fetch failed' }, 500)
  }
}

export const config: Config = {
  path: '/api/plaid/transactions',
}
