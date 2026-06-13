import type {
  AppState, Form1099NECRecord, Form1099Provider, Subcontractor, SubcontractorPayment,
} from './types'
import { formatCurrency } from './utils'

export const IRS_1099_NEC_THRESHOLD = 600

export const FORM1099_PROVIDERS: {
  id: Form1099Provider
  name: string
  description: string
  url: string
  exportKey: 'track1099' | 'tax1099' | 'quickbooks' | 'irs_fire' | 'standard'
}[] = [
  {
    id: 'track1099',
    name: 'Track1099',
    description: 'Track1099 by Avalara — e-file 1099-NEC with W-9 collection',
    url: 'https://www.track1099.com',
    exportKey: 'track1099',
  },
  {
    id: 'tax1099',
    name: 'Tax1099.com',
    description: 'Bulk import payees and file 1099-NEC electronically',
    url: 'https://www.tax1099.com',
    exportKey: 'tax1099',
  },
  {
    id: 'quickbooks',
    name: 'QuickBooks 1099',
    description: 'Import into QuickBooks contractor payments workflow',
    url: 'https://quickbooks.intuit.com',
    exportKey: 'quickbooks',
  },
  {
    id: 'irs_fire',
    name: 'IRS FIRE',
    description: 'Info Return Electronic Filing — IRS direct e-file format',
    url: 'https://www.irs.gov/e-file-providers/filing-information-returns-electronically-fire',
    exportKey: 'irs_fire',
  },
  {
    id: 'manual',
    name: 'Standard CSV',
    description: 'Generic payee export for accountants or manual filing',
    url: 'https://www.irs.gov/forms-pubs/about-form-1099-nec',
    exportKey: 'standard',
  },
]

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

function inTaxYear(date: string, year: number): boolean {
  return new Date(date).getFullYear() === year
}

export function maskTin(tin: string): string {
  const digits = tin.replace(/\D/g, '')
  if (digits.length < 4) return '•••-••-••••'
  return `•••-••-${digits.slice(-4)}`
}

export function getPayerInfo(state: AppState) {
  const p = state.profile
  return {
    name: p.name,
    tin: p.taxId,
    address: p.address,
    city: p.city,
    state: p.state,
    zip: p.zip,
    email: p.email,
    phone: p.phone,
  }
}

export function getSubcontractorPaymentsForYear(
  state: AppState,
  subcontractorId: string,
  year: number,
): number {
  const fromLedger = state.subcontractorPayments
    .filter((p) => p.subcontractorId === subcontractorId && inTaxYear(p.date, year))
    .reduce((s, p) => s + p.amount, 0)

  if (fromLedger > 0) return fromLedger

  const sub = state.subcontractors.find((s) => s.id === subcontractorId)
  if (!sub) return 0

  const expensePayments = state.expenses
    .filter((e) => e.category === 'subcontractor' && inTaxYear(e.date, year))
    .filter((e) => e.description.toLowerCase().includes(sub.name.toLowerCase()))
    .reduce((s, e) => s + e.amount, 0)

  if (expensePayments > 0) return expensePayments

  if (sub.amountPaid > 0 && inTaxYear(sub.createdAt, year)) {
    return sub.amountPaid
  }

  return 0
}

export interface Payee1099Summary {
  payeeId: string
  payeeName: string
  businessName: string
  email: string
  tin: string
  totalPaid: number
  w9OnFile: boolean
  requires1099: boolean
  meetsThreshold: boolean
  readyToFile: boolean
  missingFields: string[]
  entityType: Subcontractor['entityType']
  address: string
  city: string
  state: string
  zip: string
}

export function build1099PayeeSummaries(state: AppState, year?: number): Payee1099Summary[] {
  const taxYear = year ?? state.tax1099Settings.filingYear
  const threshold = state.tax1099Settings.thresholdAmount || IRS_1099_NEC_THRESHOLD

  return state.subcontractors.map((sub) => {
    const totalPaid = getSubcontractorPaymentsForYear(state, sub.id, taxYear)
    const missingFields: string[] = []
    if (!sub.tin) missingFields.push('TIN')
    if (!sub.address) missingFields.push('Address')
    if (!sub.city || !sub.state || !sub.zip) missingFields.push('City/State/ZIP')
    if (!sub.w9OnFile) missingFields.push('W-9')

    const meetsThreshold = totalPaid >= threshold
    const requires1099 = sub.requires1099 && meetsThreshold
    const readyToFile = requires1099 && missingFields.length === 0

    return {
      payeeId: sub.id,
      payeeName: sub.name,
      businessName: sub.businessName || sub.name,
      email: sub.email,
      tin: sub.tin,
      totalPaid,
      w9OnFile: sub.w9OnFile,
      requires1099,
      meetsThreshold,
      readyToFile,
      missingFields,
      entityType: sub.entityType,
      address: sub.address,
      city: sub.city,
      state: sub.state,
      zip: sub.zip,
    }
  })
}

export function build1099FilingStats(state: AppState, year?: number) {
  const summaries = build1099PayeeSummaries(state, year)
  const required = summaries.filter((s) => s.requires1099)
  return {
    totalPayees: summaries.length,
    requiring1099: required.length,
    readyToFile: required.filter((s) => s.readyToFile).length,
    missingW9: required.filter((s) => !s.w9OnFile).length,
    totalReportable: required.reduce((s, p) => s + p.totalPaid, 0),
    belowThreshold: summaries.filter((s) => !s.meetsThreshold).length,
  }
}

export function buildW9RequestEmail(sub: Subcontractor, contractorName: string): { subject: string; text: string } {
  return {
    subject: `W-9 request from ${contractorName}`,
    text: [
      `Hi ${sub.name},`,
      '',
      `${contractorName} needs a completed IRS Form W-9 for our records before we can issue your 1099-NEC.`,
      '',
      'Please reply with a signed W-9 including:',
      '• Legal name (or business name)',
      '• Taxpayer Identification Number (SSN or EIN)',
      '• Address',
      '',
      'Download blank W-9: https://www.irs.gov/forms-pubs/about-form-w-9',
      '',
      'Thank you,',
      contractorName,
    ].join('\n'),
  }
}

export function exportStandard1099Csv(state: AppState, year?: number) {
  const taxYear = year ?? state.tax1099Settings.filingYear
  const payees = build1099PayeeSummaries(state, taxYear).filter((p) => p.requires1099)
  const payer = getPayerInfo(state)

  downloadCsv(`1099-nec-payees-${taxYear}.csv`, [
    ['Tax Year', 'Payer Name', 'Payer TIN', 'Payee Name', 'Payee Business Name', 'Payee TIN', 'Address', 'City', 'State', 'ZIP', 'Email', 'Box 1 Nonemployee Compensation', 'W-9 On File', 'Entity Type'],
    ...payees.map((p) => [
      String(taxYear), payer.name, payer.tin, p.payeeName, p.businessName, p.tin,
      p.address, p.city, p.state, p.zip, p.email,
      p.totalPaid.toFixed(2), p.w9OnFile ? 'Yes' : 'No', p.entityType,
    ]),
  ])
}

/** Track1099 bulk import format (simplified) */
export function exportTrack1099Csv(state: AppState, year?: number) {
  const taxYear = year ?? state.tax1099Settings.filingYear
  const payees = build1099PayeeSummaries(state, taxYear).filter((p) => p.requires1099)
  const payer = getPayerInfo(state)

  downloadCsv(`track1099-import-${taxYear}.csv`, [
    ['Recipient Name', 'Recipient TIN', 'Recipient Email', 'Street Address', 'City', 'State', 'Zip', 'Amount', 'Payer Name', 'Payer TIN', 'Form Type', 'Tax Year'],
    ...payees.map((p) => [
      p.businessName, p.tin, p.email, p.address, p.city, p.state, p.zip,
      p.totalPaid.toFixed(2), payer.name, payer.tin, '1099-NEC', String(taxYear),
    ]),
  ])
}

/** Tax1099.com import format */
export function exportTax1099ComCsv(state: AppState, year?: number) {
  const taxYear = year ?? state.tax1099Settings.filingYear
  const payees = build1099PayeeSummaries(state, taxYear).filter((p) => p.requires1099)
  const payer = getPayerInfo(state)

  downloadCsv(`tax1099-import-${taxYear}.csv`, [
    ['Payer TIN', 'Payer Name', 'Recipient TIN', 'Recipient Name', 'Recipient Address', 'Recipient City', 'Recipient State', 'Recipient Zip', 'Nonemployee Compensation', 'Form', 'Year'],
    ...payees.map((p) => [
      payer.tin, payer.name, p.tin, p.businessName,
      p.address, p.city, p.state, p.zip,
      p.totalPaid.toFixed(2), 'NEC', String(taxYear),
    ]),
  ])
}

/** QuickBooks 1099 contractor export */
export function exportQuickBooks1099Csv(state: AppState, year?: number) {
  const taxYear = year ?? state.tax1099Settings.filingYear
  const payees = build1099PayeeSummaries(state, taxYear).filter((p) => p.requires1099)

  downloadCsv(`quickbooks-1099-${taxYear}.csv`, [
    ['Vendor', 'Company Name', 'Tax ID', 'Street', 'City', 'State', 'Zip', '1099-NEC Box 1', 'Track Payments'],
    ...payees.map((p) => [
      p.payeeName, p.businessName, p.tin, p.address, p.city, p.state, p.zip,
      p.totalPaid.toFixed(2), 'Yes',
    ]),
  ])
}

/** IRS FIRE-style reference export (simplified fixed-width friendly CSV) */
export function exportIrsFire1099Csv(state: AppState, year?: number) {
  const taxYear = year ?? state.tax1099Settings.filingYear
  const payees = build1099PayeeSummaries(state, taxYear).filter((p) => p.requires1099)
  const payer = getPayerInfo(state)

  downloadCsv(`irs-fire-1099nec-${taxYear}.csv`, [
    ['Form Type', 'Tax Year', 'Payer TIN', 'Payer Name Line 1', 'Payer Street', 'Payer City', 'Payer State', 'Payer ZIP', 'Payee TIN', 'Payee Name', 'Payee Street', 'Payee City', 'Payee State', 'Payee ZIP', 'Payment Amount'],
    ...payees.map((p) => [
      '1099-NEC', String(taxYear), payer.tin, payer.name, payer.address, payer.city, payer.state, payer.zip,
      p.tin, p.businessName, p.address, p.city, p.state, p.zip, p.totalPaid.toFixed(2),
    ]),
  ])
}

export function export1099ByProvider(state: AppState, provider: Form1099Provider, year?: number) {
  switch (provider) {
    case 'track1099': return exportTrack1099Csv(state, year)
    case 'tax1099': return exportTax1099ComCsv(state, year)
    case 'quickbooks': return exportQuickBooks1099Csv(state, year)
    case 'irs_fire': return exportIrsFire1099Csv(state, year)
    default: return exportStandard1099Csv(state, year)
  }
}

export function syncForm1099Records(state: AppState, year?: number): Omit<Form1099NECRecord, 'id' | 'createdAt' | 'updatedAt'>[] {
  const taxYear = year ?? state.tax1099Settings.filingYear
  const payees = build1099PayeeSummaries(state, taxYear).filter((p) => p.requires1099)

  return payees.map((p) => {
    const existing = state.form1099Records.find(
      (r) => r.taxYear === taxYear && r.payeeId === p.payeeId,
    )
    return {
      taxYear,
      payeeId: p.payeeId,
      payeeName: p.businessName,
      payeeTin: p.tin,
      totalPaid: p.totalPaid,
      box1NonemployeeCompensation: p.totalPaid,
      w9OnFile: p.w9OnFile,
      status: p.readyToFile ? (existing?.status === 'filed' ? 'filed' : 'ready') : 'draft',
      filedAt: existing?.filedAt ?? null,
      provider: existing?.provider ?? null,
      notes: existing?.notes ?? '',
    }
  })
}

export function format1099SummaryReport(state: AppState, year?: number): string {
  const taxYear = year ?? state.tax1099Settings.filingYear
  const stats = build1099FilingStats(state, taxYear)
  const payer = getPayerInfo(state)
  const payees = build1099PayeeSummaries(state, taxYear).filter((p) => p.requires1099)

  const lines = [
    `1099-NEC FILING SUMMARY — ${taxYear}`,
    `Payer: ${payer.name} (TIN: ${payer.tin || 'NOT SET'})`,
    '',
    `Payees requiring 1099: ${stats.requiring1099}`,
    `Ready to file: ${stats.readyToFile}`,
    `Missing W-9: ${stats.missingW9}`,
    `Total reportable: ${formatCurrency(stats.totalReportable, state.profile.defaultCurrency)}`,
    `File by: ${state.tax1099Settings.reminderFileBy}`,
    '',
    'PAYEES:',
    ...payees.map((p) =>
      `• ${p.businessName} — ${formatCurrency(p.totalPaid, state.profile.defaultCurrency)} — W-9: ${p.w9OnFile ? 'Yes' : 'NO'} — ${p.readyToFile ? 'Ready' : `Missing: ${p.missingFields.join(', ')}`}`,
    ),
  ]
  return lines.join('\n')
}

export function defaultSubcontractorTaxFields(): Pick<Subcontractor,
  'businessName' | 'tin' | 'address' | 'city' | 'state' | 'zip' | 'entityType' | 'w9OnFile' | 'w9ReceivedAt' | 'requires1099'
> {
  return {
    businessName: '',
    tin: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    entityType: 'individual',
    w9OnFile: false,
    w9ReceivedAt: null,
    requires1099: true,
  }
}

export function defaultSubcontractorPayment(
  data: Omit<SubcontractorPayment, 'id' | 'createdAt'>,
): SubcontractorPayment {
  return {
    ...data,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  }
}
