import { getStore } from '@netlify/blobs'

export async function storePaymentSession(sessionId: string, data: {
  invoiceId: string
  status: 'pending' | 'paid'
  paidAt?: string
}) {
  const store = getStore({ name: 'workvault-payments', consistency: 'strong' })
  await store.setJSON(`session/${sessionId}`, { ...data, updatedAt: new Date().toISOString() })
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
  const store = getStore({ name: 'workvault-oauth', consistency: 'strong' })
  await store.setJSON(`google/${code}`, { ...data, createdAt: new Date().toISOString() }, {
    metadata: { ttl: String(Date.now() + 10 * 60 * 1000) },
  })
}

export async function consumeOAuthCode(code: string) {
  const store = getStore({ name: 'workvault-oauth', consistency: 'strong' })
  const key = `google/${code}`
  const data = await store.get(key, { type: 'json' }) as {
    refreshToken: string
    email: string
    calendarId: string
    createdAt: string
  } | null
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
