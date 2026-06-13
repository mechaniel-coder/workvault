import type { Contract, IntegrationCredentials } from './types'

export async function createDocuSignEnvelope(
  contract: Contract,
  opts: {
    credentials: IntegrationCredentials
    clientEmail: string
    contractorEmail: string
    contractorName: string
    returnUrl: string
  },
) {
  const res = await fetch('/api/docusign/envelope', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      credentials: opts.credentials,
      contract: {
        id: contract.id,
        number: contract.number,
        title: contract.title,
        content: contract.content,
        clientName: contract.clientName,
        clientEmail: opts.clientEmail,
        contractorName: opts.contractorName,
        contractorEmail: opts.contractorEmail,
      },
      returnUrl: opts.returnUrl,
    }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'DocuSign envelope failed')
  return data as { envelopeId: string; signingUrl: string | null; status: string }
}
