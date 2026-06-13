import { useState } from 'react'
import { Terminal, Check, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useStore } from '../context/StoreContext'
import { Card } from './ui/Card'
import { Badge } from './ui/Badge'
import { Button } from './ui/Button'

export function CursorCliTeamPanel() {
  const { state, updateTeamMember } = useStore()
  const [savedId, setSavedId] = useState('')

  const membersWithAccess = state.teamMembers.filter((m) => m.cursorCliAccess).length
  const sharedWorkflows = state.cursorCli.workflows.filter((w) => w.teamVisible).length

  const toggleAccess = (memberId: string, enabled: boolean) => {
    updateTeamMember(memberId, { cursorCliAccess: enabled })
    setSavedId(memberId)
    setTimeout(() => setSavedId(''), 1500)
  }

  if (state.teamMembers.length === 0) return null

  return (
    <Card className="mt-8 p-6">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <h2 className="text-base font-semibold text-surface-900 flex items-center gap-2">
            <Terminal size={16} /> Cursor CLI — Team Access
          </h2>
          <p className="text-sm text-surface-500 mt-1">
            Grant team members access to shared CLI workflows. Clients and guest portals never see this.
          </p>
        </div>
        <Link to="/cursor-cli">
          <Button variant="secondary" size="sm">Open Cursor CLI</Button>
        </Link>
      </div>

      <div className="flex flex-wrap gap-3 mb-5 text-xs">
        <Badge status="active">{membersWithAccess} with CLI access</Badge>
        <Badge status="sent">{sharedWorkflows} shared workflows</Badge>
        <Badge status={state.cursorCli.settings.enabled ? 'signed' : 'draft'}>
          {state.cursorCli.settings.enabled ? 'CLI enabled' : 'CLI disabled'}
        </Badge>
      </div>

      <ul className="divide-y divide-surface-100">
        {state.teamMembers.map((member) => (
          <li key={member.id} className="flex items-center justify-between gap-4 py-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-100 text-surface-600 text-xs font-semibold">
                {member.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-surface-900 truncate">{member.name}</p>
                <p className="text-xs text-surface-400 truncate flex items-center gap-1">
                  <Users size={10} /> {member.role}
                  {member.email ? ` · ${member.email}` : ''}
                </p>
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm text-surface-600 shrink-0 cursor-pointer">
              <input
                type="checkbox"
                checked={member.cursorCliAccess}
                onChange={(e) => toggleAccess(member.id, e.target.checked)}
                className="rounded border-surface-300 text-brand-600 focus:ring-brand-500"
              />
              {savedId === member.id ? (
                <span className="text-brand-600 flex items-center gap-1 text-xs"><Check size={12} /> Saved</span>
              ) : (
                <span className="text-xs">CLI access</span>
              )}
            </label>
          </li>
        ))}
      </ul>

      {!state.cursorCli.settings.shareWorkflowsWithTeam && (
        <p className="text-xs text-amber-700 mt-4 p-3 rounded-lg bg-amber-50 border border-amber-100">
          Team workflow sharing is off. Enable it in Cursor CLI → Settings so members can use shared prompts.
        </p>
      )}
    </Card>
  )
}
