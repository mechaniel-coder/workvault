import type { Config } from '@netlify/functions'
import { getEnv, jsonResponse } from './_shared/integrations'

export default async (req: Request) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 })

  try {
    const body = await req.json() as { publicToken: string }
    if (!body.publicToken) return jsonResponse({ error: 'Missing public token' }, 400)

    const clientId = getEnv('PLAID_CLIENT_ID')
    const secret = getEnv('PLAID_SECRET')
    const env = getEnv('PLAID_ENV') || 'sandbox'
    const base = env === 'production' ? 'https://production.plaid.com' : 'https://sandbox.plaid.com'

    const exchangeRes = await fetch(`${base}/item/public_token/exchange`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: clientId,
        secret,
        public_token: body.publicToken,
      }),
    })
    const exchange = await exchangeRes.json()
    if (!exchangeRes.ok) return jsonResponse({ error: exchange.error_message || 'Exchange failed' }, exchangeRes.status)

    const accountsRes = await fetch(`${base}/accounts/get`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: clientId,
        secret,
        access_token: exchange.access_token,
      }),
    })
    const accounts = await accountsRes.json()
    const account = accounts.accounts?.[0]
    const institution = accounts.item?.institution_id

    return jsonResponse({
      accessToken: exchange.access_token,
      itemId: exchange.item_id,
      accountId: account?.account_id || '',
      accountName: account?.name || account?.official_name || 'Bank Account',
      institutionName: institution || 'Connected Bank',
    })
  } catch (err) {
    return jsonResponse({ error: err instanceof Error ? err.message : 'Plaid exchange failed' }, 500)
  }
}

export const config: Config = {
  path: '/api/plaid/exchange',
}
