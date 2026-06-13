import type { AppState, BankTransaction, IntegrationCredentials, Invoice } from './types'

export async function createPlaidLinkToken(userId?: string): Promise<string> {
  const res = await fetch('/api/plaid/link-token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Could not create Plaid link token')
  return data.linkToken as string
}

export async function exchangePlaidPublicToken(publicToken: string) {
  const res = await fetch('/api/plaid/exchange', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ publicToken }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Plaid connection failed')
  return data as {
    accessToken: string
    itemId: string
    accountId: string
    accountName: string
    institutionName: string
  }
}

export async function fetchPlaidTransactions(
  credentials: IntegrationCredentials,
  cursor?: string | null,
  accountId?: string,
) {
  const res = await fetch('/api/plaid/transactions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      accessToken: credentials.plaidAccessToken,
      cursor,
      accountId,
    }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Failed to fetch transactions')
  return data as {
    transactions: {
      plaidTransactionId: string
      date: string
      name: string
      amount: number
      currency: string
    }[]
    cursor: string | null
    hasMore: boolean
    fetchedAt: string
  }
}

export function suggestInvoiceMatch(
  txn: { name: string; amount: number; date: string },
  invoices: Invoice[],
): { invoice: Invoice; confidence: 'high' | 'medium' | 'low' } | null {
  const open = invoices.filter((i) => i.status === 'sent' || i.status === 'overdue')
  const exact = open.find((i) => Math.abs(i.total - txn.amount) < 0.01)
  if (exact) {
    const nameMatch = txn.name.toLowerCase().includes(exact.clientName.toLowerCase())
      || txn.name.includes(exact.number)
    return { invoice: exact, confidence: nameMatch ? 'high' : 'medium' }
  }

  const close = open.find((i) => Math.abs(i.total - txn.amount) <= 1)
  if (close) return { invoice: close, confidence: 'low' }
  return null
}

export function buildBankTransactionFromPlaid(
  txn: { plaidTransactionId: string; date: string; name: string; amount: number; currency: string },
  invoices: Invoice[],
  existingIds: Set<string>,
): Omit<BankTransaction, 'id' | 'createdAt'> {
  if (existingIds.has(txn.plaidTransactionId)) {
    throw new Error('duplicate')
  }
  const match = suggestInvoiceMatch(txn, invoices)
  return {
    plaidTransactionId: txn.plaidTransactionId,
    date: txn.date,
    name: txn.name,
    amount: txn.amount,
    currency: txn.currency,
    matchedInvoiceId: match?.invoice.id ?? null,
    matchConfidence: match?.confidence ?? null,
    ignored: false,
  }
}

export function matchTransactionsToInvoices(state: AppState) {
  return state.bankTransactions
    .filter((t) => !t.matchedInvoiceId && !t.ignored)
    .map((t) => {
      const match = suggestInvoiceMatch(t, state.invoices)
      return match ? { transactionId: t.id, invoiceId: match.invoice.id, confidence: match.confidence } : null
    })
    .filter(Boolean) as { transactionId: string; invoiceId: string; confidence: 'high' | 'medium' | 'low' }[]
}

declare global {
  interface Window {
    Plaid?: {
      create: (config: {
        token: string
        onSuccess: (publicToken: string, metadata: unknown) => void
        onExit: (err: unknown, metadata: unknown) => void
      }) => { open: () => void }
    }
  }
}

export function loadPlaidScript(): Promise<void> {
  if (window.Plaid) return Promise.resolve()
  return new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = 'https://cdn.plaid.com/link/v2/stable/link-initialize.js'
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Failed to load Plaid Link'))
    document.head.appendChild(script)
  })
}

export async function openPlaidLink(userId: string, onSuccess: (publicToken: string) => void) {
  await loadPlaidScript()
  const token = await createPlaidLinkToken(userId)
  const handler = window.Plaid!.create({
    token,
    onSuccess: (publicToken) => onSuccess(publicToken),
    onExit: () => {},
  })
  handler.open()
}
