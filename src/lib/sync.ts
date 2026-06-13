import type { AppState } from './types'
import { apiFetch } from './api-client'
import { decryptData, encryptData, getStoredPassphrase } from './crypto'

export interface SyncResult {
  ok: boolean
  error?: string
  syncedAt?: string
}

export interface SyncStatus {
  available: boolean
  lastSyncedAt: string | null
}

async function syncApiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  return apiFetch(path, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })
}

export async function checkSyncAvailable(): Promise<boolean> {
  try {
    const res = await syncApiFetch('/api/sync', { method: 'HEAD' })
    return res.status !== 404
  } catch {
    return false
  }
}

export async function pushToCloud(state: AppState, passphrase: string): Promise<SyncResult> {
  try {
    const payload = JSON.stringify({ ...state, activeTimer: null })
    const encrypted = await encryptData(payload, passphrase)
    const res = await syncApiFetch('/api/sync', {
      method: 'PUT',
      body: JSON.stringify({ data: encrypted, updatedAt: new Date().toISOString() }),
    })
    if (res.status === 401) return { ok: false, error: 'Not signed in. Create an account in Settings.' }
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      return { ok: false, error: (err as { error?: string }).error || 'Sync failed' }
    }
    const result = await res.json()
    return { ok: true, syncedAt: result.syncedAt }
  } catch {
    return { ok: false, error: 'Cloud sync unavailable. Deploy to Netlify with Identity enabled.' }
  }
}

export async function pullFromCloud(passphrase: string): Promise<{ ok: boolean; state?: AppState; error?: string; syncedAt?: string }> {
  try {
    const res = await syncApiFetch('/api/sync')
    if (res.status === 401) return { ok: false, error: 'Not signed in.' }
    if (res.status === 404) return { ok: false, error: 'No cloud backup found.' }
    if (!res.ok) return { ok: false, error: 'Failed to pull from cloud.' }
    const { data, syncedAt } = await res.json()
    if (!data) return { ok: false, error: 'No cloud backup found.' }
    const decrypted = await decryptData(data, passphrase)
    const state = JSON.parse(decrypted) as AppState
    return { ok: true, state, syncedAt }
  } catch {
    return { ok: false, error: 'Could not decrypt cloud data. Check your passphrase.' }
  }
}

export async function createSigningLink(contract: {
  id: string
  number: string
  title: string
  content: string
  clientName: string
  contractorName: string
  value: number
  currency: string
  signatures: { role: string; name: string; signatureImage: string; signedAt: string }[]
}): Promise<{ ok: boolean; token?: string; url?: string; error?: string }> {
  try {
    const res = await syncApiFetch('/api/sign-link', {
      method: 'POST',
      body: JSON.stringify(contract),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      return { ok: false, error: (err as { error?: string }).error || 'Failed to create signing link' }
    }
    const { token, url } = await res.json()
    return { ok: true, token, url }
  } catch {
    return { ok: false, error: 'Signing service unavailable. Deploy to Netlify first.' }
  }
}

export async function fetchSigningStatus(token: string): Promise<{
  ok: boolean
  clientSignature?: { name: string; signatureImage: string; signedAt: string }
  error?: string
}> {
  try {
    const res = await syncApiFetch(`/api/sign/${token}`)
    if (!res.ok) return { ok: false, error: 'Signing record not found' }
    const data = await res.json()
    if (data.clientSignature) {
      return { ok: true, clientSignature: data.clientSignature }
    }
    return { ok: true }
  } catch {
    return { ok: false, error: 'Could not check signing status' }
  }
}

export async function autoSyncIfEnabled(state: AppState): Promise<SyncResult | null> {
  if (!state.syncMeta.autoSync) return null
  const passphrase = getStoredPassphrase()
  if (!passphrase) return null
  return pushToCloud(state, passphrase)
}
