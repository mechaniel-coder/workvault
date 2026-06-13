import { useCallback, useRef, useState } from 'react'
import {
  Upload, File, Trash2, Globe, Package, Loader2, Send, Link2,
} from 'lucide-react'
import { useStore } from '../context/StoreContext'
import { Button } from './ui/Button'
import { Input } from './ui/Input'
import { Textarea } from './ui/Textarea'
import { Select } from './ui/Select'
import type { DemoDeliverable, DemoDeliverableKind } from '../lib/types'
import {
  formatFileSize,
  MAX_DEMO_FILE_BYTES,
  MAX_DEMO_TOTAL_BYTES,
  saveDemoFileLocal,
  deleteDemoFileLocal,
  getDemoFileLocal,
} from '../lib/demo-project-store'
import {
  inferDeliverableKind,
  publishDemoSession,
  uploadDemoFileRemote,
  deleteDemoFileRemote,
  deliverableLabel,
} from '../lib/demo'
import { publishClientRoomConfig, syncClientRoomFromState } from '../lib/client-room'

const KIND_OPTIONS: { value: DemoDeliverableKind; label: string }[] = [
  { value: 'application', label: 'Application / build' },
  { value: 'design_files', label: 'Design files' },
  { value: 'source_code', label: 'Source code / project bundle' },
  { value: 'documents', label: 'Documents' },
  { value: 'prototype', label: 'Prototype' },
  { value: 'other', label: 'Other' },
]

export function DemoProjectDropzone() {
  const { state, updateDemoSettings } = useStore()
  const { demoSettings } = state
  const transfer = demoSettings.projectTransfer
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState('')

  const totalBytes = transfer.deliverables.reduce((s, d) => s + d.size, 0)

  const patchTransfer = (patch: Partial<typeof transfer>) => {
    updateDemoSettings({
      projectTransfer: { ...transfer, ...patch, updatedAt: new Date().toISOString() },
    })
  }

  const addFiles = useCallback(async (files: FileList | File[]) => {
    const list = Array.from(files)
    const newItems: DemoDeliverable[] = []
    let runningTotal = totalBytes

    for (const file of list) {
      if (file.size > MAX_DEMO_FILE_BYTES) {
        setStatus(`${file.name} exceeds 50MB limit.`)
        continue
      }
      if (runningTotal + file.size > MAX_DEMO_TOTAL_BYTES) {
        setStatus('Total transfer limit (200MB) reached.')
        break
      }

      const id = crypto.randomUUID()
      await saveDemoFileLocal(id, file)
      newItems.push({
        id,
        name: file.name,
        size: file.size,
        mimeType: file.type || 'application/octet-stream',
        kind: inferDeliverableKind(file),
        uploadedAt: new Date().toISOString(),
        remote: false,
      })
      runningTotal += file.size
    }

    if (newItems.length > 0) {
      updateDemoSettings({
        projectTransfer: {
          ...transfer,
          deliverables: [...transfer.deliverables, ...newItems],
          updatedAt: new Date().toISOString(),
        },
      })
      setStatus(`Added ${newItems.length} file${newItems.length !== 1 ? 's' : ''}. Click "Transfer to Client Room" when ready.`)
    }
  }, [totalBytes, transfer, updateDemoSettings])

  const removeFile = async (item: DemoDeliverable) => {
    await deleteDemoFileLocal(item.id)
    if (item.remote && demoSettings.token) {
      await deleteDemoFileRemote(demoSettings.token, item.id)
    }
    patchTransfer({ deliverables: transfer.deliverables.filter((d) => d.id !== item.id) })
  }

  const transferToClient = async () => {
    const token = demoSettings.token || crypto.randomUUID()
    if (!demoSettings.token) {
      updateDemoSettings({ token, createdAt: new Date().toISOString() })
    }

    setBusy(true)
    setStatus('Uploading project files securely…')

    const updatedDeliverables: DemoDeliverable[] = []
    for (const item of transfer.deliverables) {
      if (item.remote) {
        updatedDeliverables.push(item)
        continue
      }
      const blob = await getDemoFileLocal(item.id)
      if (!blob) {
        updatedDeliverables.push(item)
        continue
      }
      const ok = await uploadDemoFileRemote(token, item.id, blob, item.name, item.mimeType)
      updatedDeliverables.push({ ...item, remote: ok })
    }

    const nextSettings = {
      ...demoSettings,
      token,
      projectTransfer: {
        ...transfer,
        deliverables: updatedDeliverables,
        updatedAt: new Date().toISOString(),
      },
    }
    updateDemoSettings(nextSettings)

    const synced = syncClientRoomFromState(state)
    const withRoom = { ...nextSettings, clientRoom: synced }
    updateDemoSettings({ clientRoom: synced })
    const [published] = await Promise.all([
      publishDemoSession(token, withRoom, state),
      publishClientRoomConfig(token, withRoom, state),
    ])
    setBusy(false)
    setStatus(
      published
        ? 'Project transferred. Your client can open the demo link and go to "Your Project".'
        : 'Saved locally. Deploy to Netlify to deliver files to remote clients.'
    )
  }

  const useHostedUrl = () => {
    const hosted = state.hostedProjects.find((p) => p.url)
    if (hosted?.url) {
      patchTransfer({ appPreviewUrl: hosted.url })
      setStatus(`Using staging URL from "${hosted.title}".`)
    }
  }

  return (
    <div className="rounded-xl border border-brand-200 bg-gradient-to-br from-brand-50/80 to-white p-5 space-y-4">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-white">
          <Package size={18} />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-surface-900">Transfer Your Project</h3>
          <p className="text-xs text-surface-500 mt-0.5 leading-relaxed">
          Drop your application build, design files, source bundle, or documents.
          {state.demoSettings.allowDownloads
            ? ' Clients can download files you transfer.'
            : ' Clients can preview in-room only unless you enable downloads in Demo settings.'}
          </p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Input
          label="Project name"
          value={transfer.title}
          onChange={(e) => patchTransfer({ title: e.target.value })}
          placeholder="e.g. Acme Mobile App v1.2"
        />
        <Input
          label="Live preview URL (optional)"
          value={transfer.appPreviewUrl || ''}
          onChange={(e) => patchTransfer({ appPreviewUrl: e.target.value || null })}
          placeholder="https://staging.yourapp.com"
        />
      </div>

      <Textarea
        label="Project description"
        value={transfer.description}
        onChange={(e) => patchTransfer({ description: e.target.value })}
        placeholder="What you built and what you'd like feedback on…"
      />

      <Textarea
        label="Instructions for your client"
        value={transfer.clientNotes}
        onChange={(e) => patchTransfer({ clientNotes: e.target.value })}
        placeholder="How to test the app, what to review, known issues…"
      />

      {state.hostedProjects.some((p) => p.url) && (
        <Button variant="secondary" size="sm" onClick={useHostedUrl}>
          <Link2 size={14} /> Use URL from Hosting module
        </Button>
      )}

      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragging(false)
          if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files)
        }}
        onClick={() => inputRef.current?.click()}
        className={`cursor-pointer rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors ${
          dragging ? 'border-brand-500 bg-brand-50' : 'border-surface-200 hover:border-brand-300 hover:bg-surface-50'
        }`}
      >
        <Upload size={28} className="mx-auto text-brand-500 mb-2" />
        <p className="text-sm font-medium text-surface-800">Drop project files here</p>
        <p className="text-xs text-surface-400 mt-1">
          App builds (.zip, .apk), designs, PDFs, source bundles — up to 50MB each, 200MB total
        </p>
        <input
          ref={inputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => e.target.files && addFiles(e.target.files)}
        />
      </div>

      {transfer.deliverables.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-surface-500">
            <span>{transfer.deliverables.length} file{transfer.deliverables.length !== 1 ? 's' : ''}</span>
            <span>{formatFileSize(totalBytes)} / {formatFileSize(MAX_DEMO_TOTAL_BYTES)}</span>
          </div>
          {transfer.deliverables.map((item) => (
            <div key={item.id} className="flex items-center gap-3 rounded-lg border border-surface-100 bg-white p-3">
              <File size={16} className="text-brand-500 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-surface-800 truncate">{item.name}</p>
                <p className="text-xs text-surface-400">
                  {formatFileSize(item.size)} · {deliverableLabel(item.kind)}
                  {item.remote ? ' · transferred' : ' · pending upload'}
                </p>
              </div>
              <Select
                value={item.kind}
                onChange={(e) => {
                  patchTransfer({
                    deliverables: transfer.deliverables.map((d) =>
                      d.id === item.id ? { ...d, kind: e.target.value as DemoDeliverableKind } : d
                    ),
                  })
                }}
                options={KIND_OPTIONS}
                className="w-40 hidden sm:block"
              />
              <button type="button" onClick={() => removeFile(item)} className="text-surface-400 hover:text-red-500 p-1">
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-2 pt-1">
        <Button onClick={transferToClient} disabled={busy || (!transfer.title && transfer.deliverables.length === 0 && !transfer.appPreviewUrl)}>
          {busy ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
          Transfer to Client Room
        </Button>
        {transfer.appPreviewUrl && (
          <Button variant="secondary" onClick={() => window.open(transfer.appPreviewUrl!, '_blank', 'noopener,noreferrer')}>
            <Globe size={14} /> Test preview URL
          </Button>
        )}
      </div>

      {status && <p className="text-xs text-brand-700 bg-brand-50 rounded-lg px-3 py-2">{status}</p>}
    </div>
  )
}
