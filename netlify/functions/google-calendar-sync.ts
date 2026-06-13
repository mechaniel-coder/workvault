import type { Config, Context } from '@netlify/functions'
import { getEnv, jsonResponse } from './_shared/integrations'

async function getAccessToken(refreshToken: string) {
  const clientId = getEnv('GOOGLE_CLIENT_ID')
  const clientSecret = getEnv('GOOGLE_CLIENT_SECRET')
  if (!clientId || !clientSecret) {
    throw new Error('Google OAuth not configured')
  }
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error_description || 'Refresh failed')
  return data.access_token as string
}

type CalendarEvent = {
  id: string
  summary: string
  description?: string
  start: { dateTime: string; timeZone: string }
  end: { dateTime: string; timeZone: string }
}

export default async (req: Request, _context: Context) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  try {
    const body = await req.json() as {
      refreshToken: string
      calendarId?: string
      events: CalendarEvent[]
      deleteEventIds?: string[]
      eventMap?: Record<string, string>
    }

    if (!body.refreshToken) {
      return jsonResponse({ error: 'Google refresh token required' }, 400)
    }

    const accessToken = await getAccessToken(body.refreshToken)
    const calendarId = encodeURIComponent(body.calendarId || 'primary')
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
    const newEventMap: Record<string, string> = { ...(body.eventMap || {}) }

    for (const eventId of body.deleteEventIds || []) {
      await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events/${eventId}`,
        { method: 'DELETE', headers: { Authorization: `Bearer ${accessToken}` } },
      )
    }

    const results: { sourceId: string; googleEventId: string }[] = []

    for (const event of body.events) {
      const existingId = body.eventMap?.[event.id]
      const payload = {
        summary: event.summary,
        description: event.description || '',
        start: { dateTime: event.start.dateTime, timeZone: event.start.timeZone || timeZone },
        end: { dateTime: event.end.dateTime, timeZone: event.end.timeZone || timeZone },
      }

      let googleEventId: string
      if (existingId) {
        const res = await fetch(
          `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events/${existingId}`,
          {
            method: 'PATCH',
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
          },
        )
        const data = await res.json()
        if (!res.ok) throw new Error(data.error?.message || 'Update failed')
        googleEventId = data.id
      } else {
        const res = await fetch(
          `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
          },
        )
        const data = await res.json()
        if (!res.ok) throw new Error(data.error?.message || 'Create failed')
        googleEventId = data.id
      }

      newEventMap[event.id] = googleEventId
      results.push({ sourceId: event.id, googleEventId })
    }

    return jsonResponse({
      ok: true,
      synced: results.length,
      eventMap: newEventMap,
      syncedAt: new Date().toISOString(),
    })
  } catch (err) {
    return jsonResponse({ error: err instanceof Error ? err.message : 'Sync failed' }, 500)
  }
}

export const config: Config = {
  path: '/api/google/calendar/sync',
}
