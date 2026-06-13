import { useLocation } from 'react-router-dom'
import { ClientSidebar } from './ClientSidebar'
import { TopBar } from './TopBar'
import { ClientAccessGates } from '../ClientAccessGates'

export function ClientAppLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation()

  return (
    <div className="relative">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(99,102,241,0.04)_0%,transparent_60%)]" />
      </div>

      <ClientSidebar />

      <div className="pl-64 relative">
        <TopBar clientMode />

        <main className="px-8 py-6 max-w-7xl mx-auto">
          <div key={location.pathname} className="page-enter">
            <ClientAccessGates>{children}</ClientAccessGates>
          </div>
        </main>
      </div>
    </div>
  )
}
