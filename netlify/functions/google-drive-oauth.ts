import type { Config, Context } from '@netlify/functions'
import { consumeProviderOAuthCode, getEnv, jsonResponse, storeProviderOAuthCode } from './_shared/integrations'
import { oauthRedirect } from './_shared/oauth-helpers'

const DRIVE_SCOPES = 'https://www.googleapis.com/auth/drive.readonly https://www.googleapis.com/auth/userinfo.email'

async function exchangeCode(code: string, redirectUri: string) {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: getEnv('GOOGLE_CLIENT_ID'),
      client_secret: getEnv('GOOGLE_CLIENT_SECRET'),
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error_description || 'Token exchange failed')
  return data as { refresh_token?: string; access_token: string }
}

export default async (req: Request, context: Context) => {
  const url = new URL(req.url)
  const action = context.params.action

  if (action === 'start' && req.method === 'GET') {
    const clientId = getEnv('GOOGLE_CLIENT_ID')
    if (!clientId) return jsonResponse({ error: 'GOOGLE_CLIENT_ID not configured' }, 503)
    const origin = url.searchParams.get('origin') || `${url.protocol}//${url.host}`
    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth')
    authUrl.searchParams.set('client_id', clientId)
    authUrl.searchParams.set('redirect_uri', `${origin}/api/google-drive/oauth/callback`)
    authUrl.searchParams.set('response_type', 'code')
    authUrl.searchParams.set('scope', DRIVE_SCOPES)
    authUrl.searchParams.set('access_type', 'offline')
    authUrl.searchParams.set('prompt', 'consent')
    return jsonResponse({ url: authUrl.toString() })
  }

  if (action === 'callback' && req.method === 'GET') {
    const code = url.searchParams.get('code')
    const origin = `${url.protocol}//${url.host}`
    if (!code) return oauthRedirect(`${origin}/integrations?google_drive=error`)
    try {
      const tokens = await exchangeCode(code, `${origin}/api/google-drive/oauth/callback`)
      const me = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      })
      const profile = me.ok ? await me.json() : { email: '' }
      const oneTimeCode = crypto.randomUUID()
      await storeProviderOAuthCode('google_drive', oneTimeCode, {
        refreshToken: tokens.refresh_token || '',
        email: profile.email || '',
      })
      return oauthRedirect(`${origin}/integrations?google_drive=connected&code=${oneTimeCode}`)
    } catch {
      return oauthRedirect(`${origin}/integrations?google_drive=error`)
    }
  }

  if (action === 'token' && req.method === 'GET') {
    const code = url.searchParams.get('code')
    if (!code) return jsonResponse({ error: 'Missing code' }, 400)
    const data = await consumeProviderOAuthCode('google_drive', code)
    if (!data) return jsonResponse({ error: 'Invalid or expired code' }, 404)
    return jsonResponse(data)
  }

  return jsonResponse({ error: 'Not found' }, 404)
}

export const config: Config = {
  path: '/api/google-drive/oauth/:action',
}
