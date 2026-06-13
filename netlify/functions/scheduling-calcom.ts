import type { Config } from '@netlify/functions'
import { jsonResponse } from './_shared/integrations'

export default async (req: Request) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 })

  try {
    const body = await req.json() as {
      apiKey?: string
      username?: string
      eventSlug?: string
    }

    const apiKey = body.apiKey || process.env.CALCOM_API_KEY
    const username = body.username || process.env.CALCOM_USERNAME
    const eventSlug = body.eventSlug || process.env.CALCOM_EVENT_SLUG

    if (username && eventSlug) {
      return jsonResponse({
        bookingUrl: `https://cal.com/${username}/${eventSlug}`,
        eventTypeName: eventSlug.replace(/-/g, ' '),
        provider: 'calcom',
      })
    }

    if (!apiKey) return jsonResponse({ error: 'Cal.com username + event slug or API key required' }, 400)

    const res = await fetch('https://api.cal.com/v1/event-types', {
      headers: { Authorization: `Bearer ${apiKey}` },
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.message || 'Cal.com API error')

    const event = data.event_types?.[0]
    if (!event) return jsonResponse({ error: 'No event types found' }, 404)

    return jsonResponse({
      bookingUrl: event.link || `https://cal.com/${event.slug}`,
      eventTypeName: event.title || event.slug,
      provider: 'calcom',
    })
  } catch (err) {
    return jsonResponse({ error: err instanceof Error ? err.message : 'Cal.com lookup failed' }, 500)
  }
}

export const config: Config = {
  path: '/api/scheduling/calcom',
}
