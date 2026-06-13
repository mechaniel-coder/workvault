import { useRef, useMemo, useState } from 'react'
import { Settings, Download, Upload, Trash2, Plug, Layers, Search } from 'lucide-react'
import { useStore } from '../context/StoreContext'
import { useIndustry } from '../context/IndustryContext'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Card } from '../components/ui/Card'
import { PageHeader } from '../components/ui/Modal'
import { exportAllData, importAllData } from '../lib/utils'
import { CloudSyncPanel } from '../components/CloudSyncPanel'
import { ClientWorkspaceImportCard } from '../components/ClientWorkspaceImportCard'
import { dataDirectoryHint, isDesktopApp } from '../lib/platform'
import { PaymentMethodsSettings } from '../components/PaymentMethodsSettings'
import { getEnabledProcessors, PAYMENT_PROCESSORS } from '../lib/payment-processors'
import { DemoReviewSettings } from '../components/DemoReviewSettings'
import { ClientRoomSettings } from '../components/ClientRoomSettings'
import { DemoProjectDropzone } from '../components/DemoProjectDropzone'
import { INDUSTRY_CATEGORIES, industriesByCategory, type IndustryCategory } from '../lib/industries'

export default function SettingsPage() {
  const { state, updateProfile, importData, resetAll } = useStore()
  const { industryId, setIndustry } = useIndustry()
  const [industryQuery, setIndustryQuery] = useState('')
  const grouped = useMemo(() => industriesByCategory(), [])
  const filteredGroups = useMemo(() => {
    const q = industryQuery.trim().toLowerCase()
    if (!q) return grouped
    const result = {} as Record<IndustryCategory, typeof grouped.general>
    for (const [cat, list] of Object.entries(grouped) as [IndustryCategory, typeof grouped.general][]) {
      const matches = list.filter(
        (i) =>
          i.label.toLowerCase().includes(q) ||
          i.shortLabel.toLowerCase().includes(q) ||
          i.description.toLowerCase().includes(q),
      )
      if (matches.length) result[cat] = matches
    }
    return result
  }, [grouped, industryQuery])
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
        <Card className="lg:col-span-2">
          <div className="px-6 py-4 border-b border-surface-100">
            <h2 className="text-base font-semibold text-surface-900 flex items-center gap-2">
              <Layers size={16} /> Industry & workspace
            </h2>
            <p className="text-xs text-surface-400 mt-1">
              Tailors navigation, labels, dashboard, and welcome experience
            </p>
          </div>
          <div className="p-6 space-y-4">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
              <input
                type="search"
                value={industryQuery}
                onChange={(e) => setIndustryQuery(e.target.value)}
                placeholder="Search industries…"
                className="w-full rounded-lg border border-surface-200 py-2 pl-9 pr-3 text-sm focus:border-brand-500 focus:outline-none"
              />
            </div>
            <div className="max-h-96 overflow-y-auto space-y-5 pr-1">
              {(Object.keys(INDUSTRY_CATEGORIES) as IndustryCategory[]).map((cat) => {
                const list = filteredGroups[cat]
                if (!list?.length) return null
                return (
                  <div key={cat}>
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-surface-400 mb-2">
                      {INDUSTRY_CATEGORIES[cat]}
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                      {list.map((industry) => {
                        const Icon = industry.icon
                        const selected = industryId === industry.id
                        return (
                          <button
                            key={industry.id}
                            type="button"
                            onClick={() => setIndustry(industry.id)}
                            className={`rounded-xl border p-3 text-left transition-all ${
                              selected
                                ? 'border-brand-500 bg-brand-50 ring-1 ring-brand-500/30'
                                : 'border-surface-200 hover:border-surface-300 hover:bg-surface-50'
                            }`}
                          >
                            <Icon size={18} className={selected ? 'text-brand-600' : 'text-surface-400'} />
                            <p className="mt-2 text-sm font-medium text-surface-900">{industry.shortLabel}</p>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </Card>

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

        <Card className="lg:col-span-2">
          <div className="px-6 py-4 border-b border-surface-100 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-semibold text-surface-900 flex items-center gap-2">
                <Plug size={16} /> Integrations
              </h2>
              <p className="text-xs text-surface-400 mt-1">Payment processors, email, calendar, and export formats</p>
            </div>
            <a href="/integrations">
              <Button variant="secondary" size="sm">Manage Integrations</Button>
            </a>
          </div>
          <div className="p-6 grid gap-3 sm:grid-cols-3 text-sm">
            <div className="p-3 rounded-xl bg-surface-50 border border-surface-100">
              <p className="font-medium text-surface-800">Payments</p>
              <p className="text-xs text-surface-500 mt-1">
                {(() => {
                  const enabled = getEnabledProcessors(state.integrations)
                  if (enabled.length === 0) return 'No live checkout'
                  return enabled.map((id) => PAYMENT_PROCESSORS.find((p) => p.id === id)?.name || id).join(', ')
                })()}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-surface-50 border border-surface-100">
              <p className="font-medium text-surface-800">Email</p>
              <p className="text-xs text-surface-500 mt-1">
                {state.integrations.gmailSendEnabled && state.integrationCredentials.gmailAccountEmail
                  ? `Gmail (${state.integrationCredentials.gmailAccountEmail})`
                  : state.integrations.emailSendEnabled ? 'Resend configured' : 'mailto fallback'}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-surface-50 border border-surface-100">
              <p className="font-medium text-surface-800">1099 Filing</p>
              <p className="text-xs text-surface-500 mt-1">{state.tax1099Settings.enabled ? 'Tracking enabled' : 'Not enabled'}</p>
            </div>
          </div>
        </Card>

        <CloudSyncPanel />

        <Card className="lg:col-span-2 p-6 border-brand-100 bg-brand-50/30">
          <h2 className="text-base font-semibold text-surface-900 mb-1">
            {isDesktopApp() ? 'WorkVault Desktop — local on your Mac' : 'Local-first + Netlify'}
          </h2>
          <p className="text-sm text-surface-600 leading-relaxed">
            {isDesktopApp() ? (
              <>
                This is the <strong>desktop app</strong>. Your business data is saved on disk at{' '}
                <code className="text-xs bg-surface-100 px-1 py-0.5 rounded">{dataDirectoryHint()}</code>.
                Netlify is optional — for sync, client hosted links, AI, OAuth, and payments when you&apos;re online.
              </>
            ) : (
              <>
                Your business data lives on this device first. Netlify optionally hosts client workspace links,
                encrypted backup sync, integrations (AI, OAuth, payments), and team features — so clients can open a
                link online while you both keep local copies. Send clients a <strong>.workvault</strong> file and/or a
                hosted link from the Clients page. Install the Mac app from the project <code className="text-xs">.dmg</code> installer.
              </>
            )}
          </p>
        </Card>

        <ClientWorkspaceImportCard />

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
        <p>WorkVault v2.0 — Local-first on your device, with optional Netlify sync, hosted client links, and integrations. Install as PWA from your browser menu. Clients can open at <a href="/open-client" className="text-brand-600 hover:underline">/open-client</a>.</p>
      </div>
    </div>
  )
}
