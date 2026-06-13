import type { Config, Context } from '@netlify/functions'
import { consumeProviderOAuthCode, getEnv, jsonResponse, storeProviderOAuthCode } from './_shared/integrations'
import { basicAuth, oauthRedirect } from './_shared/oauth-helpers'

export default async (req: Request, context: Context) => {
  const url = new URL(req.url)
  const action = context.params.action

  if (action === 'start' && req.method === 'GET') {
    const clientId = getEnv('INTUIT_CLIENT_ID')
    if (!clientId) return jsonResponse({ error: 'INTUIT_CLIENT_ID not configured' }, 503)
    const origin = url.searchParams.get('origin') || `${url.protocol}//${url.host}`
    const redirectUri = `${origin}/api/quickbooks/oauth/callback`
    const authUrl = new URL('https://appcenter.intuit.com/connect/oauth2')
    authUrl.searchParams.set('client_id', clientId)
    authUrl.searchParams.set('redirect_uri', redirectUri)
    authUrl.searchParams.set('response_type', 'code')
    authUrl.searchParams.set('scope', 'com.intuit.quickbooks.accounting')
    authUrl.searchParams.set('state', crypto.randomUUID())
    return jsonResponse({ url: authUrl.toString() })
  }

  if (action === 'callback' && req.method === 'GET') {
    const code = url.searchParams.get('code')
    const realmId = url.searchParams.get('realmId') || ''
    const origin = `${url.protocol}//${url.host}`
    if (!code) return oauthRedirect(`${origin}/integrations?quickbooks=error`)

    try {
      const clientId = getEnv('INTUIT_CLIENT_ID')
      const clientSecret = getEnv('INTUIT_CLIENT_SECRET')
      const redirectUri = `${origin}/api/quickbooks/oauth/callback`
      const res = await fetch('https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer', {
        method: 'POST',
        headers: {
          Authorization: basicAuth(clientId, clientSecret),
          'Content-Type': 'application/x-www-form-urlencoded',
          Accept: 'application/json',
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          redirect_uri: redirectUri,
        }),
      })
      const tokens = await res.json()
      if (!res.ok) throw new Error(tokens.error_description || 'Token exchange failed')

      let companyName = 'QuickBooks Company'
      if (realmId && tokens.access_token) {
        const infoRes = await fetch(`https://quickbooks.api.intuit.com/v3/company/${realmId}/companyinfo/${realmId}`, {
          headers: { Authorization: `Bearer ${tokens.access_token}`, Accept: 'application/json' },
        })
        if (infoRes.ok) {
          const info = await infoRes.json()
          companyName = info.CompanyInfo?.CompanyName || companyName
        }
      }

      const oneTimeCode = crypto.randomUUID()
      await storeProviderOAuthCode('quickbooks', oneTimeCode, {
        refreshToken: tokens.refresh_token || '',
        realmId,
        companyName,
      })
      return oauthRedirect(`${origin}/integrations?quickbooks=connected&code=${oneTimeCode}`)
    } catch {
      return oauthRedirect(`${origin}/integrations?quickbooks=error`)
    }
  }

  if (action === 'token' && req.method === 'GET') {
    const code = url.searchParams.get('code')
    if (!code) return jsonResponse({ error: 'Missing code' }, 400)
    const data = await consumeProviderOAuthCode('quickbooks', code)
    if (!data) return jsonResponse({ error: 'Invalid or expired code' }, 404)
    return jsonResponse(data)
  }

  return jsonResponse({ error: 'Not found' }, 404)
}

export const config: Config = {
  path: '/api/quickbooks/oauth/:action',
}
