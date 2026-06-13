import { type ReactNode } from 'react'

const statusColors: Record<string, string> = {
  draft: 'bg-surface-100 text-surface-600',
  sent: 'bg-blue-100 text-blue-700',
  awaiting_signature: 'bg-violet-100 text-violet-700',
  partially_signed: 'bg-amber-100 text-amber-700',
  signed: 'bg-emerald-100 text-emerald-700',
  paid: 'bg-emerald-100 text-emerald-700',
  overdue: 'bg-red-100 text-red-700',
  expired: 'bg-red-100 text-red-700',
  expiring: 'bg-amber-100 text-amber-700',
  active: 'bg-emerald-100 text-emerald-700',
  pending: 'bg-amber-100 text-amber-700',
  cancelled: 'bg-surface-100 text-surface-500',
  live: 'bg-emerald-100 text-emerald-700',
  archived: 'bg-surface-100 text-surface-500',
}

export function Badge({ status, children }: { status: string; children?: ReactNode }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${statusColors[status] || 'bg-surface-100 text-surface-600'}`}
    >
      {children || status}
    </span>
  )
}
