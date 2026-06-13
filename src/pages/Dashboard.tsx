import { Link } from 'react-router-dom'
import {
  Clock,
  FileText,
  Receipt,
  Shield,
  BadgeCheck,
  DollarSign,
  AlertTriangle,
  ArrowRight,
  Plus,
  Sparkles,
  Kanban,
  FileSignature,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useStore } from '../context/StoreContext'
import { useIndustry } from '../context/IndustryContext'
import { Card, StatCard } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { formatCurrency, formatDate, formatDuration, computeLicenseStatus, computeInvoiceStatus } from '../lib/utils'
import { findNavItem } from '../lib/industry-nav'

const ACTION_ICONS: Record<string, LucideIcon> = {
  '/time': Clock,
  '/contracts': FileText,
  '/invoices': Receipt,
  '/protection': Shield,
  '/clients': Plus,
  '/proposals': FileSignature,
  '/pipeline': Kanban,
  '/scope': AlertTriangle,
}

export default function Dashboard() {
  const { state } = useStore()
  const { config } = useIndustry()
  const { profile, timeEntries, contracts, invoices, licenses, workProtections, clients } = state
  const { terminology, dashboard } = config

  const thisWeekMinutes = timeEntries
    .filter((e) => {
      const d = new Date(e.createdAt)
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      return d >= weekAgo
    })
    .reduce((sum, e) => sum + e.durationMinutes, 0)

  const unpaidTotal = invoices
    .filter((i) => computeInvoiceStatus(i) === 'sent' || computeInvoiceStatus(i) === 'overdue')
    .reduce((sum, i) => sum + i.total, 0)

  const overdueInvoices = invoices.filter((i) => computeInvoiceStatus(i) === 'overdue')
  const expiringLicenses = licenses.filter((l) => computeLicenseStatus(l.expiryDate) === 'expiring')
  const pendingContracts = contracts.filter((c) => c.status === 'sent' || c.status === 'draft')

  const recentActivity = [
    ...timeEntries.slice(0, 3).map((e) => ({
      type: 'time' as const,
      title: e.description || e.projectName,
      subtitle: `${formatDuration(e.durationMinutes)} · ${e.clientName}`,
      date: e.createdAt,
    })),
    ...contracts.slice(0, 2).map((c) => ({
      type: 'contract' as const,
      title: c.title,
      subtitle: c.clientName,
      date: c.updatedAt,
    })),
    ...invoices.slice(0, 2).map((i) => ({
      type: 'invoice' as const,
      title: i.number,
      subtitle: `${formatCurrency(i.total, profile.defaultCurrency)} · ${i.clientName}`,
      date: i.createdAt,
    })),
  ]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 6)

  const alerts = [
    ...overdueInvoices.map((i) => ({
      message: `Invoice ${i.number} is overdue`,
      link: '/invoices',
      severity: 'danger' as const,
    })),
    ...expiringLicenses.map((l) => ({
      message: `${terminology.licenses} "${l.name}" expires ${formatDate(l.expiryDate)}`,
      link: '/licenses',
      severity: 'warning' as const,
    })),
  ]

  const heroActions = dashboard.quickActions.map(({ route, label }) => ({
    to: route,
    label,
    icon: ACTION_ICONS[route] ?? Clock,
  }))

  const sidebarActions = [
    ...dashboard.quickActions.map(({ route, label }) => ({
      to: route,
      label,
      icon: ACTION_ICONS[route] ?? Clock,
    })),
    {
      to: '/protection',
      label: findNavItem(config, 'protection')?.label ?? `Protect ${terminology.project}`,
      icon: Shield,
    },
    {
      to: '/clients',
      label: `Add ${terminology.client}`,
      icon: Plus,
    },
  ].filter(
    (item, index, arr) => arr.findIndex((x) => x.to === item.to) === index,
  )

  return (
    <div>
      <div className="relative overflow-hidden rounded-2xl gradient-brand p-8 mb-8 shadow-xl shadow-brand-600/20">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.15)_0%,transparent_60%)]" />
        <div className="absolute -right-8 -top-8 h-48 w-48 rounded-full bg-white/5 blur-2xl" />
        <div className="absolute -left-4 -bottom-4 h-32 w-32 rounded-full bg-white/5 blur-xl" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles size={14} className="text-brand-200" />
            <span className="text-xs font-semibold uppercase tracking-widest text-brand-200/80">
              {dashboard.badge}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            {profile.name
              ? `Good to see you, ${profile.name.split(' ')[0]}`
              : `Welcome to WorkVault`}
          </h1>
          <p className="mt-2 text-sm text-brand-100/80 max-w-lg">{dashboard.subtitle}</p>
          <div className="flex flex-wrap gap-2 mt-5">
            {heroActions.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                className="inline-flex items-center gap-2 rounded-lg bg-white/15 hover:bg-white/25 backdrop-blur-sm px-4 py-2 text-sm font-medium text-white transition-all duration-200 hover:scale-[1.02]"
              >
                <Icon size={15} />
                {label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {alerts.length > 0 && (
        <div className="mb-6 space-y-2">
          {alerts.map((alert, i) => (
            <Link
              key={i}
              to={alert.link}
              className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
                alert.severity === 'danger'
                  ? 'bg-red-50 text-red-700 hover:bg-red-100'
                  : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
              }`}
            >
              <AlertTriangle size={16} />
              {alert.message}
              <ArrowRight size={14} className="ml-auto" />
            </Link>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <StatCard
          label="Hours This Week"
          value={formatDuration(thisWeekMinutes)}
          icon={<Clock size={20} />}
          trend={`${timeEntries.length} total entries`}
        />
        <StatCard
          label="Unpaid Invoices"
          value={formatCurrency(unpaidTotal, profile.defaultCurrency)}
          icon={<DollarSign size={20} />}
          trend={`${overdueInvoices.length} overdue`}
        />
        <StatCard
          label={`Active ${terminology.contracts}`}
          value={String(contracts.filter((c) => c.status === 'signed' || c.status === 'sent').length)}
          icon={<FileText size={20} />}
          trend={`${pendingContracts.length} pending action`}
        />
        <StatCard
          label={dashboard.statLabels.protected}
          value={String(workProtections.length)}
          icon={<Shield size={20} />}
          trend={`${clients.length} ${dashboard.statLabels.clients}`}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="px-6 py-4 border-b border-surface-100">
            <h2 className="text-base font-semibold text-surface-900">Recent Activity</h2>
          </div>
          <div className="divide-y divide-surface-100">
            {recentActivity.length === 0 ? (
              <p className="px-6 py-8 text-sm text-surface-400 text-center">{dashboard.emptyActivity}</p>
            ) : (
              recentActivity.map((item, i) => (
                <div key={i} className="flex items-center justify-between px-6 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-surface-100 p-2 text-surface-500">
                      {item.type === 'time' && <Clock size={16} />}
                      {item.type === 'contract' && <FileText size={16} />}
                      {item.type === 'invoice' && <Receipt size={16} />}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-surface-800">{item.title}</p>
                      <p className="text-xs text-surface-400">{item.subtitle}</p>
                    </div>
                  </div>
                  <span className="text-xs text-surface-400">{formatDate(item.date)}</span>
                </div>
              ))
            )}
          </div>
        </Card>

        <div className="space-y-6">
          <Card>
            <div className="px-6 py-4 border-b border-surface-100">
              <h2 className="text-base font-semibold text-surface-900">Quick Actions</h2>
            </div>
            <div className="p-4 space-y-2">
              {sidebarActions.map(({ to, label, icon: Icon }) => (
                <Link
                  key={to}
                  to={to}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-surface-700 hover:bg-brand-50 hover:text-brand-700 transition-colors"
                >
                  <Icon size={16} />
                  {label}
                </Link>
              ))}
            </div>
          </Card>

          {!config.hiddenRoutes.includes('licenses') && (
            <Card>
              <div className="px-6 py-4 border-b border-surface-100">
                <h2 className="text-base font-semibold text-surface-900">{terminology.licenses} Status</h2>
              </div>
              <div className="p-4 space-y-3">
                {licenses.length === 0 ? (
                  <p className="text-sm text-surface-400 text-center py-2">No licenses tracked</p>
                ) : (
                  licenses.slice(0, 4).map((l) => (
                    <div key={l.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <BadgeCheck size={14} className="text-surface-400" />
                        <span className="text-sm text-surface-700">{l.name}</span>
                      </div>
                      <Badge status={computeLicenseStatus(l.expiryDate)} />
                    </div>
                  ))
                )}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
