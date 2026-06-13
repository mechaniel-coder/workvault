import type { TeamMember, TeamMemberRole } from './types'

export const TEAM_ROLE_OPTIONS: { value: TeamMemberRole; label: string; description: string }[] = [
  { value: 'owner', label: 'Owner', description: 'Full access — business owner or lead contractor.' },
  { value: 'admin', label: 'Admin', description: 'Manage clients, projects, invoices, and team invites.' },
  { value: 'member', label: 'Member', description: 'Track time, update projects, and view client work.' },
  { value: 'viewer', label: 'Viewer', description: 'Read-only access to dashboard and project status.' },
]

export function getTeamInviteUrl(token: string): string {
  return `${window.location.origin}/team/join/${token}`
}

export function teamRoleLabel(role: TeamMemberRole): string {
  return TEAM_ROLE_OPTIONS.find((o) => o.value === role)?.label ?? role
}

const LOCAL_TEAM_PREFIX = 'workvault-team-invite-'

export function saveLocalTeamInvite(member: TeamMember, profile: { name: string; email: string }): void {
  localStorage.setItem(`${LOCAL_TEAM_PREFIX}${member.inviteToken}`, JSON.stringify({ member, profile }))
}

export function loadLocalTeamInvite(token: string): { member: TeamMember; profile: { name: string; email: string } } | null {
  try {
    const raw = localStorage.getItem(`${LOCAL_TEAM_PREFIX}${token}`)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export async function publishTeamInvite(member: TeamMember, profile: { name: string; email: string }): Promise<boolean> {
  if (!member.inviteToken) return false
  saveLocalTeamInvite(member, profile)
  try {
    const res = await fetch(`/api/team-invite/${member.inviteToken}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ member, profile }),
    })
    return res.ok
  } catch {
    return false
  }
}

export async function fetchTeamInvite(token: string): Promise<{ member: TeamMember; profile: { name: string; email: string } } | null> {
  try {
    const res = await fetch(`/api/team-invite/${token}`)
    if (!res.ok) return null
    return (await res.json()) as { member: TeamMember; profile: { name: string; email: string } }
  } catch {
    return null
  }
}

export async function resolveTeamInvite(token: string, state?: import('./types').AppState): Promise<{ member: TeamMember; profile: { name: string; email: string } } | null> {
  const remote = await fetchTeamInvite(token)
  if (remote) return remote

  const local = loadLocalTeamInvite(token)
  if (local) return local

  if (state) {
    const member = state.teamMembers.find((m) => m.inviteToken === token && m.status === 'invited')
    if (!member) return null
    return {
      member,
      profile: { name: state.profile.name, email: state.profile.email },
    }
  }

  try {
    const { loadState } = await import('./utils')
    return resolveTeamInvite(token, loadState())
  } catch {
    return null
  }
}
