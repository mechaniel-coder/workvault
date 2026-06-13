import type { AppState, SlackEventType } from './types'
import { apiFetch } from './api-client'

type EventPayload = {
  invoice_paid: { number: string; clientName: string; amount: string }
  contract_signed: { number: string; title: string; clientName: string; signer: string }
  scope_change: { title: string; clientName: string; estimatedHours: number; billable: boolean }
}

export async function notifySlackEvent<E extends SlackEventType>(
  state: AppState,
  event: E,
  payload: EventPayload[E],
): Promise<void> {
  if (!state.integrations.slackNotifications) return
  if (event === 'invoice_paid' && !state.integrations.slackNotifyInvoicePaid) return
  if (event === 'contract_signed' && !state.integrations.slackNotifyContractSigned) return
  if (event === 'scope_change' && !state.integrations.slackNotifyScopeChange) return

  const creds = state.integrationCredentials
  if (!creds.slackWebhookUrl && !creds.slackBotToken) return

  const text = formatSlackMessage(event, payload, state.profile.name || 'WorkVault')
  try {
    await apiFetch('/api/slack/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        webhookUrl: creds.slackWebhookUrl || undefined,
        botToken: creds.slackBotToken || undefined,
        channel: creds.slackChannel || undefined,
        text,
      }),
    })
  } catch {
    // non-blocking
  }
}

function formatSlackMessage(event: SlackEventType, payload: EventPayload[SlackEventType], business: string): string {
  switch (event) {
    case 'invoice_paid': {
      const p = payload as EventPayload['invoice_paid']
      return `💰 *Invoice paid* — ${p.number} from ${p.clientName} (${p.amount}) · ${business}`
    }
    case 'contract_signed': {
      const p = payload as EventPayload['contract_signed']
      return `✍️ *Contract signed* — ${p.number}: ${p.title} by ${p.signer} · ${business}`
    }
    case 'scope_change': {
      const p = payload as EventPayload['scope_change']
      return `📋 *Scope change logged* — ${p.title} for ${p.clientName} (~${p.estimatedHours}h${p.billable ? ', billable' : ''}) · ${business}`
    }
    default:
      return `WorkVault notification · ${business}`
  }
}
