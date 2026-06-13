import type { BusinessProfile, PaymentMethod, PaymentMethodType } from './types'
import { formatCurrency } from './utils'

export const PAYMENT_METHOD_META: Record<
  PaymentMethodType,
  { label: string; placeholder: string; hint: string }
> = {
  bank_transfer: {
    label: 'Bank Transfer (ACH/Wire)',
    placeholder: 'Bank: Chase · Routing: 021000021 · Account: ****4521',
    hint: 'Include bank name, routing, and account number',
  },
  paypal: {
    label: 'PayPal',
    placeholder: 'paypal.me/yourbusiness or your@email.com',
    hint: 'PayPal.me link or email address',
  },
  venmo: {
    label: 'Venmo',
    placeholder: '@YourBusinessName',
    hint: 'Your Venmo username',
  },
  zelle: {
    label: 'Zelle',
    placeholder: 'pay@yourbusiness.com or (555) 123-4567',
    hint: 'Email or phone linked to Zelle',
  },
  stripe: {
    label: 'Stripe Payment Link',
    placeholder: 'https://buy.stripe.com/...',
    hint: 'Stripe payment link URL — clients can pay online',
  },
  cashapp: {
    label: 'Cash App',
    placeholder: '$YourCashtag',
    hint: 'Your Cash App $cashtag',
  },
  check: {
    label: 'Check',
    placeholder: 'Make payable to: Your Business · Mail to: 123 Main St...',
    hint: 'Payee name and mailing address',
  },
  other: {
    label: 'Other',
    placeholder: 'Wise, cryptocurrency, etc.',
    hint: 'Any other payment instructions',
  },
}

export function getEnabledPaymentMethods(profile: BusinessProfile): PaymentMethod[] {
  return profile.paymentMethods.filter((m) => m.enabled)
}

export function resolveInvoicePaymentMethods(
  profile: BusinessProfile,
  paymentMethodIds: string[]
): PaymentMethod[] {
  const enabled = getEnabledPaymentMethods(profile)
  if (paymentMethodIds.length === 0) return enabled
  return enabled.filter((m) => paymentMethodIds.includes(m.id))
}

export function getPaymentLink(method: PaymentMethod): string | null {
  const d = method.details.trim()
  if (!d) return null
  if (method.type === 'stripe' || d.startsWith('http://') || d.startsWith('https://')) {
    return d.startsWith('http') ? d : null
  }
  if (method.type === 'paypal' && d.includes('paypal.me')) {
    return d.startsWith('http') ? d : `https://${d.replace(/^\/\//, '')}`
  }
  if (method.type === 'venmo') {
    const handle = d.replace(/^@/, '')
    return `https://venmo.com/${handle}`
  }
  if (method.type === 'cashapp') {
    const tag = d.replace(/^\$/, '')
    return `https://cash.app/$${tag}`
  }
  return null
}

export function formatPaymentMethodLine(method: PaymentMethod): string {
  const meta = PAYMENT_METHOD_META[method.type]
  const name = method.label || meta.label
  return `${name}: ${method.details}`
}

export function buildPaymentInstructionsText(
  profile: BusinessProfile,
  methods: PaymentMethod[],
  extraInstructions?: string
): string {
  const lines: string[] = []
  if (methods.length > 0) {
    lines.push('PAYMENT METHODS:')
    for (const m of methods) {
      lines.push(`• ${formatPaymentMethodLine(m)}`)
      const link = getPaymentLink(m)
      if (link) lines.push(`  Pay online: ${link}`)
    }
  }
  const instructions = extraInstructions || profile.defaultPaymentInstructions
  if (instructions) {
    lines.push('', instructions)
  }
  return lines.join('\n')
}

export function buildInvoiceEmailBody(
  invoice: { number: string; total: number; dueDate: string; paymentInstructions?: string },
  profile: BusinessProfile,
  clientName: string,
  methods: PaymentMethod[]
): string {
  const paymentBlock = buildPaymentInstructionsText(profile, methods, invoice.paymentInstructions)
  return [
    `Hi ${clientName},`,
    '',
    `Please find invoice ${invoice.number} for ${formatCurrency(invoice.total, profile.defaultCurrency)}.`,
    `Due date: ${new Date(invoice.dueDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`,
    '',
    paymentBlock ? `${paymentBlock}\n` : '',
    'Thank you for your business!',
    '',
    profile.name,
  ]
    .filter(Boolean)
    .join('\n')
}
