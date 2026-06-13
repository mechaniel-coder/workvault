import type { AppState, Client } from './types'
import { computeInvoiceStatus } from './utils'

export async function publishClientPortal(
  token: string,
  client: Client,
  state: AppState
): Promise<boolean> {
  const invoices = state.invoices
    .filter((i) => i.clientId === client.id)
    .map((i) => ({
      number: i.number,
      title: i.lineItems[0]?.description || 'Invoice',
      total: i.total,
      status: computeInvoiceStatus(i),
      dueDate: i.dueDate,
      currency: state.profile.defaultCurrency,
    }))

  const contracts = state.contracts
    .filter((c) => c.clientId === client.id)
    .map((c) => ({
      number: c.number,
      title: c.title,
      status: c.status,
      value: c.value,
      currency: state.profile.defaultCurrency,
    }))

  try {
    const res = await fetch(`/api/portal/${token}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clientName: client.name,
        contractorName: state.profile.name || 'Your contractor',
        invoices,
        contracts,
      }),
    })
    return res.ok
  } catch {
    return false
  }
}

export function getPortalUrl(token: string): string {
  return `${window.location.origin}/portal/${token}`
}
