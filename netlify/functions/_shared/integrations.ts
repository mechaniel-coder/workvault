import { getStore } from '@netlify/blobs'

export async function storePaymentSession(sessionId: string, data: {
  invoiceId: string
  processor?: string
  status: 'pending' | 'paid'
  paidAt?: string
}) {
  const store = getStore({ name: 'workvault-payments', consistency: 'strong' })
  await store.setJSON(`session/${sessionId}`, { ...data, updatedAt: new Date().toISOString() })
}

export async function markPaymentSessionPaid(sessionId: string, paidAt?: string) {
  const store = getStore({ name: 'workvault-payments', consistency: 'strong' })
  const existing = await store.get(`session/${sessionId}`, { type: 'json' }) as {
    invoiceId: string
    processor?: string
    status: string
  } | null
  if (!existing) return null
  const updated = { ...existing, status: 'paid' as const, paidAt: paidAt || new Date().toISOString(), updatedAt: new Date().toISOString() }
  await store.setJSON(`session/${sessionId}`, updated)
  return updated
}

export async function getPaymentSession(sessionId: string) {
  const store = getStore({ name: 'workvault-payments', consistency: 'strong' })
  return store.get(`session/${sessionId}`, { type: 'json' }) as Promise<{
    invoiceId: string
    status: 'pending' | 'paid'
    paidAt?: string
    updatedAt: string
  } | null>
}

export async function storeOAuthCode(code: string, data: {
  refreshToken: string
  email: string
  calendarId: string
}) {
  return storeProviderOAuthCode('google', code, data)
}

export async function consumeOAuthCode(code: string) {
  return consumeProviderOAuthCode('google', code) as Promise<{
    refreshToken: string
    email: string
    calendarId: string
    createdAt: string
  } | null>
}

export async function storeProviderOAuthCode(provider: string, code: string, data: Record<string, unknown>) {
  const store = getStore({ name: 'workvault-oauth', consistency: 'strong' })
  await store.setJSON(`${provider}/${code}`, { ...data, createdAt: new Date().toISOString() })
}

export async function consumeProviderOAuthCode(provider: string, code: string) {
  const store = getStore({ name: 'workvault-oauth', consistency: 'strong' })
  const key = `${provider}/${code}`
  const data = await store.get(key, { type: 'json' }) as Record<string, unknown> | null
  if (data) await store.delete(key)
  return data
}

export function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

export function getEnv(key: string): string {
  return process.env[key] || ''
}
