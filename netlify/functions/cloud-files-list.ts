import type { Config } from '@netlify/functions'
import { jsonResponse } from './_shared/integrations'
import { refreshGoogleToken } from './_shared/oauth-helpers'

export default async (req: Request) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 })

  try {
    const body = await req.json() as {
      provider: 'google_drive' | 'dropbox'
      folderId: string
      credentials: {
        googleDriveRefreshToken?: string
        dropboxRefreshToken?: string
      }
    }

    if (body.provider === 'google_drive') {
      const refreshToken = body.credentials.googleDriveRefreshToken
      if (!refreshToken) return jsonResponse({ error: 'Google Drive not connected' }, 400)
      const tokens = await refreshGoogleToken(refreshToken)
      const q = `'${body.folderId}' in parents and trashed=false`
      const res = await fetch(`https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id,name,mimeType,modifiedTime,size,webViewLink)&pageSize=50`, {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error?.message || 'Drive list failed')
      const files = (data.files || []).map((f: { id: string; name: string; mimeType: string; webViewLink?: string; modifiedTime: string; size?: string }) => ({
        id: f.id,
        name: f.name,
        mimeType: f.mimeType,
        url: f.webViewLink || `https://drive.google.com/file/d/${f.id}/view`,
        size: f.size ? Number(f.size) : undefined,
        modifiedAt: f.modifiedTime,
      }))
      return jsonResponse({ files })
    }

    const token = body.credentials.dropboxRefreshToken
    if (!token) return jsonResponse({ error: 'Dropbox not connected' }, 400)
    const res = await fetch('https://api.dropboxapi.com/2/files/list_folder', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ path: body.folderId.startsWith('/') ? body.folderId : `/${body.folderId}`, limit: 50 }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error_summary || 'Dropbox list failed')
    const files = (data.entries || [])
      .filter((e: { '.tag': string }) => e['.tag'] === 'file')
      .map((f: { id: string; name: string; client_modified: string; size: number }) => ({
        id: f.id,
        name: f.name,
        mimeType: 'application/octet-stream',
        url: `https://www.dropbox.com/home${body.folderId}?preview=${encodeURIComponent(f.name)}`,
        size: f.size,
        modifiedAt: f.client_modified,
      }))
    return jsonResponse({ files })
  } catch (err) {
    return jsonResponse({ error: err instanceof Error ? err.message : 'File list failed' }, 500)
  }
}

export const config: Config = {
  path: '/api/cloud/files',
}
