import type { AppState, CloudFile, IntegrationCredentials, ProjectDeliverableLink } from './types'

export async function startGoogleDriveOAuth(): Promise<string> {
  const origin = window.location.origin
  const res = await fetch(`/api/google-drive/oauth/start?origin=${encodeURIComponent(origin)}`)
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Google Drive OAuth failed')
  return data.url as string
}

export async function exchangeGoogleDriveOAuthCode(code: string) {
  const res = await fetch(`/api/google-drive/oauth/token?code=${encodeURIComponent(code)}`)
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Google Drive token exchange failed')
  return data as { refreshToken: string; email: string }
}

export async function startDropboxOAuth(): Promise<string> {
  const origin = window.location.origin
  const res = await fetch(`/api/dropbox/oauth/start?origin=${encodeURIComponent(origin)}`)
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Dropbox OAuth failed')
  return data.url as string
}

export async function exchangeDropboxOAuthCode(code: string) {
  const res = await fetch(`/api/dropbox/oauth/token?code=${encodeURIComponent(code)}`)
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Dropbox token exchange failed')
  return data as { refreshToken: string; email: string }
}

export async function listCloudFolderFiles(
  link: ProjectDeliverableLink,
  credentials: IntegrationCredentials,
): Promise<CloudFile[]> {
  const res = await fetch('/api/cloud/files', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      provider: link.provider,
      folderId: link.folderId,
      credentials,
    }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Could not list files')
  return data.files as CloudFile[]
}

export function parseDriveFolderUrl(url: string): { folderId: string; folderName: string } | null {
  const match = url.match(/\/folders\/([a-zA-Z0-9_-]+)/)
  if (!match) return null
  return { folderId: match[1], folderName: 'Google Drive folder' }
}

export function parseDropboxFolderUrl(url: string): { folderId: string; folderName: string } | null {
  try {
    const u = new URL(url)
    const path = u.pathname.replace('/home', '') || '/'
    return { folderId: path, folderName: path.split('/').filter(Boolean).pop() || 'Dropbox folder' }
  } catch {
    return null
  }
}

export function buildClientDeliverables(state: AppState, clientId?: string) {
  const projects = clientId
    ? state.projects.filter((p) => p.clientId === clientId)
    : state.projects

  return projects.flatMap((project) => {
    const link = state.cloudStorageMeta.projectFolders.find((f) => f.projectId === project.id)
    if (!link) return []
    const files = state.cloudStorageMeta.fileCache[project.id] || []
    if (files.length === 0) return []
    return [{
      projectTitle: project.title,
      provider: link.provider,
      files: files.map((f) => ({
        name: f.name,
        url: f.url,
        mimeType: f.mimeType,
        modifiedAt: f.modifiedAt,
      })),
    }]
  })
}

export async function refreshProjectFiles(
  state: AppState,
  projectId: string,
  credentials: IntegrationCredentials,
): Promise<CloudFile[]> {
  const link = state.cloudStorageMeta.projectFolders.find((f) => f.projectId === projectId)
  if (!link) return []
  return listCloudFolderFiles(link, credentials)
}
