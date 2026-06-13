export type ContractStatus = 'draft' | 'sent' | 'awaiting_signature' | 'partially_signed' | 'signed' | 'expired' | 'cancelled'
export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
export type LicenseStatus = 'active' | 'expiring' | 'expired' | 'pending'
export type WorkRecordType = 'deliverable' | 'milestone' | 'revision' | 'meeting' | 'note'
export type ProtectionType = 'copyright' | 'watermark' | 'nda' | 'ip_claim' | 'timestamp'

/** File access granted to the client once the contract is fully signed */
export type ClientFileAccess = 'none' | 'read' | 'write'

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
  /** Tailors navigation, copy, and theme for the user's trade */
  industryId: 'general' | 'creative' | 'software' | 'construction' | 'consulting' | 'marketing' | 'legal' | 'healthcare' | 'photography' | 'writing' | 'real-estate' | 'education' | 'accounting' | 'events' | 'nonprofit' | 'fitness' | 'architecture' | 'music' | 'culinary' | 'translation' | 'research' | 'cleaning' | 'automotive' | 'pet-services' | 'insurance' | 'fashion' | 'beauty' | 'security' | 'landscaping' | 'childcare' | 'logistics' | 'solar' | 'film' | 'aviation' | 'printing' | 'property-management'
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
  /** Token for the full Client WorkVault app (`/client/:token`) */
  clientAppToken: string | null
  /** Lifecycle for the client WorkVault app (local-first; cloud is optional sync) */
  appLifecycle: ClientAppLifecycle
  createdAt: string
}

/** Contractor-side tracking for closing the client WorkVault app */
export interface ClientAppLifecycle {
  status: 'active' | 'archived'
  closedAt: string | null
  closeOutcome: 'paid_complete' | 'unpaid' | null
  /** Contractor confirms tax docs were exported/saved locally before archival */
  taxDocsSavedLocallyAt: string | null
  handoffCompletedAt: string | null
}

export type ClientAppCloseOutcome = 'paid_complete' | 'unpaid'

/** Tombstone shown to clients after the WorkVault app is removed */
export interface ClientAppClosureRecord {
  outcome: ClientAppCloseOutcome
  closedAt: string
  clientName: string
  contractorName: string
  message: string
  deliverables: ClientHubDeliverableFile[]
  folderUrls: string[]
}

export const DEFAULT_CLIENT_APP_LIFECYCLE: ClientAppLifecycle = {
  status: 'active',
  closedAt: null,
  closeOutcome: null,
  taxDocsSavedLocallyAt: null,
  handoffCompletedAt: null,
}

export type TeamMemberRole = 'owner' | 'admin' | 'member' | 'viewer'
export type TeamMemberStatus = 'active' | 'invited'

export interface TeamMember {
  id: string
  name: string
  email: string
  role: TeamMemberRole
  title: string
  inviteToken: string | null
  status: TeamMemberStatus
  notes: string
  /** Can use shared Cursor CLI workflows from WorkVault (contractor + team only) */
  cursorCliAccess: boolean
  createdAt: string
}

export type CursorCliMode = 'agent' | 'plan' | 'ask'

export type CursorCliWorkflowCategory = 'contracts' | 'invoices' | 'projects' | 'general'

export interface CursorCliSettings {
  enabled: boolean
  apiKey: string
  defaultModel: string
  defaultMode: CursorCliMode
  shareWorkflowsWithTeam: boolean
}

export interface CursorCliWorkflow {
  id: string
  name: string
  description: string
  prompt: string
  mode: CursorCliMode
  model: string | null
  teamVisible: boolean
  category: CursorCliWorkflowCategory
  createdAt: string
}

export interface CursorCliConfig {
  settings: CursorCliSettings
  workflows: CursorCliWorkflow[]
}

/** Third-party guest invited into a client's WorkVault workspace */
export type ClientGuestRole = 'viewer' | 'reviewer' | 'stakeholder'

export interface ClientGuestInvite {
  id: string
  clientId: string
  clientAppToken: string
  token: string
  name: string
  email: string
  role: ClientGuestRole
  label: string
  enabled: boolean
  expiresAt: string | null
  accessCount: number
  lastAccessedAt: string | null
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
  source: 'manual' | 'timer' | 'toggl' | 'harvest'
  externalId: string | null
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
  docusignEnvelopeId: string | null
  docusignSigningUrl: string | null
  /** Granted in client WorkVault after both parties sign */
  clientFileAccess: ClientFileAccess
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
  stripeCheckoutUrl: string | null
  stripeSessionId: string | null
  /** Live checkout links from enabled payment processors */
  paymentLinks: InvoicePaymentLink[]
  createdAt: string
}

export type PaymentProcessorId = 'stripe' | 'paypal' | 'square' | 'wise' | 'lemon_squeezy' | 'paddle'

export interface InvoicePaymentLink {
  processor: PaymentProcessorId
  url: string
  externalId: string | null
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
  /** User finished first-run setup — persisted with app data */
  setupComplete: boolean
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

export interface ClientHubDeliverableFile {
  name: string
  url: string
  mimeType: string
  modifiedAt: string
}

export interface ClientHubDeliverableGroup {
  projectTitle: string
  provider: 'google_drive' | 'dropbox'
  files: ClientHubDeliverableFile[]
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
  deliverables: ClientHubDeliverableGroup[]
  demoUrl: string | null
  clientFileAccess: ClientFileAccess
}

/** Published session for the client-facing WorkVault app */
export interface ClientAppSessionPublic {
  enabled: boolean
  token: string
  clientId: string
  clientName: string
  clientEmail: string
  clientCompany: string
  contractorName: string
  contractorEmail: string
  contractorLogo: string
  label: string
  allowDownloads: boolean
  projectTransfer: DemoProjectTransfer
  clientRoom: ClientRoomConfig
  publishedAt: string
  /** Effective file access from signed contracts */
  clientFileAccess: ClientFileAccess
  guestInvites: ClientGuestInvite[]
  /** Filtered app state scoped to this client */
  appState: AppState
  /** Set when the client app is archived — client sees farewell instead of workspace */
  closure?: ClientAppClosureRecord | null
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
  /** Legal/business name for 1099 if different from name */
  businessName: string
  tin: string
  address: string
  city: string
  state: string
  zip: string
  entityType: Tax1099EntityType
  w9OnFile: boolean
  w9ReceivedAt: string | null
  requires1099: boolean
  createdAt: string
}

export type Tax1099EntityType = 'individual' | 'llc' | 'corp' | 'partnership' | 'other'

export type Form1099FilingStatus = 'draft' | 'ready' | 'filed' | 'accepted' | 'corrected'

export type Form1099Provider = 'track1099' | 'tax1099' | 'quickbooks' | 'irs_fire' | 'manual'

export interface SubcontractorPayment {
  id: string
  subcontractorId: string
  subcontractorName: string
  amount: number
  date: string
  method: string
  notes: string
  createdAt: string
}

export interface Form1099NECRecord {
  id: string
  taxYear: number
  payeeId: string
  payeeName: string
  payeeTin: string
  totalPaid: number
  box1NonemployeeCompensation: number
  w9OnFile: boolean
  status: Form1099FilingStatus
  filedAt: string | null
  provider: Form1099Provider | null
  notes: string
  createdAt: string
  updatedAt: string
}

export interface Tax1099Settings {
  enabled: boolean
  filingYear: number
  thresholdAmount: number
  autoFlagPayees: boolean
  reminderFileBy: string
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

export interface CalendarSyncMeta {
  lastSyncedAt: string | null
  eventMap: Record<string, string>
}

export interface BookkeepingSyncMeta {
  quickbooksLastSyncedAt: string | null
  xeroLastSyncedAt: string | null
  quickbooksCustomerMap: Record<string, string>
  quickbooksInvoiceMap: Record<string, string>
  quickbooksExpenseMap: Record<string, string>
  xeroContactMap: Record<string, string>
  xeroInvoiceMap: Record<string, string>
  xeroExpenseMap: Record<string, string>
}

export interface SchedulingMeta {
  provider: 'calcom' | 'calendly' | null
  bookingUrl: string
  eventTypeName: string
  lastFetchedAt: string | null
}

export interface PlaidSyncMeta {
  connected: boolean
  itemId: string
  accountId: string
  accountName: string
  institutionName: string
  lastFetchedAt: string | null
  cursor: string | null
}

export interface BankTransaction {
  id: string
  plaidTransactionId: string
  date: string
  name: string
  amount: number
  currency: string
  matchedInvoiceId: string | null
  matchConfidence: 'high' | 'medium' | 'low' | null
  ignored: boolean
  createdAt: string
}

export interface GmailThreadSummary {
  id: string
  threadId: string
  from: string
  to: string
  subject: string
  snippet: string
  date: string
  clientId: string | null
  clientName: string | null
  unread: boolean
}

export type CloudStorageProvider = 'google_drive' | 'dropbox'

export interface ProjectDeliverableLink {
  projectId: string
  provider: CloudStorageProvider
  folderId: string
  folderName: string
  folderUrl: string
}

export interface CloudFile {
  id: string
  name: string
  mimeType: string
  url: string
  size?: number
  modifiedAt: string
}

export interface CloudStorageMeta {
  lastSyncedAt: string | null
  projectFolders: ProjectDeliverableLink[]
  fileCache: Record<string, CloudFile[]>
}

export type SlackEventType = 'invoice_paid' | 'contract_signed' | 'scope_change'

export interface IntegrationSettings {
  quickbooksExport: boolean
  xeroExport: boolean
  quickbooksLiveSync: boolean
  xeroLiveSync: boolean
  calcomScheduling: boolean
  calendlyScheduling: boolean
  gmailSendEnabled: boolean
  gmailInboxEnabled: boolean
  plaidBankMatch: boolean
  plaidAutoMatch: boolean
  stripeLivePayments: boolean
  paypalPayments: boolean
  squarePayments: boolean
  wisePayments: boolean
  lemonSqueezyPayments: boolean
  paddlePayments: boolean
  wiseMultiCurrency: boolean
  googleCalendarSync: boolean
  emailSendEnabled: boolean
  track1099Export: boolean
  tax1099ComExport: boolean
  quickBooks1099Export: boolean
  irsFire1099Export: boolean
  googleDriveDeliverables: boolean
  dropboxDeliverables: boolean
  slackNotifications: boolean
  slackNotifyInvoicePaid: boolean
  slackNotifyContractSigned: boolean
  slackNotifyScopeChange: boolean
  togglImport: boolean
  harvestImport: boolean
  docusignEnabled: boolean
}

export interface IntegrationCredentials {
  stripeSecretKey: string
  paypalClientId: string
  paypalClientSecret: string
  paypalMode: 'sandbox' | 'live'
  squareAccessToken: string
  squareLocationId: string
  wiseApiToken: string
  wiseProfileId: string
  lemonSqueezyApiKey: string
  lemonSqueezyStoreId: string
  lemonSqueezyVariantId: string
  paddleApiKey: string
  paddleVendorId: string
  resendApiKey: string
  emailFrom: string
  emailFromName: string
  googleRefreshToken: string
  googleCalendarId: string
  googleAccountEmail: string
  track1099ApiKey: string
  tax1099ComApiKey: string
  quickbooksRefreshToken: string
  quickbooksRealmId: string
  quickbooksCompanyName: string
  xeroRefreshToken: string
  xeroTenantId: string
  xeroTenantName: string
  calcomApiKey: string
  calcomUsername: string
  calcomEventSlug: string
  calendlyApiKey: string
  calendlyEventUri: string
  gmailRefreshToken: string
  gmailAccountEmail: string
  plaidAccessToken: string
  googleDriveRefreshToken: string
  googleDriveEmail: string
  dropboxRefreshToken: string
  dropboxAccountEmail: string
  slackWebhookUrl: string
  slackBotToken: string
  slackChannel: string
  togglApiToken: string
  togglWorkspaceId: string
  harvestAccountId: string
  harvestAccessToken: string
  docusignIntegrationKey: string
  docusignAccountId: string
  docusignUserId: string
  docusignAccessToken: string
  docusignBaseUrl: string
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
  subcontractorPayments: SubcontractorPayment[]
  form1099Records: Form1099NECRecord[]
  tax1099Settings: Tax1099Settings
  emailTemplates: EmailTemplate[]
  availabilityBlocks: AvailabilityBlock[]
  milestones: Milestone[]
  taxSettings: TaxSettings
  integrations: IntegrationSettings
  integrationCredentials: IntegrationCredentials
  calendarSyncMeta: CalendarSyncMeta
  bookkeepingSyncMeta: BookkeepingSyncMeta
  schedulingMeta: SchedulingMeta
  plaidSyncMeta: PlaidSyncMeta
  bankTransactions: BankTransaction[]
  gmailInboxCache: GmailThreadSummary[]
  cloudStorageMeta: CloudStorageMeta
  activeTimer: { entryId: string; startedAt: string } | null
  syncMeta: SyncMeta
  demoSettings: DemoSettings
  teamMembers: TeamMember[]
  clientGuestInvites: ClientGuestInvite[]
  cursorCli: CursorCliConfig
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
  industryId: 'general',
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
  quickbooksLiveSync: false,
  xeroLiveSync: false,
  calcomScheduling: false,
  calendlyScheduling: false,
  gmailSendEnabled: false,
  gmailInboxEnabled: false,
  plaidBankMatch: false,
  plaidAutoMatch: false,
  stripeLivePayments: false,
  paypalPayments: false,
  squarePayments: false,
  wisePayments: false,
  lemonSqueezyPayments: false,
  paddlePayments: false,
  wiseMultiCurrency: false,
  googleCalendarSync: false,
  emailSendEnabled: false,
  track1099Export: false,
  tax1099ComExport: false,
  quickBooks1099Export: false,
  irsFire1099Export: false,
  googleDriveDeliverables: false,
  dropboxDeliverables: false,
  slackNotifications: false,
  slackNotifyInvoicePaid: true,
  slackNotifyContractSigned: true,
  slackNotifyScopeChange: true,
  togglImport: false,
  harvestImport: false,
  docusignEnabled: false,
}

export const DEFAULT_INTEGRATION_CREDENTIALS: IntegrationCredentials = {
  stripeSecretKey: '',
  paypalClientId: '',
  paypalClientSecret: '',
  paypalMode: 'sandbox',
  squareAccessToken: '',
  squareLocationId: '',
  wiseApiToken: '',
  wiseProfileId: '',
  lemonSqueezyApiKey: '',
  lemonSqueezyStoreId: '',
  lemonSqueezyVariantId: '',
  paddleApiKey: '',
  paddleVendorId: '',
  resendApiKey: '',
  emailFrom: '',
  emailFromName: '',
  googleRefreshToken: '',
  googleCalendarId: 'primary',
  googleAccountEmail: '',
  track1099ApiKey: '',
  tax1099ComApiKey: '',
  quickbooksRefreshToken: '',
  quickbooksRealmId: '',
  quickbooksCompanyName: '',
  xeroRefreshToken: '',
  xeroTenantId: '',
  xeroTenantName: '',
  calcomApiKey: '',
  calcomUsername: '',
  calcomEventSlug: '',
  calendlyApiKey: '',
  calendlyEventUri: '',
  gmailRefreshToken: '',
  gmailAccountEmail: '',
  plaidAccessToken: '',
  googleDriveRefreshToken: '',
  googleDriveEmail: '',
  dropboxRefreshToken: '',
  dropboxAccountEmail: '',
  slackWebhookUrl: '',
  slackBotToken: '',
  slackChannel: '',
  togglApiToken: '',
  togglWorkspaceId: '',
  harvestAccountId: '',
  harvestAccessToken: '',
  docusignIntegrationKey: '',
  docusignAccountId: '',
  docusignUserId: '',
  docusignAccessToken: '',
  docusignBaseUrl: 'https://demo.docusign.net/restapi',
}

export const DEFAULT_CLOUD_STORAGE_META: CloudStorageMeta = {
  lastSyncedAt: null,
  projectFolders: [],
  fileCache: {},
}

export const DEFAULT_BOOKKEEPING_SYNC_META: BookkeepingSyncMeta = {
  quickbooksLastSyncedAt: null,
  xeroLastSyncedAt: null,
  quickbooksCustomerMap: {},
  quickbooksInvoiceMap: {},
  quickbooksExpenseMap: {},
  xeroContactMap: {},
  xeroInvoiceMap: {},
  xeroExpenseMap: {},
}

export const DEFAULT_SCHEDULING_META: SchedulingMeta = {
  provider: null,
  bookingUrl: '',
  eventTypeName: '',
  lastFetchedAt: null,
}

export const DEFAULT_PLAID_SYNC_META: PlaidSyncMeta = {
  connected: false,
  itemId: '',
  accountId: '',
  accountName: '',
  institutionName: '',
  lastFetchedAt: null,
  cursor: null,
}

export const DEFAULT_TAX1099_SETTINGS: Tax1099Settings = {
  enabled: false,
  filingYear: new Date().getFullYear(),
  thresholdAmount: 600,
  autoFlagPayees: true,
  reminderFileBy: `${new Date().getFullYear() + 1}-01-31`,
}

export const DEFAULT_CALENDAR_SYNC_META: CalendarSyncMeta = {
  lastSyncedAt: null,
  eventMap: {},
}

export const DEFAULT_CURSOR_CLI_SETTINGS: CursorCliSettings = {
  enabled: false,
  apiKey: '',
  defaultModel: 'composer-2.5',
  defaultMode: 'agent',
  shareWorkflowsWithTeam: true,
}

export function createDefaultCursorCliWorkflows(): CursorCliWorkflow[] {
  const now = new Date().toISOString()
  const seed = (name: string, description: string, prompt: string, category: CursorCliWorkflowCategory): CursorCliWorkflow => ({
    id: crypto.randomUUID(),
    name,
    description,
    prompt,
    mode: 'agent',
    model: null,
    teamVisible: true,
    category,
    createdAt: now,
  })
  return [
    seed(
      'Draft contract from scope',
      'Generate a contract draft from project scope notes',
      'Review the project scope and draft a freelance contract with payment milestones, IP assignment, and revision limits. Use plain language suitable for a small business client.',
      'contracts',
    ),
    seed(
      'Invoice follow-up email',
      'Write a polite payment reminder for an overdue invoice',
      'Write a professional but friendly invoice follow-up email. Include the invoice number, amount due, due date, and a clear call to action. Keep it under 150 words.',
      'invoices',
    ),
    seed(
      'Scope creep analysis',
      'Flag out-of-scope requests from client messages',
      'Analyze recent client feedback and messages. List any requests that appear outside the original scope, estimate effort, and suggest how to document them as change orders.',
      'projects',
    ),
    seed(
      'Weekly status summary',
      'Summarize project progress for a client update',
      'Summarize this week\'s project progress: completed tasks, blockers, next steps, and anything the client needs to decide. Format as a brief email update.',
      'general',
    ),
  ]
}

export const DEFAULT_CURSOR_CLI: CursorCliConfig = {
  settings: { ...DEFAULT_CURSOR_CLI_SETTINGS },
  workflows: createDefaultCursorCliWorkflows(),
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
