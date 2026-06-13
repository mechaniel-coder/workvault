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
} from 'lucide-react'

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/time', icon: Clock, label: 'Time Tracker' },
  { to: '/contracts', icon: FileText, label: 'Contracts' },
  { to: '/invoices', icon: Receipt, label: 'Invoices' },
  { to: '/protection', icon: Shield, label: 'Work Protection' },
  { to: '/licenses', icon: BadgeCheck, label: 'Licenses' },
  { to: '/hosting', icon: Globe, label: 'Hosting' },
  { to: '/records', icon: Archive, label: 'Work Records' },
  { to: '/clients', icon: Users, label: 'Clients' },
  { to: '/settings', icon: Settings, label: 'Settings' },
]

export function Sidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-30 flex w-64 flex-col border-r border-surface-200 bg-white">
      <div className="flex items-center gap-3 px-5 py-5 border-b border-surface-100">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg gradient-brand">
          <Box size={20} className="text-white" />
        </div>
        <div>
          <h1 className="text-base font-bold text-surface-900">WorkVault</h1>
          <p className="text-[10px] font-medium uppercase tracking-wider text-surface-400">
            Contract Worker Hub
          </p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-brand-50 text-brand-700 shadow-sm'
                  : 'text-surface-600 hover:bg-surface-50 hover:text-surface-900'
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-surface-100 px-5 py-4">
        <p className="text-[11px] text-surface-400 leading-relaxed">
          All data stored locally on your device. Your work, your control.
        </p>
      </div>
    </aside>
  )
}
