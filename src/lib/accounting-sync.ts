import type { AppState, IntegrationCredentials, Invoice } from './types'

export async function startQuickBooksOAuth(): Promise<string> {
  const origin = window.location.origin
  const res = await fetch(`/api/quickbooks/oauth/start?origin=${encodeURIComponent(origin)}`)
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'QuickBooks OAuth start failed')
  return data.url as string
}

export async function exchangeQuickBooksOAuthCode(code: string) {
  const res = await fetch(`/api/quickbooks/oauth/token?code=${encodeURIComponent(code)}`)
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'QuickBooks token exchange failed')
  return data as { refreshToken: string; realmId: string; companyName: string }
}

export async function startXeroOAuth(): Promise<string> {
  const origin = window.location.origin
  const res = await fetch(`/api/xero/oauth/start?origin=${encodeURIComponent(origin)}`)
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Xero OAuth start failed')
  return data.url as string
}

export async function exchangeXeroOAuthCode(code: string) {
  const res = await fetch(`/api/xero/oauth/token?code=${encodeURIComponent(code)}`)
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Xero token exchange failed')
  return data as { refreshToken: string; tenantId: string; tenantName: string }
}

function invoicePayload(invoice: Invoice, state: AppState) {
  const client = state.clients.find((c) => c.id === invoice.clientId)
  return {
    id: invoice.id,
    number: invoice.number,
    clientId: invoice.clientId,
    clientName: invoice.clientName,
    clientEmail: client?.email,
    total: invoice.total,
    issueDate: invoice.issueDate,
    dueDate: invoice.dueDate,
    paidAt: invoice.paidAt,
    lineItems: invoice.lineItems.map((li) => ({ description: li.description, amount: li.amount })),
  }
}

export async function syncQuickBooks(state: AppState, credentials: IntegrationCredentials) {
  const meta = state.bookkeepingSyncMeta
  const invoices = state.invoices
    .filter((i) => i.status === 'paid' && !meta.quickbooksInvoiceMap[i.id])
    .map((i) => invoicePayload(i, state))
  const expenses = state.expenses
    .filter((e) => !meta.quickbooksExpenseMap[e.id])
    .map((e) => ({
      id: e.id,
      description: e.description,
      amount: e.amount,
      date: e.date,
      category: e.category,
    }))

  const res = await fetch('/api/quickbooks/sync', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      credentials,
      invoices,
      expenses,
      customerMap: meta.quickbooksCustomerMap,
      invoiceMap: meta.quickbooksInvoiceMap,
      expenseMap: meta.quickbooksExpenseMap,
    }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'QuickBooks sync failed')
  return data as {
    syncedInvoices: number
    syncedExpenses: number
    customerMap: Record<string, string>
    invoiceMap: Record<string, string>
    expenseMap: Record<string, string>
    refreshToken?: string
    syncedAt: string
  }
}

export async function syncXero(state: AppState, credentials: IntegrationCredentials) {
  const meta = state.bookkeepingSyncMeta
  const invoices = state.invoices
    .filter((i) => i.status === 'paid' && !meta.xeroInvoiceMap[i.id])
    .map((i) => invoicePayload(i, state))
  const expenses = state.expenses
    .filter((e) => !meta.xeroExpenseMap[e.id])
    .map((e) => ({
      id: e.id,
      description: e.description,
      amount: e.amount,
      date: e.date,
      category: e.category,
    }))

  const res = await fetch('/api/xero/sync', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      credentials,
      invoices,
      expenses,
      contactMap: meta.xeroContactMap,
      invoiceMap: meta.xeroInvoiceMap,
      expenseMap: meta.xeroExpenseMap,
    }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Xero sync failed')
  return data as {
    syncedInvoices: number
    syncedExpenses: number
    contactMap: Record<string, string>
    invoiceMap: Record<string, string>
    expenseMap: Record<string, string>
    refreshToken?: string
    syncedAt: string
  }
}

export async function syncAccountingIfEnabled(
  state: AppState,
  credentials: IntegrationCredentials,
  onUpdate: (patch: {
    credentials?: Partial<IntegrationCredentials>
    bookkeeping?: Partial<AppState['bookkeepingSyncMeta']>
  }) => void,
) {
  const results: string[] = []

  if (state.integrations.quickbooksLiveSync && credentials.quickbooksRefreshToken) {
    const qb = await syncQuickBooks(state, credentials)
    onUpdate({
      credentials: qb.refreshToken ? { quickbooksRefreshToken: qb.refreshToken } : undefined,
      bookkeeping: {
        quickbooksCustomerMap: qb.customerMap,
        quickbooksInvoiceMap: qb.invoiceMap,
        quickbooksExpenseMap: qb.expenseMap,
        quickbooksLastSyncedAt: qb.syncedAt,
      },
    })
    results.push(`QuickBooks: ${qb.syncedInvoices} invoices, ${qb.syncedExpenses} expenses`)
  }

  if (state.integrations.xeroLiveSync && credentials.xeroRefreshToken) {
    const xero = await syncXero(state, credentials)
    onUpdate({
      credentials: xero.refreshToken ? { xeroRefreshToken: xero.refreshToken } : undefined,
      bookkeeping: {
        xeroContactMap: xero.contactMap,
        xeroInvoiceMap: xero.invoiceMap,
        xeroExpenseMap: xero.expenseMap,
        xeroLastSyncedAt: xero.syncedAt,
      },
    })
    results.push(`Xero: ${xero.syncedInvoices} invoices, ${xero.syncedExpenses} expenses`)
  }

  return results
}
