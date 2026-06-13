import type { Config } from '@netlify/functions'
import { getEnv, jsonResponse } from './_shared/integrations'
import { refreshQuickBooksToken } from './_shared/oauth-helpers'

type SyncInvoice = {
  id: string
  number: string
  clientId: string
  clientName: string
  clientEmail?: string
  total: number
  issueDate: string
  paidAt: string | null
  lineItems: { description: string; amount: number }[]
}

type SyncExpense = {
  id: string
  description: string
  amount: number
  date: string
  category: string
}

async function qbRequest(realmId: string, accessToken: string, path: string, method: string, body?: unknown) {
  const res = await fetch(`https://quickbooks.api.intuit.com/v3/company/${realmId}/${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.Fault?.Error?.[0]?.Message || data.message || 'QuickBooks API error')
  return data
}

export default async (req: Request) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 })

  try {
    const body = await req.json() as {
      credentials: {
        quickbooksRefreshToken?: string
        quickbooksRealmId?: string
      }
      invoices: SyncInvoice[]
      expenses: SyncExpense[]
      customerMap: Record<string, string>
      invoiceMap: Record<string, string>
      expenseMap: Record<string, string>
    }

    const refreshToken = body.credentials.quickbooksRefreshToken || ''
    const realmId = body.credentials.quickbooksRealmId || ''
    if (!refreshToken || !realmId) return jsonResponse({ error: 'QuickBooks not connected' }, 400)

    const tokens = await refreshQuickBooksToken(refreshToken)
    const accessToken = tokens.access_token
    const customerMap = { ...body.customerMap }
    const invoiceMap = { ...body.invoiceMap }
    const expenseMap = { ...body.expenseMap }
    let syncedInvoices = 0
    let syncedExpenses = 0

    for (const invoice of body.invoices) {
      if (invoiceMap[invoice.id]) continue

      let customerId = customerMap[invoice.clientId]
      if (!customerId) {
        const created = await qbRequest(realmId, accessToken, 'customer', 'POST', {
          DisplayName: invoice.clientName,
          PrimaryEmailAddr: invoice.clientEmail ? { Address: invoice.clientEmail } : undefined,
        })
        customerId = created.Customer?.Id
        if (customerId) customerMap[invoice.clientId] = customerId
      }

      const receipt = await qbRequest(realmId, accessToken, 'salesreceipt', 'POST', {
        CustomerRef: { value: customerId },
        TxnDate: (invoice.paidAt || invoice.issueDate).split('T')[0],
        DocNumber: invoice.number,
        Line: invoice.lineItems.length > 0
          ? invoice.lineItems.map((li) => ({
            Amount: li.amount,
            DetailType: 'SalesItemLineDetail',
            Description: li.description,
            SalesItemLineDetail: { Qty: 1, UnitPrice: li.amount },
          }))
          : [{
            Amount: invoice.total,
            DetailType: 'SalesItemLineDetail',
            Description: `Invoice ${invoice.number}`,
            SalesItemLineDetail: { Qty: 1, UnitPrice: invoice.total },
          }],
        PrivateNote: `WorkVault invoice ${invoice.id}`,
      })
      if (receipt.SalesReceipt?.Id) {
        invoiceMap[invoice.id] = receipt.SalesReceipt.Id
        syncedInvoices++
      }
    }

    for (const expense of body.expenses) {
      if (expenseMap[expense.id]) continue
      const purchase = await qbRequest(realmId, accessToken, 'purchase', 'POST', {
        PaymentType: 'Cash',
        TxnDate: expense.date.split('T')[0],
        Line: [{
          Amount: expense.amount,
          DetailType: 'AccountBasedExpenseLineDetail',
          Description: expense.description,
          AccountBasedExpenseLineDetail: {
            AccountRef: { value: getEnv('QUICKBOOKS_EXPENSE_ACCOUNT_ID') || '7' },
          },
        }],
        PrivateNote: `WorkVault expense ${expense.id} · ${expense.category}`,
      })
      if (purchase.Purchase?.Id) {
        expenseMap[expense.id] = purchase.Purchase.Id
        syncedExpenses++
      }
    }

    return jsonResponse({
      syncedInvoices,
      syncedExpenses,
      customerMap,
      invoiceMap,
      expenseMap,
      refreshToken: tokens.refresh_token || refreshToken,
      syncedAt: new Date().toISOString(),
    })
  } catch (err) {
    return jsonResponse({ error: err instanceof Error ? err.message : 'QuickBooks sync failed' }, 500)
  }
}

export const config: Config = {
  path: '/api/quickbooks/sync',
}
