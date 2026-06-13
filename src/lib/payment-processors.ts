import type { AppState, IntegrationCredentials, IntegrationSettings, Invoice, InvoicePaymentLink, PaymentProcessorId } from './types'
import { apiFetch } from './api-client'

export const PAYMENT_PROCESSORS: {
  id: PaymentProcessorId
  name: string
  description: string
  url: string
  integrationKey: keyof IntegrationSettings
  credentialFields: { key: keyof IntegrationCredentials; label: string; secret?: boolean; placeholder?: string }[]
}[] = [
  {
    id: 'stripe',
    name: 'Stripe',
    description: 'Checkout sessions with cards, ACH, and Apple Pay.',
    url: 'https://stripe.com',
    integrationKey: 'stripeLivePayments',
    credentialFields: [
      { key: 'stripeSecretKey', label: 'Secret key', secret: true, placeholder: 'sk_live_... or sk_test_...' },
    ],
  },
  {
    id: 'paypal',
    name: 'PayPal',
    description: 'PayPal Checkout — clients pay with PayPal balance or card.',
    url: 'https://developer.paypal.com',
    integrationKey: 'paypalPayments',
    credentialFields: [
      { key: 'paypalClientId', label: 'Client ID', placeholder: 'From PayPal Developer Dashboard' },
      { key: 'paypalClientSecret', label: 'Client secret', secret: true },
    ],
  },
  {
    id: 'square',
    name: 'Square',
    description: 'Square payment links for online invoice collection.',
    url: 'https://developer.squareup.com',
    integrationKey: 'squarePayments',
    credentialFields: [
      { key: 'squareAccessToken', label: 'Access token', secret: true },
      { key: 'squareLocationId', label: 'Location ID', placeholder: 'L...' },
    ],
  },
  {
    id: 'wise',
    name: 'Wise Business',
    description: 'International bank transfers and multi-currency payment requests.',
    url: 'https://wise.com/business',
    integrationKey: 'wisePayments',
    credentialFields: [
      { key: 'wiseApiToken', label: 'API token', secret: true },
      { key: 'wiseProfileId', label: 'Profile ID', placeholder: 'From Wise Business settings' },
    ],
  },
  {
    id: 'lemon_squeezy',
    name: 'Lemon Squeezy',
    description: 'Checkout for digital products and services with tax handling.',
    url: 'https://docs.lemonsqueezy.com',
    integrationKey: 'lemonSqueezyPayments',
    credentialFields: [
      { key: 'lemonSqueezyApiKey', label: 'API key', secret: true },
      { key: 'lemonSqueezyStoreId', label: 'Store ID', placeholder: 'Numeric store ID' },
      { key: 'lemonSqueezyVariantId', label: 'Variant ID', placeholder: 'Custom-price variant ID' },
    ],
  },
  {
    id: 'paddle',
    name: 'Paddle',
    description: 'Merchant of record for SaaS and digital sales worldwide.',
    url: 'https://developer.paddle.com',
    integrationKey: 'paddlePayments',
    credentialFields: [
      { key: 'paddleApiKey', label: 'API key', secret: true },
      { key: 'paddleVendorId', label: 'Vendor / seller ID', placeholder: 'sel_...' },
    ],
  },
]

export function getEnabledProcessors(integrations: IntegrationSettings): PaymentProcessorId[] {
  return PAYMENT_PROCESSORS.filter((p) => integrations[p.integrationKey]).map((p) => p.id)
}

export function getProcessorMeta(id: PaymentProcessorId) {
  return PAYMENT_PROCESSORS.find((p) => p.id === id)
}

export function normalizeInvoicePaymentLinks(invoice: Invoice): InvoicePaymentLink[] {
  const links = [...(invoice.paymentLinks || [])]
  if (invoice.stripeCheckoutUrl && !links.some((l) => l.processor === 'stripe')) {
    links.push({
      processor: 'stripe',
      url: invoice.stripeCheckoutUrl,
      externalId: invoice.stripeSessionId,
      createdAt: invoice.sentAt || invoice.createdAt,
    })
  }
  return links
}

export function getPrimaryPaymentLink(invoice: Invoice, processor?: PaymentProcessorId): string | null {
  const links = normalizeInvoicePaymentLinks(invoice)
  if (processor) return links.find((l) => l.processor === processor)?.url ?? null
  return links[0]?.url ?? invoice.stripeCheckoutUrl
}

export function formatPaymentLinksForEmail(invoice: Invoice, state: AppState): string {
  const links = normalizeInvoicePaymentLinks(invoice)
  const enabled = new Set(getEnabledProcessors(state.integrations))
  const lines = links
    .filter((l) => enabled.has(l.processor))
    .map((l) => {
      const name = getProcessorMeta(l.processor)?.name ?? l.processor
      return `• ${name}: ${l.url}`
    })
  if (lines.length === 0) return ''
  return ['Pay online:', ...lines].join('\n')
}

export function mergePaymentLink(
  existing: InvoicePaymentLink[],
  link: InvoicePaymentLink,
): InvoicePaymentLink[] {
  const filtered = existing.filter((l) => l.processor !== link.processor)
  return [...filtered, link]
}

export type CheckoutPayload = {
  invoice: {
    id: string
    number: string
    total: number
    currency: string
    clientName: string
    clientEmail?: string
    lineItems: { description: string; amount: number }[]
  }
  successUrl: string
  cancelUrl: string
  credentials: Partial<IntegrationCredentials>
}

export async function createProcessorCheckout(
  processor: PaymentProcessorId,
  invoice: Invoice,
  state: AppState,
): Promise<InvoicePaymentLink> {
  const successUrl = `${window.location.origin}/invoices?payment_success=1&processor=${processor}`
  const cancelUrl = `${window.location.origin}/invoices?payment_cancel=1&processor=${processor}`
  const client = state.clients.find((c) => c.id === invoice.clientId)

  const payload: CheckoutPayload = {
    invoice: {
      id: invoice.id,
      number: invoice.number,
      total: invoice.total,
      currency: state.profile.defaultCurrency,
      clientName: invoice.clientName,
      clientEmail: client?.email,
      lineItems: invoice.lineItems.map((li) => ({ description: li.description, amount: li.amount })),
    },
    successUrl,
    cancelUrl,
    credentials: state.integrationCredentials,
  }

  const res = await apiFetch(`/api/payments/${processor}/checkout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || `${processor} checkout failed`)

  return {
    processor,
    url: data.url,
    externalId: data.externalId ?? data.sessionId ?? null,
    createdAt: new Date().toISOString(),
  }
}

export async function verifyProcessorPayment(
  processor: PaymentProcessorId,
  externalId: string,
  credentials: IntegrationCredentials,
): Promise<{ paid: boolean; invoiceId?: string; paidAt?: string }> {
  const res = await apiFetch(`/api/payments/${processor}/verify/${externalId}`, {
    headers: { 'Content-Type': 'application/json' },
    method: 'POST',
    body: JSON.stringify({ credentials }),
  })
  return res.json()
}

export function invoiceUpdateFromPaymentLinks(
  links: InvoicePaymentLink[],
): Partial<Invoice> {
  const stripe = links.find((l) => l.processor === 'stripe')
  return {
    paymentLinks: links,
    stripeCheckoutUrl: stripe?.url ?? null,
    stripeSessionId: stripe?.externalId ?? null,
  }
}
