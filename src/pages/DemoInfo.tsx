import { Shield, Sparkles, Lock, Database, Code, RefreshCw } from 'lucide-react'
import { Card } from '../components/ui/Card'
import { PageHeader } from '../components/ui/Modal'
import { useDemo } from '../context/DemoContext'

export default function DemoInfo() {
  const demo = useDemo()

  const points = [
    { icon: Database, title: 'Sample data only', desc: 'All clients, invoices, and records shown here are fictional demo content.' },
    { icon: Lock, title: 'Isolated session', desc: 'This preview cannot access the contractor\'s real data, backups, or cloud sync.' },
    { icon: Code, title: 'No sensitive exports', desc: 'Data export, settings, and account controls are disabled in this environment.' },
    { icon: RefreshCw, title: 'Nothing persists', desc: demo.mode === 'review' ? 'Review mode is read-only — explore every screen safely.' : 'Demo mode lets you click around; changes reset when you leave.' },
    { icon: Lock, title: 'No downloads', desc: 'Project files and exports are view-only in this room — your contractor\'s work stays protected.' },
  ]

  return (
    <div>
      <PageHeader
        title="Preview Information"
        description={`You're viewing a secure ${demo.mode === 'review' ? 'review' : 'demo'} room hosted by ${demo.contractorName}.`}
      />

      <Card className="mb-6 p-6 border-brand-200 bg-gradient-to-br from-brand-50 to-white">
        <div className="flex items-center gap-3 mb-3">
          {demo.mode === 'review' ? <Shield size={20} className="text-brand-600" /> : <Sparkles size={20} className="text-brand-600" />}
          <h2 className="text-lg font-semibold text-surface-900">
            {demo.mode === 'review' ? 'Review Mode' : 'Interactive Demo Mode'}
          </h2>
        </div>
        <p className="text-sm text-surface-600 leading-relaxed">
          Use the sidebar to explore WorkVault modules. This environment is designed so your customer can evaluate the platform
          without seeing private business information or accessing backend systems.
        </p>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        {points.map(({ icon: Icon, title, desc }) => (
          <Card key={title} className="p-5">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-100 text-brand-600">
                <Icon size={16} />
              </div>
              <div>
                <p className="text-sm font-semibold text-surface-900">{title}</p>
                <p className="text-xs text-surface-500 mt-1 leading-relaxed">{desc}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
