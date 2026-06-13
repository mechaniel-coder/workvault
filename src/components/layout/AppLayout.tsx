import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'
import { AiAssistantPanel } from '../AiAssistantPanel'
import { AiAssistantProvider } from '../../context/AiAssistantContext'
import { useStore } from '../../context/StoreContext'
import { Clock } from 'lucide-react'
import { formatDuration } from '../../lib/utils'
import { useEffect, useState } from 'react'

export function AppLayout() {
  const { state, stopTimer } = useStore()
  const [elapsed, setElapsed] = useState(0)
  const location = useLocation()

  useEffect(() => {
    if (!state.activeTimer) {
      setElapsed(0)
      return
    }
    const tick = () => {
      const start = new Date(state.activeTimer!.startedAt).getTime()
      setElapsed(Math.floor((Date.now() - start) / 60000))
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [state.activeTimer])

  return (
    <AiAssistantProvider>
    <div className="min-h-screen bg-surface-50">
      {/* Subtle background texture */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(99,102,241,0.04)_0%,transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(129,140,248,0.03)_0%,transparent_50%)]" />
      </div>

      <Sidebar />

      <div className="pl-64 relative">
        <TopBar />

        {state.activeTimer && (
          <div className="flex items-center justify-between border-b border-brand-200/60 bg-brand-50/90 backdrop-blur-sm px-8 py-2">
            <div className="flex items-center gap-2 text-sm font-medium text-brand-700">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-500" />
              </span>
              <Clock size={15} />
              Timer running — {formatDuration(elapsed || 1)}
            </div>
            <button
              onClick={stopTimer}
              className="rounded-lg bg-brand-600 px-3 py-1 text-xs font-medium text-white hover:bg-brand-700 transition-colors shadow-sm"
            >
              Stop Timer
            </button>
          </div>
        )}

        <main className="px-8 py-6 max-w-7xl mx-auto">
          <div key={location.pathname} className="page-enter">
            <Outlet />
          </div>
        </main>
      </div>
      <AiAssistantPanel />
    </div>
    </AiAssistantProvider>
  )
}
