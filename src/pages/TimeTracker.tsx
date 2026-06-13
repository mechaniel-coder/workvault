import { useState } from 'react'
import { Clock, Play, Square, Plus, Trash2, DollarSign } from 'lucide-react'
import { useStore } from '../context/StoreContext'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Modal, PageHeader, EmptyState } from '../components/ui/Modal'
import { formatCurrency, formatDateTime, formatDuration } from '../lib/utils'

export default function TimeTracker() {
  const { state, startTimer, stopTimer, addTimeEntry, deleteTimeEntry } = useStore()
  const [showManual, setShowManual] = useState(false)
  const [form, setForm] = useState({
    projectName: '',
    clientId: '',
    description: '',
    hours: '1',
    minutes: '0',
    billable: true,
  })

  const activeEntry = state.activeTimer
    ? state.timeEntries.find((e) => e.id === state.activeTimer!.entryId)
    : null

  const totalMinutes = state.timeEntries.reduce((s, e) => s + e.durationMinutes, 0)
  const billableMinutes = state.timeEntries.filter((e) => e.billable).reduce((s, e) => s + e.durationMinutes, 0)
  const unbilledAmount = state.timeEntries
    .filter((e) => e.billable && !e.invoiced)
    .reduce((s, e) => s + (e.durationMinutes / 60) * e.hourlyRate, 0)

  const handleStart = () => {
    const client = state.clients.find((c) => c.id === form.clientId)
    startTimer({
      projectId: '',
      projectName: form.projectName || 'Untitled Project',
      clientId: form.clientId,
      clientName: client?.name || 'No Client',
      description: form.description,
      startTime: new Date().toISOString(),
      hourlyRate: state.profile.defaultHourlyRate,
      billable: form.billable,
      invoiced: false,
    })
    setForm({ ...form, projectName: '', description: '' })
  }

  const handleManualAdd = () => {
    const client = state.clients.find((c) => c.id === form.clientId)
    const durationMinutes = parseInt(form.hours) * 60 + parseInt(form.minutes)
    const now = new Date()
    addTimeEntry({
      projectId: '',
      projectName: form.projectName || 'Untitled Project',
      clientId: form.clientId,
      clientName: client?.name || 'No Client',
      description: form.description,
      startTime: now.toISOString(),
      endTime: now.toISOString(),
      durationMinutes,
      hourlyRate: state.profile.defaultHourlyRate,
      billable: form.billable,
      invoiced: false,
    })
    setShowManual(false)
    setForm({ projectName: '', clientId: '', description: '', hours: '1', minutes: '0', billable: true })
  }

  const clientOptions = [
    { value: '', label: 'Select client...' },
    ...state.clients.map((c) => ({ value: c.id, label: c.name })),
  ]

  return (
    <div>
      <PageHeader
        title="Time Tracker"
        description="Log every hour. Bill with confidence."
        action={
          <Button variant="secondary" onClick={() => setShowManual(true)}>
            <Plus size={16} /> Manual Entry
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-8">
        <Card className="p-5">
          <p className="text-sm text-surface-500">Total Tracked</p>
          <p className="text-2xl font-bold text-surface-900 mt-1">{formatDuration(totalMinutes)}</p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-surface-500">Billable Hours</p>
          <p className="text-2xl font-bold text-surface-900 mt-1">{formatDuration(billableMinutes)}</p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-surface-500">Unbilled Value</p>
          <p className="text-2xl font-bold text-brand-600 mt-1">
            {formatCurrency(unbilledAmount, state.profile.defaultCurrency)}
          </p>
        </Card>
      </div>

      <Card className="mb-8">
        <div className="p-6">
          {state.activeTimer && activeEntry ? (
            <div className="flex flex-col items-center py-6">
              <div className="relative mb-4">
                <div className="h-24 w-24 rounded-full border-4 border-brand-200 flex items-center justify-center">
                  <Clock size={32} className="text-brand-600 animate-pulse" />
                </div>
              </div>
              <h3 className="text-lg font-semibold text-surface-900">{activeEntry.projectName}</h3>
              <p className="text-sm text-surface-500 mt-1">{activeEntry.description || activeEntry.clientName}</p>
              <Button variant="danger" size="lg" className="mt-6" onClick={stopTimer}>
                <Square size={18} /> Stop Timer
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 items-end">
              <Input
                label="Project"
                placeholder="Project name"
                value={form.projectName}
                onChange={(e) => setForm({ ...form, projectName: e.target.value })}
              />
              <Select
                label="Client"
                options={clientOptions}
                value={form.clientId}
                onChange={(e) => setForm({ ...form, clientId: e.target.value })}
              />
              <Input
                label="Description"
                placeholder="What are you working on?"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
              <Button size="lg" onClick={handleStart} disabled={!form.projectName}>
                <Play size={18} /> Start Timer
              </Button>
            </div>
          )}
        </div>
      </Card>

      <Card>
        <div className="px-6 py-4 border-b border-surface-100">
          <h2 className="text-base font-semibold text-surface-900">Time Entries</h2>
        </div>
        {state.timeEntries.length === 0 ? (
          <EmptyState
            icon={<Clock size={24} />}
            title="No time entries yet"
            description="Start the timer or add a manual entry to begin tracking your work."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-100 text-left text-surface-500">
                  <th className="px-6 py-3 font-medium">Project</th>
                  <th className="px-6 py-3 font-medium">Client</th>
                  <th className="px-6 py-3 font-medium">Duration</th>
                  <th className="px-6 py-3 font-medium">Value</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 font-medium">Date</th>
                  <th className="px-6 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100">
                {state.timeEntries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-surface-50">
                    <td className="px-6 py-3.5">
                      <p className="font-medium text-surface-800">{entry.projectName}</p>
                      {entry.description && (
                        <p className="text-xs text-surface-400 mt-0.5">{entry.description}</p>
                      )}
                    </td>
                    <td className="px-6 py-3.5 text-surface-600">{entry.clientName}</td>
                    <td className="px-6 py-3.5 font-medium">{formatDuration(entry.durationMinutes)}</td>
                    <td className="px-6 py-3.5">
                      <span className="flex items-center gap-1 text-surface-700">
                        <DollarSign size={12} />
                        {formatCurrency((entry.durationMinutes / 60) * entry.hourlyRate, state.profile.defaultCurrency)}
                      </span>
                    </td>
                    <td className="px-6 py-3.5">
                      {entry.invoiced ? (
                        <Badge status="paid">Invoiced</Badge>
                      ) : entry.billable ? (
                        <Badge status="sent">Billable</Badge>
                      ) : (
                        <Badge status="draft">Non-billable</Badge>
                      )}
                    </td>
                    <td className="px-6 py-3.5 text-surface-400 text-xs">{formatDateTime(entry.createdAt)}</td>
                    <td className="px-6 py-3.5">
                      <button
                        onClick={() => deleteTimeEntry(entry.id)}
                        className="text-surface-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal open={showManual} onClose={() => setShowManual(false)} title="Manual Time Entry">
        <div className="space-y-4">
          <Input label="Project" value={form.projectName} onChange={(e) => setForm({ ...form, projectName: e.target.value })} />
          <Select label="Client" options={clientOptions} value={form.clientId} onChange={(e) => setForm({ ...form, clientId: e.target.value })} />
          <Input label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Hours" type="number" min="0" value={form.hours} onChange={(e) => setForm({ ...form, hours: e.target.value })} />
            <Input label="Minutes" type="number" min="0" max="59" value={form.minutes} onChange={(e) => setForm({ ...form, minutes: e.target.value })} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setShowManual(false)}>Cancel</Button>
            <Button onClick={handleManualAdd} disabled={!form.projectName}>Add Entry</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
