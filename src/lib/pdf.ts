import jsPDF from 'jspdf'
import type { BusinessProfile, Contract, Invoice } from './types'
import { formatCurrency, formatDate } from './utils'
import { formatPaymentMethodLine, getPaymentLink, resolveInvoicePaymentMethods } from './payments'

function addHeader(doc: jsPDF, profile: BusinessProfile, title: string) {
  doc.setFontSize(20)
  doc.setTextColor(79, 70, 229)
  doc.text(profile.name || 'WorkVault', 20, 25)

  doc.setFontSize(10)
  doc.setTextColor(100, 116, 139)
  if (profile.email) doc.text(profile.email, 20, 32)
  if (profile.phone) doc.text(profile.phone, 20, 37)
  if (profile.address) {
    doc.text(`${profile.address}, ${profile.city} ${profile.state} ${profile.zip}`, 20, 42)
  }

  doc.setFontSize(16)
  doc.setTextColor(15, 23, 42)
  doc.text(title, 20, 58)
  doc.setDrawColor(226, 232, 240)
  doc.line(20, 62, 190, 62)
}

export function generateContractPDF(contract: Contract, profile: BusinessProfile): void {
  const doc = new jsPDF()
  addHeader(doc, profile, `Contract ${contract.number}`)

  doc.setFontSize(10)
  doc.setTextColor(71, 85, 105)
  doc.text(`Client: ${contract.clientName}`, 20, 72)
  doc.text(`Status: ${contract.status.toUpperCase()}`, 20, 78)
  doc.text(`Period: ${formatDate(contract.startDate)} — ${formatDate(contract.endDate)}`, 20, 84)
  doc.text(`Value: ${formatCurrency(contract.value, profile.defaultCurrency)}`, 20, 90)

  doc.setFontSize(11)
  doc.setTextColor(15, 23, 42)
  const lines = doc.splitTextToSize(contract.content, 170)
  let y = 102
  doc.text(lines, 20, y)
  y += lines.length * 5 + 10

  if (contract.signatures.length > 0) {
    if (y > 250) {
      doc.addPage()
      y = 20
    }
    doc.setDrawColor(226, 232, 240)
    doc.line(20, y, 190, y)
    y += 10
    doc.setFontSize(10)
    doc.setTextColor(100, 116, 139)
    doc.text('SIGNATURES', 20, y)
    y += 8

    for (const sig of contract.signatures) {
      if (y > 240) {
        doc.addPage()
        y = 20
      }
      doc.setFontSize(9)
      doc.setTextColor(71, 85, 105)
      doc.text(`${sig.role === 'contractor' ? 'Contractor' : 'Client'}: ${sig.name}`, 20, y)
      y += 4
      doc.text(`Signed: ${formatDate(sig.signedAt)}`, 20, y)
      y += 4
      try {
        doc.addImage(sig.signatureImage, 'PNG', 20, y, 60, 20)
        y += 26
      } catch {
        y += 4
      }
    }
  }

  doc.save(`${contract.number}.pdf`)
}

export function generateInvoicePDF(invoice: Invoice, profile: BusinessProfile): void {
  const doc = new jsPDF()
  addHeader(doc, profile, `Invoice ${invoice.number}`)

  doc.setFontSize(10)
  doc.setTextColor(71, 85, 105)
  doc.text(`Bill To: ${invoice.clientName}`, 20, 72)
  doc.text(`Issue Date: ${formatDate(invoice.issueDate)}`, 20, 78)
  doc.text(`Due Date: ${formatDate(invoice.dueDate)}`, 20, 84)
  doc.text(`Status: ${invoice.status.toUpperCase()}`, 20, 90)

  let y = 102
  doc.setFillColor(248, 250, 252)
  doc.rect(20, y - 5, 170, 8, 'F')
  doc.setFontSize(9)
  doc.setTextColor(100, 116, 139)
  doc.text('Description', 22, y)
  doc.text('Qty', 120, y)
  doc.text('Rate', 140, y)
  doc.text('Amount', 165, y)
  y += 10

  doc.setFontSize(10)
  doc.setTextColor(15, 23, 42)
  for (const item of invoice.lineItems) {
    doc.text(item.description.substring(0, 50), 22, y)
    doc.text(String(item.quantity), 120, y)
    doc.text(formatCurrency(item.rate, profile.defaultCurrency), 140, y)
    doc.text(formatCurrency(item.amount, profile.defaultCurrency), 165, y)
    y += 7
  }

  y += 5
  doc.line(120, y, 190, y)
  y += 8
  doc.text('Subtotal:', 130, y)
  doc.text(formatCurrency(invoice.subtotal, profile.defaultCurrency), 165, y)
  y += 7
  doc.text(`Tax (${invoice.taxRate}%):`, 130, y)
  doc.text(formatCurrency(invoice.taxAmount, profile.defaultCurrency), 165, y)
  y += 7
  doc.setFontSize(12)
  doc.setTextColor(79, 70, 229)
  doc.text('Total:', 130, y)
  doc.text(formatCurrency(invoice.total, profile.defaultCurrency), 165, y)

  if (invoice.notes) {
    y += 15
    doc.setFontSize(9)
    doc.setTextColor(100, 116, 139)
    doc.text('Notes:', 20, y)
    y += 5
    doc.setTextColor(71, 85, 105)
    const noteLines = doc.splitTextToSize(invoice.notes, 170)
    doc.text(noteLines, 20, y)
    y += noteLines.length * 4 + 10
  }

  const methods = resolveInvoicePaymentMethods(profile, invoice.paymentMethodIds)
  const payInstructions = invoice.paymentInstructions || profile.defaultPaymentInstructions
  if (methods.length > 0 || payInstructions) {
    if (y > 230) { doc.addPage(); y = 20 }
    doc.setDrawColor(226, 232, 240)
    doc.line(20, y, 190, y)
    y += 10
    doc.setFontSize(10)
    doc.setTextColor(79, 70, 229)
    doc.text('HOW TO PAY', 20, y)
    y += 8
    for (const method of methods) {
      if (y > 260) { doc.addPage(); y = 20 }
      doc.setFontSize(9)
      doc.setTextColor(15, 23, 42)
      doc.text(formatPaymentMethodLine(method), 22, y)
      y += 5
      const link = getPaymentLink(method)
      if (link) {
        doc.setTextColor(79, 70, 229)
        doc.textWithLink('Pay online →', 22, y, { url: link })
        y += 5
      }
    }
    if (payInstructions) {
      y += 3
      doc.setFontSize(9)
      doc.setTextColor(71, 85, 105)
      const instrLines = doc.splitTextToSize(payInstructions, 170)
      doc.text(instrLines, 22, y)
    }
  }

  doc.save(`${invoice.number}.pdf`)
}

export function generateWorkProtectionCertificate(
  title: string,
  hash: string,
  timestamp: string,
  profile: BusinessProfile
): void {
  const doc = new jsPDF()
  addHeader(doc, profile, 'Work Protection Certificate')

  doc.setFontSize(12)
  doc.setTextColor(15, 23, 42)
  doc.text('Certificate of Work Registration', 20, 72)

  doc.setFontSize(10)
  doc.setTextColor(71, 85, 105)
  doc.text(`Work Title: ${title}`, 20, 85)
  doc.text(`Registered By: ${profile.name || 'Contractor'}`, 20, 93)
  doc.text(`Timestamp: ${timestamp}`, 20, 101)
  doc.text(`SHA-256 Hash:`, 20, 109)

  doc.setFontSize(8)
  doc.setTextColor(100, 116, 139)
  const hashLines = doc.splitTextToSize(hash, 170)
  doc.text(hashLines, 20, 115)

  const endY = 115 + hashLines.length * 4 + 10

  doc.setFontSize(9)
  doc.setTextColor(71, 85, 105)
  const disclaimer = doc.splitTextToSize(
    'This certificate provides a cryptographic timestamp and hash of your work at the time of registration. Store this document as evidence of your original creation date. WorkVault records are stored locally on your device.',
    170
  )
  doc.text(disclaimer, 20, endY)

  doc.save(`work-protection-${Date.now()}.pdf`)
}
