import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Loader2, Users, Shield } from 'lucide-react'
import { resolveTeamInvite, teamRoleLabel } from '../lib/team-invites'
import { loadState } from '../lib/utils'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'

export default function TeamJoin() {
  const { token } = useParams<{ token: string }>()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [payload, setPayload] = useState<Awaited<ReturnType<typeof resolveTeamInvite>>>(null)

  useEffect(() => {
    if (!token) {
      setError('Invalid invitation')
      setLoading(false)
      return
    }
    resolveTeamInvite(token, loadState()).then((result) => {
      if (!result) setError('This team invitation is invalid or has expired.')
      else setPayload(result)
      setLoading(false)
    })
  }, [token])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-50">
        <Loader2 className="animate-spin text-brand-600" size={32} />
      </div>
    )
  }

  if (error || !payload) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-50 p-6">
        <Card className="max-w-md w-full p-8 text-center">
          <h1 className="text-xl font-semibold text-surface-900 mb-2">Invitation unavailable</h1>
          <p className="text-sm text-surface-500">{error}</p>
        </Card>
      </div>
    )
  }

  const { member, profile } = payload

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-surface-50 to-brand-50/40 p-6">
      <Card className="max-w-lg w-full p-8">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl gradient-brand text-white mb-4">
          <Users size={22} />
        </div>
        <h1 className="text-2xl font-bold text-surface-900">Join {profile.name || 'the team'}</h1>
        <p className="text-sm text-surface-600 mt-2 leading-relaxed">
          You&apos;ve been invited to collaborate on WorkVault as <strong>{member.name || member.email}</strong>
          {' '}with <strong>{teamRoleLabel(member.role)}</strong> access.
        </p>

        <div className="mt-6 p-4 rounded-xl bg-surface-50 border border-surface-100 text-sm space-y-2">
          <p className="flex items-start gap-2 text-surface-600">
            <Shield size={14} className="mt-0.5 shrink-0 text-brand-600" />
            Team invites connect collaborators to this WorkVault workspace. Ask {profile.name} to enable cloud sync in Settings for shared access across devices.
          </p>
        </div>

        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <Link to="/" className="flex-1">
            <Button className="w-full">Open WorkVault</Button>
          </Link>
        </div>

        <p className="text-xs text-surface-400 mt-6 text-center">
          Invited by {profile.name}{profile.email ? ` · ${profile.email}` : ''}
        </p>
      </Card>
    </div>
  )
}
