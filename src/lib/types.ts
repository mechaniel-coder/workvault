export type ContractStatus = 'draft' | 'sent' | 'awaiting_signature' | 'partially_signed' | 'signed' | 'expired' | 'cancelled'
export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
export type LicenseStatus = 'active' | 'expiring' | 'expired' | 'pending'
export type WorkRecordType = 'deliverable' | 'milestone' | 'revision' | 'meeting' | 'note'
export type ProtectionType = 'copyright' | 'watermark' | 'nda' | 'ip_claim' | 'timestamp'

export interface BusinessProfile {
  name: string
  email: string
  phone: string
  address: string
  city: string
  state: string
  zip: string
  taxId: string
  website: string
  logoUrl: string
  defaultHourlyRate: number
  defaultCurrency: string
  invoicePrefix: string
  contractPrefix: string
}

export interface Client {
  id: string
  name: string
  email: string
  phone: string
  company: string
  address: string
  notes: string
  createdAt: string
}

export interface TimeEntry {
  id: string
  projectId: string
  projectName: string
  clientId: string
  clientName: string
  description: string
  startTime: string
  endTime: string | null
  durationMinutes: number
  hourlyRate: number
  billable: boolean
  invoiced: boolean
  createdAt: string
}

export interface ContractSignature {
  role: 'contractor' | 'client'
  name: string
  signatureImage: string
  signedAt: string
}

export interface Contract {
  id: string
  number: string
  title: string
  clientId: string
  clientName: string
  status: ContractStatus
  template: string
  content: string
  startDate: string
  endDate: string
  value: number
  terms: string
  sentAt: string | null
  signedAt: string | null
  signatures: ContractSignature[]
  signingToken: string | null
  createdAt: string
  updatedAt: string
}

export interface InvoiceLineItem {
  id: string
  description: string
  quantity: number
  rate: number
  amount: number
}

export interface Invoice {
  id: string
  number: string
  clientId: string
  clientName: string
  status: InvoiceStatus
  issueDate: string
  dueDate: string
  lineItems: InvoiceLineItem[]
  subtotal: number
  taxRate: number
  taxAmount: number
  total: number
  notes: string
  sentAt: string | null
  paidAt: string | null
  createdAt: string
}

export interface License {
  id: string
  name: string
  number: string
  issuingBody: string
  type: string
  status: LicenseStatus
  issueDate: string
  expiryDate: string
  verificationUrl: string
  documentUrl: string
  notes: string
  createdAt: string
}

export interface WorkProtection {
  id: string
  title: string
  type: ProtectionType
  projectId: string
  projectName: string
  description: string
  hash: string
  timestamp: string
  evidence: string
  clientId: string
  clientName: string
  createdAt: string
}

export interface HostedProject {
  id: string
  title: string
  description: string
  clientId: string
  clientName: string
  url: string
  status: 'live' | 'draft' | 'archived'
  deliverables: string[]
  deployedAt: string | null
  createdAt: string
}

export interface WorkRecord {
  id: string
  type: WorkRecordType
  title: string
  description: string
  projectId: string
  projectName: string
  clientId: string
  clientName: string
  hoursSpent: number
  attachments: string[]
  tags: string[]
  createdAt: string
}

export interface SyncMeta {
  lastSyncedAt: string | null
  autoSync: boolean
}

export interface AppState {
  profile: BusinessProfile
  clients: Client[]
  timeEntries: TimeEntry[]
  contracts: Contract[]
  invoices: Invoice[]
  licenses: License[]
  workProtections: WorkProtection[]
  hostedProjects: HostedProject[]
  workRecords: WorkRecord[]
  activeTimer: { entryId: string; startedAt: string } | null
  syncMeta: SyncMeta
}

export const DEFAULT_PROFILE: BusinessProfile = {
  name: '',
  email: '',
  phone: '',
  address: '',
  city: '',
  state: '',
  zip: '',
  taxId: '',
  website: '',
  logoUrl: '',
  defaultHourlyRate: 75,
  defaultCurrency: 'USD',
  invoicePrefix: 'INV',
  contractPrefix: 'CTR',
}

export const CONTRACT_TEMPLATES = {
  freelance: {
    name: 'Freelance Services Agreement',
    content: `FREELANCE SERVICES AGREEMENT

This Agreement is entered into as of {{startDate}} between:

CONTRACTOR: {{businessName}}
Email: {{businessEmail}}
Address: {{businessAddress}}

CLIENT: {{clientName}}
Email: {{clientEmail}}
Company: {{clientCompany}}

1. SERVICES
The Contractor agrees to provide the following services: {{title}}

2. COMPENSATION
Total project value: {{value}} {{currency}}
Payment terms: Net 30 from invoice date.

3. INTELLECTUAL PROPERTY
Upon full payment, all deliverables become the property of the Client. The Contractor retains the right to display work in their portfolio unless otherwise agreed in writing.

4. CONFIDENTIALITY
Both parties agree to keep confidential information private and not disclose to third parties.

5. TERMINATION
Either party may terminate with 14 days written notice. Client pays for work completed to date.

6. GOVERNING LAW
This agreement shall be governed by applicable local laws.

SIGNATURES:

Contractor: _________________________ Date: _________
Client: _________________________ Date: _________`,
  },
  nda: {
    name: 'Non-Disclosure Agreement',
    content: `NON-DISCLOSURE AGREEMENT

Effective Date: {{startDate}}

DISCLOSING PARTY: {{businessName}}
RECEIVING PARTY: {{clientName}} / {{clientCompany}}

1. CONFIDENTIAL INFORMATION
All business, technical, and financial information shared during the engagement.

2. OBLIGATIONS
The Receiving Party shall not disclose Confidential Information to any third party without prior written consent.

3. TERM
This Agreement remains in effect for 2 years from the effective date.

4. RETURN OF MATERIALS
Upon termination, all confidential materials must be returned or destroyed.

SIGNATURES:

Disclosing Party: _________________________ Date: _________
Receiving Party: _________________________ Date: _________`,
  },
  retainer: {
    name: 'Monthly Retainer Agreement',
    content: `MONTHLY RETAINER AGREEMENT

Effective Date: {{startDate}}

PROVIDER: {{businessName}}
CLIENT: {{clientName}} / {{clientCompany}}

1. RETAINER SERVICES
Provider agrees to dedicate up to 40 hours per month for: {{title}}

2. MONTHLY FEE
{{value}} {{currency}} per month, due on the 1st of each month.

3. OVERAGE
Hours exceeding the retainer are billed at {{hourlyRate}} {{currency}}/hour.

4. TERM
This agreement runs from {{startDate}} to {{endDate}}, renewing automatically unless cancelled with 30 days notice.

SIGNATURES:

Provider: _________________________ Date: _________
Client: _________________________ Date: _________`,
  },
}
