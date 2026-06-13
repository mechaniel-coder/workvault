import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Clock,
  FileText,
  Receipt,
  Shield,
  BadgeCheck,
  Globe,
  Archive,
  Users,
  Settings,
  Box,
  Kanban,
  FileSignature,
  Wallet,
  AlertTriangle,
  FolderOpen,
  Wrench,
  HardHat,
  Info,
  Package,
} from 'lucide-react'
import { useDemoOptional } from '../../context/DemoContext'

const navSections = [
  {
    label: 'Overview',
    items: [
      { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
      { to: '/time', icon: Clock, label: 'Time Tracker' },
      { to: '/pipeline', icon: Kanban, label: 'Pipeline' },
    ],
  },
  {
    label: 'Business',
    items: [
      { to: '/proposals', icon: FileSignature, label: 'Proposals' },
      { to: '/contracts', icon: FileText, label: 'Contracts' },
      { to: '/invoices', icon: Receipt, label: 'Invoices' },
      { to: '/finance', icon: Wallet, label: 'Finance' },
      { to: '/clients', icon: Users, label: 'Clients' },
    ],
  },
  {
    label: 'Operations',
    items: [
      { to: '/scope', icon: AlertTriangle, label: 'Scope Log' },
      { to: '/documents', icon: FolderOpen, label: 'Documents' },
      { to: '/tools', icon: Wrench, label: 'Tools' },
      { to: '/subcontractors', icon: HardHat, label: 'Subcontractors' },
    ],
  },
  {
    label: 'Protection',
    items: [
      { to: '/protection', icon: Shield, label: 'Work Protection' },
      { to: '/licenses', icon: BadgeCheck, label: 'Licenses' },
      { to: '/hosting', icon: Globe, label: 'Hosting' },
      { to: '/records', icon: Archive, label: 'Work Records' },
    ],
  },
  {
    label: 'Account',
    items: [
      { to: '/settings', icon: Settings, label: 'Settings' },
    ],
  },
]

const demoAccountSection = {
  label: 'Your deliverable',
  items: [{ to: '/project', icon: Package, label: 'Your Project' }],
}

const demoAboutSection = {
  label: 'Preview',
  items: [{ to: '/about', icon: Info, label: 'About This Preview' }],
}

type SidebarProps = {
  demoMode?: boolean
}

export function Sidebar({ demoMode }: SidebarProps) {
  const demo = useDemoOptional()
  const prefix = demo?.basePath ?? ''
  const sections = demoMode
    ? [
        demoAccountSection,
        ...navSections.filter((s) => s.label !== 'Account'),
        demoAboutSection,
      ]
    : navSections

  return (
    <aside className="fixed inset-y-0 left-0 z-30 flex w-64 flex-col border-r border-surface-200/80 bg-white/95 backdrop-blur-xl">
      <div className="flex items-center gap-3 px-5 py-5">
        <div className="relative">
          <div className="absolute inset-0 rounded-xl bg-brand-500/20 blur-md" />
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl gradient-brand shadow-md shadow-brand-600/25">
            <Box size={20} className="text-white" />
          </div>
        </div>
        <div>
          <h1 className="text-base font-bold text-surface-900 tracking-tight">WorkVault</h1>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-brand-500/70">
            {demoMode ? 'Preview' : 'Pro Edition'}
          </p>
        </div>
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
        {demoMode ? (
          <>
            <p className="text-xs font-semibold text-amber-700 mb-0.5">Sandbox Environment</p>
            <p className="text-[11px] text-surface-500 leading-relaxed">
              Sample data only. No connection to the contractor&apos;s real account.
            </p>
          </>
        ) : (
          <>
            <p className="text-xs font-semibold text-brand-700 mb-0.5">Local & Private</p>
            <p className="text-[11px] text-surface-500 leading-relaxed">
              Your data stays on your device. Encrypted cloud sync available in Settings.
            </p>
          </>
        )}
      </div>
    </aside>
  )
}
