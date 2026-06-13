import type { AppState, AvailabilityBlock, IntegrationCredentials, Invoice, Milestone } from './types'
import { buildInvoiceEmailBody, resolveInvoicePaymentMethods } from './payments'
import { formatPaymentLinksForEmail } from './payment-processors'
import { fillTemplate } from './reports'
import { formatCurrency, formatDate } from './utils'

export function maskSecret(value: string): string {
  if (!value) return ''
  if (value.length <= 8) return '••••••••'
  return `${value.slice(0, 4)}${'•'.repeat(8)}${value.slice(-4)}`
}

export async function createStripeCheckout(
  invoice: Invoice,
  state: AppState,
  credentials: IntegrationCredentials,
): Promise<{ url: string; sessionId: string }> {
  const successUrl = `${window.location.origin}/invoices?stripe_success=1`
  const cancelUrl = `${window.location.origin}/invoices?stripe_cancel=1`

  const res = await fetch('/api/stripe/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      secretKey: credentials.stripeSecretKey || undefined,
      invoice: {
        id: invoice.id,
        number: invoice.number,
        total: invoice.total,
        currency: state.profile.defaultCurrency,
        clientName: invoice.clientName,
        lineItems: invoice.lineItems.map((li) => ({
          description: li.description,
          amount: li.amount,
        })),
      },
      successUrl,
      cancelUrl,
    }),
  })

  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Failed to create checkout')
  return { url: data.url, sessionId: data.sessionId }
}

export async function sendEmailViaResend(opts: {
  credentials: IntegrationCredentials
  profileEmail: string
  profileName: string
  to: string
  subject: string
  text: string
}): Promise<{ ok: boolean; id?: string; error?: string }> {
  const from = opts.credentials.emailFrom || opts.profileEmail
  if (!from) return { ok: false, error: 'Configure a from email address in Integrations' }

  const res = await fetch('/api/email/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      apiKey: opts.credentials.resendApiKey || undefined,
      from,
      fromName: opts.credentials.emailFromName || opts.profileName,
      to: opts.to,
      subject: opts.subject,
      text: opts.text,
      replyTo: opts.profileEmail || undefined,
    }),
  })

  const data = await res.json()
  if (!res.ok) return { ok: false, error: data.error || 'Send failed' }
  return { ok: true, id: data.id }
}

export async function verifyStripeSession(
  sessionId: string,
  secretKey?: string,
): Promise<{ paid: boolean; invoiceId?: string; paidAt?: string }> {
  const res = await fetch(`/api/stripe/verify/${sessionId}`, {
    headers: secretKey ? { 'x-stripe-secret': secretKey } : {},
  })
  return res.json()
}

export async function startGmailOAuth(): Promise<string> {
  const origin = window.location.origin
  const res = await fetch(`/api/gmail/oauth/start?origin=${encodeURIComponent(origin)}`)
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Gmail OAuth start failed')
  return data.url as string
}

export async function exchangeGmailOAuthCode(code: string) {
  const res = await fetch(`/api/gmail/oauth/token?code=${encodeURIComponent(code)}`)
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Gmail token exchange failed')
  return data as { refreshToken: string; email: string }
}

export async function sendEmailViaGmail(opts: {
  credentials: IntegrationCredentials
  profileEmail: string
  profileName: string
  to: string
  subject: string
  text: string
}): Promise<{ ok: boolean; id?: string; error?: string }> {
  const from = opts.credentials.gmailAccountEmail || opts.profileEmail
  if (!opts.credentials.gmailRefreshToken) return { ok: false, error: 'Gmail not connected' }
  if (!from) return { ok: false, error: 'Configure a Gmail from address' }

  const res = await fetch('/api/gmail/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      refreshToken: opts.credentials.gmailRefreshToken,
      from,
      fromName: opts.credentials.emailFromName || opts.profileName,
      to: opts.to,
      subject: opts.subject,
      text: opts.text,
      replyTo: opts.profileEmail || undefined,
    }),
  })
  const data = await res.json()
  if (!res.ok) return { ok: false, error: data.error || 'Gmail send failed' }
  return { ok: true, id: data.id }
}

export async function fetchGmailInbox(state: AppState) {
  const clientEmails = state.clients.map((c) => c.email).filter(Boolean)
  const res = await fetch('/api/gmail/inbox', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      refreshToken: state.integrationCredentials.gmailRefreshToken,
      clientEmails,
      maxResults: 30,
    }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Inbox fetch failed')
  return data.threads as {
    id: string
    threadId: string
    from: string
    to: string
    subject: string
    snippet: string
    date: string
    clientEmail: string | null
    unread: boolean
  }[]
}

export async function deliverEmail(
  state: AppState,
  to: string,
  subject: string,
  text: string,
): Promise<{ ok: boolean; provider?: string; error?: string }> {
  const opts = {
    credentials: state.integrationCredentials,
    profileEmail: state.profile.email,
    profileName: state.profile.name,
    to,
    subject,
    text,
  }

  if (state.integrations.gmailSendEnabled && state.integrationCredentials.gmailRefreshToken) {
    const result = await sendEmailViaGmail(opts)
    return { ...result, provider: 'gmail' }
  }

  if (state.integrations.emailSendEnabled) {
    const result = await sendEmailViaResend(opts)
    return { ...result, provider: 'resend' }
  }

  return { ok: false, error: 'No email provider enabled' }
}

export function buildInvoiceEmailContent(invoice: Invoice, state: AppState) {
  const client = state.clients.find((c) => c.id === invoice.clientId)
  const methods = resolveInvoicePaymentMethods(state.profile, invoice.paymentMethodIds)
  let text = buildInvoiceEmailBody(invoice, state.profile, client?.name || 'there', methods)
  const paymentBlock = formatPaymentLinksForEmail(invoice, state)
  if (paymentBlock) text += `\n\n${paymentBlock}`
  return {
    to: client?.email || '',
    subject: `Invoice ${invoice.number} — ${formatCurrency(invoice.total, state.profile.defaultCurrency)}`,
    text,
  }
}

export function buildReminderEmailContent(invoice: Invoice, state: AppState) {
  const client = state.clients.find((c) => c.id === invoice.clientId)
  const templateType = invoice.status === 'overdue' || new Date(invoice.dueDate) < new Date()
    ? 'payment_overdue'
    : 'payment_reminder'
  const template = state.emailTemplates.find((t) => t.type === templateType)
  const vars = {
    clientName: client?.name || 'there',
    invoiceNumber: invoice.number,
    amount: formatCurrency(invoice.total, state.profile.defaultCurrency),
    amountDue: formatCurrency(invoice.total, state.profile.defaultCurrency),
    dueDate: formatDate(invoice.dueDate),
    contractorName: state.profile.name || 'Your contractor',
    businessName: state.profile.name || 'Your contractor',
  }
  const subject = template
    ? fillTemplate(template.subject, vars)
    : `Payment reminder: Invoice ${invoice.number}`
  let text = template
    ? fillTemplate(template.body, vars)
    : `Hi ${vars.clientName},\n\nThis is a friendly reminder that invoice ${invoice.number} for ${vars.amount} is due on ${vars.dueDate}.\n\nThank you.`
  const paymentBlock = formatPaymentLinksForEmail(invoice, state)
  if (paymentBlock) text += `\n\n${paymentBlock}`
  return { to: client?.email || '', subject, text }
}

export async function startGoogleOAuth(): Promise<string> {
  const origin = window.location.origin
  const res = await fetch(`/api/google/oauth/start?origin=${encodeURIComponent(origin)}`)
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'OAuth start failed')
  return data.url as string
}

export async function exchangeGoogleOAuthCode(code: string) {
  const res = await fetch(`/api/google/oauth/token?code=${encodeURIComponent(code)}`)
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Token exchange failed')
  return data as { refreshToken: string; email: string; calendarId: string }
}

function toIsoDateTime(date: string, time: string): string {
  return new Date(`${date}T${time}:00`).toISOString()
}

export function buildCalendarEventsFromState(state: AppState) {
  const events: {
    id: string
    summary: string
    description?: string
    start: { dateTime: string; timeZone: string }
    end: { dateTime: string; timeZone: string }
  }[] = []

  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'

  state.availabilityBlocks.forEach((block: AvailabilityBlock) => {
    events.push({
      id: `avail-${block.id}`,
      summary: block.available ? 'Available' : 'Unavailable',
      description: block.notes || undefined,
      start: { dateTime: toIsoDateTime(block.date, block.startTime), timeZone: tz },
      end: { dateTime: toIsoDateTime(block.date, block.endTime), timeZone: tz },
    })
  })

  state.milestones
    .filter((m: Milestone) => !m.completed && m.dueDate)
    .forEach((m) => {
      events.push({
        id: `milestone-${m.id}`,
        summary: `Milestone: ${m.title}`,
        description: `${m.projectName} · ${m.clientName} · ${m.percent}%`,
        start: { dateTime: `${m.dueDate}T09:00:00`, timeZone: tz },
        end: { dateTime: `${m.dueDate}T10:00:00`, timeZone: tz },
      })
    })

  return events
}

export async function syncGoogleCalendar(
  state: AppState,
  credentials: IntegrationCredentials,
  eventMap: Record<string, string>,
) {
  const events = buildCalendarEventsFromState(state)
  const activeIds = new Set(events.map((e) => e.id))
  const deleteEventIds = Object.entries(eventMap)
    .filter(([sourceId]) => !activeIds.has(sourceId))
    .map(([, googleId]) => googleId)

  const res = await fetch('/api/google/calendar/sync', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      refreshToken: credentials.googleRefreshToken,
      calendarId: credentials.googleCalendarId || 'primary',
      events,
      deleteEventIds,
      eventMap,
    }),
  })

  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Calendar sync failed')
  return data as { eventMap: Record<string, string>; syncedAt: string; synced: number }
}

export function downloadIcsFeed(state: AppState) {
  const events = buildCalendarEventsFromState(state)
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//WorkVault//Calendar//EN',
    'CALSCALE:GREGORIAN',
  ]

  events.forEach((e) => {
    const uid = e.id
    const dtStart = e.start.dateTime.replace(/[-:]/g, '').replace(/\.\d{3}/, '')
    const dtEnd = e.end.dateTime.replace(/[-:]/g, '').replace(/\.\d{3}/, '')
    lines.push(
      'BEGIN:VEVENT',
      `UID:${uid}@workvault`,
      `DTSTART:${dtStart}`,
      `DTEND:${dtEnd}`,
      `SUMMARY:${e.summary.replace(/\n/g, ' ')}`,
      e.description ? `DESCRIPTION:${e.description.replace(/\n/g, ' ')}` : '',
      'END:VEVENT',
    )
  })

  lines.push('END:VCALENDAR')
  const blob = new Blob([lines.filter(Boolean).join('\r\n')], { type: 'text/calendar' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `workvault-calendar-${new Date().toISOString().split('T')[0]}.ics`
  a.click()
  URL.revokeObjectURL(url)
}
