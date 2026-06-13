import type { AppState, Client, ClientAppSessionPublic } from './types'
import { buildClientAppSession } from './client-app-state'
import { publishClientRoomConfig } from './client-room'

const LOCAL_SESSION_PREFIX = 'workvault-client-app-'

export function getClientAppUrl(token: string): string {
  return `${window.location.origin}/client/${token}`
}

function saveLocalSession(session: ClientAppSessionPublic): void {
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

export function validateLocalClientAppToken(token: string, state: AppState): ClientAppSessionPublic | null {
  const stored = loadLocalClientAppSession(token)
  if (stored?.enabled) return stored

  const client = state.clients.find((c) => c.clientAppToken === token)
  if (!client) return null

  return buildClientAppSession(token, client.id, state)
}

export async function fetchClientAppSession(token: string): Promise<ClientAppSessionPublic | null> {
  try {
    const res = await fetch(`/api/client-app/${token}`)
    if (!res.ok) return null
    return (await res.json()) as ClientAppSessionPublic
  } catch {
    return null
  }
}

export async function resolveClientAppSession(token: string, state?: AppState): Promise<ClientAppSessionPublic | null> {
  const remote = await fetchClientAppSession(token)
  if (remote?.enabled) return remote

  if (state) return validateLocalClientAppToken(token, state)
  try {
    const { loadState } = await import('./utils')
    return validateLocalClientAppToken(token, loadState())
  } catch {
    return null
  }
}

export async function publishClientApp(
  token: string,
  client: Client,
  state: AppState
): Promise<boolean> {
  const session = buildClientAppSession(token, client.id, state)
  saveLocalSession(session)

  let remoteOk = false
  try {
    const res = await fetch(`/api/client-app/${token}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(session),
    })
    remoteOk = res.ok
  } catch {
    remoteOk = false
  }

  await publishClientRoomConfig(token, session.appState.demoSettings, state)

  return remoteOk || true
}
