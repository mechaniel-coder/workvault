import type { ClientGuestInvite, ClientGuestRole } from './types'
import { apiFetch } from './api-client'

export const CLIENT_GUEST_ROLE_OPTIONS: { value: ClientGuestRole; label: string; description: string }[] = [
  {
    value: 'viewer',
    label: 'Viewer',
    description: 'Dashboard, project files, and shared documents only.',
  },
  {
    value: 'reviewer',
    label: 'Reviewer',
    description: 'Viewer access plus review checklist, feedback, and Q&A.',
  },
  {
    value: 'stakeholder',
    label: 'Stakeholder',
    description: 'Reviewer access plus read-only proposals, contracts, and scope log.',
  },
]

export function getGuestInviteUrl(token: string): string {
  return `${window.location.origin}/guest/${token}`
}

export function guestRoleLabel(role: ClientGuestRole): string {
  return CLIENT_GUEST_ROLE_OPTIONS.find((o) => o.value === role)?.label ?? role
}

export function isGuestInviteExpired(invite: ClientGuestInvite): boolean {
  if (!invite.expiresAt) return false
  return new Date(invite.expiresAt) < new Date()
}

const LOCAL_GUEST_PREFIX = 'workvault-guest-invite-'

export function saveLocalGuestInviteRecord(invite: ClientGuestInvite, clientAppSession: unknown): void {
  localStorage.setItem(`${LOCAL_GUEST_PREFIX}${invite.token}`, JSON.stringify({ invite, clientAppSession }))
}

export function loadLocalGuestInviteRecord(token: string): { invite: ClientGuestInvite; clientAppSession: import('./types').ClientAppSessionPublic } | null {
  try {
    const raw = localStorage.getItem(`${LOCAL_GUEST_PREFIX}${token}`)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export async function publishGuestInvite(invite: ClientGuestInvite, session: import('./types').ClientAppSessionPublic): Promise<boolean> {
  saveLocalGuestInviteRecord(invite, session)
  try {
    const res = await apiFetch(`/api/guest-invite/${invite.token}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ invite, session }),
    })
    return res.ok
  } catch {
    return false
  }
}

export async function fetchGuestInvite(token: string): Promise<{ invite: ClientGuestInvite; session: import('./types').ClientAppSessionPublic } | null> {
  try {
    const res = await apiFetch(`/api/guest-invite/${token}`)
    if (!res.ok) return null
    return (await res.json()) as { invite: ClientGuestInvite; session: import('./types').ClientAppSessionPublic }
  } catch {
    return null
  }
}

export async function resolveGuestInvite(token: string, state?: import('./types').AppState): Promise<{ invite: ClientGuestInvite; session: import('./types').ClientAppSessionPublic } | null> {
  const remote = await fetchGuestInvite(token)
  if (remote?.invite?.enabled && !isGuestInviteExpired(remote.invite)) return remote

  const local = loadLocalGuestInviteRecord(token)
  if (local?.invite?.enabled && !isGuestInviteExpired(local.invite)) {
    return { invite: local.invite, session: local.clientAppSession }
  }

  if (state) {
    const invite = state.clientGuestInvites.find((i) => i.token === token && i.enabled)
    if (!invite || isGuestInviteExpired(invite)) return null
    const { validateLocalClientAppToken } = await import('./client-app')
    const session = validateLocalClientAppToken(invite.clientAppToken, state)
    if (!session) return null
    return { invite, session }
  }

  try {
    const { loadState } = await import('./utils')
    return resolveGuestInvite(token, loadState())
  } catch {
    return null
  }
}

/** Nav paths allowed per guest role (relative to client app base) */
export function guestAllowedPaths(role: ClientGuestRole): string[] {
  const base = ['/', '/pipeline', '/project', '/documents']
  if (role === 'viewer') return base
  if (role === 'reviewer') return [...base, '/review', '/messages']
  return [...base, '/review', '/messages', '/proposals', '/contracts', '/scope']
}

export function guestCanAccessPath(role: ClientGuestRole, path: string): boolean {
  const normalized = path.replace(/\/$/, '') || '/'
  return guestAllowedPaths(role).some((p) => normalized === p || normalized.startsWith(`${p}/`))
}
