import type { Config } from '@netlify/functions'
import { jsonResponse } from './_shared/integrations'
import { refreshGoogleToken } from './_shared/oauth-helpers'

function buildRawEmail(from: string, to: string, subject: string, text: string, replyTo?: string) {
  const lines = [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: ${subject}`,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=utf-8',
  ]
  if (replyTo) lines.push(`Reply-To: ${replyTo}`)
  lines.push('', text)
  const raw = lines.join('\r\n')
  return Buffer.from(raw).toString('base64url')
}

export default async (req: Request) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 })

  try {
    const body = await req.json() as {
      refreshToken: string
      from: string
      fromName?: string
      to: string
      subject: string
      text: string
      replyTo?: string
    }

    if (!body.refreshToken || !body.to || !body.subject || !body.text) {
      return jsonResponse({ error: 'Missing required fields' }, 400)
    }

    const tokens = await refreshGoogleToken(body.refreshToken)
    const from = body.fromName ? `${body.fromName} <${body.from}>` : body.from
    const raw = buildRawEmail(from, body.to, body.subject, body.text, body.replyTo)

    const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ raw }),
    })
    const data = await res.json()
    if (!res.ok) return jsonResponse({ error: data.error?.message || 'Gmail send failed' }, res.status)
    return jsonResponse({ ok: true, id: data.id })
  } catch (err) {
    return jsonResponse({ error: err instanceof Error ? err.message : 'Gmail send failed' }, 500)
  }
}

export const config: Config = {
  path: '/api/gmail/send',
}
