import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { useStore } from '../../context/StoreContext'
import { Clock } from 'lucide-react'
import { formatDuration } from '../../lib/utils'
import { useEffect, useState } from 'react'

export function AppLayout() {
  const { state, stopTimer } = useStore()
  const [elapsed, setElapsed] = useState(0)

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
    <div className="min-h-screen bg-surface-50">
      <Sidebar />
      <main className="pl-64">
        {state.activeTimer && (
          <div className="sticky top-0 z-20 flex items-center justify-between border-b border-brand-200 bg-brand-50 px-8 py-2">
            <div className="flex items-center gap-2 text-sm font-medium text-brand-700">
              <Clock size={16} className="animate-pulse" />
              Timer running — {formatDuration(elapsed || 1)}
            </div>
            <button
              onClick={stopTimer}
              className="rounded-md bg-brand-600 px-3 py-1 text-xs font-medium text-white hover:bg-brand-700 transition-colors"
            >
              Stop Timer
            </button>
          </div>
        )}
        <div className="px-8 py-8 max-w-7xl">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
