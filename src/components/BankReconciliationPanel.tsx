import { useState } from 'react'
import { Building2, Link2, Loader2, RefreshCw, CheckCircle, X } from 'lucide-react'
import { useStore } from '../context/StoreContext'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import {
  buildBankTransactionFromPlaid,
  exchangePlaidPublicToken,
  fetchPlaidTransactions,
  openPlaidLink,
  suggestInvoiceMatch,
} from '../lib/plaid-api'
import { formatCurrency, formatDate } from '../lib/utils'
import { syncAccountingIfEnabled } from '../lib/accounting-sync'

export function BankReconciliationPanel() {
  const {
    state, updateIntegrationCredentials, updatePlaidSyncMeta,
    addBankTransaction, updateBankTransaction, updateInvoice,
    updateBookkeepingSyncMeta,
  } = useStore()
  const [busy, setBusy] = useState('')
  const [status, setStatus] = useState('')

  const connectBank = async () => {
    setBusy('connect')
    setStatus('')
    try {
      await openPlaidLink(state.profile.email || 'workvault-user', async (publicToken) => {
        const result = await exchangePlaidPublicToken(publicToken)
        updateIntegrationCredentials({ plaidAccessToken: result.accessToken })
        updatePlaidSyncMeta({
          connected: true,
          itemId: result.itemId,
          accountId: result.accountId,
          accountName: result.accountName,
          institutionName: result.institutionName,
        })
        setStatus(`Connected ${result.institutionName} · ${result.accountName}`)
      })
    } catch (e) {
      setStatus(e instanceof Error ? e.message : 'Bank connection failed')
    } finally {
      setBusy('')
    }
  }

  const fetchTransactions = async () => {
    if (!state.integrationCredentials.plaidAccessToken) {
      setStatus('Connect a bank account first')
      return
    }
    setBusy('fetch')
    setStatus('')
    try {
      const result = await fetchPlaidTransactions(
        state.integrationCredentials,
        state.plaidSyncMeta.cursor,
        state.plaidSyncMeta.accountId,
      )
      const existing = new Set(state.bankTransactions.map((t) => t.plaidTransactionId))
      let added = 0
      for (const txn of result.transactions) {
        try {
          const row = buildBankTransactionFromPlaid(txn, state.invoices, existing)
          addBankTransaction(row)
          existing.add(txn.plaidTransactionId)
          added++
        } catch {
          // duplicate
        }
      }
      updatePlaidSyncMeta({ cursor: result.cursor, lastFetchedAt: result.fetchedAt })

      if (state.integrations.plaidAutoMatch) {
        applyHighConfidenceMatches()
      }
      setStatus(`Imported ${added} new transaction${added !== 1 ? 's' : ''}`)
    } catch (e) {
      setStatus(e instanceof Error ? e.message : 'Fetch failed')
    } finally {
      setBusy('')
    }
  }

  const applyHighConfidenceMatches = () => {
    let matched = 0
    state.bankTransactions.forEach((t) => {
      if (t.matchedInvoiceId || t.ignored) return
      const match = suggestInvoiceMatch(t, state.invoices)
      if (match?.confidence !== 'high') return
      updateBankTransaction(t.id, { matchedInvoiceId: match.invoice.id, matchConfidence: 'high' })
      updateInvoice(match.invoice.id, { status: 'paid', paidAt: t.date })
      matched++
    })
    if (matched > 0) setStatus(`Auto-matched ${matched} invoice${matched !== 1 ? 's' : ''}`)
  }

  const matchToInvoice = async (transactionId: string, invoiceId: string) => {
    updateBankTransaction(transactionId, { matchedInvoiceId: invoiceId, matchConfidence: 'high' })
    updateInvoice(invoiceId, { status: 'paid', paidAt: new Date().toISOString() })

    if (state.integrations.quickbooksLiveSync || state.integrations.xeroLiveSync) {
      try {
        await syncAccountingIfEnabled(state, state.integrationCredentials, ({ credentials, bookkeeping }) => {
          if (credentials) updateIntegrationCredentials(credentials)
          if (bookkeeping) updateBookkeepingSyncMeta(bookkeeping)
        })
      } catch {
        // non-blocking
      }
    }
    setStatus('Invoice marked paid from bank deposit')
  }

  const openInvoices = state.invoices.filter((i) => i.status === 'sent' || i.status === 'overdue')
  const pending = state.bankTransactions.filter((t) => !t.matchedInvoiceId && !t.ignored)

  return (
    <div className="space-y-4">
      {status && (
        <Card className="p-4 border-brand-200 bg-brand-50/50">
          <p className="text-sm text-brand-800">{status}</p>
        </Card>
      )}

      <Card className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
          <div>
            <h2 className="text-base font-semibold text-surface-900 flex items-center gap-2">
              <Building2 size={18} className="text-emerald-600" /> Bank Reconciliation
            </h2>
            <p className="text-sm text-surface-500 mt-1">
              Connect your business bank via Plaid and match incoming deposits to invoices.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {!state.plaidSyncMeta.connected ? (
              <Button onClick={connectBank} disabled={busy === 'connect'}>
                {busy === 'connect' ? <Loader2 size={16} className="animate-spin" /> : <Link2 size={16} />}
                Connect bank
              </Button>
            ) : (
              <>
                <Badge status="signed">{state.plaidSyncMeta.institutionName}</Badge>
                <Button onClick={fetchTransactions} disabled={busy === 'fetch'}>
                  {busy === 'fetch' ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
                  Import transactions
                </Button>
              </>
            )}
          </div>
        </div>
        {state.plaidSyncMeta.connected && (
          <p className="text-xs text-surface-400">
            {state.plaidSyncMeta.accountName}
            {state.plaidSyncMeta.lastFetchedAt && ` · Last import ${new Date(state.plaidSyncMeta.lastFetchedAt).toLocaleString()}`}
          </p>
        )}
        <p className="text-xs text-surface-500 mt-3">
          Requires <code className="bg-surface-100 px-1 rounded text-[10px]">PLAID_CLIENT_ID</code> and{' '}
          <code className="bg-surface-100 px-1 rounded text-[10px]">PLAID_SECRET</code> in Netlify env.
        </p>
      </Card>

      {pending.length === 0 ? (
        <Card className="p-8 text-center text-sm text-surface-500">
          No unmatched bank deposits. Import transactions after connecting your bank.
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-100 text-left text-surface-500">
                  <th className="px-6 py-3 font-medium">Date</th>
                  <th className="px-6 py-3 font-medium">Description</th>
                  <th className="px-6 py-3 font-medium">Amount</th>
                  <th className="px-6 py-3 font-medium">Suggested match</th>
                  <th className="px-6 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100">
                {pending.map((txn) => {
                  const suggested = openInvoices.find((i) =>
                    Math.abs(i.total - txn.amount) < 0.01
                    || i.number.toLowerCase().includes(txn.name.toLowerCase()),
                  )
                  return (
                    <tr key={txn.id} className="hover:bg-surface-50">
                      <td className="px-6 py-3.5 text-surface-500">{formatDate(txn.date)}</td>
                      <td className="px-6 py-3.5">{txn.name}</td>
                      <td className="px-6 py-3.5 font-medium text-emerald-600">
                        {formatCurrency(txn.amount, txn.currency)}
                      </td>
                      <td className="px-6 py-3.5">
                        {suggested ? (
                          <span className="text-surface-700">
                            {suggested.number} · {suggested.clientName}
                            {txn.matchConfidence && (
                              <Badge status={txn.matchConfidence === 'high' ? 'paid' : 'sent'}>
                                {txn.matchConfidence}
                              </Badge>
                            )}
                          </span>
                        ) : (
                          <span className="text-surface-400">No match</span>
                        )}
                      </td>
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-1">
                          {suggested && (
                            <Button size="sm" variant="secondary" onClick={() => matchToInvoice(txn.id, suggested.id)}>
                              <CheckCircle size={14} /> Match
                            </Button>
                          )}
                          <Button size="sm" variant="ghost" onClick={() => updateBankTransaction(txn.id, { ignored: true })}>
                            <X size={14} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  )
}
