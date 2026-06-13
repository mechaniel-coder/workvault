import { useEffect, useState } from 'react'
import {
  Package, Globe, File, Eye, Lock, Loader2, Download, ExternalLink,
} from 'lucide-react'
import { useDemo } from '../context/DemoContext'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { PageHeader, EmptyState } from '../components/ui/Modal'
import { deliverableLabel, hasProjectTransferContent } from '../lib/demo'
import { formatFileSize } from '../lib/demo-project-store'
import {
  canPreviewInBrowser,
  createViewBlobUrl,
  demoViewGuardPropsFor,
  downloadDemoFile,
} from '../lib/demo-files'
import type { DemoDeliverable } from '../lib/types'

function ProjectFilePreview({
  token,
  item,
  allowDownloads,
}: {
  token: string
  item: DemoDeliverable
  allowDownloads: boolean
}) {
  const [viewUrl, setViewUrl] = useState<string | null>(null)
  const [error, setError] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [downloadError, setDownloadError] = useState('')
  const previewable = canPreviewInBrowser(item.mimeType, item.name)
  const guard = demoViewGuardPropsFor(allowDownloads)

  useEffect(() => {
    if (!previewable) return
    let cancelled = false
    let url: string | null = null

    createViewBlobUrl(token, item).then((u) => {
      if (cancelled) {
        if (u) URL.revokeObjectURL(u)
        return
      }
      url = u
      if (!u) setError(true)
      else setViewUrl(u)
    })

    return () => {
      cancelled = true
      if (url) URL.revokeObjectURL(url)
    }
  }, [token, item, previewable])

  const handleDownload = async () => {
    setDownloading(true)
    setDownloadError('')
    const err = await downloadDemoFile(token, item)
    if (err) setDownloadError(err)
    setDownloading(false)
  }

  return (
    <div className="space-y-3">
      {allowDownloads && (
        <div className="flex justify-end">
          <Button variant="secondary" size="sm" onClick={handleDownload} disabled={downloading}>
            {downloading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
            Download
          </Button>
        </div>
      )}

      {downloadError && (
        <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{downloadError}</p>
      )}

      {!previewable ? (
        <div className="rounded-lg border border-surface-200 bg-surface-50 px-4 py-6 text-center">
          <Lock size={20} className="mx-auto text-surface-400 mb-2" />
          <p className="text-sm text-surface-600">{item.name}</p>
          <p className="text-xs text-surface-400 mt-1">
            {allowDownloads
              ? 'Use the download button above to save this file.'
              : 'This file type is view-only in the review room. Downloads are disabled to protect the contractor\'s work.'}
          </p>
        </div>
      ) : error ? (
        <p className="text-sm text-surface-500 py-4 text-center">
          Preview unavailable. Contact your contractor if you need access.
        </p>
      ) : !viewUrl ? (
        <div className="flex items-center justify-center py-12 text-surface-400">
          <Loader2 size={18} className="animate-spin mr-2" /> Loading preview…
        </div>
      ) : item.mimeType.startsWith('image/') ? (
        <div {...guard} className="flex justify-center bg-surface-100 rounded-lg p-4">
          <img
            src={viewUrl}
            alt={item.name}
            draggable={!allowDownloads}
            className={`max-h-[480px] max-w-full rounded-md shadow-sm ${allowDownloads ? '' : 'pointer-events-none select-none'}`}
          />
        </div>
      ) : (
        <div {...guard} className="rounded-lg overflow-hidden border border-surface-200 bg-surface-100" style={{ height: item.mimeType.includes('pdf') ? 480 : 360 }}>
          <iframe
            title={item.name}
            src={viewUrl}
            className="h-full w-full border-0"
            sandbox={allowDownloads ? undefined : ''}
          />
        </div>
      )}
    </div>
  )
}

export default function DemoProject() {
  const demo = useDemo()
  const transfer = demo.projectTransfer
  const fileAccess = demo.clientFileAccess ?? (demo.allowDownloads ? 'write' : 'read')
  const allowDownloads = fileAccess === 'write'

  if (fileAccess === 'none') {
    return (
      <div>
        <PageHeader
          title="Your Project"
          description="Project files shared by your contractor."
        />
        <Card>
          <EmptyState
            icon={<Lock size={24} />}
            title="File access not granted"
            description="Project files are only available when your contract is fully signed and includes file access. Contact your contractor if you believe this is an error."
          />
        </Card>
      </div>
    )
  }

  if (!hasProjectTransferContent(transfer)) {
    return (
      <div>
        <PageHeader
          title="Your Project"
          description="Work shared by your contractor for this review session."
        />
        <Card>
          <EmptyState
            icon={<Package size={24} />}
            title="No project transferred yet"
            description="Your contractor hasn't shared any project materials for this session yet."
          />
        </Card>
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title={transfer.title || 'Your Project'}
        description={transfer.description || `Project materials from ${demo.contractorName}`}
      />

      <Card className={`mb-6 p-4 border ${allowDownloads ? 'border-brand-200 bg-brand-50/80' : 'border-amber-200 bg-amber-50/80'}`}>
        <div className="flex items-start gap-3">
          {allowDownloads ? (
            <Download size={16} className="text-brand-700 mt-0.5 shrink-0" />
          ) : (
            <Lock size={16} className="text-amber-700 mt-0.5 shrink-0" />
          )}
          <p className={`text-xs leading-relaxed ${allowDownloads ? 'text-brand-900' : 'text-amber-900'}`}>
            {allowDownloads ? (
              <>
                <strong>Read & write access.</strong> Per your signed contract, you can preview, download, and upload project files.
              </>
            ) : (
              <>
                <strong>Read-only access.</strong> You can preview files here but cannot download them unless your contract includes write access.
              </>
            )}
          </p>
        </div>
      </Card>

      {transfer.clientNotes && (
        <Card className="mb-6 p-5 border-brand-200 bg-brand-50/50">
          <p className="text-xs font-semibold uppercase tracking-wider text-brand-600 mb-2">Instructions</p>
          <p className="text-sm text-surface-700 whitespace-pre-wrap leading-relaxed">{transfer.clientNotes}</p>
        </Card>
      )}

      {transfer.appPreviewUrl && (
        <Card className="mb-6 overflow-hidden">
          <div className="flex items-center justify-between gap-2 px-5 py-3 border-b border-surface-100 bg-surface-50 text-sm font-medium text-surface-800">
            <div className="flex items-center gap-2">
              <Globe size={16} className="text-brand-600" />
              Live preview
            </div>
            {allowDownloads ? (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => window.open(transfer.appPreviewUrl!, '_blank', 'noopener,noreferrer')}
              >
                <ExternalLink size={14} /> Open in new tab
              </Button>
            ) : (
              <span className="text-[10px] font-normal uppercase tracking-wider text-surface-400">In-room only</span>
            )}
          </div>
          <div
            {...demoViewGuardPropsFor(allowDownloads)}
            className="relative bg-surface-100"
            style={{ height: 'min(70vh, 560px)' }}
          >
            <iframe
              title="Project preview"
              src={transfer.appPreviewUrl}
              className="absolute inset-0 h-full w-full border-0 bg-white"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
              referrerPolicy="no-referrer"
            />
          </div>
        </Card>
      )}

      {transfer.deliverables.length > 0 && (
        <div className="space-y-6">
          {transfer.deliverables.map((item) => (
            <Card key={item.id}>
              <div className="px-6 py-4 border-b border-surface-100 flex items-center gap-3">
                <File size={16} className="text-brand-600 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-surface-900 truncate">{item.name}</p>
                  <p className="text-xs text-surface-400">
                    {formatFileSize(item.size)} · {deliverableLabel(item.kind)}
                  </p>
                </div>
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-surface-400">
                  {allowDownloads ? <Download size={11} /> : <Eye size={11} />}
                  {allowDownloads ? 'Downloadable' : 'View only'}
                </span>
              </div>
              <div className="p-4">
                <ProjectFilePreview token={demo.token} item={item} allowDownloads={allowDownloads} />
              </div>
            </Card>
          ))}
        </div>
      )}

      <p className="mt-6 text-center text-xs text-surface-400">
        {allowDownloads
          ? 'Downloads are enabled for this session at your contractor\'s discretion.'
          : 'Downloads and exports are disabled in this secure review environment.'}
      </p>
    </div>
  )
}
