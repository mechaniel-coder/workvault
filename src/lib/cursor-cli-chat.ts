import type { AppState } from './types'
import { buildAppContext } from './ai-assistant/context'
import { buildAgentCommand, CURSOR_CLI_MODES } from './cursor-cli'
import type { CursorCliMode } from './types'

export const CURSOR_CLI_STARTER_PROMPTS = [
  'Draft an agent prompt to review my unsigned contracts',
  'Build a CLI command to summarize overdue invoices',
  'What Cursor CLI workflow fits my active projects?',
  'Help me write an agent prompt for scope creep follow-up',
]

const CHAT_STORAGE_KEY = 'workvault-cursor-cli-chat'

export type CursorCliChatMessage = {
  id: string
  role: 'user' | 'assistant'
  content: string
  pending?: boolean
}

export function buildCursorCliChatContext(
  state: AppState,
  pathname: string,
  mode: CursorCliMode,
  model: string,
): string {
  const appContext = buildAppContext(state, pathname)
  const { settings, workflows } = state.cursorCli
  const modeLabel = CURSOR_CLI_MODES.find((m) => m.value === mode)?.label ?? mode

  const workflowLines = workflows.length
    ? workflows.map((w) => `- ${w.name} (${w.category}): ${w.description}`).join('\n')
    : '- No saved workflows yet'

  return `${appContext}

---
Cursor CLI chat session
CLI enabled: ${settings.enabled ? 'yes' : 'no'}
Session mode: ${modeLabel} (${mode})
Session model: ${model || settings.defaultModel}
Default mode: ${settings.defaultMode}
Default model: ${settings.defaultModel}
API key configured: ${settings.apiKey ? 'yes (stored locally)' : 'no — user should add key on Cursor CLI → Setup'}

Saved workflows:
${workflowLines}

When the user asks for terminal commands, include a copy-paste ready \`agent\` command in a \`\`\`bash code block.
Use this format: agent -p "prompt text" [--model "name"] [--mode=plan|ask]
Escape double quotes inside prompts with backslash.
Prefer read-only tools to gather WorkVault data before drafting prompts.
Keep replies concise. Explain what the agent prompt will accomplish.`
}

export function buildCommandForPrompt(
  prompt: string,
  state: AppState,
  mode: CursorCliMode,
  model: string,
): string {
  return buildAgentCommand(prompt, {
    ...state.cursorCli.settings,
    defaultMode: mode,
    defaultModel: model || state.cursorCli.settings.defaultModel,
  })
}

/** Extract bash code blocks that look like agent commands. */
export function extractAgentCommands(text: string): string[] {
  const blocks = [...text.matchAll(/```(?:bash|sh|shell)?\n?([\s\S]*?)```/gi)]
  const commands: string[] = []
  for (const block of blocks) {
    const lines = block[1]
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l && !l.startsWith('#'))
    for (const line of lines) {
      if (/^agent\b/.test(line)) commands.push(line)
    }
  }
  if (commands.length === 0) {
    const inline = text.match(/^agent\s+-p\s+.+/m)
    if (inline) commands.push(inline[0].trim())
  }
  return commands
}

export function loadCursorCliChatHistory(): CursorCliChatMessage[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(CHAT_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as CursorCliChatMessage[]
    return Array.isArray(parsed) ? parsed.filter((m) => m.role && m.content && !m.pending) : []
  } catch {
    return []
  }
}

export function saveCursorCliChatHistory(messages: CursorCliChatMessage[]): void {
  if (typeof window === 'undefined') return
  const toSave = messages.filter((m) => !m.pending)
  localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(toSave.slice(-80)))
}

export function clearCursorCliChatHistory(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(CHAT_STORAGE_KEY)
}
