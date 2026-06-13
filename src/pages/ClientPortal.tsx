import { useEffect, useState } from 'react'
import { apiFetch } from '../lib/api-client'
import { useParams } from 'react-router-dom'
import { FileText, Receipt, Loader2 } from 'lucide-react'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { formatCurrency, formatDate } from '../lib/utils'

interface PortalData {
  clientName: string
  contractorName: string
  invoices: { number: string; title: string; total: number; status: string; dueDate: string; currency: string }[]
  contracts: { number: string; title: string; status: string; value: number; currency: string }[]
  updatedAt: string
}

export default function ClientPortal() {
  const { token } = useParams<{ token: string }>()
  const [data, setData] = useState<PortalData | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token) return
    apiFetch(`/api/portal/${token}`)
      .then(async (res) => {
        if (!res.ok) throw new Error('Portal not found or expired')
        return res.json() as Promise<PortalData>
      })
      .then(setData)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }, [token])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-50">
        <Loader2 className="animate-spin text-brand-600" size={32} />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-50 p-6">
        <Card className="max-w-md w-full p-8 text-center">
          <h1 className="text-xl font-semibold text-surface-900 mb-2">Portal Unavailable</h1>
          <p className="text-surface-500 text-sm">{error || 'This client portal link is invalid or has expired.'}</p>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-surface-50 to-brand-50/30">
      <header className="border-b border-surface-200 bg-white/80 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-brand-600 mb-1">Client Portal</p>
          <h1 className="text-2xl font-bold text-surface-900">{data.clientName}</h1>
          <p className="text-sm text-surface-500 mt-1">Powered by {data.contractorName}</p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-8">
        <section>
          <h2 className="text-lg font-semibold text-surface-900 flex items-center gap-2 mb-4">
            <Receipt size={18} /> Invoices
          </h2>
          {data.invoices.length === 0 ? (
            <p className="text-sm text-surface-400">No invoices yet.</p>
          ) : (
            <div className="space-y-3">
              {data.invoices.map((inv) => (
                <Card key={inv.number} className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-surface-900">{inv.number} — {inv.title}</p>
                    <p className="text-xs text-surface-400">Due {formatDate(inv.dueDate)}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-surface-900">{formatCurrency(inv.total, inv.currency)}</p>
                    <Badge status={inv.status}>{inv.status}</Badge>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </section>

        <section>
          <h2 className="text-lg font-semibold text-surface-900 flex items-center gap-2 mb-4">
            <FileText size={18} /> Contracts
          </h2>
          {data.contracts.length === 0 ? (
            <p className="text-sm text-surface-400">No contracts yet.</p>
          ) : (
            <div className="space-y-3">
              {data.contracts.map((c) => (
                <Card key={c.number} className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-surface-900">{c.number} — {c.title}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-surface-900">{formatCurrency(c.value, c.currency)}</p>
                    <Badge status={c.status}>{c.status}</Badge>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </section>

        <p className="text-xs text-center text-surface-400">
          Last updated {formatDate(data.updatedAt)}
        </p>
      </main>
    </div>
  )
}
