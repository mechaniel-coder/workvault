import type { Config } from '@netlify/functions'
import { jsonResponse } from './_shared/integrations'
import { refreshXeroToken } from './_shared/oauth-helpers'

type SyncInvoice = {
  id: string
  number: string
  clientId: string
  clientName: string
  clientEmail?: string
  total: number
  issueDate: string
  dueDate: string
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

async function xeroRequest(tenantId: string, accessToken: string, path: string, method: string, body?: unknown) {
  const res = await fetch(`https://api.xero.com/api.xro/2.0/${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'Xero-tenant-id': tenantId,
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.Message || data.Detail || 'Xero API error')
  return data
}

export default async (req: Request) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 })

  try {
    const body = await req.json() as {
      credentials: { xeroRefreshToken?: string; xeroTenantId?: string }
      invoices: SyncInvoice[]
      expenses: SyncExpense[]
      contactMap: Record<string, string>
      invoiceMap: Record<string, string>
      expenseMap: Record<string, string>
    }

    const refreshToken = body.credentials.xeroRefreshToken || ''
    const tenantId = body.credentials.xeroTenantId || ''
    if (!refreshToken || !tenantId) return jsonResponse({ error: 'Xero not connected' }, 400)

    const tokens = await refreshXeroToken(refreshToken)
    const accessToken = tokens.access_token
    const contactMap = { ...body.contactMap }
    const invoiceMap = { ...body.invoiceMap }
    const expenseMap = { ...body.expenseMap }
    let syncedInvoices = 0
    let syncedExpenses = 0

    for (const invoice of body.invoices) {
      if (invoiceMap[invoice.id]) continue

      let contactId = contactMap[invoice.clientId]
      if (!contactId) {
        const created = await xeroRequest(tenantId, accessToken, 'Contacts', 'POST', {
          Contacts: [{
            Name: invoice.clientName,
            EmailAddress: invoice.clientEmail || undefined,
          }],
        })
        contactId = created.Contacts?.[0]?.ContactID
        if (contactId) contactMap[invoice.clientId] = contactId
      }

      const createdInv = await xeroRequest(tenantId, accessToken, 'Invoices', 'POST', {
        Invoices: [{
          Type: 'ACCREC',
          Contact: { ContactID: contactId },
          Date: invoice.issueDate.split('T')[0],
          DueDate: invoice.dueDate.split('T')[0],
          InvoiceNumber: invoice.number,
          Status: invoice.paidAt ? 'PAID' : 'AUTHORISED',
          LineItems: invoice.lineItems.length > 0
            ? invoice.lineItems.map((li) => ({
              Description: li.description,
              Quantity: 1,
              UnitAmount: li.amount,
              AccountCode: '200',
            }))
            : [{
              Description: `Invoice ${invoice.number}`,
              Quantity: 1,
              UnitAmount: invoice.total,
              AccountCode: '200',
            }],
        }],
      })
      const xeroInvoiceId = createdInv.Invoices?.[0]?.InvoiceID
      if (xeroInvoiceId) {
        invoiceMap[invoice.id] = xeroInvoiceId
        syncedInvoices++
      }
    }

    for (const expense of body.expenses) {
      if (expenseMap[expense.id]) continue
      const created = await xeroRequest(tenantId, accessToken, 'BankTransactions', 'POST', {
        BankTransactions: [{
          Type: 'SPEND',
          Contact: { Name: 'WorkVault Expense' },
          Date: expense.date.split('T')[0],
          LineItems: [{
            Description: expense.description,
            Quantity: 1,
            UnitAmount: expense.amount,
            AccountCode: '400',
          }],
        }],
      })
      const txnId = created.BankTransactions?.[0]?.BankTransactionID
      if (txnId) {
        expenseMap[expense.id] = txnId
        syncedExpenses++
      }
    }

    return jsonResponse({
      syncedInvoices,
      syncedExpenses,
      contactMap,
      invoiceMap,
      expenseMap,
      refreshToken: tokens.refresh_token || refreshToken,
      syncedAt: new Date().toISOString(),
    })
  } catch (err) {
    return jsonResponse({ error: err instanceof Error ? err.message : 'Xero sync failed' }, 500)
  }
}

export const config: Config = {
  path: '/api/xero/sync',
}
