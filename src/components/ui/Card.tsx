import { type ReactNode } from 'react'

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border border-surface-200 bg-white shadow-sm ${className}`}>
      {children}
    </div>
  )
}

export function CardHeader({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`px-6 py-4 border-b border-surface-100 ${className}`}>{children}</div>
}

export function CardBody({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`px-6 py-4 ${className}`}>{children}</div>
}

export function StatCard({
  label,
  value,
  icon,
  trend,
  className = '',
}: {
  label: string
  value: string
  icon: ReactNode
  trend?: string
  className?: string
}) {
  return (
    <Card className={`p-5 ${className}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-surface-500">{label}</p>
          <p className="mt-1 text-2xl font-bold text-surface-900">{value}</p>
          {trend && <p className="mt-1 text-xs text-surface-400">{trend}</p>}
        </div>
        <div className="rounded-lg bg-brand-50 p-2.5 text-brand-600">{icon}</div>
      </div>
    </Card>
  )
}
