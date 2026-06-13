import { useRef } from 'react'
import { Settings, Download, Upload, Trash2, Plug } from 'lucide-react'
import { useStore } from '../context/StoreContext'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Card } from '../components/ui/Card'
import { PageHeader } from '../components/ui/Modal'
import { exportAllData, importAllData } from '../lib/utils'
import { CloudSyncPanel } from '../components/CloudSyncPanel'
import { PaymentMethodsSettings } from '../components/PaymentMethodsSettings'
import { DemoReviewSettings } from '../components/DemoReviewSettings'
import { ClientRoomSettings } from '../components/ClientRoomSettings'
import { DemoProjectDropzone } from '../components/DemoProjectDropzone'

export default function SettingsPage() {
  const { state, updateProfile, updateIntegrations, importData, resetAll } = useStore()
  const fileRef = useRef<HTMLInputElement>(null)
  const { profile } = state

  const handleExport = () => {
    const data = exportAllData(state)
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `workvault-backup-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const data = importAllData(ev.target?.result as string)
        importData(data)
        alert('Data imported successfully!')
      } catch {
        alert('Invalid backup file.')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  const handleReset = () => {
    if (confirm('This will permanently delete all your WorkVault data. Are you sure?')) {
      resetAll()
    }
  }

  return (
    <div>
      <PageHeader
        title="Settings"
        description="Configure your business profile and manage your data."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <div className="px-6 py-4 border-b border-surface-100">
            <h2 className="text-base font-semibold text-surface-900 flex items-center gap-2">
              <Settings size={16} /> Business Profile
            </h2>
            <p className="text-xs text-surface-400 mt-1">Used on contracts and invoices</p>
          </div>
          <div className="p-6 space-y-4">
            <Input label="Business Name" value={profile.name} onChange={(e) => updateProfile({ name: e.target.value })} />
            <div className="grid grid-cols-2 gap-4">
              <Input label="Email" type="email" value={profile.email} onChange={(e) => updateProfile({ email: e.target.value })} />
              <Input label="Phone" value={profile.phone} onChange={(e) => updateProfile({ phone: e.target.value })} />
            </div>
            <Input label="Address" value={profile.address} onChange={(e) => updateProfile({ address: e.target.value })} />
            <div className="grid grid-cols-3 gap-4">
              <Input label="City" value={profile.city} onChange={(e) => updateProfile({ city: e.target.value })} />
              <Input label="State" value={profile.state} onChange={(e) => updateProfile({ state: e.target.value })} />
              <Input label="ZIP" value={profile.zip} onChange={(e) => updateProfile({ zip: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Tax ID / EIN" value={profile.taxId} onChange={(e) => updateProfile({ taxId: e.target.value })} />
              <Input label="Website" value={profile.website} onChange={(e) => updateProfile({ website: e.target.value })} />
            </div>
          </div>
        </Card>

        <Card>
          <div className="px-6 py-4 border-b border-surface-100">
            <h2 className="text-base font-semibold text-surface-900">Billing Defaults</h2>
          </div>
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Default Hourly Rate"
                type="number"
                value={profile.defaultHourlyRate}
                onChange={(e) => updateProfile({ defaultHourlyRate: parseFloat(e.target.value) || 0 })}
              />
              <Input
                label="Currency"
                value={profile.defaultCurrency}
                onChange={(e) => updateProfile({ defaultCurrency: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Invoice Prefix"
                value={profile.invoicePrefix}
                onChange={(e) => updateProfile({ invoicePrefix: e.target.value })}
              />
              <Input
                label="Contract Prefix"
                value={profile.contractPrefix}
                onChange={(e) => updateProfile({ contractPrefix: e.target.value })}
              />
            </div>
          </div>
        </Card>

        <PaymentMethodsSettings />

        <Card>
          <div className="px-6 py-4 border-b border-surface-100">
            <h2 className="text-base font-semibold text-surface-900 flex items-center gap-2">
              <Plug size={16} /> Integrations
            </h2>
            <p className="text-xs text-surface-400 mt-1">Enable export formats and third-party features</p>
          </div>
          <div className="p-6 space-y-3">
            {([
              ['quickbooksExport', 'QuickBooks CSV export', 'Export invoices and expenses in QuickBooks format from Finance → Reports'],
              ['xeroExport', 'Xero export format', 'Compatible CSV layout for Xero import'],
              ['stripeLivePayments', 'Stripe live payment links', 'Use live Stripe URLs on invoices (configure in Payment Methods)'],
              ['wiseMultiCurrency', 'Wise multi-currency', 'Show multi-currency payment options for international clients'],
              ['googleCalendarSync', 'Google Calendar sync', 'Sync availability blocks to Google Calendar (coming soon)'],
            ] as const).map(([key, label, desc]) => (
              <label key={key} className="flex items-start gap-3 p-3 rounded-xl border border-surface-100 hover:bg-surface-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={state.integrations[key]}
                  onChange={(e) => updateIntegrations({ [key]: e.target.checked })}
                  className="mt-1 rounded border-surface-300 text-brand-600 focus:ring-brand-500"
                />
                <div>
                  <p className="text-sm font-medium text-surface-900">{label}</p>
                  <p className="text-xs text-surface-400 mt-0.5">{desc}</p>
                </div>
              </label>
            ))}
          </div>
        </Card>

        <CloudSyncPanel />

        <DemoReviewSettings />

        <ClientRoomSettings />

        <div className="lg:col-span-2">
          <DemoProjectDropzone />
        </div>

        <Card className="lg:col-span-2">
          <div className="px-6 py-4 border-b border-surface-100">
            <h2 className="text-base font-semibold text-surface-900">Local Backup</h2>
            <p className="text-xs text-surface-400 mt-1">Export or import a JSON backup file</p>
          </div>
          <div className="p-6 flex flex-wrap gap-3">
            <Button variant="secondary" onClick={handleExport}>
              <Download size={16} /> Export Backup
            </Button>
            <Button variant="secondary" onClick={() => fileRef.current?.click()}>
              <Upload size={16} /> Import Backup
            </Button>
            <input ref={fileRef} type="file" accept=".json" className="hidden" onChange={handleImport} />
            <Button variant="danger" onClick={handleReset}>
              <Trash2 size={16} /> Reset All Data
            </Button>
          </div>
        </Card>
      </div>

      <div className="mt-8 text-center text-xs text-surface-400">
        <p>WorkVault v2.0 — Local-first with optional encrypted cloud sync. Install as PWA from your browser menu.</p>
      </div>
    </div>
  )
}
