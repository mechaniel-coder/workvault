import type { ClientFileAccess, Contract } from './types'

const ACCESS_RANK: Record<ClientFileAccess, number> = {
  none: 0,
  read: 1,
  write: 2,
}

export const CLIENT_FILE_ACCESS_OPTIONS: { value: ClientFileAccess; label: string; description: string }[] = [
  {
    value: 'none',
    label: 'No file access',
    description: 'Client cannot view or download project files in their WorkVault app.',
  },
  {
    value: 'read',
    label: 'Read access',
    description: 'Client can preview deliverables in-app after the contract is fully signed.',
  },
  {
    value: 'write',
    label: 'Read & write access',
    description: 'Signed clients can preview, download, and upload files.',
  },
]

/** Highest file-access level granted by any fully signed contract for this client. */
export function resolveClientFileAccess(contracts: Contract[], clientId: string): ClientFileAccess {
  const signed = contracts.filter(
    (c) => c.clientId === clientId && c.status === 'signed'
  )
  if (signed.length === 0) return 'none'

  return signed.reduce<ClientFileAccess>((best, c) => {
    const level = c.clientFileAccess ?? 'none'
    return ACCESS_RANK[level] > ACCESS_RANK[best] ? level : best
  }, 'none')
}

export function fileAccessFlags(access: ClientFileAccess) {
  return {
    clientFileAccess: access,
    canViewFiles: access !== 'none',
    allowDownloads: access === 'write',
    clientAssetUploadEnabled: access === 'write',
  }
}

export function clientFileAccessLabel(access: ClientFileAccess): string {
  return CLIENT_FILE_ACCESS_OPTIONS.find((o) => o.value === access)?.label ?? 'No file access'
}
