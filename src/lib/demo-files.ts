import type { DemoDeliverable } from './types'
import { getDemoFileLocal } from './demo-project-store'

function viewUrl(token: string, fileId: string): string {
  return `/api/demo/${token}/assets/${fileId}`
}

export async function resolveDemoFileBlob(
  token: string,
  item: DemoDeliverable
): Promise<Blob | null> {
  if (item.inlineData) {
    const bytes = Uint8Array.from(atob(item.inlineData), (c) => c.charCodeAt(0))
    return new Blob([bytes], { type: item.mimeType })
  }

  if (item.remote) {
    try {
      const res = await fetch(viewUrl(token, item.id))
      if (!res.ok) return null
      return await res.blob()
    } catch {
      return null
    }
  }

  return getDemoFileLocal(item.id)
}

export function canPreviewInBrowser(mimeType: string, name: string): boolean {
  const n = name.toLowerCase()
  if (mimeType.startsWith('image/')) return true
  if (mimeType === 'application/pdf' || n.endsWith('.pdf')) return true
  if (mimeType.startsWith('text/') || n.endsWith('.txt') || n.endsWith('.md') || n.endsWith('.html')) return true
  return false
}

/** In-memory blob URL for view-only rendering — never exposed as a download link. */
export async function createViewBlobUrl(
  token: string,
  item: DemoDeliverable
): Promise<string | null> {
  const blob = await resolveDemoFileBlob(token, item)
  if (!blob) return null
  return URL.createObjectURL(blob)
}

export async function downloadDemoFile(token: string, item: DemoDeliverable): Promise<string | null> {
  const blob = await resolveDemoFileBlob(token, item)
  if (!blob) return 'File not available. Ask your contractor to re-transfer the project.'

  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = item.name
  anchor.style.display = 'none'
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
  setTimeout(() => URL.revokeObjectURL(url), 1000)
  return null
}

export const demoViewGuardProps = {
  onContextMenu: (e: React.MouseEvent) => e.preventDefault(),
  onDragStart: (e: React.DragEvent) => e.preventDefault(),
  style: { userSelect: 'none' as const },
}

export function demoViewGuardPropsFor(allowDownloads: boolean) {
  if (allowDownloads) return {}
  return demoViewGuardProps
}
