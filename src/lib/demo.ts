import type {
  AppState, DemoDeliverableKind, DemoProjectTransfer, DemoSettings,
} from './types'

export interface DemoSessionPublic {
  enabled: boolean
  mode: DemoSettings['mode']
  expiresAt: string | null
  contractorName: string
  label: string
  lastAccessedAt: string | null
  accessCount: number
  projectTransfer: DemoProjectTransfer
  allowDownloads: boolean
}

const EMPTY_TRANSFER: DemoProjectTransfer = {
  title: '',
  description: '',
  clientNotes: '',
  appPreviewUrl: null,
  deliverables: [],
  updatedAt: null,
}

export function getDemoUrl(token: string): string {
  return `${window.location.origin}/demo/${token}`
}

export function getDemoProjectUrl(token: string): string {
  return `${window.location.origin}/demo/${token}/project`
}

export function computeDemoExpiry(hours: number | null): string | null {
  if (hours == null) return null
  const d = new Date()
  d.setHours(d.getHours() + hours)
  return d.toISOString()
}

export function isDemoExpired(expiresAt: string | null): boolean {
  if (!expiresAt) return false
  return new Date(expiresAt) < new Date()
}

export async function publishDemoSession(
  token: string,
  settings: DemoSettings,
  state: AppState
): Promise<boolean> {
  try {
    const res = await fetch(`/api/demo/${token}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        enabled: settings.enabled,
        mode: settings.mode,
        expiresAt: settings.expiresAt,
        contractorName: state.profile.name || 'WorkVault User',
        label: settings.label,
        projectTransfer: settings.projectTransfer,
        allowDownloads: settings.allowDownloads,
      }),
    })
    return res.ok
  } catch {
    return false
  }
}

export async function revokeDemoSession(token: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/demo/${token}`, { method: 'DELETE' })
    return res.ok
  } catch {
    return false
  }
}

export async function fetchDemoSession(token: string): Promise<DemoSessionPublic | null> {
  try {
    const res = await fetch(`/api/demo/${token}`)
    if (!res.ok) return null
    const data = (await res.json()) as DemoSessionPublic
    return {
      ...data,
      projectTransfer: data.projectTransfer || EMPTY_TRANSFER,
      allowDownloads: data.allowDownloads ?? false,
    }
  } catch {
    return null
  }
}

export async function uploadDemoFileRemote(
  token: string,
  fileId: string,
  file: Blob,
  name: string,
  mimeType: string
): Promise<boolean> {
  const buffer = await file.arrayBuffer()
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.length; i += 8192) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 8192))
  }
  const data = btoa(binary)

  try {
    const res = await fetch(`/api/demo/${token}/assets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileId, name, mimeType, size: file.size, data }),
    })
    return res.ok
  } catch {
    return false
  }
}

export function getDemoFileViewUrl(token: string, fileId: string): string {
  return `/api/demo/${token}/assets/${fileId}`
}

/** @deprecated Use view-only flow via demo-files.ts — no client downloads */
export function getDemoFileDownloadUrl(token: string, fileId: string): string {
  return getDemoFileViewUrl(token, fileId)
}

export async function deleteDemoFileRemote(token: string, fileId: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/demo/${token}/assets/${fileId}`, { method: 'DELETE' })
    return res.ok
  } catch {
    return false
  }
}

export function inferDeliverableKind(file: File): DemoDeliverableKind {
  const n = file.name.toLowerCase()
  const t = file.type
  if (t.includes('zip') || n.endsWith('.zip') || n.endsWith('.tar') || n.endsWith('.gz')) return 'source_code'
  if (n.endsWith('.fig') || n.endsWith('.sketch') || n.endsWith('.xd') || t.startsWith('image/')) return 'design_files'
  if (n.endsWith('.pdf') || n.endsWith('.doc') || n.endsWith('.docx')) return 'documents'
  if (n.endsWith('.html') || n.endsWith('.apk') || n.endsWith('.ipa') || t.includes('application')) return 'application'
  if (n.endsWith('.proto') || n.endsWith('.framer')) return 'prototype'
  return 'other'
}

export function validateLocalDemoToken(token: string, state: AppState): DemoSessionPublic | null {
  const { demoSettings } = state
  if (!demoSettings.enabled || demoSettings.token !== token) return null
  if (isDemoExpired(demoSettings.expiresAt)) return null
  return {
    enabled: true,
    mode: demoSettings.mode,
    expiresAt: demoSettings.expiresAt,
    contractorName: state.profile.name || 'WorkVault User',
    label: demoSettings.label,
    lastAccessedAt: demoSettings.lastAccessedAt,
    accessCount: demoSettings.accessCount,
    projectTransfer: demoSettings.projectTransfer,
    allowDownloads: demoSettings.allowDownloads,
  }
}

export function hasProjectTransferContent(transfer: DemoProjectTransfer): boolean {
  return Boolean(
    transfer.title ||
    transfer.description ||
    transfer.appPreviewUrl ||
    transfer.deliverables.length > 0
  )
}

export function deliverableLabel(kind: DemoDeliverableKind): string {
  const labels: Record<DemoDeliverableKind, string> = {
    application: 'Application',
    design_files: 'Design files',
    source_code: 'Source / project bundle',
    documents: 'Documents',
    prototype: 'Prototype',
    other: 'Other',
  }
  return labels[kind]
}
