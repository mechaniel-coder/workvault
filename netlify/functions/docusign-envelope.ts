import type { Config } from '@netlify/functions'
import { getEnv, jsonResponse } from './_shared/integrations'

export default async (req: Request) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 })

  try {
    const body = await req.json() as {
      credentials: {
        docusignAccessToken?: string
        docusignAccountId?: string
        docusignBaseUrl?: string
      }
      contract: {
        id: string
        number: string
        title: string
        content: string
        clientName: string
        clientEmail: string
        contractorName: string
        contractorEmail: string
      }
      returnUrl: string
    }

    const accessToken = body.credentials.docusignAccessToken || getEnv('DOCUSIGN_ACCESS_TOKEN')
    const accountId = body.credentials.docusignAccountId || getEnv('DOCUSIGN_ACCOUNT_ID')
    const baseUrl = (body.credentials.docusignBaseUrl || getEnv('DOCUSIGN_BASE_URL') || 'https://demo.docusign.net/restapi').replace(/\/$/, '')

    if (!accessToken || !accountId) {
      return jsonResponse({ error: 'DocuSign access token and account ID required' }, 400)
    }

    const { contract, returnUrl } = body
    const docBase64 = Buffer.from(contract.content, 'utf8').toString('base64')

    const envelope = {
      emailSubject: `Please sign: ${contract.title}`,
      documents: [{
        documentBase64: docBase64,
        name: `${contract.number}.txt`,
        fileExtension: 'txt',
        documentId: '1',
      }],
      recipients: {
        signers: [{
          email: contract.clientEmail,
          name: contract.clientName,
          recipientId: '1',
          routingOrder: '1',
          tabs: {
            signHereTabs: [{ documentId: '1', pageNumber: '1', xPosition: '100', yPosition: '700' }],
          },
        }],
      },
      status: 'sent',
    }

    const createRes = await fetch(`${baseUrl}/v2.1/accounts/${accountId}/envelopes`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(envelope),
    })
    const created = await createRes.json()
    if (!createRes.ok) throw new Error(created.message || 'DocuSign envelope failed')

    const viewRes = await fetch(`${baseUrl}/v2.1/accounts/${accountId}/envelopes/${created.envelopeId}/views/recipient`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        returnUrl,
        authenticationMethod: 'none',
        email: contract.clientEmail,
        userName: contract.clientName,
        recipientId: '1',
      }),
    })
    const view = await viewRes.json()

    return jsonResponse({
      envelopeId: created.envelopeId,
      signingUrl: view.url || null,
      status: created.status,
    })
  } catch (err) {
    return jsonResponse({ error: err instanceof Error ? err.message : 'DocuSign failed' }, 500)
  }
}

export const config: Config = {
  path: '/api/docusign/envelope',
}
