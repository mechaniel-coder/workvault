import { Shield, X, Eye, Sparkles } from 'lucide-react'
import { useDemo } from '../context/DemoContext'

export function DemoBanner() {
  const demo = useDemo()

  return (
    <div className="relative z-40 border-b border-amber-300/60 bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-8 py-2.5">
        <div className="flex items-start gap-3 min-w-0">
          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/15 text-amber-700">
            {demo.mode === 'review' ? <Eye size={16} /> : <Sparkles size={16} />}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-amber-900">
              {demo.mode === 'review' ? 'Client Review Room' : 'Interactive Client Demo'} — {demo.label}
            </p>
            <p className="text-xs text-amber-800/80 leading-relaxed">
              <Shield size={11} className="inline mr-1 -mt-px" />
              Secure sandbox · Sample data only · View-only — no downloads · Nothing is saved
            </p>
          </div>
        </div>
        <p className="text-[10px] font-medium uppercase tracking-wider text-amber-700/70 shrink-0">
          Preview Environment
        </p>
      </div>

      {demo.blockedMessage && (
        <div className="flex items-center justify-between gap-3 border-t border-amber-200/80 bg-amber-100/80 px-8 py-2 text-xs text-amber-900">
          <span>{demo.blockedMessage}</span>
          <button type="button" onClick={demo.clearBlocked} className="text-amber-700 hover:text-amber-900 p-1">
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  )
}
