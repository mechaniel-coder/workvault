import { useState } from 'react'
import { Terminal, Copy, Check, ExternalLink, Settings2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useStore } from '../context/StoreContext'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { Card } from '../components/ui/Card'
import { CursorCliPageShell } from '../components/CursorCliPageShell'
import type { CursorCliMode } from '../lib/types'
import {
  buildEnvExport, CURSOR_CLI_INSTALL, CURSOR_CLI_MODELS, CURSOR_CLI_MODES, maskApiKey,
} from '../lib/cursor-cli'

export default function CursorCliSetup() {
  const { state, updateCursorCliSettings } = useStore()
  const { settings } = state.cursorCli
  const [copied, setCopied] = useState('')

  const copyText = async (key: string, text: string) => {
    await navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(''), 2000)
  }

  return (
    <CursorCliPageShell description="Install the Cursor CLI, add your API key, and configure defaults for agent commands.">
      {!settings.enabled && (
        <Card className="mb-6 p-4 border-amber-200 bg-amber-50/60">
          <p className="text-sm text-amber-800">
            Cursor CLI is disabled. Turn it on to copy install commands, API key exports, and workflow prompts.
          </p>
        </Card>
      )}

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
            <li>Use <Link to="/cursor-cli/chat" className="text-brand-600 hover:underline">Chat</Link> or copy a workflow command and run it in your project directory</li>
            <li>Manage team access on the <Link to="/team" className="text-brand-600 hover:underline">Team</Link> page</li>
          </ol>
        </Card>
      </div>
    </CursorCliPageShell>
  )
}
