import { Shield, X, Users } from 'lucide-react'
import { useClientApp } from '../context/ClientAppContext'

export function ClientAppBanner({ guestLabel }: { guestLabel?: string }) {
  const app = useClientApp()

  return (
    <div className="relative z-40 border-b border-brand-300/50 bg-gradient-to-r from-brand-50 via-indigo-50 to-brand-50">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-8 py-2.5">
        <div className="flex items-start gap-3 min-w-0">
          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-500/15 text-brand-700">
            <Users size={16} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-brand-900">
              {guestLabel || app.label} — {app.isGuest ? `guest access · ${app.contractorName}` : `with ${app.contractorName}`}
            </p>
            <p className="text-xs text-brand-800/80 leading-relaxed">
              <Shield size={11} className="inline mr-1 -mt-px" />
              {app.isGuest
                ? `Third-party invitation · ${app.guestRole} access · read-only`
                : 'Your private project workspace · View contracts, invoices, and deliverables'}
            </p>
          </div>
        </div>
        <p className="text-[10px] font-medium uppercase tracking-wider text-brand-700/70 shrink-0">
          {app.isGuest ? 'Guest Access' : 'Client WorkVault'}
        </p>
      </div>

      {app.blockedMessage && (
        <div className="flex items-center justify-between gap-3 border-t border-brand-200/80 bg-brand-100/80 px-8 py-2 text-xs text-brand-900">
          <span>{app.blockedMessage}</span>
          <button type="button" onClick={app.clearBlocked} className="text-brand-700 hover:text-brand-900 p-1">
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  )
}
