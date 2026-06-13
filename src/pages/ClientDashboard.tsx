import { Link } from 'react-router-dom'
import {
  FileText, Receipt, Package, CheckCircle2, MessageSquare, ArrowRight,
  AlertTriangle, Kanban, FileSignature,
} from 'lucide-react'
import { useStore } from '../context/StoreContext'
import { useClientApp } from '../context/ClientAppContext'
import { Card, StatCard } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { formatCurrency, formatDate, computeInvoiceStatus } from '../lib/utils'
import { hasProjectTransferContent } from '../lib/demo'

export default function ClientDashboard() {
  const { state } = useStore()
  const app = useClientApp()
  const { profile, contracts, invoices, projects, proposals } = state

  const unpaid = invoices.filter(
    (i) => computeInvoiceStatus(i) === 'sent' || computeInvoiceStatus(i) === 'overdue'
  )
  const pendingContracts = contracts.filter(
    (c) => c.status === 'sent' || c.status === 'awaiting_signature' || c.status === 'partially_signed'
  )
  const pendingProposals = proposals.filter((p) => p.status === 'sent')
  const activeProject = projects[0]
  const hasProject = hasProjectTransferContent(app.projectTransfer) && app.canViewFiles

  const quickLinks = [
    hasProject && { to: `${app.basePath}/project`, icon: Package, label: 'View deliverables', desc: app.projectTransfer.title || 'Your project files' },
    !app.canViewFiles && { to: `${app.basePath}/contracts`, icon: FileText, label: 'Sign contract for file access', desc: 'Files unlock after signing' },
    pendingContracts.length > 0 && { to: `${app.basePath}/contracts`, icon: FileText, label: 'Sign contracts', desc: `${pendingContracts.length} awaiting signature` },
    unpaid.length > 0 && { to: `${app.basePath}/invoices`, icon: Receipt, label: 'Pay invoices', desc: `${unpaid.length} outstanding` },
    { to: `${app.basePath}/review`, icon: CheckCircle2, label: 'Review & approve', desc: 'Checklist and sign-off' },
    { to: `${app.basePath}/messages`, icon: MessageSquare, label: 'Message contractor', desc: 'Ask questions' },
  ].filter(Boolean) as { to: string; icon: typeof Package; label: string; desc: string }[]

  return (
    <div>
      <div className="relative overflow-hidden rounded-2xl gradient-brand p-8 mb-8 shadow-xl shadow-brand-600/20">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.15)_0%,transparent_60%)]" />
        <div className="relative">
          <p className="text-brand-100 text-sm font-medium mb-1">Welcome back, {profile.name.split(' ')[0]}</p>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">{app.label}</h1>
          <p className="text-brand-100/90 text-sm max-w-lg">
            Your project workspace with {app.contractorName}. Review deliverables, sign documents, and pay invoices — all in one place.
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <StatCard label="Outstanding" value={String(unpaid.length)} icon={<Receipt size={18} />} trend={unpaid.length ? formatCurrency(unpaid.reduce((s, i) => s + i.total, 0), profile.defaultCurrency) : 'All paid'} />
        <StatCard label="Contracts" value={String(pendingContracts.length)} icon={<FileText size={18} />} trend="Need attention" />
        <StatCard label="Proposals" value={String(pendingProposals.length)} icon={<FileSignature size={18} />} trend="Awaiting response" />
        <StatCard label="Projects" value={String(projects.length)} icon={<Kanban size={18} />} trend={activeProject?.title || 'Active'} />
      </div>

      {(unpaid.length > 0 || pendingContracts.length > 0) && (
        <Card className="p-5 mb-8 border-amber-200 bg-amber-50/50">
          <h2 className="text-sm font-semibold text-surface-900 flex items-center gap-2 mb-3">
            <AlertTriangle size={16} className="text-amber-600" /> Action needed
          </h2>
          <div className="space-y-2 text-sm">
            {unpaid.map((inv) => (
              <div key={inv.id} className="flex justify-between gap-2">
                <span>Invoice {inv.number} due {formatDate(inv.dueDate)}</span>
                <span className="font-medium">{formatCurrency(inv.total, profile.defaultCurrency)}</span>
              </div>
            ))}
            {pendingContracts.map((c) => (
              <div key={c.id} className="flex justify-between gap-2">
                <span>{c.title}</span>
                <Badge status={c.status}>{c.status}</Badge>
              </div>
            ))}
          </div>
        </Card>
      )}

      {app.clientRoom.milestones.length > 0 && (
        <Card className="p-5 mb-8">
          <h2 className="text-sm font-semibold text-surface-900 flex items-center gap-2 mb-4">
            <Kanban size={16} /> Timeline
          </h2>
          <div className="space-y-3">
            {app.clientRoom.milestones.map((m) => (
              <div key={m.id} className="flex gap-3">
                <div className={`mt-1 h-3 w-3 rounded-full shrink-0 ${m.status === 'done' ? 'bg-emerald-500' : m.status === 'active' ? 'bg-brand-500' : 'bg-surface-300'}`} />
                <div>
                  <p className="text-sm font-medium text-surface-900">{m.title}</p>
                  <p className="text-xs text-surface-400">{formatDate(m.date)}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <h2 className="text-sm font-semibold text-surface-900 mb-4">Quick links</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {quickLinks.map(({ to, icon: Icon, label, desc }) => (
          <Link key={to} to={to} className="group">
            <Card className="p-4 flex items-center justify-between hover:border-brand-300 hover:shadow-md transition-all">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                  <Icon size={18} />
                </div>
                <div>
                  <p className="text-sm font-medium text-surface-900">{label}</p>
                  <p className="text-xs text-surface-500">{desc}</p>
                </div>
              </div>
              <ArrowRight size={16} className="text-surface-300 group-hover:text-brand-600 transition-colors" />
            </Card>
          </Link>
        ))}
      </div>

      {app.clientRoom.hubWelcomeMessage && (
        <Card className="p-5 mt-8 bg-surface-50">
          <p className="text-sm text-surface-600 leading-relaxed">{app.clientRoom.hubWelcomeMessage}</p>
          <p className="text-xs text-surface-400 mt-2">— {app.contractorName}</p>
        </Card>
      )}
    </div>
  )
}
