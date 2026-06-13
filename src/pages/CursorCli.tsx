import { useMemo, useState } from 'react'
import {
  Terminal, Copy, Check, Plus, Trash2, ExternalLink, BookOpen, Zap, Settings2,
} from 'lucide-react'
import { useStore } from '../context/StoreContext'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { Textarea } from '../components/ui/Textarea'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Modal, PageHeader, EmptyState } from '../components/ui/Modal'
import type { CursorCliMode, CursorCliWorkflow, CursorCliWorkflowCategory } from '../lib/types'
import {
  buildAgentCommand, buildEnvExport, CURSOR_CLI_INSTALL, CURSOR_CLI_MODELS,
  CURSOR_CLI_MODES, CURSOR_CLI_REFERENCE, maskApiKey, workflowCategoryLabel,
} from '../lib/cursor-cli'

const tabs = [
  { id: 'workflows', label: 'Workflows', icon: Zap },
  { id: 'setup', label: 'Setup', icon: Terminal },
  { id: 'reference', label: 'Reference', icon: BookOpen },
] as const

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
    state, updateCursorCliSettings, addCursorCliWorkflow, updateCursorCliWorkflow, deleteCursorCliWorkflow,
  } = useStore()
  const { settings, workflows } = state.cursorCli

  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]['id']>('workflows')
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
    <div>
      <PageHeader
        title="Cursor CLI"
        description="Run Cursor Agent from your terminal — contractor and team only. Not available in client or guest portals."
        action={
          <label className="flex items-center gap-2 text-sm font-medium text-surface-700 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.enabled}
              onChange={(e) => updateCursorCliSettings({ enabled: e.target.checked })}
              className="rounded border-surface-300 text-brand-600 focus:ring-brand-500"
            />
            Enable CLI integration
          </label>
        }
      />

      {!settings.enabled && (
        <Card className="mb-6 p-4 border-amber-200 bg-amber-50/60">
          <p className="text-sm text-amber-800">
            Cursor CLI is disabled. Turn it on to copy install commands, API key exports, and workflow prompts.
          </p>
        </Card>
      )}

      <div className="mb-6 flex flex-wrap gap-2">
        {tabs.map((tab) => {
          const Icon = tab.icon
          return (
            <Button
              key={tab.id}
              variant={activeTab === tab.id ? 'primary' : 'secondary'}
              onClick={() => setActiveTab(tab.id)}
            >
              <Icon size={16} /> {tab.label}
            </Button>
          )
        })}
      </div>

      {activeTab === 'workflows' && (
        <div className="space-y-6">
          <div className="flex justify-end">
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
      )}

      {activeTab === 'setup' && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="p-5">
            <h2 className="text-base font-semibold text-surface-900 flex items-center gap-2">
              <Terminal size={16} /> Install
            </h2>
            <p className="text-sm text-surface-500 mt-1">Install the Cursor CLI on your machine (macOS / Linux).</p>
            <pre className="mt-4 p-3 rounded-lg bg-surface-900 text-surface-100 text-sm overflow-x-auto">{CURSOR_CLI_INSTALL}</pre>
            <Button variant="secondary" size="sm" className="mt-3" disabled={!settings.enabled} onClick={() => copyText('install', CURSOR_CLI_INSTALL)}>
              {copied === 'install' ? <><Check size={14} /> Copied</> : <><Copy size={14} /> Copy install command</>}
            </Button>
            <a
              href="https://cursor.com/docs/cli/overview"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-brand-600 hover:text-brand-800 mt-4"
            >
              Cursor CLI docs <ExternalLink size={14} />
            </a>
          </Card>

          <Card className="p-5">
            <h2 className="text-base font-semibold text-surface-900 flex items-center gap-2">
              <Settings2 size={16} /> Authentication
            </h2>
            <p className="text-sm text-surface-500 mt-1">
              API key stored locally in WorkVault only — never sent to client portals.
            </p>
            <div className="mt-4 space-y-4">
              <Input
                label="Cursor API key"
                type="password"
                value={settings.apiKey}
                onChange={(e) => updateCursorCliSettings({ apiKey: e.target.value })}
                placeholder="cursor_..."
              />
              {settings.apiKey && (
                <p className="text-xs text-surface-400">Stored as: {maskApiKey(settings.apiKey)}</p>
              )}
              <Select
                label="Default model"
                value={settings.defaultModel}
                onChange={(e) => updateCursorCliSettings({ defaultModel: e.target.value })}
                options={CURSOR_CLI_MODELS.map((m) => ({ value: m.value, label: m.label }))}
              />
              <Select
                label="Default mode"
                value={settings.defaultMode}
                onChange={(e) => updateCursorCliSettings({ defaultMode: e.target.value as CursorCliMode })}
                options={CURSOR_CLI_MODES.map((m) => ({ value: m.value, label: m.label }))}
              />
              <label className="flex items-start gap-3 p-3 rounded-xl border border-surface-100 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.shareWorkflowsWithTeam}
                  onChange={(e) => updateCursorCliSettings({ shareWorkflowsWithTeam: e.target.checked })}
                  className="mt-1 rounded border-surface-300 text-brand-600 focus:ring-brand-500"
                />
                <div>
                  <p className="text-sm font-medium text-surface-900">Share workflows with team</p>
                  <p className="text-xs text-surface-400 mt-0.5">Team members with CLI access can use team-visible workflows.</p>
                </div>
              </label>
            </div>
            <pre className="mt-4 p-3 rounded-lg bg-surface-50 border border-surface-200 text-xs text-surface-700 overflow-x-auto">
              {buildEnvExport(settings)}
            </pre>
            <Button variant="secondary" size="sm" className="mt-3" disabled={!settings.enabled || !settings.apiKey} onClick={() => copyText('env', buildEnvExport(settings))}>
              {copied === 'env' ? <><Check size={14} /> Copied</> : <><Copy size={14} /> Copy export command</>}
            </Button>
          </Card>

          <Card className="p-5 lg:col-span-2">
            <h2 className="text-base font-semibold text-surface-900">Quick start</h2>
            <ol className="mt-3 space-y-2 text-sm text-surface-600 list-decimal list-inside">
              <li>Install the CLI with the command above</li>
              <li>Add your API key from <a href="https://cursor.com/dashboard/integrations" target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:underline">Cursor Dashboard → Integrations</a></li>
              <li>Run <code className="text-xs bg-surface-100 px-1.5 py-0.5 rounded">export CURSOR_API_KEY=...</code> or paste the export command</li>
              <li>Copy a workflow command and run it in your project directory</li>
              <li>Manage team access on the <a href="/team" className="text-brand-600 hover:underline">Team</a> page</li>
            </ol>
          </Card>
        </div>
      )}

      {activeTab === 'reference' && (
        <Card className="p-5">
          <h2 className="text-base font-semibold text-surface-900 mb-4">Command reference</h2>
          <div className="divide-y divide-surface-100">
            {CURSOR_CLI_REFERENCE.map((row) => (
              <div key={row.cmd} className="flex flex-col sm:flex-row sm:items-center gap-2 py-3">
                <code className="text-sm font-mono text-brand-700 bg-brand-50 px-2 py-1 rounded shrink-0">{row.cmd}</code>
                <p className="text-sm text-surface-600">{row.desc}</p>
                <Button variant="ghost" size="sm" className="sm:ml-auto shrink-0" onClick={() => copyText(row.cmd, row.cmd)}>
                  {copied === row.cmd ? <Check size={14} /> : <Copy size={14} />}
                </Button>
              </div>
            ))}
          </div>
        </Card>
      )}

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
    </div>
  )
}
