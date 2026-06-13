import type { CursorCliMode, CursorCliWorkflow, CursorCliSettings } from './types'

export const CURSOR_CLI_INSTALL = 'curl https://cursor.com/install -fsS | bash'

export const CURSOR_CLI_MODELS = [
  { value: 'composer-2.5', label: 'Composer 2.5 (default)' },
  { value: 'gpt-5.2', label: 'GPT-5.2' },
  { value: 'claude-4.5-sonnet', label: 'Claude 4.5 Sonnet' },
  { value: 'auto', label: 'Auto (server picks)' },
] as const

export const CURSOR_CLI_MODES: { value: CursorCliMode; label: string; flag: string }[] = [
  { value: 'agent', label: 'Agent', flag: '' },
  { value: 'plan', label: 'Plan', flag: '--mode=plan' },
  { value: 'ask', label: 'Ask (read-only)', flag: '--mode=ask' },
]

export const CURSOR_CLI_REFERENCE = [
  { cmd: 'agent', desc: 'Start an interactive Agent session' },
  { cmd: 'agent -p "prompt"', desc: 'Run a one-shot prompt (print mode)' },
  { cmd: 'agent --list-models', desc: 'List available models' },
  { cmd: 'agent resume', desc: 'Continue the most recent conversation' },
  { cmd: 'agent --continue', desc: 'Alias for resume' },
  { cmd: '/models', desc: 'Switch models inside an interactive session' },
  { cmd: '/plan', desc: 'Switch to Plan mode' },
  { cmd: '/ask', desc: 'Switch to Ask mode (read-only)' },
  { cmd: '/mcp enable <name>', desc: 'Enable an MCP server' },
  { cmd: '/rules', desc: 'Create or edit Cursor rules' },
] as const

export function maskApiKey(key: string): string {
  if (!key) return ''
  if (key.length <= 8) return '••••••••'
  return `${key.slice(0, 7)}${'•'.repeat(Math.min(12, key.length - 11))}${key.slice(-4)}`
}

export function buildEnvExport(settings: CursorCliSettings): string {
  if (!settings.apiKey) return '# Add your API key in WorkVault → Cursor CLI first'
  return `export CURSOR_API_KEY="${settings.apiKey}"`
}

export function buildAgentCommand(
  prompt: string,
  settings: CursorCliSettings,
  workflow?: Pick<CursorCliWorkflow, 'mode' | 'model'>,
): string {
  const mode = workflow?.mode ?? settings.defaultMode
  const model = workflow?.model ?? settings.defaultModel
  const parts = ['agent', '-p', `"${prompt.replace(/"/g, '\\"')}"`]

  if (model && model !== 'composer-2.5') {
    parts.push('--model', `"${model}"`)
  }

  const modeFlag = CURSOR_CLI_MODES.find((m) => m.value === mode)?.flag
  if (modeFlag) parts.push(modeFlag)

  return parts.join(' ')
}

export function workflowCategoryLabel(category: CursorCliWorkflow['category']): string {
  const labels: Record<CursorCliWorkflow['category'], string> = {
    contracts: 'Contracts',
    invoices: 'Invoices',
    projects: 'Projects',
    general: 'General',
  }
  return labels[category]
}

export function defaultCursorCliAccessForRole(role: import('./types').TeamMemberRole): boolean {
  return role === 'owner' || role === 'admin'
}
