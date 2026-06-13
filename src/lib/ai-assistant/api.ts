import { apiFetch } from '../api-client'
export type AssistantChatMessage =
  | { role: 'user'; content: string }
  | { role: 'assistant'; content: string; toolCalls?: AssistantToolCall[] }
  | { role: 'tool'; toolCallId: string; content: string }

export type AssistantToolCall = {
  id: string
  name: string
  arguments: string
}

export type AssistantTurnResponse = {
  content: string
  toolCalls: AssistantToolCall[]
  finishReason?: string
  error?: string
}

export type AssistantVariant = 'default' | 'cursor-cli'

export async function callAssistantTurn(
  messages: AssistantChatMessage[],
  context: string,
  variant: AssistantVariant = 'default',
): Promise<AssistantTurnResponse> {
  const apiMessages = messages.map((m) => {
    if (m.role === 'user') return { role: 'user' as const, content: m.content }
    if (m.role === 'assistant') {
      if (m.toolCalls?.length) {
        return {
          role: 'assistant' as const,
          content: m.content || null,
          tool_calls: m.toolCalls.map((tc) => ({
            id: tc.id,
            type: 'function' as const,
            function: { name: tc.name, arguments: tc.arguments },
          })),
        }
      }
      return { role: 'assistant' as const, content: m.content }
    }
    return { role: 'tool' as const, tool_call_id: m.toolCallId, content: m.content }
  })

  const res = await apiFetch('/api/assistant', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages: apiMessages, context, variant }),
  })
  const data = await res.json()
  if (!res.ok) {
    return { content: '', toolCalls: [], error: data.error || 'Assistant unavailable' }
  }
  return {
    content: data.content || '',
    toolCalls: data.toolCalls || [],
    finishReason: data.finishReason,
  }
}
