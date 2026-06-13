import { useState } from 'react'
import { Globe, Plus, Trash2, ExternalLink, Rocket } from 'lucide-react'
import { useStore } from '../context/StoreContext'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { Textarea } from '../components/ui/Textarea'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Modal, PageHeader, EmptyState } from '../components/ui/Modal'
import { formatDate } from '../lib/utils'

export default function Hosting() {
  const { state, addHostedProject, updateHostedProject, deleteHostedProject } = useStore()
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({
    title: '',
    description: '',
    clientId: '',
    url: '',
    status: 'draft' as 'live' | 'draft' | 'archived',
    deliverables: '',
  })

  const clientOptions = [
    { value: '', label: 'Select client...' },
    ...state.clients.map((c) => ({ value: c.id, label: c.name })),
  ]

  const handleCreate = () => {
    const client = state.clients.find((c) => c.id === form.clientId)
    addHostedProject({
      title: form.title,
      description: form.description,
      clientId: form.clientId,
      clientName: client?.name || 'Unknown',
      url: form.url,
      status: form.status,
      deliverables: form.deliverables.split('\n').filter(Boolean),
      deployedAt: form.status === 'live' ? new Date().toISOString() : null,
    })
    setShowCreate(false)
    setForm({ title: '', description: '', clientId: '', url: '', status: 'draft', deliverables: '' })
  }

  return (
    <div>
      <PageHeader
        title="Project Hosting"
        description="Track deployed deliverables and hosted project links."
        action={
          <Button onClick={() => setShowCreate(true)}>
            <Plus size={16} /> Add Project
          </Button>
        }
      />

      <Card className="mb-6 p-5 bg-surface-800 text-white">
        <div className="flex items-start gap-4">
          <Rocket size={24} className="text-brand-400 mt-0.5 shrink-0" />
          <div>
            <h3 className="text-sm font-semibold">Deliverable Hosting</h3>
            <p className="text-sm text-surface-300 mt-1 leading-relaxed">
              Track where your deliverables are hosted — staging URLs, production sites, file shares, and client portals.
              Link each project to a client and maintain a record of what's live.
            </p>
          </div>
        </div>
      </Card>

      {state.hostedProjects.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Globe size={24} />}
            title="No hosted projects"
            description="Add your deployed projects and deliverable links."
            action={<Button onClick={() => setShowCreate(true)}><Plus size={16} /> Add Project</Button>}
          />
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {state.hostedProjects.map((project) => (
            <Card key={project.id} className="overflow-hidden">
              <div className={`h-2 ${project.status === 'live' ? 'bg-emerald-500' : project.status === 'draft' ? 'bg-amber-400' : 'bg-surface-300'}`} />
              <div className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-base font-semibold text-surface-900">{project.title}</h3>
                    <p className="text-sm text-surface-500 mt-0.5">{project.clientName}</p>
                  </div>
                  <Badge status={project.status} />
                </div>
                {project.description && (
                  <p className="text-sm text-surface-600 mt-3 line-clamp-2">{project.description}</p>
                )}
                {project.url && (
                  <a
                    href={project.url.startsWith('http') ? project.url : `https://${project.url}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex items-center gap-1 text-sm text-brand-600 hover:text-brand-700"
                  >
                    {project.url} <ExternalLink size={12} />
                  </a>
                )}
                {project.deliverables.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs font-medium text-surface-400 mb-1">Deliverables</p>
                    <ul className="text-xs text-surface-600 space-y-0.5">
                      {project.deliverables.map((d, i) => (
                        <li key={i} className="flex items-center gap-1">
                          <span className="h-1 w-1 rounded-full bg-brand-400" /> {d}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <div className="mt-4 flex items-center justify-between text-xs text-surface-400">
                  <span>{project.deployedAt ? `Deployed ${formatDate(project.deployedAt)}` : 'Not deployed'}</span>
                  <div className="flex items-center gap-2">
                    {project.status === 'draft' && (
                      <Button variant="success" size="sm" onClick={() => updateHostedProject(project.id, { status: 'live', deployedAt: new Date().toISOString() })}>
                        Go Live
                      </Button>
                    )}
                    <button onClick={() => deleteHostedProject(project.id)} className="text-surface-400 hover:text-red-500">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Add Hosted Project">
        <div className="space-y-4">
          <Input label="Project Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <Select label="Client" options={clientOptions} value={form.clientId} onChange={(e) => setForm({ ...form, clientId: e.target.value })} />
          <Input label="URL" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} placeholder="https://client-site.com" />
          <Select
            label="Status"
            options={[
              { value: 'draft', label: 'Draft / Staging' },
              { value: 'live', label: 'Live / Production' },
              { value: 'archived', label: 'Archived' },
            ]}
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value as 'live' | 'draft' | 'archived' })}
          />
          <Textarea label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <Textarea label="Deliverables (one per line)" value={form.deliverables} onChange={(e) => setForm({ ...form, deliverables: e.target.value })} placeholder="Homepage design&#10;Mobile responsive layout&#10;CMS integration" />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={!form.title}>Add Project</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
