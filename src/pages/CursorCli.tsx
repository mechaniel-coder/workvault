import { useMemo, useState } from 'react'
import { Copy, Check, Plus, Trash2, Zap } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useStore } from '../context/StoreContext'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { Textarea } from '../components/ui/Textarea'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Modal, EmptyState } from '../components/ui/Modal'
import { CursorCliPageShell } from '../components/CursorCliPageShell'
import type { CursorCliMode, CursorCliWorkflow, CursorCliWorkflowCategory } from '../lib/types'
import {
  buildAgentCommand, CURSOR_CLI_MODELS, CURSOR_CLI_MODES, workflowCategoryLabel,
} from '../lib/cursor-cli'

const emptyWorkflow = {
  name: '',
  description: '',
  prompt: '',
  mode: 'agent' as CursorCliMode,
  model: '',
  teamVisible: true,
  category: 'general' as CursorCliWorkflowCategory,
}

export default function CursorCli() {
  const {
    state, addCursorCliWorkflow, updateCursorCliWorkflow, deleteCursorCliWorkflow,
  } = useStore()
  const { settings, workflows } = state.cursorCli

  const [copied, setCopied] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyWorkflow)

  const grouped = useMemo(() => {
    const map = new Map<string, CursorCliWorkflow[]>()
    workflows.forEach((w) => {
      const list = map.get(w.category) || []
      list.push(w)
      map.set(w.category, list)
    })
    return map
  }, [workflows])

  const copyText = async (key: string, text: string) => {
    await navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(''), 2000)
  }

  const openCreate = () => {
    setEditingId(null)
    setForm(emptyWorkflow)
    setShowModal(true)
  }

  const openEdit = (workflow: CursorCliWorkflow) => {
    setEditingId(workflow.id)
    setForm({
      name: workflow.name,
      description: workflow.description,
      prompt: workflow.prompt,
      mode: workflow.mode,
      model: workflow.model || '',
      teamVisible: workflow.teamVisible,
      category: workflow.category,
    })
    setShowModal(true)
  }

  const saveWorkflow = () => {
    const payload = {
      name: form.name,
      description: form.description,
      prompt: form.prompt,
      mode: form.mode,
      model: form.model || null,
      teamVisible: form.teamVisible,
      category: form.category,
    }
    if (editingId) updateCursorCliWorkflow(editingId, payload)
    else addCursorCliWorkflow(payload)
    setShowModal(false)
    setEditingId(null)
    setForm(emptyWorkflow)
  }

  return (
    <CursorCliPageShell description="Run Cursor Agent from your terminal — contractor and team only. Not available in client or guest portals.">
      {!settings.enabled && (
        <Card className="mb-6 p-4 border-amber-200 bg-amber-50/60">
          <p className="text-sm text-amber-800">
            Cursor CLI is disabled. Turn it on to copy install commands, API key exports, and workflow prompts.
          </p>
        </Card>
      )}

      <div className="space-y-6">
        <div className="flex flex-wrap justify-between gap-3">
          <p className="text-sm text-surface-500">
            Need a custom prompt? Use{' '}
            <Link to="/cursor-cli/chat" className="text-brand-600 hover:underline">Chat</Link>
            {' '}to draft agent commands from your WorkVault data.
          </p>
          <Button onClick={openCreate} disabled={!settings.enabled}>
            <Plus size={16} /> Add Workflow
          </Button>
        </div>

        {workflows.length === 0 ? (
          <Card>
            <EmptyState
              icon={<Zap size={24} />}
              title="No workflows yet"
              description="Create reusable prompts you can paste into the Cursor CLI."
              action={<Button onClick={openCreate}><Plus size={16} /> Add Workflow</Button>}
            />
          </Card>
        ) : (
          Array.from(grouped.entries()).map(([category, items]) => (
            <div key={category}>
              <h3 className="text-sm font-semibold text-surface-700 mb-3">{workflowCategoryLabel(category as CursorCliWorkflowCategory)}</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                {items.map((workflow) => {
                  const cmd = buildAgentCommand(workflow.prompt, settings, workflow)
                  const copyKey = `wf-${workflow.id}`
                  return (
                    <Card key={workflow.id} className="p-5 flex flex-col">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="font-semibold text-surface-900">{workflow.name}</h4>
                          <p className="text-sm text-surface-500 mt-1">{workflow.description}</p>
                        </div>
                        <button type="button" onClick={() => deleteCursorCliWorkflow(workflow.id)} className="text-surface-400 hover:text-red-500 p-1">
                          <Trash2 size={14} />
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-3">
                        <Badge status="active">{workflow.mode}</Badge>
                        {workflow.teamVisible && settings.shareWorkflowsWithTeam && (
                          <Badge status="sent">Team shared</Badge>
                        )}
                      </div>
                      <pre className="mt-3 flex-1 text-[11px] leading-5 p-3 rounded-lg bg-surface-900 text-surface-100 overflow-x-auto">
                        {cmd}
                      </pre>
                      <div className="flex gap-2 mt-3">
                        <Button variant="secondary" size="sm" className="flex-1" disabled={!settings.enabled} onClick={() => copyText(copyKey, cmd)}>
                          {copied === copyKey ? <><Check size={14} /> Copied</> : <><Copy size={14} /> Copy command</>}
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => openEdit(workflow)}>Edit</Button>
                      </div>
                    </Card>
                  )
                })}
              </div>
            </div>
          ))
        )}
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editingId ? 'Edit Workflow' : 'Add Workflow'} wide>
        <div className="space-y-4">
          <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Input label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <Select
            label="Category"
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value as CursorCliWorkflowCategory })}
            options={[
              { value: 'contracts', label: 'Contracts' },
              { value: 'invoices', label: 'Invoices' },
              { value: 'projects', label: 'Projects' },
              { value: 'general', label: 'General' },
            ]}
          />
          <Textarea label="Prompt" value={form.prompt} onChange={(e) => setForm({ ...form, prompt: e.target.value })} rows={5} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Select
              label="Mode"
              value={form.mode}
              onChange={(e) => setForm({ ...form, mode: e.target.value as CursorCliMode })}
              options={CURSOR_CLI_MODES.map((m) => ({ value: m.value, label: m.label }))}
            />
            <Select
              label="Model (optional)"
              value={form.model}
              onChange={(e) => setForm({ ...form, model: e.target.value })}
              options={[{ value: '', label: 'Use default' }, ...CURSOR_CLI_MODELS.map((m) => ({ value: m.value, label: m.label }))]}
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-surface-700">
            <input
              type="checkbox"
              checked={form.teamVisible}
              onChange={(e) => setForm({ ...form, teamVisible: e.target.checked })}
              className="rounded border-surface-300 text-brand-600 focus:ring-brand-500"
            />
            Visible to team members with CLI access
          </label>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button onClick={saveWorkflow} disabled={!form.name.trim() || !form.prompt.trim()}>Save</Button>
          </div>
        </div>
      </Modal>
    </CursorCliPageShell>
  )
}
