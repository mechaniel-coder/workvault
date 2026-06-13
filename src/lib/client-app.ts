import type { AppState, Client, ClientAppSessionPublic } from './types'
import { apiFetch } from './api-client'
import { buildClientAppSession } from './client-app-state'
import { publishClientRoomConfig } from './client-room'
import { downloadClientWorkspaceBundle } from './client-app-bundle'

const LOCAL_SESSION_PREFIX = 'workvault-client-app-'

export function getClientAppUrl(token: string): string {
  return `${window.location.origin}/client/${token}`
}

export function saveLocalClientAppSession(session: ClientAppSessionPublic): void {
  localStorage.setItem(`${LOCAL_SESSION_PREFIX}${session.token}`, JSON.stringify(session))
}

export function loadLocalClientAppSession(token: string): ClientAppSessionPublic | null {
  try {
    const raw = localStorage.getItem(`${LOCAL_SESSION_PREFIX}${token}`)
    if (!raw) return null
    return JSON.parse(raw) as ClientAppSessionPublic
  } catch {
    return null
  }
}

function sessionTimestamp(session: ClientAppSessionPublic | null): number {
  if (!session?.publishedAt) return 0
  return new Date(session.publishedAt).getTime()
}

/** Prefer the newest session between device cache and Netlify. */
function pickNewestSession(
  local: ClientAppSessionPublic | null,
  remote: ClientAppSessionPublic | null,
): ClientAppSessionPublic | null {
  if (!local && !remote) return null
  if (!local) return remote
  if (!remote) return local
  return sessionTimestamp(remote) >= sessionTimestamp(local) ? remote : local
}

export function validateLocalClientAppToken(token: string, state: AppState): ClientAppSessionPublic | null {
  const stored = loadLocalClientAppSession(token)
  if (stored?.enabled) return stored

  const client = state.clients.find((c) => c.clientAppToken === token)
  if (!client) return null

  return buildClientAppSession(token, client.id, state)
}

export async function fetchClientAppSession(token: string): Promise<ClientAppSessionPublic | null> {
  try {
    const res = await apiFetch(`/api/client-app/${token}`)
    if (!res.ok) return null
    return (await res.json()) as ClientAppSessionPublic
  } catch {
    return null
  }
}

/**
 * Resolve client workspace: local device first, then merge with Netlify if online.
 * Works offline (local/bundle) and online (hosted link sync).
 */
export async function resolveClientAppSession(token: string, state?: AppState): Promise<ClientAppSessionPublic | null> {
  const local = loadLocalClientAppSession(token)
  const remote = await fetchClientAppSession(token)
  const merged = pickNewestSession(local, remote)

  if (merged) {
    if (!merged.enabled && merged.closure) return merged
    if (merged.enabled) {
      saveLocalClientAppSession(merged)
      return merged
    }
  }

  if (state) {
    const built = validateLocalClientAppToken(token, state)
    if (built) {
      saveLocalClientAppSession(built)
      return built
    }
  }

  try {
    const { loadState } = await import('./utils')
    return validateLocalClientAppToken(token, loadState())
  } catch {
    return null
  }
}

export type PublishClientAppResult = {
  ok: boolean
  local: boolean
  remote: boolean
  session: ClientAppSessionPublic
}

/** Publish to this device and Netlify (when signed in). Always saves locally first. */
export async function publishClientApp(
  token: string,
  client: Client,
  state: AppState,
  options?: { downloadBundle?: boolean },
): Promise<PublishClientAppResult> {
  const session = buildClientAppSession(token, client.id, state)
  saveLocalClientAppSession(session)

  if (options?.downloadBundle !== false) {
    downloadClientWorkspaceBundle(session)
  }

  let remoteOk = false
  try {
    const res = await apiFetch(`/api/client-app/${token}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(session),
    })
    remoteOk = res.ok
  } catch {
    remoteOk = false
  }

  try {
    await publishClientRoomConfig(token, session.appState.demoSettings, state)
  } catch {
    // local + optional Netlify client-app still valid
  }

  return { ok: true, local: true, remote: remoteOk, session }
}

export async function exportClientWorkspaceForClient(
  token: string,
  client: Client,
  state: AppState,
): Promise<void> {
  const session = buildClientAppSession(token, client.id, state)
  saveLocalClientAppSession(session)
  downloadClientWorkspaceBundle(session)
}
