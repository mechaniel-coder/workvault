import { useMemo, useState } from 'react'
import { Calculator, CalendarDays, Mail, Plus, PencilLine, Trash2, RefreshCw, Download, Loader2, CalendarClock, Copy, Check, ExternalLink } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useStore } from '../context/StoreContext'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { Textarea } from '../components/ui/Textarea'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Modal, PageHeader, EmptyState } from '../components/ui/Modal'
import { calculateRate } from '../lib/tax'
import { fillTemplate } from '../lib/reports'
import { formatCurrency } from '../lib/utils'
import { syncGoogleCalendar, downloadIcsFeed } from '../lib/integrations-api'
import { fetchCalcomBookingLink, fetchCalendlyBookingLink } from '../lib/scheduling-api'
import type { AvailabilityBlock, EmailTemplate, EmailTemplateType } from '../lib/types'

const tabs = [
  { id: 'rate', label: 'Rate Calculator', icon: Calculator },
  { id: 'availability', label: 'Availability', icon: CalendarDays },
  { id: 'scheduling', label: 'Scheduling', icon: CalendarClock },
  { id: 'templates', label: 'Email Templates', icon: Mail },
] as const

const templateTypes: { value: EmailTemplateType; label: string }[] = [
  { value: 'invoice_sent', label: 'Invoice sent' },
  { value: 'payment_reminder', label: 'Payment reminder' },
  { value: 'payment_overdue', label: 'Payment overdue' },
  { value: 'proposal_sent', label: 'Proposal sent' },
  { value: 'contract_followup', label: 'Contract follow-up' },
  { value: 'project_kickoff', label: 'Project kickoff' },
  { value: 'custom', label: 'Custom' },
]

const previewVars = {
  businessName: 'WorkVault Studio',
  businessEmail: 'hello@workvault.local',
  businessPhone: '(555) 123-4567',
  clientName: 'Acme Co.',
  clientEmail: 'client@example.com',
  projectName: 'Website Refresh',
  projectTitle: 'Website Refresh',
  invoiceNumber: 'INV-1001',
  proposalName: 'Website Refresh Proposal',
  contractTitle: 'Website Refresh Contract',
  amountDue: '$1,250',
  dueDate: 'Jul 15, 2026',
  firstName: 'Alex',
  lastName: 'Jordan',
  senderName: 'WorkVault Studio',
}

const emptyAvailabilityForm = {
  date: new Date().toISOString().split('T')[0],
  startTime: '09:00',
  endTime: '17:00',
  available: true,
  notes: '',
}

const emptyTemplateForm = {
  name: '',
  type: 'custom' as EmailTemplateType,
  subject: '',
  body: '',
}

function getWeekdayLabel(date: string) {
  return new Date(`${date}T00:00:00`).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  })
}

export default function Tools() {
  const { state, addAvailabilityBlock, deleteAvailabilityBlock, updateEmailTemplate, addEmailTemplate, deleteEmailTemplate, updateCalendarSyncMeta, updateSchedulingMeta, updateIntegrationCredentials } = useStore()
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]['id']>('rate')
  const [calendarSyncing, setCalendarSyncing] = useState(false)
  const [calendarStatus, setCalendarStatus] = useState('')
  const [schedulingBusy, setSchedulingBusy] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)

  const [rateForm, setRateForm] = useState({
    desiredIncome: String(state.profile.defaultHourlyRate * 1800),
    billableHours: '30',
    expenses: '12000',
    taxRate: String(state.taxSettings.estimatedTaxRate),
    weeksOff: '4',
  })

  const [showAvailabilityModal, setShowAvailabilityModal] = useState(false)
  const [availabilityForm, setAvailabilityForm] = useState(emptyAvailabilityForm)

  const [showTemplateModal, setShowTemplateModal] = useState(false)
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null)
  const [templateForm, setTemplateForm] = useState(emptyTemplateForm)
  const [selectedTemplateId, setSelectedTemplateId] = useState(state.emailTemplates[0]?.id || '')

  const rate = useMemo(() => {
    return calculateRate({
      desiredIncome: parseFloat(rateForm.desiredIncome) || 0,
      billableHours: parseFloat(rateForm.billableHours) || 0,
      expenses: parseFloat(rateForm.expenses) || 0,
      taxRate: parseFloat(rateForm.taxRate) || 0,
      weeksOff: parseFloat(rateForm.weeksOff) || 0,
    })
  }, [rateForm])

  const groupedAvailability = useMemo(() => {
    const groups = new Map<string, AvailabilityBlock[]>()
    const sortedBlocks = [...state.availabilityBlocks].sort((a, b) =>
      `${b.date}${b.startTime}`.localeCompare(`${a.date}${a.startTime}`)
    )
    sortedBlocks.forEach((block) => {
      const list = groups.get(block.date) || []
      list.push(block)
      groups.set(block.date, list)
    })
    return Array.from(groups.entries())
  }, [state.availabilityBlocks])

  const activeTemplate = state.emailTemplates.find((template) => template.id === selectedTemplateId) || state.emailTemplates[0] || null

  const previewSubject = activeTemplate ? fillTemplate(activeTemplate.subject, previewVars) : ''
  const previewBody = activeTemplate ? fillTemplate(activeTemplate.body, previewVars) : ''

  const openAvailability = () => {
    setAvailabilityForm(emptyAvailabilityForm)
    setShowAvailabilityModal(true)
  }

  const saveAvailability = () => {
    addAvailabilityBlock(availabilityForm)
    setAvailabilityForm(emptyAvailabilityForm)
    setShowAvailabilityModal(false)
  }

  const handleCalendarSync = async () => {
    if (!state.integrationCredentials.googleRefreshToken) {
      setCalendarStatus('Connect Google Calendar in Integrations first.')
      return
    }
    setCalendarSyncing(true)
    setCalendarStatus('')
    try {
      const result = await syncGoogleCalendar(state, state.integrationCredentials, state.calendarSyncMeta.eventMap)
      updateCalendarSyncMeta({ eventMap: result.eventMap, lastSyncedAt: result.syncedAt })
      setCalendarStatus(`Synced ${result.synced} events to Google Calendar.`)
    } catch (e) {
      setCalendarStatus(e instanceof Error ? e.message : 'Sync failed')
    } finally {
      setCalendarSyncing(false)
    }
  }

  const refreshSchedulingLink = async () => {
    setSchedulingBusy(true)
    setCalendarStatus('')
    try {
      const creds = state.integrationCredentials
      if (state.integrations.calcomScheduling) {
        const data = await fetchCalcomBookingLink(creds)
        updateSchedulingMeta({ provider: 'calcom', bookingUrl: data.bookingUrl, eventTypeName: data.eventTypeName, lastFetchedAt: new Date().toISOString() })
        setCalendarStatus(`Cal.com link ready`)
      } else if (state.integrations.calendlyScheduling) {
        const data = await fetchCalendlyBookingLink(creds)
        updateSchedulingMeta({ provider: 'calendly', bookingUrl: data.bookingUrl, eventTypeName: data.eventTypeName, lastFetchedAt: new Date().toISOString() })
        if (data.eventUri) updateIntegrationCredentials({ calendlyEventUri: data.eventUri })
        setCalendarStatus(`Calendly link ready`)
      } else {
        setCalendarStatus('Enable Cal.com or Calendly in Integrations')
      }
    } catch (e) {
      setCalendarStatus(e instanceof Error ? e.message : 'Scheduling lookup failed')
    } finally {
      setSchedulingBusy(false)
    }
  }

  const copyBookingLink = () => {
    if (!state.schedulingMeta.bookingUrl) return
    navigator.clipboard.writeText(state.schedulingMeta.bookingUrl)
    setCopiedLink(true)
    setTimeout(() => setCopiedLink(false), 2000)
  }

  const openNewTemplate = () => {
    setEditingTemplateId(null)
    setTemplateForm(emptyTemplateForm)
    setShowTemplateModal(true)
  }

  const openEditTemplate = (template: EmailTemplate) => {
    setEditingTemplateId(template.id)
    setTemplateForm({
      name: template.name,
      type: template.type,
      subject: template.subject,
      body: template.body,
    })
    setShowTemplateModal(true)
  }

  const saveTemplate = () => {
    const payload = {
      name: templateForm.name,
      type: templateForm.type,
      subject: templateForm.subject,
      body: templateForm.body,
    }

    if (editingTemplateId) {
      updateEmailTemplate(editingTemplateId, payload)
    } else {
      const created = addEmailTemplate(payload)
      setSelectedTemplateId(created.id)
    }

    setShowTemplateModal(false)
    setEditingTemplateId(null)
    setTemplateForm(emptyTemplateForm)
  }

  return (
    <div>
      <PageHeader
        title="Tools"
        description="Quick calculators, availability, and reusable email templates."
      />

      <div className="mb-6 flex flex-wrap gap-2">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const active = activeTab === tab.id
          return (
            <Button
              key={tab.id}
              variant={active ? 'primary' : 'secondary'}
              onClick={() => setActiveTab(tab.id)}
            >
              <Icon size={16} /> {tab.label}
            </Button>
          )
        })}
      </div>

      {activeTab === 'rate' && (
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <Card className="p-5">
            <h2 className="text-base font-semibold text-surface-900">Rate Calculator</h2>
            <p className="mt-1 text-sm text-surface-500">Estimate a sustainable hourly rate based on your target income and overhead.</p>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Input
                label="Desired annual income"
                type="number"
                value={rateForm.desiredIncome}
                onChange={(e) => setRateForm({ ...rateForm, desiredIncome: e.target.value })}
              />
              <Input
                label="Billable hours / week"
                type="number"
                step="0.5"
                value={rateForm.billableHours}
                onChange={(e) => setRateForm({ ...rateForm, billableHours: e.target.value })}
              />
              <Input
                label="Annual expenses"
                type="number"
                value={rateForm.expenses}
                onChange={(e) => setRateForm({ ...rateForm, expenses: e.target.value })}
              />
              <Input
                label="Tax rate %"
                type="number"
                step="0.1"
                value={rateForm.taxRate}
                onChange={(e) => setRateForm({ ...rateForm, taxRate: e.target.value })}
              />
              <Input
                label="Weeks off"
                type="number"
                value={rateForm.weeksOff}
                onChange={(e) => setRateForm({ ...rateForm, weeksOff: e.target.value })}
              />
            </div>
          </Card>

          <div className="space-y-4">
            <Card className="p-5">
              <p className="text-sm text-surface-500">Recommended hourly rate</p>
              <p className="mt-1 text-3xl font-bold text-surface-900">{formatCurrency(rate.hourlyRate, state.profile.defaultCurrency)}</p>
            </Card>
            <Card className="p-5">
              <p className="text-sm text-surface-500">Monthly equivalent</p>
              <p className="mt-1 text-3xl font-bold text-brand-600">{formatCurrency(rate.monthlyRate, state.profile.defaultCurrency)}</p>
            </Card>
            <Card className="p-5">
              <p className="text-sm text-surface-500">Annual gross target</p>
              <p className="mt-1 text-2xl font-bold text-surface-900">{formatCurrency(rate.annualGross, state.profile.defaultCurrency)}</p>
            </Card>
          </div>
        </div>
      )}

      {activeTab === 'availability' && (
        <div className="space-y-5">
          <div className="flex flex-wrap justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              {state.integrations.googleCalendarSync && (
                <>
                  <Button variant="secondary" size="sm" onClick={handleCalendarSync} disabled={calendarSyncing}>
                    {calendarSyncing ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                    Sync to Google Calendar
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => downloadIcsFeed(state)}>
                    <Download size={14} /> Export .ics
                  </Button>
                </>
              )}
              {!state.integrations.googleCalendarSync && (
                <Link to="/integrations">
                  <Button variant="secondary" size="sm">Set up Calendar sync</Button>
                </Link>
              )}
            </div>
            <Button onClick={openAvailability}>
              <Plus size={16} /> Add Block
            </Button>
          </div>

          {calendarStatus && (
            <p className="text-sm text-brand-700 bg-brand-50 border border-brand-100 rounded-lg px-4 py-2">{calendarStatus}</p>
          )}
          {state.calendarSyncMeta.lastSyncedAt && (
            <p className="text-xs text-surface-400">
              Last calendar sync: {new Date(state.calendarSyncMeta.lastSyncedAt).toLocaleString()}
            </p>
          )}

          {groupedAvailability.length === 0 ? (
            <Card>
              <EmptyState
                icon={<CalendarDays size={24} />}
                title="No availability blocks yet"
                description="Add dates when you are available or unavailable so project planning stays simple."
                action={<Button onClick={openAvailability}><Plus size={16} /> Add Block</Button>}
              />
            </Card>
          ) : (
            <div className="space-y-4">
              {groupedAvailability.map(([date, blocks]) => (
                <Card key={date} className="p-5">
                  <div className="mb-4 flex items-center justify-between gap-4">
                    <div>
                      <h3 className="text-base font-semibold text-surface-900">{getWeekdayLabel(date)}</h3>
                      <p className="text-sm text-surface-500">{blocks.length} block{blocks.length === 1 ? '' : 's'}</p>
                    </div>
                    <Badge status="active">Available schedule</Badge>
                  </div>
                  <div className="grid gap-3">
                    {blocks.map((block) => (
                      <div key={block.id} className="flex items-start justify-between rounded-lg border border-surface-200 bg-surface-50 px-4 py-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <Badge status={block.available ? 'paid' : 'overdue'}>{block.available ? 'Available' : 'Unavailable'}</Badge>
                            <p className="text-sm font-medium text-surface-800">{block.startTime} - {block.endTime}</p>
                          </div>
                          {block.notes && <p className="mt-1 text-sm text-surface-600">{block.notes}</p>}
                        </div>
                        <button
                          onClick={() => deleteAvailabilityBlock(block.id)}
                          className="rounded-lg p-1.5 text-surface-400 hover:text-red-500"
                          title="Delete block"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'scheduling' && (
        <Card className="p-6 max-w-2xl">
          <h2 className="text-base font-semibold text-surface-900 flex items-center gap-2">
            <CalendarClock size={18} className="text-indigo-600" /> Client booking link
          </h2>
          <p className="text-sm text-surface-500 mt-1 mb-4">
            Share your Cal.com or Calendly link with prospects and clients. Configure in{' '}
            <Link to="/integrations" className="text-brand-600 hover:underline">Integrations</Link>.
          </p>
          {state.schedulingMeta.bookingUrl ? (
            <div className="space-y-4">
              <div className="rounded-xl border border-surface-200 bg-surface-50 p-4">
                <p className="text-sm font-medium text-surface-900">{state.schedulingMeta.eventTypeName}</p>
                <p className="text-xs text-surface-500 mt-1 break-all">{state.schedulingMeta.bookingUrl}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button onClick={copyBookingLink}>
                  {copiedLink ? <Check size={16} /> : <Copy size={16} />}
                  {copiedLink ? 'Copied' : 'Copy link'}
                </Button>
                <a href={state.schedulingMeta.bookingUrl} target="_blank" rel="noopener noreferrer">
                  <Button variant="secondary"><ExternalLink size={16} /> Open</Button>
                </a>
                <Button variant="ghost" onClick={refreshSchedulingLink} disabled={schedulingBusy}>
                  {schedulingBusy ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
                  Refresh
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-surface-500">No booking link yet.</p>
              <Button onClick={refreshSchedulingLink} disabled={schedulingBusy}>
                {schedulingBusy ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
                Load booking link
              </Button>
            </div>
          )}
        </Card>
      )}

      {activeTab === 'templates' && (
        <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
          <div className="space-y-4">
            <div className="flex justify-end">
              <Button onClick={openNewTemplate}>
                <Plus size={16} /> Add Template
              </Button>
            </div>

            {state.emailTemplates.length === 0 ? (
              <Card>
                <EmptyState
                  icon={<Mail size={24} />}
                  title="No email templates yet"
                  description="Create reusable templates for invoices, proposals, and follow-ups."
                  action={<Button onClick={openNewTemplate}><Plus size={16} /> Add Template</Button>}
                />
              </Card>
            ) : (
              <div className="grid gap-4">
                {state.emailTemplates.map((template) => (
                  <Card key={template.id} className={`p-5 ${selectedTemplateId === template.id ? 'border-brand-200 ring-1 ring-brand-100' : ''}`}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            className="text-left"
                            onClick={() => setSelectedTemplateId(template.id)}
                            title="Preview template"
                          >
                            <h3 className="text-base font-semibold text-surface-900">{template.name}</h3>
                          </button>
                          <Badge status={template.type}>{templateTypes.find((option) => option.value === template.type)?.label || template.type}</Badge>
                        </div>
                        <p className="mt-1 text-sm text-surface-500">{template.subject || 'No subject yet'}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm" onClick={() => openEditTemplate(template)} title="Edit template">
                          <PencilLine size={14} />
                        </Button>
                        <button
                          onClick={() => deleteEmailTemplate(template.id)}
                          className="rounded-lg p-1.5 text-surface-400 hover:text-red-500"
                          title="Delete template"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          <Card className="p-5">
            <h2 className="text-base font-semibold text-surface-900">Preview</h2>
            <p className="mt-1 text-sm text-surface-500">Template values filled with sample data for a quick reality check.</p>
            {activeTemplate ? (
              <div className="mt-4 space-y-4">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-surface-400">Subject</p>
                  <p className="mt-1 rounded-lg border border-surface-200 bg-surface-50 px-3 py-2 text-sm text-surface-800">
                    {previewSubject}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-surface-400">Body</p>
                  <pre className="mt-1 whitespace-pre-wrap rounded-lg border border-surface-200 bg-surface-50 px-3 py-2 text-sm leading-6 text-surface-700">
                    {previewBody}
                  </pre>
                </div>
              </div>
            ) : (
              <EmptyState
                icon={<Mail size={24} />}
                title="No template selected"
                description="Add a template or pick one from the list to preview it here."
              />
            )}
          </Card>
        </div>
      )}

      <Modal open={showAvailabilityModal} onClose={() => setShowAvailabilityModal(false)} title="Add Availability Block">
        <div className="space-y-4">
          <Input label="Date" type="date" value={availabilityForm.date} onChange={(e) => setAvailabilityForm({ ...availabilityForm, date: e.target.value })} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Start Time" type="time" value={availabilityForm.startTime} onChange={(e) => setAvailabilityForm({ ...availabilityForm, startTime: e.target.value })} />
            <Input label="End Time" type="time" value={availabilityForm.endTime} onChange={(e) => setAvailabilityForm({ ...availabilityForm, endTime: e.target.value })} />
          </div>
          <label className="flex items-center gap-2 text-sm font-medium text-surface-700">
            <input
              type="checkbox"
              checked={availabilityForm.available}
              onChange={(e) => setAvailabilityForm({ ...availabilityForm, available: e.target.checked })}
              className="h-4 w-4 rounded border-surface-300 text-brand-600 focus:ring-brand-500"
            />
            Available
          </label>
          <Textarea label="Notes" value={availabilityForm.notes} onChange={(e) => setAvailabilityForm({ ...availabilityForm, notes: e.target.value })} placeholder="Client call, travel day, deep work block..." />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setShowAvailabilityModal(false)}>Cancel</Button>
            <Button onClick={saveAvailability} disabled={!availabilityForm.date || !availabilityForm.startTime || !availabilityForm.endTime}>Save Block</Button>
          </div>
        </div>
      </Modal>

      <Modal open={showTemplateModal} onClose={() => setShowTemplateModal(false)} title={editingTemplateId ? 'Edit Template' : 'Add Template'} wide>
        <div className="space-y-4">
          <Input label="Name" value={templateForm.name} onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })} placeholder="Invoice Follow-up" />
          <Select
            label="Type"
            options={templateTypes}
            value={templateForm.type}
            onChange={(e) => setTemplateForm({ ...templateForm, type: e.target.value as EmailTemplateType })}
          />
          <Input label="Subject" value={templateForm.subject} onChange={(e) => setTemplateForm({ ...templateForm, subject: e.target.value })} placeholder="Invoice {{invoiceNumber}} is ready" />
          <Textarea
            label="Body"
            value={templateForm.body}
            onChange={(e) => setTemplateForm({ ...templateForm, body: e.target.value })}
            placeholder={`Hi {{firstName}},\n\nYour invoice {{invoiceNumber}} for {{projectName}} is ready.\n\nThanks,\n{{businessName}}`}
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setShowTemplateModal(false)}>Cancel</Button>
            <Button onClick={saveTemplate} disabled={!templateForm.name}>Save Template</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
