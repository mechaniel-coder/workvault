import { useMemo, useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { BarChart3, Download, Pencil, Play, Plus, RefreshCw, Trash2 } from 'lucide-react'
import { useStore } from '../context/StoreContext'
import { useDemoDownloadsBlocked } from '../context/DemoContext'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { Textarea } from '../components/ui/Textarea'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Modal, PageHeader, EmptyState } from '../components/ui/Modal'
import {
  EXPENSE_CATEGORIES,
  type Expense,
  type ExpenseCategory,
  type RecurringFrequency,
  type RecurringInvoice,
} from '../lib/types'
import { calculateTaxSummary, getQuarterlyDueDates } from '../lib/tax'
import {
  exportExpensesCsv,
  exportInvoicesCsv,
  exportQuickBooksCsv,
  exportTimeCsv,
  getReportSummary,
} from '../lib/reports'
import { formatCurrency, formatDate, getNextNumber } from '../lib/utils'
import { BankReconciliationPanel } from '../components/BankReconciliationPanel'
import { syncQuickBooks, syncXero } from '../lib/accounting-sync'

type TabKey = 'expenses' | 'tax' | 'recurring' | 'reports' | 'banking'

type ExpenseForm = {
  description: string
  amount: string
  category: ExpenseCategory
  date: string
  clientId: string
  projectId: string
  billable: boolean
  mileage: string
  notes: string
}

type RecurringForm = {
  clientId: string
  title: string
  amount: string
  frequency: RecurringFrequency
  nextDate: string
  active: boolean
}

const expenseCategoryOptions = EXPENSE_CATEGORIES.map((category) => ({
  value: category.id,
  label: category.label,
}))

function createEmptyExpenseForm(): ExpenseForm {
  return {
    description: '',
    amount: '',
    category: 'materials',
    date: new Date().toISOString().split('T')[0],
    clientId: '',
    projectId: '',
    billable: false,
    mileage: '',
    notes: '',
  }
}

function createExpenseForm(expense: Expense | null): ExpenseForm {
  if (!expense) return createEmptyExpenseForm()
  return {
    description: expense.description,
    amount: String(expense.amount),
    category: expense.category,
    date: expense.date,
    clientId: expense.clientId,
    projectId: expense.projectId,
    billable: expense.billable,
    mileage: String(expense.mileage || ''),
    notes: expense.notes,
  }
}

function createEmptyRecurringForm(): RecurringForm {
  return {
    clientId: '',
    title: '',
    amount: '',
    frequency: 'monthly',
    nextDate: new Date().toISOString().split('T')[0],
    active: true,
  }
}

function createRecurringForm(recurring: RecurringInvoice | null): RecurringForm {
  if (!recurring) return createEmptyRecurringForm()
  return {
    clientId: recurring.clientId,
    title: recurring.title,
    amount: String(recurring.amount),
    frequency: recurring.frequency,
    nextDate: recurring.nextDate,
    active: recurring.active,
  }
}

export default function FinancePage() {
  const {
    state,
    addExpense,
    updateExpense,
    deleteExpense,
    updateTaxSettings,
    addRecurringInvoice,
    updateRecurringInvoice,
    deleteRecurringInvoice,
    addInvoice,
    updateIntegrationCredentials,
    updateBookkeepingSyncMeta,
  } = useStore()
  const downloadsBlocked = useDemoDownloadsBlocked()
  const [searchParams] = useSearchParams()

  const [activeTab, setActiveTab] = useState<TabKey>(
    (searchParams.get('tab') as TabKey) || 'expenses',
  )
  useEffect(() => {
    const tab = searchParams.get('tab') as TabKey | null
    if (tab && ['expenses', 'tax', 'recurring', 'reports', 'banking'].includes(tab)) {
      setActiveTab(tab)
    }
  }, [searchParams])
  const [expenseModalOpen, setExpenseModalOpen] = useState(false)
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
  const [expenseForm, setExpenseForm] = useState<ExpenseForm>(createEmptyExpenseForm())
  const [recurringModalOpen, setRecurringModalOpen] = useState(false)
  const [editingRecurring, setEditingRecurring] = useState<RecurringInvoice | null>(null)
  const [recurringForm, setRecurringForm] = useState<RecurringForm>(createEmptyRecurringForm())
  const [taxYear, setTaxYear] = useState(String(new Date().getFullYear()))
  const [reportYear, setReportYear] = useState(String(new Date().getFullYear()))

  const expenseSummary = useMemo(
    () => calculateTaxSummary(state, parseInt(taxYear, 10) || new Date().getFullYear()),
    [state, taxYear]
  )
  const reportSummary = useMemo(
    () => getReportSummary(state, parseInt(reportYear, 10) || new Date().getFullYear()),
    [state, reportYear]
  )
  const quarterlyDueDates = useMemo(
    () => getQuarterlyDueDates(parseInt(taxYear, 10) || new Date().getFullYear()),
    [taxYear]
  )

  const clientOptions = [
    { value: '', label: 'Select client...' },
    ...state.clients.map((client) => ({ value: client.id, label: client.name })),
  ]

  const projectOptions = [
    { value: '', label: 'Select project...' },
    ...state.projects.map((project) => ({ value: project.id, label: project.title })),
  ]

  const mileageExpenseAmount =
    expenseForm.category === 'mileage'
      ? ((parseFloat(expenseForm.mileage) || 0) * state.taxSettings.mileageRate).toFixed(2)
      : expenseForm.amount

  const resetExpenseModal = (expense: Expense | null = null) => {
    setEditingExpense(expense)
    setExpenseForm(createExpenseForm(expense))
    setExpenseModalOpen(true)
  }

  const resetRecurringModal = (recurring: RecurringInvoice | null = null) => {
    setEditingRecurring(recurring)
    setRecurringForm(createRecurringForm(recurring))
    setRecurringModalOpen(true)
  }

  const saveExpense = () => {
    const client = state.clients.find((item) => item.id === expenseForm.clientId)
    const project = state.projects.find((item) => item.id === expenseForm.projectId)
    const mileage = parseFloat(expenseForm.mileage) || 0
    const amount = expenseForm.category === 'mileage'
      ? mileage * state.taxSettings.mileageRate
      : parseFloat(expenseForm.amount) || 0

    const payload = {
      description: expenseForm.description,
      amount,
      category: expenseForm.category,
      date: expenseForm.date,
      clientId: expenseForm.clientId,
      clientName: client?.name || 'Unassigned',
      projectId: expenseForm.projectId,
      projectName: project?.title || 'Unassigned',
      billable: expenseForm.billable,
      invoiced: editingExpense?.invoiced ?? false,
      mileage,
      notes: expenseForm.notes,
    }

    if (editingExpense) {
      updateExpense(editingExpense.id, payload)
    } else {
      addExpense(payload)
    }

    setExpenseModalOpen(false)
    setEditingExpense(null)
    setExpenseForm(createEmptyExpenseForm())
  }

  const saveRecurring = () => {
    const client = state.clients.find((item) => item.id === recurringForm.clientId)
    const payload = {
      clientId: recurringForm.clientId,
      clientName: client?.name || 'Unassigned',
      title: recurringForm.title,
      amount: parseFloat(recurringForm.amount) || 0,
      frequency: recurringForm.frequency,
      nextDate: recurringForm.nextDate,
      lineItemDescription: recurringForm.title,
      active: recurringForm.active,
      lastGenerated: editingRecurring?.lastGenerated ?? null,
    }

    if (editingRecurring) {
      updateRecurringInvoice(editingRecurring.id, payload)
    } else {
      addRecurringInvoice(payload)
    }

    setRecurringModalOpen(false)
    setEditingRecurring(null)
    setRecurringForm(createEmptyRecurringForm())
  }

  const generateRecurringInvoice = (recurring: RecurringInvoice) => {
    const now = new Date().toISOString()
    const invoiceAmount = recurring.amount
    const invoiceDate = new Date().toISOString().split('T')[0]

    addInvoice({
      number: getNextNumber(state.profile.invoicePrefix, state.invoices.map((invoice) => invoice.number)),
      clientId: recurring.clientId,
      clientName: recurring.clientName,
      status: 'draft',
      issueDate: invoiceDate,
      dueDate: recurring.nextDate,
      lineItems: [
        {
          id: crypto.randomUUID(),
          description: recurring.lineItemDescription || recurring.title,
          quantity: 1,
          rate: invoiceAmount,
          amount: invoiceAmount,
        },
      ],
      subtotal: invoiceAmount,
      taxRate: 0,
      taxAmount: 0,
      total: invoiceAmount,
      notes: `Generated from recurring invoice: ${recurring.title}`,
      paymentMethodIds: [],
      paymentInstructions: '',
      sentAt: null,
      paidAt: null,
      stripeCheckoutUrl: null,
      stripeSessionId: null,
      paymentLinks: [],
    })

    updateRecurringInvoice(recurring.id, { lastGenerated: now })
  }

  const tabs: { key: TabKey; label: string }[] = [
    { key: 'expenses', label: 'Expenses' },
    { key: 'tax', label: 'Tax' },
    { key: 'recurring', label: 'Recurring' },
    { key: 'banking', label: 'Banking' },
    { key: 'reports', label: 'Reports' },
  ]

  const runBookkeepingSync = async (provider: 'quickbooks' | 'xero') => {
    try {
      if (provider === 'quickbooks') {
        const result = await syncQuickBooks(state, state.integrationCredentials)
        updateBookkeepingSyncMeta({
          quickbooksCustomerMap: result.customerMap,
          quickbooksInvoiceMap: result.invoiceMap,
          quickbooksExpenseMap: result.expenseMap,
          quickbooksLastSyncedAt: result.syncedAt,
        })
        if (result.refreshToken) updateIntegrationCredentials({ quickbooksRefreshToken: result.refreshToken })
      } else {
        const result = await syncXero(state, state.integrationCredentials)
        updateBookkeepingSyncMeta({
          xeroContactMap: result.contactMap,
          xeroInvoiceMap: result.invoiceMap,
          xeroExpenseMap: result.expenseMap,
          xeroLastSyncedAt: result.syncedAt,
        })
        if (result.refreshToken) updateIntegrationCredentials({ xeroRefreshToken: result.refreshToken })
      }
    } catch {
      // surfaced in integrations
    }
  }

  return (
    <div>
      <PageHeader
        title="Finance"
        description="Track expenses, estimate taxes, manage recurring invoices, and export reports."
        action={
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => resetExpenseModal()}>
              <Plus size={16} /> New Expense
            </Button>
            <Button variant="secondary" onClick={() => resetRecurringModal()}>
              <Plus size={16} /> New Recurring Invoice
            </Button>
          </div>
        }
      />

      <div className="mb-6 flex flex-wrap gap-2 border-b border-surface-200 pb-4">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? 'bg-brand-600 text-white'
                : 'bg-surface-100 text-surface-600 hover:bg-surface-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'expenses' && (
        <div className="space-y-6">
          <Card className="p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-surface-900">Expenses</h2>
                <p className="text-sm text-surface-500">Log business spending and mileage deductions.</p>
              </div>
              <Button onClick={() => resetExpenseModal()}>
                <Plus size={16} /> Add Expense
              </Button>
            </div>
          </Card>

          {state.expenses.length === 0 ? (
            <Card>
              <EmptyState
                icon={<BarChart3 size={24} />}
                title="No expenses yet"
                description="Add expenses to track deductions, billable items, and mileage."
                action={<Button onClick={() => resetExpenseModal()}><Plus size={16} /> Add First Expense</Button>}
              />
            </Card>
          ) : (
            <Card>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-surface-100 text-left text-surface-500">
                      <th className="px-6 py-3 font-medium">Expense</th>
                      <th className="px-6 py-3 font-medium">Client / Project</th>
                      <th className="px-6 py-3 font-medium">Category</th>
                      <th className="px-6 py-3 font-medium">Amount</th>
                      <th className="px-6 py-3 font-medium">Status</th>
                      <th className="px-6 py-3 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-100">
                    {state.expenses.map((expense) => {
                      const categoryLabel = EXPENSE_CATEGORIES.find((item) => item.id === expense.category)?.label || expense.category
                      return (
                        <tr key={expense.id} className="hover:bg-surface-50">
                          <td className="px-6 py-4">
                            <p className="font-medium text-surface-900">{expense.description}</p>
                            <p className="text-xs text-surface-500">{formatDate(expense.date)}</p>
                          </td>
                          <td className="px-6 py-4 text-surface-600">
                            <p>{expense.clientName}</p>
                            <p className="text-xs text-surface-400">{expense.projectName}</p>
                          </td>
                          <td className="px-6 py-4">
                            <Badge status={expense.category}>{categoryLabel}</Badge>
                          </td>
                          <td className="px-6 py-4 font-medium">{formatCurrency(expense.amount, state.profile.defaultCurrency)}</td>
                          <td className="px-6 py-4">
                            <div className="flex flex-wrap gap-2">
                              <Badge status={expense.billable ? 'active' : 'cancelled'}>
                                {expense.billable ? 'Billable' : 'Non-billable'}
                              </Badge>
                              <Badge status={expense.invoiced ? 'paid' : 'draft'}>
                                {expense.invoiced ? 'Invoiced' : 'Open'}
                              </Badge>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-1">
                              <Button variant="ghost" size="sm" onClick={() => resetExpenseModal(expense)} title="Edit expense">
                                <Pencil size={14} />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => deleteExpense(expense.id)} title="Delete expense">
                                <Trash2 size={14} />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      )}

      {activeTab === 'tax' && (
        <div className="space-y-6">
          <Card className="p-4 border-brand-100 bg-brand-50/40 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-surface-900">1099-NEC filing for subcontractors</p>
              <p className="text-xs text-surface-500 mt-0.5">Track W-9s, payments, and export to Track1099, Tax1099, or QuickBooks.</p>
            </div>
            <a href="/tax-1099">
              <Button variant="secondary" size="sm">Open 1099 Hub</Button>
            </a>
          </Card>
          <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
            <Card className="p-5">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div>
                  <h2 className="text-base font-semibold text-surface-900">Tax Summary</h2>
                  <p className="text-sm text-surface-500">Estimated for the selected year.</p>
                </div>
                <Input
                  label="Tax Year"
                  type="number"
                  value={taxYear}
                  onChange={(e) => setTaxYear(e.target.value)}
                  className="max-w-[140px]"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {[
                  ['Gross Income', expenseSummary.grossIncome],
                  ['Expenses', expenseSummary.expenses],
                  ['Net Income', expenseSummary.netIncome],
                  ['Estimated Tax', expenseSummary.estimatedTax],
                  ['SE Tax', expenseSummary.selfEmploymentTax],
                  ['Total Owed', expenseSummary.totalTaxOwed],
                  ['Quarterly Payment', expenseSummary.quarterlyPayment],
                  ['Mileage Deduction', expenseSummary.mileageDeduction],
                ].map(([label, value]) => (
                  <div key={label as string} className="rounded-xl border border-surface-200 bg-surface-50 p-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-surface-500">{label as string}</p>
                    <p className="mt-2 text-xl font-semibold text-surface-900">
                      {formatCurrency(Number(value), state.profile.defaultCurrency)}
                    </p>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-5">
              <h2 className="text-base font-semibold text-surface-900">Tax Settings</h2>
              <p className="text-sm text-surface-500 mt-1">Updated live in your store.</p>

              <div className="mt-4 space-y-4">
                <Input
                  label="Estimated Tax Rate (%)"
                  type="number"
                  value={state.taxSettings.estimatedTaxRate}
                  onChange={(e) => updateTaxSettings({ estimatedTaxRate: parseFloat(e.target.value) || 0 })}
                />
                <Input
                  label="Self-Employment Tax (%)"
                  type="number"
                  value={state.taxSettings.selfEmploymentTaxRate}
                  onChange={(e) => updateTaxSettings({ selfEmploymentTaxRate: parseFloat(e.target.value) || 0 })}
                />
                <Input
                  label="Mileage Rate"
                  type="number"
                  step="0.01"
                  value={state.taxSettings.mileageRate}
                  onChange={(e) => updateTaxSettings({ mileageRate: parseFloat(e.target.value) || 0 })}
                />
                <label className="flex items-center gap-3 rounded-lg border border-surface-200 px-3 py-2 text-sm text-surface-700">
                  <input
                    type="checkbox"
                    checked={state.taxSettings.quarterlyReminders}
                    onChange={(e) => updateTaxSettings({ quarterlyReminders: e.target.checked })}
                    className="rounded border-surface-300 text-brand-600"
                  />
                  Quarterly reminder badges
                </label>
              </div>
            </Card>
          </div>

          <Card className="p-5">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="text-base font-semibold text-surface-900">Quarterly Due Dates</h3>
                <p className="text-sm text-surface-500">Federal estimated payment reminders.</p>
              </div>
              <Badge status={state.taxSettings.quarterlyReminders ? 'active' : 'cancelled'}>
                {state.taxSettings.quarterlyReminders ? 'Reminders On' : 'Reminders Off'}
              </Badge>
            </div>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {quarterlyDueDates.map((quarter) => (
                <div key={quarter.quarter} className="rounded-xl border border-surface-200 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-surface-900">{quarter.quarter}</p>
                      <p className="text-sm text-surface-500 mt-1">{formatDate(quarter.dueDate)}</p>
                    </div>
                    {state.taxSettings.quarterlyReminders && (
                      <Badge status="expiring">Reminder</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'recurring' && (
        <div className="space-y-6">
          <Card className="p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-surface-900">Recurring Invoices</h2>
                <p className="text-sm text-surface-500">Automate repeat billing with a simple schedule.</p>
              </div>
              <Button onClick={() => resetRecurringModal()}>
                <Plus size={16} /> Add Recurring Invoice
              </Button>
            </div>
          </Card>

          {state.recurringInvoices.length === 0 ? (
            <Card>
              <EmptyState
                icon={<RefreshCw size={24} />}
                title="No recurring invoices yet"
                description="Create a recurring invoice to generate drafts on a schedule."
                action={<Button onClick={() => resetRecurringModal()}><Plus size={16} /> New Recurring Invoice</Button>}
              />
            </Card>
          ) : (
            <Card>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-surface-100 text-left text-surface-500">
                      <th className="px-6 py-3 font-medium">Recurring Invoice</th>
                      <th className="px-6 py-3 font-medium">Client</th>
                      <th className="px-6 py-3 font-medium">Schedule</th>
                      <th className="px-6 py-3 font-medium">Dates</th>
                      <th className="px-6 py-3 font-medium">Status</th>
                      <th className="px-6 py-3 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-100">
                    {state.recurringInvoices.map((recurring) => (
                      <tr key={recurring.id} className="hover:bg-surface-50">
                        <td className="px-6 py-4">
                          <p className="font-medium text-surface-900">{recurring.title}</p>
                          <p className="text-xs text-surface-500">{formatCurrency(recurring.amount, state.profile.defaultCurrency)}</p>
                        </td>
                        <td className="px-6 py-4 text-surface-600">{recurring.clientName}</td>
                        <td className="px-6 py-4">
                          <Badge status={recurring.frequency}>{recurring.frequency}</Badge>
                        </td>
                        <td className="px-6 py-4 text-surface-600">
                          <p>Next: {formatDate(recurring.nextDate)}</p>
                          <p className="text-xs text-surface-400">
                            Last generated: {formatDate(recurring.lastGenerated)}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <Badge status={recurring.active ? 'active' : 'cancelled'}>
                            {recurring.active ? 'Active' : 'Paused'}
                          </Badge>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap items-center gap-1">
                            <Button variant="secondary" size="sm" onClick={() => generateRecurringInvoice(recurring)}>
                              <Play size={14} /> Generate Now
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => resetRecurringModal(recurring)}>
                              <Pencil size={14} />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => deleteRecurringInvoice(recurring.id)}>
                              <Trash2 size={14} />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      )}

      {activeTab === 'reports' && (
        <div className="space-y-6">
          <Card className="p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-surface-900">Reports</h2>
                <p className="text-sm text-surface-500">Annual summary and export tools.</p>
              </div>
              <Input
                label="Report Year"
                type="number"
                value={reportYear}
                onChange={(e) => setReportYear(e.target.value)}
                className="max-w-[140px]"
              />
            </div>
          </Card>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Card className="p-5">
              <p className="text-sm text-surface-500">Revenue</p>
              <p className="mt-1 text-2xl font-bold text-surface-900">{reportSummary.formatted.revenue}</p>
            </Card>
            <Card className="p-5">
              <p className="text-sm text-surface-500">Expenses</p>
              <p className="mt-1 text-2xl font-bold text-surface-900">{reportSummary.formatted.expenses}</p>
            </Card>
            <Card className="p-5">
              <p className="text-sm text-surface-500">Profit</p>
              <p className="mt-1 text-2xl font-bold text-surface-900">{reportSummary.formatted.profit}</p>
            </Card>
            <Card className="p-5">
              <p className="text-sm text-surface-500">Billable Hours</p>
              <p className="mt-1 text-2xl font-bold text-surface-900">{reportSummary.hours}</p>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
            <Card className="p-5">
              <div className="flex items-center justify-between gap-3 mb-4">
                <div>
                  <h3 className="text-base font-semibold text-surface-900">Revenue by Client</h3>
                  <p className="text-sm text-surface-500">Paid invoice revenue for the selected year.</p>
                </div>
                <Badge status="active">{reportSummary.invoiceCount} invoices</Badge>
              </div>

              {reportSummary.byClient.length === 0 ? (
                <EmptyState
                  icon={<BarChart3 size={24} />}
                  title="No revenue yet"
                  description="Client revenue will appear here once paid invoices exist."
                />
              ) : (
                <div className="space-y-3">
                  {reportSummary.byClient.map(([clientName, amount]) => (
                    <div key={clientName} className="flex items-center justify-between rounded-xl border border-surface-200 px-4 py-3">
                      <div>
                        <p className="font-medium text-surface-900">{clientName}</p>
                        <p className="text-xs text-surface-500">Paid revenue</p>
                      </div>
                      <p className="font-semibold text-surface-900">{formatCurrency(amount, state.profile.defaultCurrency)}</p>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {!downloadsBlocked && (
              <Card className="p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Download size={16} className="text-surface-500" />
                  <h3 className="text-base font-semibold text-surface-900">Exports</h3>
                </div>

                <div className="space-y-2">
                  <Button variant="secondary" className="w-full justify-start" onClick={() => exportInvoicesCsv(state)}>
                    <Download size={14} /> Export Invoices CSV
                  </Button>
                  <Button variant="secondary" className="w-full justify-start" onClick={() => exportExpensesCsv(state)}>
                    <Download size={14} /> Export Expenses CSV
                  </Button>
                  <Button variant="secondary" className="w-full justify-start" onClick={() => exportQuickBooksCsv(state)}>
                    <Download size={14} /> Export QuickBooks CSV
                  </Button>
                  {state.integrations.quickbooksLiveSync && state.integrationCredentials.quickbooksRefreshToken && (
                    <Button variant="secondary" className="w-full justify-start" onClick={() => runBookkeepingSync('quickbooks')}>
                      <RefreshCw size={14} /> Sync to QuickBooks
                    </Button>
                  )}
                  {state.integrations.xeroLiveSync && state.integrationCredentials.xeroRefreshToken && (
                    <Button variant="secondary" className="w-full justify-start" onClick={() => runBookkeepingSync('xero')}>
                      <RefreshCw size={14} /> Sync to Xero
                    </Button>
                  )}
                  <Button variant="secondary" className="w-full justify-start" onClick={() => exportTimeCsv(state)}>
                    <Download size={14} /> Export Time CSV
                  </Button>
                </div>
              </Card>
            )}
          </div>
        </div>
      )}

      {activeTab === 'banking' && state.integrations.plaidBankMatch && (
        <BankReconciliationPanel />
      )}

      {activeTab === 'banking' && !state.integrations.plaidBankMatch && (
        <Card className="p-8 text-center">
          <p className="text-sm text-surface-600">Enable Plaid bank matching in <a href="/integrations" className="text-brand-600 underline">Integrations</a>.</p>
        </Card>
      )}

      <Modal
        open={expenseModalOpen}
        onClose={() => {
          setExpenseModalOpen(false)
          setEditingExpense(null)
        }}
        title={editingExpense ? 'Edit Expense' : 'Add Expense'}
        wide
      >
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Input
              label="Description"
              value={expenseForm.description}
              onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
            />
            <Input
              label="Date"
              type="date"
              value={expenseForm.date}
              onChange={(e) => setExpenseForm({ ...expenseForm, date: e.target.value })}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Select
              label="Category"
              options={expenseCategoryOptions}
              value={expenseForm.category}
              onChange={(e) => {
                const category = e.target.value as ExpenseCategory
                const nextForm = { ...expenseForm, category }
                if (category === 'mileage') {
                  const mileage = parseFloat(nextForm.mileage) || 0
                  nextForm.amount = (mileage * state.taxSettings.mileageRate).toFixed(2)
                }
                setExpenseForm(nextForm)
              }}
            />
            <Input
              label="Amount"
              type="number"
              step="0.01"
              value={mileageExpenseAmount}
              onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
              readOnly={expenseForm.category === 'mileage'}
            />
          </div>

          {expenseForm.category === 'mileage' && (
            <div className="grid gap-4 md:grid-cols-2">
              <Input
                label="Mileage"
                type="number"
                step="0.1"
                value={expenseForm.mileage}
                onChange={(e) => {
                  const mileage = e.target.value
                  const mileageAmount = ((parseFloat(mileage) || 0) * state.taxSettings.mileageRate).toFixed(2)
                  setExpenseForm({ ...expenseForm, mileage, amount: mileageAmount })
                }}
              />
              <Card className="p-4 bg-surface-50">
                <p className="text-xs font-medium uppercase tracking-wide text-surface-500">Mileage Rate</p>
                <p className="mt-2 text-lg font-semibold text-surface-900">
                  {formatCurrency(state.taxSettings.mileageRate, state.profile.defaultCurrency)} / mile
                </p>
              </Card>
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <Select
              label="Client"
              options={clientOptions}
              value={expenseForm.clientId}
              onChange={(e) => setExpenseForm({ ...expenseForm, clientId: e.target.value })}
            />
            <Select
              label="Project"
              options={projectOptions}
              value={expenseForm.projectId}
              onChange={(e) => setExpenseForm({ ...expenseForm, projectId: e.target.value })}
            />
          </div>

          <label className="flex items-center gap-3 rounded-lg border border-surface-200 px-3 py-2 text-sm text-surface-700">
            <input
              type="checkbox"
              checked={expenseForm.billable}
              onChange={(e) => setExpenseForm({ ...expenseForm, billable: e.target.checked })}
              className="rounded border-surface-300 text-brand-600"
            />
            Billable expense
          </label>

          <Textarea
            label="Notes"
            value={expenseForm.notes}
            onChange={(e) => setExpenseForm({ ...expenseForm, notes: e.target.value })}
            placeholder="Optional context, receipt notes, or reimbursement details"
          />

          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="secondary"
              onClick={() => {
                setExpenseModalOpen(false)
                setEditingExpense(null)
              }}
            >
              Cancel
            </Button>
            <Button onClick={saveExpense} disabled={!expenseForm.description || !expenseForm.date}>
              {editingExpense ? 'Save Changes' : 'Add Expense'}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={recurringModalOpen}
        onClose={() => {
          setRecurringModalOpen(false)
          setEditingRecurring(null)
        }}
        title={editingRecurring ? 'Edit Recurring Invoice' : 'Add Recurring Invoice'}
        wide
      >
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Select
              label="Client"
              options={clientOptions}
              value={recurringForm.clientId}
              onChange={(e) => setRecurringForm({ ...recurringForm, clientId: e.target.value })}
            />
            <Input
              label="Title"
              value={recurringForm.title}
              onChange={(e) => setRecurringForm({ ...recurringForm, title: e.target.value })}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Input
              label="Amount"
              type="number"
              step="0.01"
              value={recurringForm.amount}
              onChange={(e) => setRecurringForm({ ...recurringForm, amount: e.target.value })}
            />
            <Select
              label="Frequency"
              options={[
                { value: 'weekly', label: 'Weekly' },
                { value: 'biweekly', label: 'Biweekly' },
                { value: 'monthly', label: 'Monthly' },
                { value: 'quarterly', label: 'Quarterly' },
              ]}
              value={recurringForm.frequency}
              onChange={(e) => setRecurringForm({ ...recurringForm, frequency: e.target.value as RecurringFrequency })}
            />
            <Input
              label="Next Date"
              type="date"
              value={recurringForm.nextDate}
              onChange={(e) => setRecurringForm({ ...recurringForm, nextDate: e.target.value })}
            />
          </div>

          <label className="flex items-center gap-3 rounded-lg border border-surface-200 px-3 py-2 text-sm text-surface-700">
            <input
              type="checkbox"
              checked={recurringForm.active}
              onChange={(e) => setRecurringForm({ ...recurringForm, active: e.target.checked })}
              className="rounded border-surface-300 text-brand-600"
            />
            Active
          </label>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="secondary"
              onClick={() => {
                setRecurringModalOpen(false)
                setEditingRecurring(null)
              }}
            >
              Cancel
            </Button>
            <Button onClick={saveRecurring} disabled={!recurringForm.clientId || !recurringForm.title || !recurringForm.amount || !recurringForm.nextDate}>
              {editingRecurring ? 'Save Changes' : 'Add Recurring Invoice'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
