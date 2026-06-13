export type CheckoutInvoice = {
  id: string
  number: string
  total: number
  currency: string
  clientName: string
  clientEmail?: string
  lineItems: { description: string; amount: number }[]
}

export type CheckoutBody = {
  invoice: CheckoutInvoice
  successUrl: string
  cancelUrl: string
  credentials?: Record<string, string>
}

export function parseCheckoutBody(raw: unknown): CheckoutBody {
  const body = raw as CheckoutBody
  if (!body?.invoice?.id || !body.successUrl || !body.cancelUrl) {
    throw new Error('Invalid checkout payload')
  }
  return body
}

export function cred(
  credentials: Record<string, string> | undefined,
  key: string,
  envKey?: string,
): string {
  return credentials?.[key] || (envKey ? process.env[envKey] || '' : '')
}

export function appendPaymentId(url: string, param: string, placeholder: string): string {
  const sep = url.includes('?') ? '&' : '?'
  return `${url}${sep}${param}=${placeholder}`
}
