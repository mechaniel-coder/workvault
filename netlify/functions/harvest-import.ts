import type { Config } from '@netlify/functions'
import { jsonResponse } from './_shared/integrations'

export default async (req: Request) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 })

  try {
    const body = await req.json() as {
      accessToken: string
      accountId: string
      from?: string
      to?: string
    }

    if (!body.accessToken || !body.accountId) {
      return jsonResponse({ error: 'Harvest access token and account ID required' }, 400)
    }

    const from = body.from || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const to = body.to || new Date().toISOString().split('T')[0]
    const params = new URLSearchParams({ from, to })

    const res = await fetch(`https://api.harvestapp.com/v2/time_entries?${params}`, {
      headers: {
        Authorization: `Bearer ${body.accessToken}`,
        'Harvest-Account-Id': body.accountId,
        'User-Agent': 'WorkVault',
      },
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.message || 'Harvest fetch failed')

    const mapped = (data.time_entries || []).map((e: {
      id: number
      notes: string
      project: { name: string } | null
      client: { name: string } | null
      spent_date: string
      started_time: string | null
      ended_time: string | null
      hours: number
      billable: boolean
    }) => ({
      externalId: String(e.id),
      description: e.notes || 'Harvest entry',
      projectName: e.project?.name || 'Harvest',
      clientName: e.client?.name || '',
      startTime: e.started_time ? `${e.spent_date}T${e.started_time}` : `${e.spent_date}T09:00:00`,
      endTime: e.ended_time ? `${e.spent_date}T${e.ended_time}` : `${e.spent_date}T10:00:00`,
      durationMinutes: Math.max(1, Math.round(e.hours * 60)),
      billable: e.billable,
      source: 'harvest' as const,
    }))

    return jsonResponse({ entries: mapped, importedAt: new Date().toISOString() })
  } catch (err) {
    return jsonResponse({ error: err instanceof Error ? err.message : 'Harvest import failed' }, 500)
  }
}

export const config: Config = {
  path: '/api/harvest/import',
}
