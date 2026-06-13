import type { AppState, IntegrationCredentials, TimeEntry } from './types'

export type ImportedTimeEntry = {
  externalId: string
  description: string
  projectName: string
  clientName?: string
  startTime: string
  endTime: string
  durationMinutes: number
  billable: boolean
  source: 'toggl' | 'harvest'
}

export async function importFromToggl(credentials: IntegrationCredentials, since?: string) {
  const res = await fetch('/api/toggl/import', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      apiToken: credentials.togglApiToken,
      workspaceId: credentials.togglWorkspaceId || undefined,
      since,
    }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Toggl import failed')
  return data.entries as ImportedTimeEntry[]
}

export async function importFromHarvest(credentials: IntegrationCredentials, from?: string, to?: string) {
  const res = await fetch('/api/harvest/import', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      accessToken: credentials.harvestAccessToken,
      accountId: credentials.harvestAccountId,
      from,
      to,
    }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Harvest import failed')
  return data.entries as ImportedTimeEntry[]
}

export function mergeImportedEntries(
  state: AppState,
  imported: ImportedTimeEntry[],
  defaultClientId: string,
  hourlyRate: number,
): Omit<TimeEntry, 'id' | 'createdAt'>[] {
  const existing = new Set(state.timeEntries.map((e) => e.externalId).filter(Boolean))
  return imported
    .filter((e) => !existing.has(e.externalId))
    .map((e) => {
      const client = state.clients.find((c) => c.name === e.clientName)
      return {
        projectId: '',
        projectName: e.projectName,
        clientId: client?.id || defaultClientId,
        clientName: client?.name || e.clientName || 'Imported',
        description: e.description,
        startTime: e.startTime,
        endTime: e.endTime,
        durationMinutes: e.durationMinutes,
        hourlyRate,
        billable: e.billable,
        invoiced: false,
        source: e.source,
        externalId: e.externalId,
      }
    })
}
