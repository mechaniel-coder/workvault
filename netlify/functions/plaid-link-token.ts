import type { Config } from '@netlify/functions'
import { getEnv, jsonResponse } from './_shared/integrations'

export default async (req: Request) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 })

  try {
    const body = await req.json() as { userId?: string }
    const clientId = getEnv('PLAID_CLIENT_ID')
    const secret = getEnv('PLAID_SECRET')
    if (!clientId || !secret) return jsonResponse({ error: 'Plaid not configured on server' }, 503)

    const env = getEnv('PLAID_ENV') || 'sandbox'
    const base = env === 'production' ? 'https://production.plaid.com' : 'https://sandbox.plaid.com'

    const res = await fetch(`${base}/link/token/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: clientId,
        secret,
        client_name: 'WorkVault',
        language: 'en',
        country_codes: ['US'],
        user: { client_user_id: body.userId || 'workvault-user' },
        products: ['transactions'],
      }),
    })
    const data = await res.json()
    if (!res.ok) return jsonResponse({ error: data.error_message || 'Link token failed' }, res.status)
    return jsonResponse({ linkToken: data.link_token, expiration: data.expiration })
  } catch (err) {
    return jsonResponse({ error: err instanceof Error ? err.message : 'Link token failed' }, 500)
  }
}

export const config: Config = {
  path: '/api/plaid/link-token',
}
