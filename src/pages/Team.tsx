import { useMemo, useState } from 'react'
import { Plus, Trash2, Mail, Link2, Check, UserCircle2 } from 'lucide-react'
import { useStore } from '../context/StoreContext'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { Textarea } from '../components/ui/Textarea'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Modal, PageHeader, EmptyState } from '../components/ui/Modal'
import type { TeamMemberRole } from '../lib/types'
import { TEAM_ROLE_OPTIONS, getTeamInviteUrl, publishTeamInvite, teamRoleLabel } from '../lib/team-invites'
import { CursorCliTeamPanel } from '../components/CursorCliTeamPanel'

const emptyForm = {
  name: '',
  email: '',
  role: 'member' as TeamMemberRole,
  title: '',
  notes: '',
}

export default function Team() {
  const {
    state, addTeamMember, deleteTeamMember, generateTeamMemberInviteToken,
  } = useStore()
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [copiedId, setCopiedId] = useState('')

  const members = useMemo(
    () => [...state.teamMembers].sort((a, b) => a.name.localeCompare(b.name)),
    [state.teamMembers]
  )

  const handleCreate = () => {
    addTeamMember({
      name: form.name,
      email: form.email,
      role: form.role,
      title: form.title,
      notes: form.notes,
    })
    setShowModal(false)
    setForm(emptyForm)
  }

  const sendInvite = async (memberId: string) => {
    const member = state.teamMembers.find((m) => m.id === memberId)
    if (!member) return
    const token = member.inviteToken || generateTeamMemberInviteToken(memberId)
    const updated = { ...member, inviteToken: token, status: 'invited' as const }
    await publishTeamInvite(updated, { name: state.profile.name, email: state.profile.email })
    const url = getTeamInviteUrl(token)
    await navigator.clipboard.writeText(url)
    setCopiedId(memberId)
    setTimeout(() => setCopiedId(''), 2000)
  }

  return (
    <div>
      <PageHeader
        title="Team"
        description="Manage your internal team and send invitation links for collaborators."
        action={
          <Button onClick={() => setShowModal(true)}>
            <Plus size={16} /> Add Team Member
          </Button>
        }
      />

      {members.length === 0 ? (
        <Card>
          <EmptyState
            icon={<UserCircle2 size={24} />}
            title="No team members yet"
            description="Add staff, partners, or assistants who help run your business."
            action={<Button onClick={() => setShowModal(true)}><Plus size={16} /> Add Team Member</Button>}
          />
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {members.map((member) => (
            <Card key={member.id} className="p-5">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-700 font-semibold text-sm">
                    {member.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-base font-semibold text-surface-900 truncate">{member.name}</h3>
                    {member.title && <p className="text-sm text-surface-500 truncate">{member.title}</p>}
                  </div>
                </div>
                <button type="button" onClick={() => deleteTeamMember(member.id)} className="text-surface-400 hover:text-red-500 p-1">
                  <Trash2 size={14} />
                </button>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <Badge status={member.status === 'active' ? 'paid' : 'sent'}>{teamRoleLabel(member.role)}</Badge>
                <Badge status={member.status === 'active' ? 'signed' : 'draft'}>{member.status}</Badge>
              </div>

              {member.email && (
                <p className="text-sm text-surface-600 mt-3 flex items-center gap-2 truncate">
                  <Mail size={14} className="text-surface-400 shrink-0" /> {member.email}
                </p>
              )}

              {member.notes && <p className="text-xs text-surface-400 mt-2 line-clamp-2">{member.notes}</p>}

              <Button variant="secondary" size="sm" className="w-full mt-4" onClick={() => sendInvite(member.id)}>
                {copiedId === member.id ? (
                  <><Check size={14} /> Invite Link Copied</>
                ) : (
                  <><Link2 size={14} /> Copy Team Invite Link</>
                )}
              </Button>
            </Card>
          ))}
        </div>
      )}

      <CursorCliTeamPanel />

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Add Team Member">
        <div className="space-y-4">
          <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <Input label="Title / role" placeholder="Project manager" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <Select
            label="Permission level"
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value as TeamMemberRole })}
            options={TEAM_ROLE_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
          />
          <p className="text-xs text-surface-500 -mt-2">
            {TEAM_ROLE_OPTIONS.find((o) => o.value === form.role)?.description}
          </p>
          <Textarea label="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={!form.name.trim()}>Add Member</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
