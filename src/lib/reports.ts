import type { AppState } from './types'
import { formatCurrency } from './utils'

function downloadCsv(filename: string, rows: string[][]) {
  const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function exportInvoicesCsv(state: AppState) {
  downloadCsv(`invoices-${new Date().toISOString().split('T')[0]}.csv`, [
    ['Number', 'Client', 'Issue Date', 'Due Date', 'Total', 'Status', 'Paid Date'],
    ...state.invoices.map((i) => [
      i.number, i.clientName, i.issueDate, i.dueDate,
      String(i.total), i.status, i.paidAt || '',
    ]),
  ])
}

export function exportExpensesCsv(state: AppState) {
  downloadCsv(`expenses-${new Date().toISOString().split('T')[0]}.csv`, [
    ['Date', 'Description', 'Category', 'Amount', 'Client', 'Project', 'Billable'],
    ...state.expenses.map((e) => [
      e.date, e.description, e.category, String(e.amount),
      e.clientName, e.projectName, e.billable ? 'Yes' : 'No',
    ]),
  ])
}

export function exportQuickBooksCsv(state: AppState) {
  downloadCsv(`quickbooks-export-${new Date().toISOString().split('T')[0]}.csv`, [
    ['Date', 'Description', 'Amount', 'Category', 'Customer'],
    ...state.invoices.filter((i) => i.status === 'paid').map((i) => [
      i.paidAt || i.issueDate, `Invoice ${i.number}`, String(i.total), 'Income', i.clientName,
    ]),
    ...state.expenses.map((e) => [
      e.date, e.description, String(-e.amount), e.category, e.clientName,
    ]),
  ])
}

export function exportTimeCsv(state: AppState) {
  downloadCsv(`time-${new Date().toISOString().split('T')[0]}.csv`, [
    ['Date', 'Project', 'Client', 'Description', 'Hours', 'Rate', 'Amount', 'Billable'],
    ...state.timeEntries.map((e) => [
      e.createdAt.split('T')[0], e.projectName, e.clientName, e.description,
      String((e.durationMinutes / 60).toFixed(2)), String(e.hourlyRate),
      String(((e.durationMinutes / 60) * e.hourlyRate).toFixed(2)),
      e.billable ? 'Yes' : 'No',
    ]),
  ])
}

export function getReportSummary(state: AppState, year?: number) {
  const y = year ?? new Date().getFullYear()
  const inYear = (d: string) => new Date(d).getFullYear() === y
  const currency = state.profile.defaultCurrency

  const revenue = state.invoices
    .filter((i) => i.status === 'paid' && inYear(i.paidAt || i.createdAt))
    .reduce((s, i) => s + i.total, 0)

  const expenses = state.expenses
    .filter((e) => inYear(e.date))
    .reduce((s, e) => s + e.amount, 0)

  const hours = state.timeEntries
    .filter((e) => inYear(e.createdAt))
    .reduce((s, e) => s + e.durationMinutes, 0) / 60

  const byClient: Record<string, number> = {}
  state.invoices.filter((i) => i.status === 'paid' && inYear(i.paidAt || i.createdAt)).forEach((i) => {
    byClient[i.clientName] = (byClient[i.clientName] || 0) + i.total
  })

  return {
    year: y,
    currency,
    revenue,
    expenses,
    profit: revenue - expenses,
    hours: hours.toFixed(1),
    invoiceCount: state.invoices.filter((i) => inYear(i.createdAt)).length,
    byClient: Object.entries(byClient).sort((a, b) => b[1] - a[1]),
    formatted: {
      revenue: formatCurrency(revenue, currency),
      expenses: formatCurrency(expenses, currency),
      profit: formatCurrency(revenue - expenses, currency),
    },
  }
}

export function fillTemplate(
  template: string,
  vars: Record<string, string>
): string {
  let result = template
  for (const [key, value] of Object.entries(vars)) {
    result = result.replace(new RegExp(`{{${key}}}`, 'g'), value)
  }
  return result
}
