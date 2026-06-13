import type { IntegrationCredentials } from './types'
import { apiFetch } from './api-client'

export async function fetchCalcomBookingLink(credentials: IntegrationCredentials) {
  const res = await apiFetch('/api/scheduling/calcom', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      apiKey: credentials.calcomApiKey || undefined,
      username: credentials.calcomUsername || undefined,
      eventSlug: credentials.calcomEventSlug || undefined,
    }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Cal.com lookup failed')
  return data as { bookingUrl: string; eventTypeName: string; provider: 'calcom' }
}

export async function fetchCalendlyBookingLink(credentials: IntegrationCredentials) {
  const res = await apiFetch('/api/scheduling/calendly', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      apiKey: credentials.calendlyApiKey || undefined,
      eventUri: credentials.calendlyEventUri || undefined,
    }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Calendly lookup failed')
  return data as { bookingUrl: string; eventTypeName: string; provider: 'calendly'; eventUri?: string }
}

export function buildCalcomUrl(username: string, eventSlug: string) {
  return `https://cal.com/${username.replace(/^\//, '')}/${eventSlug.replace(/^\//, '')}`
}
