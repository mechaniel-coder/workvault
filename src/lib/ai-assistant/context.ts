import type { AppState } from '../types'
import { computeInvoiceStatus } from '../utils'

export function buildAppContext(state: AppState, pathname: string): string {
  const overdue = state.invoices.filter((i) => computeInvoiceStatus(i) === 'overdue')
  const outstanding = state.invoices.filter((i) => i.status === 'sent' || computeInvoiceStatus(i) === 'overdue')
  const activeTimer = state.activeTimer
    ? state.timeEntries.find((e) => e.id === state.activeTimer!.entryId)
    : null

  const stageCounts = state.projects.reduce<Record<string, number>>((acc, p) => {
    acc[p.stage] = (acc[p.stage] || 0) + 1
    return acc
  }, {})

  const lines = [
    `Page: ${pathname}`,
    `Business: ${state.profile.name || 'Unnamed'} (${state.profile.defaultCurrency}, $${state.profile.defaultHourlyRate}/hr)`,
    `Clients: ${state.clients.length}`,
    `Projects: ${state.projects.length}${Object.keys(stageCounts).length ? ` (${Object.entries(stageCounts).map(([s, n]) => `${s}:${n}`).join(', ')})` : ''}`,
    `Invoices: ${state.invoices.length} (outstanding: ${outstanding.length}, overdue: ${overdue.length})`,
    `Contracts: ${state.contracts.length} (unsigned: ${state.contracts.filter((c) => c.status !== 'signed').length})`,
    `Time entries: ${state.timeEntries.length}`,
    `Scope entries: ${state.scopeEntries.length} (unbilled billable hrs: ${state.scopeEntries.filter((e) => e.billable && !e.invoiced).reduce((s, e) => s + e.estimatedHours, 0).toFixed(1)})`,
    `Active timer: ${activeTimer ? `${activeTimer.projectName} for ${activeTimer.clientName}` : 'none'}`,
  ]

  if (state.clients.length > 0) {
    lines.push(`Recent clients: ${state.clients.slice(0, 8).map((c) => `${c.name} (${c.id})`).join('; ')}`)
  }
  if (state.projects.length > 0) {
    lines.push(`Recent projects: ${state.projects.slice(-8).map((p) => `${p.title} [${p.stage}] (${p.id})`).join('; ')}`)
  }

  return lines.join('\n')
}
