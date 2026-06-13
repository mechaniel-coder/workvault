import type { Config, Context } from '@netlify/functions'
import { consumeProviderOAuthCode, getEnv, jsonResponse, storeProviderOAuthCode } from './_shared/integrations'
import { oauthRedirect } from './_shared/oauth-helpers'

export default async (req: Request, context: Context) => {
  const url = new URL(req.url)
  const action = context.params.action
  const appKey = getEnv('DROPBOX_APP_KEY')
  const appSecret = getEnv('DROPBOX_APP_SECRET')

  if (action === 'start' && req.method === 'GET') {
    if (!appKey) return jsonResponse({ error: 'DROPBOX_APP_KEY not configured' }, 503)
    const origin = url.searchParams.get('origin') || `${url.protocol}//${url.host}`
    const authUrl = new URL('https://www.dropbox.com/oauth2/authorize')
    authUrl.searchParams.set('client_id', appKey)
    authUrl.searchParams.set('redirect_uri', `${origin}/api/dropbox/oauth/callback`)
    authUrl.searchParams.set('response_type', 'code')
    authUrl.searchParams.set('token_access_type', 'offline')
    return jsonResponse({ url: authUrl.toString() })
  }

  if (action === 'callback' && req.method === 'GET') {
    const code = url.searchParams.get('code')
    const origin = `${url.protocol}//${url.host}`
    if (!code) return oauthRedirect(`${origin}/integrations?dropbox=error`)
    try {
      const res = await fetch('https://api.dropboxapi.com/oauth2/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code,
          grant_type: 'authorization_code',
          client_id: appKey,
          client_secret: appSecret,
          redirect_uri: `${origin}/api/dropbox/oauth/callback`,
        }),
      })
      const tokens = await res.json()
      if (!res.ok) throw new Error(tokens.error_description || 'Token exchange failed')

      const acct = await fetch('https://api.dropboxapi.com/2/users/get_current_account', {
        method: 'POST',
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      })
      const account = acct.ok ? await acct.json() : { email: '' }

      const oneTimeCode = crypto.randomUUID()
      await storeProviderOAuthCode('dropbox', oneTimeCode, {
        refreshToken: tokens.refresh_token || tokens.access_token,
        email: account.email || '',
      })
      return oauthRedirect(`${origin}/integrations?dropbox=connected&code=${oneTimeCode}`)
    } catch {
      return oauthRedirect(`${origin}/integrations?dropbox=error`)
    }
  }

  if (action === 'token' && req.method === 'GET') {
    const code = url.searchParams.get('code')
    if (!code) return jsonResponse({ error: 'Missing code' }, 400)
    const data = await consumeProviderOAuthCode('dropbox', code)
    if (!data) return jsonResponse({ error: 'Invalid or expired code' }, 404)
    return jsonResponse(data)
  }

  return jsonResponse({ error: 'Not found' }, 404)
}

export const config: Config = {
  path: '/api/dropbox/oauth/:action',
}
