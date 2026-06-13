import type { Config, Context } from '@netlify/functions'
import { getEnv, jsonResponse } from './_shared/integrations'

export default async (req: Request, _context: Context) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  try {
    const body = await req.json() as {
      apiKey?: string
      from: string
      fromName?: string
      to: string
      subject: string
      html?: string
      text: string
      replyTo?: string
    }

    const apiKey = body.apiKey || getEnv('RESEND_API_KEY')
    if (!apiKey) {
      return jsonResponse({ error: 'Resend API key required' }, 400)
    }

    if (!body.to || !body.subject || !body.text) {
      return jsonResponse({ error: 'Missing to, subject, or text' }, 400)
    }

    const from = body.fromName
      ? `${body.fromName} <${body.from}>`
      : body.from

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [body.to],
        subject: body.subject,
        text: body.text,
        html: body.html || undefined,
        reply_to: body.replyTo || undefined,
      }),
    })

    const data = await res.json()
    if (!res.ok) {
      return jsonResponse({ error: data.message || data.error || 'Send failed' }, res.status)
    }

    return jsonResponse({ ok: true, id: data.id })
  } catch (err) {
    return jsonResponse({ error: err instanceof Error ? err.message : 'Send failed' }, 500)
  }
}

export const config: Config = {
  path: '/api/email/send',
}
