import type { ClientAppSessionPublic, ClientRoomData } from './types'
import { saveLocalClientAppSession } from './client-app'

export const CLIENT_BUNDLE_FORMAT = 'workvault-client' as const
export const CLIENT_BUNDLE_VERSION = 1

export interface ClientWorkspaceBundle {
  format: typeof CLIENT_BUNDLE_FORMAT
  version: number
  exportedAt: string
  session: ClientAppSessionPublic
  roomData?: ClientRoomData
}

export function buildClientWorkspaceBundle(
  session: ClientAppSessionPublic,
  roomData?: ClientRoomData,
): ClientWorkspaceBundle {
  return {
    format: CLIENT_BUNDLE_FORMAT,
    version: CLIENT_BUNDLE_VERSION,
    exportedAt: new Date().toISOString(),
    session: { ...session, publishedAt: session.publishedAt || new Date().toISOString() },
    roomData,
  }
}

export function downloadClientWorkspaceBundle(
  session: ClientAppSessionPublic,
  roomData?: ClientRoomData,
): void {
  const bundle = buildClientWorkspaceBundle(session, roomData)
  const slug = session.clientName.replace(/\s+/g, '-').toLowerCase().replace(/[^a-z0-9-]/g, '') || 'client'
  const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${slug}-workvault.workvault`
  a.click()
  URL.revokeObjectURL(url)
}

export function parseClientWorkspaceBundle(raw: string): ClientWorkspaceBundle {
  const data = JSON.parse(raw) as ClientWorkspaceBundle
  if (data.format !== CLIENT_BUNDLE_FORMAT) {
    throw new Error('Not a WorkVault client workspace file')
  }
  if (!data.session?.token) {
    throw new Error('Invalid workspace bundle — missing session')
  }
  return data
}

export function importClientWorkspaceBundle(bundle: ClientWorkspaceBundle): ClientAppSessionPublic {
  saveLocalClientAppSession(bundle.session)
  if (bundle.roomData) {
    localStorage.setItem(
      `workvault-client-room-data-${bundle.session.token}`,
      JSON.stringify(bundle.roomData),
    )
  }
  localStorage.setItem('workvault-last-client-token', bundle.session.token)
  return bundle.session
}

export async function importClientWorkspaceFile(file: File): Promise<ClientAppSessionPublic> {
  const text = await file.text()
  const bundle = parseClientWorkspaceBundle(text)
  return importClientWorkspaceBundle(bundle)
}

export function getLastImportedClientToken(): string | null {
  try {
    return localStorage.getItem('workvault-last-client-token')
  } catch {
    return null
  }
}
