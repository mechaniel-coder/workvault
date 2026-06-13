import { Package, Trash2, FolderOpen, ExternalLink } from 'lucide-react'
import type { ClientAppClosureRecord } from '../lib/types'
import { Button } from './ui/Button'
import { Card } from './ui/Card'

export function ClientAppClosureScreen({ closure }: { closure: ClientAppClosureRecord }) {
  const paid = closure.outcome === 'paid_complete'

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-surface-50 to-brand-50/30 p-6">
      <Card className="max-w-lg w-full p-8 text-center shadow-xl">
        <div className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl ${paid ? 'bg-emerald-100 text-emerald-600' : 'bg-surface-100 text-surface-500'}`}>
          {paid ? <Package size={28} /> : <Trash2 size={28} />}
        </div>
        <h1 className="text-xl font-bold text-surface-900 mb-2">
          {paid ? 'Project complete' : 'Workspace closed'}
        </h1>
        <p className="text-sm text-surface-600 leading-relaxed mb-6">{closure.message}</p>

        {paid && (closure.deliverables.length > 0 || closure.folderUrls.length > 0) && (
          <div className="text-left rounded-xl border border-surface-200 bg-surface-50 p-4 mb-6 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-surface-500 flex items-center gap-1.5">
              <FolderOpen size={14} /> Your final deliverables
            </p>
            {closure.folderUrls.map((url) => (
              <a
                key={url}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between gap-2 rounded-lg border border-surface-100 bg-white px-3 py-2 text-sm hover:bg-brand-50 transition-colors"
              >
                <span className="truncate text-surface-800">Shared folder</span>
                <ExternalLink size={14} className="text-surface-400 shrink-0" />
              </a>
            ))}
            {closure.deliverables.map((file) => (
              <a
                key={file.url}
                href={file.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between gap-2 rounded-lg border border-surface-100 bg-white px-3 py-2 text-sm hover:bg-brand-50 transition-colors"
              >
                <span className="truncate text-surface-800">{file.name}</span>
                <ExternalLink size={14} className="text-surface-400 shrink-0" />
              </a>
            ))}
            <p className="text-[10px] text-surface-400 pt-1">
              Save these files locally — this app has been removed from your device.
            </p>
          </div>
        )}

        {!paid && (
          <p className="text-xs text-surface-500 mb-4">
            This WorkVault client app is no longer available. Contact {closure.contractorName} if you have questions.
          </p>
        )}

        <Button
          variant="secondary"
          className="w-full"
          onClick={() => {
            try {
              localStorage.removeItem(`workvault-client-app-${window.location.pathname.split('/')[2]}`)
            } catch { /* ignore */ }
            window.location.href = '/'
          }}
        >
          Done — remove from this device
        </Button>
      </Card>
    </div>
  )
}
