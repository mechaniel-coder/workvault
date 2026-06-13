import type { AppState } from './types'
import { formatCurrency } from './utils'

export interface TaxSummary {
  grossIncome: number
  expenses: number
  netIncome: number
  estimatedTax: number
  selfEmploymentTax: number
  totalTaxOwed: number
  quarterlyPayment: number
  mileageDeduction: number
}

export function calculateTaxSummary(state: AppState, year?: number): TaxSummary {
  const y = year ?? new Date().getFullYear()
  const inYear = (d: string) => new Date(d).getFullYear() === y

  const paidInvoices = state.invoices.filter((i) => i.status === 'paid' && inYear(i.paidAt || i.createdAt))
  const grossIncome = paidInvoices.reduce((s, i) => s + i.total, 0)

  const yearExpenses = state.expenses.filter((e) => inYear(e.date))
  let expenses = yearExpenses.reduce((s, e) => s + e.amount, 0)

  const mileageExpenses = yearExpenses.filter((e) => e.category === 'mileage')
  const mileageDeduction = mileageExpenses.reduce(
    (s, e) => s + (e.mileage > 0 ? e.mileage * state.taxSettings.mileageRate : e.amount),
    0
  )
  expenses += mileageExpenses.reduce((s, e) => {
    if (e.mileage > 0) return s + Math.max(0, e.mileage * state.taxSettings.mileageRate - e.amount)
    return s
  }, 0)

  const netIncome = Math.max(0, grossIncome - expenses)
  const estimatedTax = netIncome * (state.taxSettings.estimatedTaxRate / 100)
  const selfEmploymentTax = netIncome * (state.taxSettings.selfEmploymentTaxRate / 100)
  const totalTaxOwed = estimatedTax + selfEmploymentTax
  const quarterlyPayment = totalTaxOwed / 4

  return { grossIncome, expenses, netIncome, estimatedTax, selfEmploymentTax, totalTaxOwed, quarterlyPayment, mileageDeduction }
}

export function getQuarterlyDueDates(year: number): { quarter: string; dueDate: string }[] {
  return [
    { quarter: 'Q1 (Jan–Mar)', dueDate: `${year}-04-15` },
    { quarter: 'Q2 (Apr–Jun)', dueDate: `${year}-06-15` },
    { quarter: 'Q3 (Jul–Sep)', dueDate: `${year}-09-15` },
    { quarter: 'Q4 (Oct–Dec)', dueDate: `${year + 1}-01-15` },
  ]
}

export function formatTaxReport(summary: TaxSummary, currency: string): string {
  return [
    'TAX SUMMARY',
    `Gross Income: ${formatCurrency(summary.grossIncome, currency)}`,
    `Business Expenses: ${formatCurrency(summary.expenses, currency)}`,
    `Net Income: ${formatCurrency(summary.netIncome, currency)}`,
    `Income Tax (est.): ${formatCurrency(summary.estimatedTax, currency)}`,
    `Self-Employment Tax (est.): ${formatCurrency(summary.selfEmploymentTax, currency)}`,
    `Total Tax Owed (est.): ${formatCurrency(summary.totalTaxOwed, currency)}`,
    `Quarterly Payment: ${formatCurrency(summary.quarterlyPayment, currency)}`,
  ].join('\n')
}

export function calculateRate(params: {
  desiredIncome: number
  billableHours: number
  expenses: number
  taxRate: number
  weeksOff: number
}): { hourlyRate: number; monthlyRate: number; annualGross: number } {
  const workingWeeks = 52 - params.weeksOff
  const annualHours = params.billableHours * workingWeeks
  const taxMultiplier = 1 + params.taxRate / 100
  const annualGross = (params.desiredIncome + params.expenses) * taxMultiplier
  const hourlyRate = annualHours > 0 ? annualGross / annualHours : 0
  const monthlyRate = hourlyRate * (params.billableHours * 4.33)
  return { hourlyRate, monthlyRate, annualGross }
}
