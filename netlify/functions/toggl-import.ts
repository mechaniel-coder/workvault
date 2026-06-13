import type { Config } from '@netlify/functions'
import { jsonResponse } from './_shared/integrations'

export default async (req: Request) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 })

  try {
    const body = await req.json() as {
      apiToken: string
      workspaceId?: string
      since?: string
    }

    if (!body.apiToken) return jsonResponse({ error: 'Toggl API token required' }, 400)

    const auth = Buffer.from(`${body.apiToken}:api_token`).toString('base64')
    const since = body.since || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const params = new URLSearchParams({ start_date: since })
    if (body.workspaceId) params.set('workspace_id', body.workspaceId)

    const res = await fetch(`https://api.track.toggl.com/api/v9/me/time_entries?${params}`, {
      headers: { Authorization: `Basic ${auth}` },
    })
    const entries = await res.json()
    if (!res.ok) throw new Error(entries.message || entries.description || 'Toggl fetch failed')

    const mapped = (Array.isArray(entries) ? entries : []).map((e: {
      id: number
      description: string
      project_id: number | null
      start: string
      stop: string | null
      duration: number
      billable: boolean
    }) => ({
      externalId: String(e.id),
      description: e.description || 'Toggl entry',
      projectName: e.project_id ? `Toggl Project ${e.project_id}` : 'Toggl',
      startTime: e.start,
      endTime: e.stop || e.start,
      durationMinutes: Math.max(1, Math.round((e.duration > 0 ? e.duration : 0) / 60)),
      billable: e.billable,
      source: 'toggl' as const,
    }))

    return jsonResponse({ entries: mapped, importedAt: new Date().toISOString() })
  } catch (err) {
    return jsonResponse({ error: err instanceof Error ? err.message : 'Toggl import failed' }, 500)
  }
}

export const config: Config = {
  path: '/api/toggl/import',
}
