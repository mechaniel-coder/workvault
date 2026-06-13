import type { Config, Context } from '@netlify/functions'
import { consumeProviderOAuthCode, getEnv, jsonResponse, storeProviderOAuthCode } from './_shared/integrations'
import { basicAuth, oauthRedirect } from './_shared/oauth-helpers'

export default async (req: Request, context: Context) => {
  const url = new URL(req.url)
  const action = context.params.action

  if (action === 'start' && req.method === 'GET') {
    const clientId = getEnv('XERO_CLIENT_ID')
    if (!clientId) return jsonResponse({ error: 'XERO_CLIENT_ID not configured' }, 503)
    const origin = url.searchParams.get('origin') || `${url.protocol}//${url.host}`
    const redirectUri = `${origin}/api/xero/oauth/callback`
    const authUrl = new URL('https://login.xero.com/identity/connect/authorize')
    authUrl.searchParams.set('client_id', clientId)
    authUrl.searchParams.set('redirect_uri', redirectUri)
    authUrl.searchParams.set('response_type', 'code')
    authUrl.searchParams.set('scope', 'openid profile email accounting.transactions accounting.contacts offline_access')
    authUrl.searchParams.set('state', crypto.randomUUID())
    return jsonResponse({ url: authUrl.toString() })
  }

  if (action === 'callback' && req.method === 'GET') {
    const code = url.searchParams.get('code')
    const origin = `${url.protocol}//${url.host}`
    if (!code) return oauthRedirect(`${origin}/integrations?xero=error`)

    try {
      const clientId = getEnv('XERO_CLIENT_ID')
      const clientSecret = getEnv('XERO_CLIENT_SECRET')
      const redirectUri = `${origin}/api/xero/oauth/callback`
      const res = await fetch('https://identity.xero.com/connect/token', {
        method: 'POST',
        headers: {
          Authorization: basicAuth(clientId, clientSecret),
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          redirect_uri: redirectUri,
        }),
      })
      const tokens = await res.json()
      if (!res.ok) throw new Error(tokens.error_description || 'Token exchange failed')

      const connRes = await fetch('https://api.xero.com/connections', {
        headers: { Authorization: `Bearer ${tokens.access_token}`, Accept: 'application/json' },
      })
      const connections = await connRes.json()
      const tenant = connections[0]

      const oneTimeCode = crypto.randomUUID()
      await storeProviderOAuthCode('xero', oneTimeCode, {
        refreshToken: tokens.refresh_token || '',
        tenantId: tenant?.tenantId || '',
        tenantName: tenant?.tenantName || 'Xero Organization',
      })
      return oauthRedirect(`${origin}/integrations?xero=connected&code=${oneTimeCode}`)
    } catch {
      return oauthRedirect(`${origin}/integrations?xero=error`)
    }
  }

  if (action === 'token' && req.method === 'GET') {
    const code = url.searchParams.get('code')
    if (!code) return jsonResponse({ error: 'Missing code' }, 400)
    const data = await consumeProviderOAuthCode('xero', code)
    if (!data) return jsonResponse({ error: 'Invalid or expired code' }, 404)
    return jsonResponse(data)
  }

  return jsonResponse({ error: 'Not found' }, 404)
}

export const config: Config = {
  path: '/api/xero/oauth/:action',
}
