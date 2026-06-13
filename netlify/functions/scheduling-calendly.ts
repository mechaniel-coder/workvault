import type { Config } from '@netlify/functions'
import { jsonResponse } from './_shared/integrations'

export default async (req: Request) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 })

  try {
    const body = await req.json() as { apiKey?: string; eventUri?: string }
    const apiKey = body.apiKey || process.env.CALENDLY_API_KEY
    if (!apiKey) return jsonResponse({ error: 'Calendly API key required' }, 400)

    if (body.eventUri) {
      const res = await fetch(body.eventUri, {
        headers: { Authorization: `Bearer ${apiKey}` },
      })
      const event = await res.json()
      if (!res.ok) throw new Error(event.message || 'Calendly event lookup failed')
      return jsonResponse({
        bookingUrl: event.resource?.scheduling_url || event.resource?.url,
        eventTypeName: event.resource?.name || 'Calendly Event',
        provider: 'calendly',
      })
    }

    const meRes = await fetch('https://api.calendly.com/users/me', {
      headers: { Authorization: `Bearer ${apiKey}` },
    })
    const me = await meRes.json()
    if (!meRes.ok) throw new Error(me.message || 'Calendly auth failed')

    const userUri = me.resource?.uri
    const eventsRes = await fetch(`https://api.calendly.com/event_types?user=${encodeURIComponent(userUri)}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    })
    const events = await eventsRes.json()
    const event = events.collection?.[0]
    if (!event) return jsonResponse({ error: 'No Calendly event types found' }, 404)

    return jsonResponse({
      bookingUrl: event.scheduling_url,
      eventTypeName: event.name,
      provider: 'calendly',
      eventUri: event.uri,
    })
  } catch (err) {
    return jsonResponse({ error: err instanceof Error ? err.message : 'Calendly lookup failed' }, 500)
  }
}

export const config: Config = {
  path: '/api/scheduling/calendly',
}
