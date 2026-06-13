import { getEnv } from './integrations'

export function oauthRedirect(url: string) {
  return new Response(null, { status: 302, headers: { Location: url } })
}

export function basicAuth(clientId: string, clientSecret: string) {
  return `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`
}

export async function refreshQuickBooksToken(refreshToken: string, clientId?: string, clientSecret?: string) {
  const id = clientId || getEnv('INTUIT_CLIENT_ID')
  const secret = clientSecret || getEnv('INTUIT_CLIENT_SECRET')
  const res = await fetch('https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer', {
    method: 'POST',
    headers: {
      Authorization: basicAuth(id, secret),
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    },
    body: new URLSearchParams({ grant_type: 'refresh_token', refresh_token: refreshToken }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error_description || 'QuickBooks token refresh failed')
  return data as { access_token: string; refresh_token?: string }
}

export async function refreshXeroToken(refreshToken: string, clientId?: string, clientSecret?: string) {
  const id = clientId || getEnv('XERO_CLIENT_ID')
  const secret = clientSecret || getEnv('XERO_CLIENT_SECRET')
  const res = await fetch('https://identity.xero.com/connect/token', {
    method: 'POST',
    headers: {
      Authorization: basicAuth(id, secret),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({ grant_type: 'refresh_token', refresh_token: refreshToken }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error_description || 'Xero token refresh failed')
  return data as { access_token: string; refresh_token?: string }
}

export async function refreshGoogleToken(refreshToken: string, clientId?: string, clientSecret?: string) {
  const id = clientId || getEnv('GOOGLE_CLIENT_ID')
  const secret = clientSecret || getEnv('GOOGLE_CLIENT_SECRET')
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: id,
      client_secret: secret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error_description || 'Google token refresh failed')
  return data as { access_token: string }
}
