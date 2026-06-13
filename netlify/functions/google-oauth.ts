import type { Config, Context } from '@netlify/functions'
import { consumeOAuthCode, getEnv, jsonResponse, storeOAuthCode } from './_shared/integrations'

const SCOPES = 'https://www.googleapis.com/auth/calendar.events'

function redirect(url: string) {
  return new Response(null, { status: 302, headers: { Location: url } })
}

async function exchangeCode(code: string, redirectUri: string) {
  const clientId = getEnv('GOOGLE_CLIENT_ID')
  const clientSecret = getEnv('GOOGLE_CLIENT_SECRET')
  if (!clientId || !clientSecret) {
    throw new Error('Google OAuth not configured on server')
  }

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error_description || 'Token exchange failed')
  return data as { refresh_token?: string; access_token: string }
}

async function getGoogleEmail(accessToken: string) {
  const res = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) return ''
  const data = await res.json()
  return data.email || ''
}

export default async (req: Request, context: Context) => {
  const url = new URL(req.url)
  const action = context.params.action

  if (action === 'start' && req.method === 'GET') {
    const clientId = getEnv('GOOGLE_CLIENT_ID')
    if (!clientId) {
      return jsonResponse({ error: 'GOOGLE_CLIENT_ID not configured' }, 503)
    }
    const origin = url.searchParams.get('origin') || `${url.protocol}//${url.host}`
    const redirectUri = `${origin}/api/google/oauth/callback`
    const state = crypto.randomUUID()
    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth')
    authUrl.searchParams.set('client_id', clientId)
    authUrl.searchParams.set('redirect_uri', redirectUri)
    authUrl.searchParams.set('response_type', 'code')
    authUrl.searchParams.set('scope', SCOPES)
    authUrl.searchParams.set('access_type', 'offline')
    authUrl.searchParams.set('prompt', 'consent')
    authUrl.searchParams.set('state', state)
    return jsonResponse({ url: authUrl.toString(), state })
  }

  if (action === 'callback' && req.method === 'GET') {
    const code = url.searchParams.get('code')
    const error = url.searchParams.get('error')
    const origin = `${url.protocol}//${url.host}`

    if (error || !code) {
      return redirect(`${origin}/integrations?google=error`)
    }

    try {
      const redirectUri = `${origin}/api/google/oauth/callback`
      const tokens = await exchangeCode(code, redirectUri)
      const email = await getGoogleEmail(tokens.access_token)
      const oneTimeCode = crypto.randomUUID()
      await storeOAuthCode(oneTimeCode, {
        refreshToken: tokens.refresh_token || '',
        email,
        calendarId: 'primary',
      })
      return redirect(`${origin}/integrations?google=connected&code=${oneTimeCode}`)
    } catch {
      return redirect(`${origin}/integrations?google=error`)
    }
  }

  if (action === 'token' && req.method === 'GET') {
    const code = url.searchParams.get('code')
    if (!code) return jsonResponse({ error: 'Missing code' }, 400)
    const data = await consumeOAuthCode(code)
    if (!data) return jsonResponse({ error: 'Invalid or expired code' }, 404)
    return jsonResponse(data)
  }

  return jsonResponse({ error: 'Not found' }, 404)
}

export const config: Config = {
  path: '/api/google/oauth/:action',
}
