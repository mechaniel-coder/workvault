export type ContractStatus = 'draft' | 'sent' | 'awaiting_signature' | 'partially_signed' | 'signed' | 'expired' | 'cancelled'
export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
export type LicenseStatus = 'active' | 'expiring' | 'expired' | 'pending'
export type WorkRecordType = 'deliverable' | 'milestone' | 'revision' | 'meeting' | 'note'
export type ProtectionType = 'copyright' | 'watermark' | 'nda' | 'ip_claim' | 'timestamp'

export type PaymentMethodType =
  | 'bank_transfer'
  | 'paypal'
  | 'venmo'
  | 'zelle'
  | 'stripe'
  | 'cashapp'
  | 'check'
  | 'other'

export interface PaymentMethod {
  id: string
  type: PaymentMethodType
  label: string
  details: string
  enabled: boolean
}

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
  paymentMethods: PaymentMethod[]
  defaultPaymentInstructions: string
}

export interface Client {
  id: string
  name: string
  email: string
  phone: string
  company: string
  address: string
  notes: string
  portalToken: string | null
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
  paymentMethodIds: string[]
  paymentInstructions: string
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

export type DemoRoomMode = 'demo' | 'review'

export type DemoDeliverableKind =
  | 'application'
  | 'design_files'
  | 'source_code'
  | 'documents'
  | 'prototype'
  | 'other'

export interface DemoDeliverable {
  id: string
  name: string
  size: number
  mimeType: string
  kind: DemoDeliverableKind
  uploadedAt: string
  /** Stored in Netlify Blobs and available to remote clients */
  remote: boolean
  /** Base64 payload for small files when blob storage unavailable (max ~3MB) */
  inlineData?: string | null
}

export interface DemoProjectTransfer {
  title: string
  description: string
  /** Instructions shown to your client in the review room */
  clientNotes: string
  /** Live app, staging site, Figma prototype, etc. */
  appPreviewUrl: string | null
  deliverables: DemoDeliverable[]
  updatedAt: string | null
}

export interface DemoSettings {
  enabled: boolean
  token: string | null
  mode: DemoRoomMode
  expiresAt: string | null
  label: string
  createdAt: string | null
  lastAccessedAt: string | null
  accessCount: number
  projectTransfer: DemoProjectTransfer
  /** Secret for uploading demo files without Netlify Identity */
  uploadSecret: string | null
  /** When false (default), clients can preview but not download files or exports */
  allowDownloads: boolean
  /** Client-facing review hub configuration */
  clientRoom: ClientRoomConfig
}

export type ClientFeedbackStatus = 'approve' | 'changes'
export type ClientFeedbackTarget = 'file' | 'milestone' | 'general'
export type ClientMilestoneStatus = 'done' | 'active' | 'upcoming'

export interface ClientRoomChecklistItem {
  id: string
  label: string
  required: boolean
}

export interface ClientRoomMilestone {
  id: string
  title: string
  status: ClientMilestoneStatus
  date: string
}

export interface ClientRoomConfig {
  versionLabel: string
  ndaRequired: boolean
  ndaText: string
  linkPassword: string | null
  watermarkText: string
  notifyClientEmail: string | null
  checklist: ClientRoomChecklistItem[]
  guidedTourEnabled: boolean
  milestones: ClientRoomMilestone[]
  hubWelcomeMessage: string
  clientAssetUploadEnabled: boolean
  availabilitySlots: { date: string; startTime: string; endTime: string; notes: string }[]
}

export interface ClientFeedbackEntry {
  id: string
  targetType: ClientFeedbackTarget
  targetId: string
  targetLabel: string
  status: ClientFeedbackStatus
  comment: string
  clientName: string
  createdAt: string
}

export interface ClientSignOff {
  approved: boolean
  clientName: string
  signedAt: string
  note: string
}

export interface ClientMessage {
  id: string
  from: 'client' | 'contractor'
  authorName: string
  body: string
  createdAt: string
}

export interface ClientChecklistProgress {
  itemId: string
  checked: boolean
  checkedAt: string | null
}

export interface ClientAuditEntry {
  type: 'visit' | 'file_view' | 'page_view' | 'signoff' | 'survey'
  detail: string
  at: string
}

export interface ClientAssetSubmission {
  id: string
  name: string
  size: number
  mimeType: string
  uploadedAt: string
}

export interface ClientSurveyResponse {
  rating: number
  comment: string
  submittedAt: string
}

export interface ClientRoomData {
  feedback: ClientFeedbackEntry[]
  signOff: ClientSignOff | null
  messages: ClientMessage[]
  checklistProgress: ClientChecklistProgress[]
  auditLog: ClientAuditEntry[]
  clientAssets: ClientAssetSubmission[]
  survey: ClientSurveyResponse | null
  ndaAcceptedAt: string | null
  ndaAcceptedName: string | null
}

export interface ClientHubInvoice {
  number: string
  title: string
  total: number
  status: string
  dueDate: string
  currency: string
  paymentLinks: { label: string; url: string }[]
}

export interface ClientHubContract {
  number: string
  title: string
  status: string
  value: number
  currency: string
}

export interface ClientHubSession {
  token: string
  contractorName: string
  clientName: string
  label: string
  allowDownloads: boolean
  config: ClientRoomConfig
  data: ClientRoomData
  projectTransfer: DemoProjectTransfer
  invoices: ClientHubInvoice[]
  contracts: ClientHubContract[]
  demoUrl: string | null
}

export type ProjectStage = 'lead' | 'proposal' | 'active' | 'delivered' | 'invoiced' | 'paid'
export type ExpenseCategory = 'materials' | 'software' | 'travel' | 'mileage' | 'subcontractor' | 'equipment' | 'office' | 'other'
export type ProposalStatus = 'draft' | 'sent' | 'accepted' | 'declined' | 'expired'
export type RecurringFrequency = 'weekly' | 'biweekly' | 'monthly' | 'quarterly'
export type VaultDocType = 'w9' | 'insurance' | 'license' | 'contract' | 'nda' | 'receipt' | 'client_asset' | 'other'
export type EmailTemplateType = 'invoice_sent' | 'payment_reminder' | 'payment_overdue' | 'proposal_sent' | 'contract_followup' | 'project_kickoff' | 'custom'

export interface Project {
  id: string
  title: string
  clientId: string
  clientName: string
  stage: ProjectStage
  value: number
  description: string
  startDate: string
  dueDate: string
  createdAt: string
  updatedAt: string
}

export interface ProposalLineItem {
  id: string
  description: string
  quantity: number
  rate: number
  amount: number
}

export interface Proposal {
  id: string
  number: string
  title: string
  clientId: string
  clientName: string
  status: ProposalStatus
  lineItems: ProposalLineItem[]
  subtotal: number
  total: number
  validUntil: string
  notes: string
  createdAt: string
  updatedAt: string
}

export interface Expense {
  id: string
  description: string
  amount: number
  category: ExpenseCategory
  date: string
  clientId: string
  clientName: string
  projectId: string
  projectName: string
  billable: boolean
  invoiced: boolean
  mileage: number
  notes: string
  createdAt: string
}

export interface RecurringInvoice {
  id: string
  clientId: string
  clientName: string
  title: string
  amount: number
  frequency: RecurringFrequency
  nextDate: string
  lineItemDescription: string
  active: boolean
  lastGenerated: string | null
  createdAt: string
}

export interface ScopeEntry {
  id: string
  title: string
  description: string
  clientId: string
  clientName: string
  projectId: string
  projectName: string
  requestedBy: string
  estimatedHours: number
  billable: boolean
  invoiced: boolean
  createdAt: string
}

export interface VaultDocument {
  id: string
  name: string
  type: VaultDocType
  clientId: string
  clientName: string
  projectId: string
  notes: string
  expiryDate: string
  createdAt: string
}

export interface Subcontractor {
  id: string
  name: string
  email: string
  phone: string
  trade: string
  rate: number
  projectId: string
  projectName: string
  amountOwed: number
  amountPaid: number
  clientPaidUs: boolean
  notes: string
  createdAt: string
}

export interface EmailTemplate {
  id: string
  name: string
  type: EmailTemplateType
  subject: string
  body: string
  createdAt: string
}

export interface AvailabilityBlock {
  id: string
  date: string
  startTime: string
  endTime: string
  available: boolean
  notes: string
  createdAt: string
}

export interface Milestone {
  id: string
  projectId: string
  projectName: string
  clientId: string
  clientName: string
  title: string
  percent: number
  amount: number
  dueDate: string
  invoiced: boolean
  invoiceId: string | null
  completed: boolean
  createdAt: string
}

export interface TaxSettings {
  estimatedTaxRate: number
  selfEmploymentTaxRate: number
  quarterlyReminders: boolean
  mileageRate: number
}

export interface IntegrationSettings {
  quickbooksExport: boolean
  xeroExport: boolean
  stripeLivePayments: boolean
  wiseMultiCurrency: boolean
  googleCalendarSync: boolean
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
  projects: Project[]
  proposals: Proposal[]
  expenses: Expense[]
  recurringInvoices: RecurringInvoice[]
  scopeEntries: ScopeEntry[]
  vaultDocuments: VaultDocument[]
  subcontractors: Subcontractor[]
  emailTemplates: EmailTemplate[]
  availabilityBlocks: AvailabilityBlock[]
  milestones: Milestone[]
  taxSettings: TaxSettings
  integrations: IntegrationSettings
  activeTimer: { entryId: string; startedAt: string } | null
  syncMeta: SyncMeta
  demoSettings: DemoSettings
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
  paymentMethods: [],
  defaultPaymentInstructions: '',
}

export const DEFAULT_TAX_SETTINGS: TaxSettings = {
  estimatedTaxRate: 25,
  selfEmploymentTaxRate: 15.3,
  quarterlyReminders: true,
  mileageRate: 0.67,
}

export const DEFAULT_INTEGRATIONS: IntegrationSettings = {
  quickbooksExport: false,
  xeroExport: false,
  stripeLivePayments: false,
  wiseMultiCurrency: false,
  googleCalendarSync: false,
}

export const DEFAULT_DEMO_PROJECT_TRANSFER: DemoProjectTransfer = {
  title: '',
  description: '',
  clientNotes: '',
  appPreviewUrl: null,
  deliverables: [],
  updatedAt: null,
}

export const DEFAULT_CLIENT_ROOM_CONFIG: ClientRoomConfig = {
  versionLabel: '',
  ndaRequired: false,
  ndaText: 'The materials in this review room are confidential. Do not share, copy, or distribute without written permission from the contractor.',
  linkPassword: null,
  watermarkText: 'Confidential — Client Review',
  notifyClientEmail: null,
  checklist: [],
  guidedTourEnabled: true,
  milestones: [],
  hubWelcomeMessage: '',
  clientAssetUploadEnabled: true,
  availabilitySlots: [],
}

export const DEFAULT_CLIENT_ROOM_DATA: ClientRoomData = {
  feedback: [],
  signOff: null,
  messages: [],
  checklistProgress: [],
  auditLog: [],
  clientAssets: [],
  survey: null,
  ndaAcceptedAt: null,
  ndaAcceptedName: null,
}

export const DEFAULT_DEMO_SETTINGS: DemoSettings = {
  enabled: false,
  token: null,
  mode: 'demo',
  expiresAt: null,
  label: 'Client Preview',
  createdAt: null,
  lastAccessedAt: null,
  accessCount: 0,
  projectTransfer: { ...DEFAULT_DEMO_PROJECT_TRANSFER },
  uploadSecret: null,
  allowDownloads: false,
  clientRoom: { ...DEFAULT_CLIENT_ROOM_CONFIG },
}

export const PROJECT_STAGES: { id: ProjectStage; label: string; color: string }[] = [
  { id: 'lead', label: 'Lead', color: 'bg-surface-200 text-surface-700' },
  { id: 'proposal', label: 'Proposal', color: 'bg-violet-100 text-violet-700' },
  { id: 'active', label: 'Active', color: 'bg-blue-100 text-blue-700' },
  { id: 'delivered', label: 'Delivered', color: 'bg-amber-100 text-amber-700' },
  { id: 'invoiced', label: 'Invoiced', color: 'bg-orange-100 text-orange-700' },
  { id: 'paid', label: 'Paid', color: 'bg-emerald-100 text-emerald-700' },
]

export const EXPENSE_CATEGORIES: { id: ExpenseCategory; label: string }[] = [
  { id: 'materials', label: 'Materials' },
  { id: 'software', label: 'Software & Tools' },
  { id: 'travel', label: 'Travel' },
  { id: 'mileage', label: 'Mileage' },
  { id: 'subcontractor', label: 'Subcontractor' },
  { id: 'equipment', label: 'Equipment' },
  { id: 'office', label: 'Office & Admin' },
  { id: 'other', label: 'Other' },
]

export const DEFAULT_EMAIL_TEMPLATES: Omit<EmailTemplate, 'id' | 'createdAt'>[] = [
  {
    name: 'Invoice Sent',
    type: 'invoice_sent',
    subject: 'Invoice {{invoiceNumber}} — {{amount}}',
    body: 'Hi {{clientName}},\n\nPlease find invoice {{invoiceNumber}} for {{amount}}.\n\nDue date: {{dueDate}}\n\nThank you!',
  },
  {
    name: 'Payment Reminder (Friendly)',
    type: 'payment_reminder',
    subject: 'Friendly reminder: Invoice {{invoiceNumber}}',
    body: 'Hi {{clientName}},\n\nJust a friendly reminder that invoice {{invoiceNumber}} for {{amount}} was due on {{dueDate}}.\n\nPlease let me know if you have any questions.',
  },
  {
    name: 'Payment Overdue (Firm)',
    type: 'payment_overdue',
    subject: 'Overdue: Invoice {{invoiceNumber}} — Action Required',
    body: 'Hi {{clientName}},\n\nInvoice {{invoiceNumber}} for {{amount}} is now overdue. Please arrange payment at your earliest convenience.\n\nThank you.',
  },
  {
    name: 'Proposal Sent',
    type: 'proposal_sent',
    subject: 'Proposal: {{projectTitle}}',
    body: 'Hi {{clientName}},\n\nPlease review the attached proposal for {{projectTitle}} totaling {{amount}}.\n\nValid until {{validUntil}}.\n\nLooking forward to working together!',
  },
  {
    name: 'Project Kickoff',
    type: 'project_kickoff',
    subject: 'Project Kickoff: {{projectTitle}}',
    body: 'Hi {{clientName}},\n\nExcited to get started on {{projectTitle}}!\n\nNext steps:\n- Review timeline\n- Confirm deliverables\n- Schedule check-in\n\nBest regards,\n{{businessName}}',
  },
]

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
