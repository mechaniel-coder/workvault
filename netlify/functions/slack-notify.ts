import type { Config } from '@netlify/functions'
import { getEnv, jsonResponse } from './_shared/integrations'

export default async (req: Request) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 })

  try {
    const body = await req.json() as {
      webhookUrl?: string
      botToken?: string
      channel?: string
      text: string
      blocks?: unknown[]
    }

    const webhookUrl = body.webhookUrl || getEnv('SLACK_WEBHOOK_URL')
    if (webhookUrl) {
      const res = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: body.text, blocks: body.blocks }),
      })
      if (!res.ok) {
        const err = await res.text()
        return jsonResponse({ error: err || 'Slack webhook failed' }, res.status)
      }
      return jsonResponse({ ok: true })
    }

    const token = body.botToken || getEnv('SLACK_BOT_TOKEN')
    const channel = body.channel || getEnv('SLACK_CHANNEL')
    if (!token || !channel) return jsonResponse({ error: 'Slack webhook or bot token + channel required' }, 400)

    const res = await fetch('https://slack.com/api/chat.postMessage', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ channel, text: body.text, blocks: body.blocks }),
    })
    const data = await res.json()
    if (!data.ok) return jsonResponse({ error: data.error || 'Slack API failed' }, 400)
    return jsonResponse({ ok: true })
  } catch (err) {
    return jsonResponse({ error: err instanceof Error ? err.message : 'Slack notify failed' }, 500)
  }
}

export const config: Config = {
  path: '/api/slack/notify',
}
