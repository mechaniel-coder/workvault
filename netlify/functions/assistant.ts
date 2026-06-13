import type { Config } from '@netlify/functions'
import OpenAI from 'openai'
import { jsonResponse } from './_shared/integrations'
import { ASSISTANT_TOOLS, buildCursorCliSystemPrompt, buildSystemPrompt } from './_shared/assistant-tools'

type ChatMessage = OpenAI.Chat.Completions.ChatCompletionMessageParam

export default async (req: Request) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 })

  try {
    const body = await req.json() as {
      messages: ChatMessage[]
      context?: string
      variant?: 'default' | 'cursor-cli'
    }

    if (!body.messages?.length) {
      return jsonResponse({ error: 'messages required' }, 400)
    }

    const openai = new OpenAI()
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: body.variant === 'cursor-cli'
            ? buildCursorCliSystemPrompt(body.context || 'No context provided.')
            : buildSystemPrompt(body.context || 'No context provided.'),
        },
        ...body.messages,
      ],
      tools: ASSISTANT_TOOLS,
      tool_choice: 'auto',
      max_tokens: 2048,
    })

    const choice = completion.choices[0]?.message
    if (!choice) {
      return jsonResponse({ error: 'No response from model' }, 502)
    }

    return jsonResponse({
      content: choice.content ?? '',
      toolCalls: choice.tool_calls?.map((tc) => {
        if (tc.type !== 'function') return null
        return {
          id: tc.id,
          name: tc.function.name,
          arguments: tc.function.arguments,
        }
      }).filter(Boolean) ?? [],
      finishReason: completion.choices[0]?.finish_reason,
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Assistant request failed'
    const isGateway = msg.includes('API key') || msg.includes('401') || msg.includes('503')
    return jsonResponse(
      {
        error: isGateway
          ? 'AI Gateway unavailable. Enable AI on your Netlify site and deploy to production once.'
          : msg,
      },
      isGateway ? 503 : 500,
    )
  }
}

export const config: Config = {
  path: '/api/assistant',
}
