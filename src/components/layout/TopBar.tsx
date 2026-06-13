import { useLocation } from 'react-router-dom'
import { Bell, Search } from 'lucide-react'
import { useStore } from '../../context/StoreContext'
import { useAuth } from '../../context/AuthContext'
import { useDemoOptional } from '../../context/DemoContext'
import { formatDate } from '../../lib/utils'

const PAGE_TITLES: Record<string, string> = {
  '/': 'Dashboard',
  '/time': 'Time Tracker',
  '/pipeline': 'Pipeline',
  '/proposals': 'Proposals',
  '/contracts': 'Contracts',
  '/invoices': 'Invoices',
  '/finance': 'Finance',
  '/scope': 'Scope Log',
  '/documents': 'Documents',
  '/tools': 'Tools',
  '/subcontractors': 'Subcontractors',
  '/protection': 'Work Protection',
  '/licenses': 'Licenses',
  '/hosting': 'Hosting',
  '/records': 'Work Records',
  '/clients': 'Clients',
  '/settings': 'Settings',
  '/project': 'Your Project',
  '/about': 'Preview Info',
}

export function TopBar({ demoMode }: { demoMode?: boolean }) {
  const location = useLocation()
  const { state } = useStore()
  const { user } = useAuth()
  const demo = useDemoOptional()

  const pathKey = demo?.basePath
    ? location.pathname.replace(demo.basePath, '') || '/'
    : location.pathname

  const title = PAGE_TITLES[pathKey] || (pathKey === '/about' ? 'Preview Info' : pathKey === '/project' ? 'Your Project' : 'WorkVault')
  const displayName = demoMode ? 'Preview Guest' : (state.profile.name || user?.name || 'Contractor')
  const initial = displayName.charAt(0).toUpperCase()

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between border-b border-surface-200/80 bg-white/80 backdrop-blur-xl px-8 py-3.5">
      <div>
        <p className="text-[11px] font-medium uppercase tracking-wider text-surface-400">
          {formatDate(new Date().toISOString())}
        </p>
        <h2 className="text-lg font-semibold text-surface-900">{title}</h2>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative hidden sm:block">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
          <input
            type="text"
            placeholder="Search..."
            className="w-52 rounded-lg border border-surface-200 bg-surface-50 pl-9 pr-3 py-1.5 text-sm text-surface-700 placeholder:text-surface-400 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/15 transition-all"
          />
        </div>

        <button className="relative rounded-lg p-2 text-surface-400 hover:bg-surface-100 hover:text-surface-600 transition-colors">
          <Bell size={18} />
          {state.invoices.some((i) => i.status === 'overdue') && (
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
          )}
        </button>

        <div className="flex items-center gap-2.5 pl-2 border-l border-surface-200">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-surface-800 leading-tight">{displayName}</p>
            <p className="text-[11px] text-surface-400">{demoMode ? 'Read-only preview guest' : (state.profile.email || user?.email || 'Local account')}</p>
          </div>
          <div className="flex h-9 w-9 items-center justify-center rounded-full gradient-brand text-white text-sm font-semibold shadow-md shadow-brand-600/20">
            {initial}
          </div>
        </div>
      </div>
    </header>
  )
}
