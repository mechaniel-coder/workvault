import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, FileText, Receipt, FileSignature, FolderOpen,
  AlertTriangle, Package, MessageSquare, CheckCircle2, Kanban, Box,
} from 'lucide-react'
import { useClientApp } from '../../context/ClientAppContext'

const navSections = [
  {
    label: 'Overview',
    items: [
      { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
      { to: '/pipeline', icon: Kanban, label: 'Project Status' },
    ],
  },
  {
    label: 'Your Work',
    items: [
      { to: '/project', icon: Package, label: 'Your Project' },
      { to: '/review', icon: CheckCircle2, label: 'Review & Sign-off' },
      { to: '/messages', icon: MessageSquare, label: 'Messages' },
    ],
  },
  {
    label: 'Business',
    items: [
      { to: '/proposals', icon: FileSignature, label: 'Proposals' },
      { to: '/contracts', icon: FileText, label: 'Contracts' },
      { to: '/invoices', icon: Receipt, label: 'Invoices' },
    ],
  },
  {
    label: 'Files',
    items: [
      { to: '/documents', icon: FolderOpen, label: 'Documents' },
      { to: '/scope', icon: AlertTriangle, label: 'Scope Log' },
    ],
  },
]

export function ClientSidebar() {
  const app = useClientApp()
  const prefix = app.basePath

  const sections = navSections.map((section) => ({
    ...section,
    items: section.items.filter((item) => {
      if (item.to === '/project' && !app.canViewFiles) return false
      if (item.to === '/invoices') return !app.isGuest
      if (app.isGuest && app.guestRole) {
        const allowed = app.allowedPaths
        if (!allowed.includes(item.to)) return false
      }
      return true
    }),
  })).filter((section) => section.items.length > 0)

  return (
    <aside className="fixed inset-y-0 left-0 z-30 flex w-64 flex-col border-r border-surface-200/80 bg-white/95 backdrop-blur-xl">
      <div className="flex items-center gap-3 px-5 py-5">
        <div className="relative">
          <div className="absolute inset-0 rounded-xl bg-brand-500/20 blur-md" />
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl gradient-brand shadow-md shadow-brand-600/25">
            {app.projectTransfer.title ? (
              <span className="text-white text-sm font-bold">{app.projectTransfer.title.charAt(0)}</span>
            ) : (
              <Box size={20} className="text-white" />
            )}
          </div>
        </div>
        <div className="min-w-0">
          <h1 className="text-base font-bold text-surface-900 tracking-tight truncate">WorkVault</h1>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-brand-500/70 truncate">
            Client Edition
          </p>
        </div>
      </div>

      <div className="px-5 pb-3">
        <p className="text-xs font-medium text-surface-900 truncate">
          {app.isGuest ? app.guestName : app.clientName}
        </p>
        <p className="text-[11px] text-surface-500 truncate">
          {app.isGuest ? `Guest · ${app.guestRole} · ${app.contractorName}` : `with ${app.contractorName}`}
        </p>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-5">
        {sections.map((section) => (
          <div key={section.label}>
            <p className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-surface-400">
              {section.label}
            </p>
            <div className="space-y-0.5">
              {section.items.map(({ to, icon: Icon, label }) => {
                const path = `${prefix}${to}`
                return (
                  <NavLink
                    key={path}
                    to={path}
                    end={to === '/'}
                    className={({ isActive }) =>
                      `group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                        isActive
                          ? 'bg-brand-600 text-white shadow-md shadow-brand-600/25'
                          : 'text-surface-600 hover:bg-surface-100 hover:text-surface-900'
                      }`
                    }
                  >
                    <Icon size={17} className="shrink-0" />
                    {label}
                  </NavLink>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-surface-100 mx-3 mb-3 rounded-xl bg-gradient-to-br from-brand-50 to-surface-50 p-4">
        <p className="text-xs font-semibold text-brand-700 mb-0.5">Your project workspace</p>
        <p className="text-[11px] text-surface-500 leading-relaxed">
          Configured by {app.contractorName} for {app.label}.
        </p>
      </div>
    </aside>
  )
}
