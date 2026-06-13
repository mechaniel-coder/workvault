import type { Config } from '@netlify/functions'
import { jsonResponse } from './_shared/integrations'
import { refreshGoogleToken } from './_shared/oauth-helpers'

function headerValue(headers: { name: string; value: string }[], name: string) {
  return headers.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value || ''
}

export default async (req: Request) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 })

  try {
    const body = await req.json() as {
      refreshToken: string
      clientEmails?: string[]
      maxResults?: number
    }

    if (!body.refreshToken) return jsonResponse({ error: 'Gmail not connected' }, 400)

    const tokens = await refreshGoogleToken(body.refreshToken)
    const maxResults = body.maxResults || 20
    const clientEmails = (body.clientEmails || []).filter(Boolean)

    let query = ''
    if (clientEmails.length > 0) {
      query = clientEmails.map((e) => `from:${e} OR to:${e}`).join(' OR ')
    }

    const listUrl = new URL('https://gmail.googleapis.com/gmail/v1/users/me/messages')
    listUrl.searchParams.set('maxResults', String(maxResults))
    if (query) listUrl.searchParams.set('q', query)

    const listRes = await fetch(listUrl, {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    })
    const listData = await listRes.json()
    if (!listRes.ok) return jsonResponse({ error: listData.error?.message || 'Inbox fetch failed' }, listRes.status)

    const messages = listData.messages || []
    const threads = await Promise.all(messages.slice(0, maxResults).map(async (msg: { id: string; threadId: string }) => {
      const detailRes = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=metadata&metadataHeaders=From&metadataHeaders=To&metadataHeaders=Subject&metadataHeaders=Date`, {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      })
      const detail = await detailRes.json()
      const headers = detail.payload?.headers || []
      const from = headerValue(headers, 'From')
      const to = headerValue(headers, 'To')
      const subject = headerValue(headers, 'Subject')
      const date = headerValue(headers, 'Date')
      const emailMatch = clientEmails.find((e) => from.toLowerCase().includes(e.toLowerCase()) || to.toLowerCase().includes(e.toLowerCase()))
      return {
        id: msg.id,
        threadId: msg.threadId,
        from,
        to,
        subject,
        snippet: detail.snippet || '',
        date: date || new Date(Number(detail.internalDate)).toISOString(),
        clientEmail: emailMatch || null,
        unread: (detail.labelIds || []).includes('UNREAD'),
      }
    }))

    return jsonResponse({ threads })
  } catch (err) {
    return jsonResponse({ error: err instanceof Error ? err.message : 'Inbox fetch failed' }, 500)
  }
}

export const config: Config = {
  path: '/api/gmail/inbox',
}
