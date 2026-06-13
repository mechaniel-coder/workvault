import type { NavigateFunction } from 'react-router-dom'
import type {
  AppState, Client, Contract, Expense, ExpenseCategory, Invoice, Project, ProjectStage,
  Proposal, ScopeEntry, TimeEntry,
} from '../types'
import { CONTRACT_TEMPLATES } from '../types'
import { fillContractTemplate, formatCurrency, formatDate, getNextNumber } from '../utils'
import { getEnabledPaymentMethods } from '../payments'
import { notifySlackEvent } from '../slack-notify'

export type AssistantStore = {
  addClient: (data: Omit<Client, 'id' | 'createdAt' | 'portalToken' | 'clientAppToken' | 'appLifecycle'>) => Client
  updateClient: (id: string, data: Partial<Client>) => void
  addProject: (data: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => Project
  updateProject: (id: string, data: Partial<Project>) => void
  addTimeEntry: (data: Omit<TimeEntry, 'id' | 'createdAt' | 'source' | 'externalId'> & Partial<Pick<TimeEntry, 'source' | 'externalId'>>) => TimeEntry
  startTimer: (data: Omit<TimeEntry, 'id' | 'createdAt' | 'endTime' | 'durationMinutes' | 'source' | 'externalId'> & Partial<Pick<TimeEntry, 'source' | 'externalId'>>) => void
  stopTimer: () => void
  addInvoice: (data: Omit<Invoice, 'id' | 'createdAt'>) => Invoice
  updateInvoice: (id: string, data: Partial<Invoice>) => void
  addScopeEntry: (data: Omit<ScopeEntry, 'id' | 'createdAt'>) => ScopeEntry
  addProposal: (data: Omit<Proposal, 'id' | 'createdAt' | 'updatedAt'>) => Proposal
  addExpense: (data: Omit<Expense, 'id' | 'createdAt'>) => Expense
  addContract: (data: Omit<Contract, 'id' | 'createdAt' | 'updatedAt' | 'signatures' | 'signingToken' | 'clientFileAccess' | 'docusignEnvelopeId' | 'docusignSigningUrl'> & { clientFileAccess?: Contract['clientFileAccess'] }) => Contract
}

type Deps = {
  state: AppState
  store: AssistantStore
  navigate: NavigateFunction
  readOnly: boolean
}

function ok(data: unknown) {
  return { ok: true as const, data }
}

function err(message: string) {
  return { ok: false as const, error: message }
}

function norm(s: string) {
  return s.trim().toLowerCase()
}

function findClient(state: AppState, ref: string): Client | undefined {
  const q = norm(ref)
  return state.clients.find((c) => c.id === ref || norm(c.name) === q || norm(c.name).includes(q))
}

function findProject(state: AppState, ref: string) {
  const q = norm(ref)
  return state.projects.find((p) => p.id === ref || norm(p.title) === q || norm(p.title).includes(q))
}

function findInvoice(state: AppState, ref: string) {
  const q = norm(ref)
  return state.invoices.find((i) => i.id === ref || norm(i.number) === q || norm(i.number).includes(q))
}

function guardWrite(readOnly: boolean) {
  if (readOnly) return err('This session is read-only. Switch to the contractor app to make changes.')
  return null
}

export function executeAssistantTool(
  name: string,
  args: Record<string, unknown>,
  deps: Deps,
): { ok: boolean; data?: unknown; error?: string } {
  const { state, store, navigate, readOnly } = deps

  try {
    switch (name) {
      case 'get_app_summary': {
        const overdue = state.invoices.filter((i) => i.status === 'overdue')
        const timer = state.activeTimer
          ? state.timeEntries.find((e) => e.id === state.activeTimer!.entryId)
          : null
        return ok({
          clients: state.clients.length,
          projects: state.projects.length,
          invoices: {
            total: state.invoices.length,
            draft: state.invoices.filter((i) => i.status === 'draft').length,
            sent: state.invoices.filter((i) => i.status === 'sent').length,
            paid: state.invoices.filter((i) => i.status === 'paid').length,
            overdue: overdue.length,
          },
          contracts: state.contracts.length,
          timeEntries: state.timeEntries.length,
          scopeEntries: state.scopeEntries.length,
          activeTimer: timer ? { project: timer.projectName, client: timer.clientName } : null,
          unbilledTimeValue: state.timeEntries
            .filter((e) => e.billable && !e.invoiced)
            .reduce((s, e) => s + (e.durationMinutes / 60) * e.hourlyRate, 0),
        })
      }

      case 'list_clients': {
        const query = typeof args.query === 'string' ? norm(args.query) : ''
        const items = state.clients
          .filter((c) => !query || norm(c.name).includes(query) || norm(c.email).includes(query))
          .map((c) => ({ id: c.id, name: c.name, email: c.email, company: c.company }))
        return ok({ clients: items })
      }

      case 'list_projects': {
        const clientName = typeof args.clientName === 'string' ? args.clientName : ''
        const stage = typeof args.stage === 'string' ? args.stage : ''
        const items = state.projects
          .filter((p) => (!clientName || norm(p.clientName).includes(norm(clientName)))
            && (!stage || p.stage === stage))
          .map((p) => ({
            id: p.id, title: p.title, clientName: p.clientName, stage: p.stage,
            value: p.value, dueDate: p.dueDate,
          }))
        return ok({ projects: items })
      }

      case 'list_invoices': {
        const status = typeof args.status === 'string' ? args.status : ''
        const clientName = typeof args.clientName === 'string' ? args.clientName : ''
        const items = state.invoices
          .filter((i) => (!status || i.status === status)
            && (!clientName || norm(i.clientName).includes(norm(clientName))))
          .slice(0, 30)
          .map((i) => ({
            id: i.id, number: i.number, clientName: i.clientName, status: i.status,
            total: i.total, dueDate: i.dueDate,
          }))
        return ok({ invoices: items })
      }

      case 'list_contracts': {
        const clientName = typeof args.clientName === 'string' ? args.clientName : ''
        const status = typeof args.status === 'string' ? args.status : ''
        const items = state.contracts
          .filter((c) => (!clientName || norm(c.clientName).includes(norm(clientName)))
            && (!status || c.status === status))
          .slice(0, 30)
          .map((c) => ({
            id: c.id, number: c.number, title: c.title, clientName: c.clientName,
            status: c.status, value: c.value,
          }))
        return ok({ contracts: items })
      }

      case 'list_time_entries': {
        const clientName = typeof args.clientName === 'string' ? args.clientName : ''
        const limit = typeof args.limit === 'number' ? args.limit : 20
        const items = state.timeEntries
          .filter((e) => !clientName || norm(e.clientName).includes(norm(clientName)))
          .slice(0, limit)
          .map((e) => ({
            id: e.id, projectName: e.projectName, clientName: e.clientName,
            durationMinutes: e.durationMinutes, billable: e.billable, invoiced: e.invoiced,
            description: e.description,
          }))
        return ok({ timeEntries: items })
      }

      case 'list_scope_entries': {
        const clientName = typeof args.clientName === 'string' ? args.clientName : ''
        const billableOnly = args.billableOnly === true
        const items = state.scopeEntries
          .filter((e) => (!clientName || norm(e.clientName).includes(norm(clientName)))
            && (!billableOnly || e.billable))
          .map((e) => ({
            id: e.id, title: e.title, clientName: e.clientName, projectName: e.projectName,
            estimatedHours: e.estimatedHours, billable: e.billable, invoiced: e.invoiced,
          }))
        return ok({ scopeEntries: items })
      }

      case 'navigate_to': {
        const path = typeof args.path === 'string' ? args.path : '/'
        const safe = path.startsWith('/') ? path : `/${path}`
        navigate(safe)
        return ok({ navigatedTo: safe })
      }

      case 'add_client': {
        const blocked = guardWrite(readOnly)
        if (blocked) return blocked
        const name = String(args.name || '').trim()
        if (!name) return err('name is required')
        const client = store.addClient({
          name,
          email: String(args.email || ''),
          phone: String(args.phone || ''),
          company: String(args.company || ''),
          address: '',
          notes: String(args.notes || ''),
        })
        return ok({ client: { id: client.id, name: client.name } })
      }

      case 'update_client': {
        const blocked = guardWrite(readOnly)
        if (blocked) return blocked
        const client = findClient(state, String(args.clientRef || ''))
        if (!client) return err('Client not found')
        const patch: Partial<Client> = {}
        if (args.name) patch.name = String(args.name)
        if (args.email !== undefined) patch.email = String(args.email)
        if (args.phone !== undefined) patch.phone = String(args.phone)
        if (args.company !== undefined) patch.company = String(args.company)
        if (args.notes !== undefined) patch.notes = String(args.notes)
        store.updateClient(client.id, patch)
        return ok({ updated: client.id, ...patch })
      }

      case 'add_project': {
        const blocked = guardWrite(readOnly)
        if (blocked) return blocked
        const title = String(args.title || '').trim()
        const client = findClient(state, String(args.clientRef || ''))
        if (!title) return err('title is required')
        if (!client) return err('Client not found')
        const today = new Date().toISOString().split('T')[0]
        const project = store.addProject({
          title,
          clientId: client.id,
          clientName: client.name,
          stage: (args.stage as ProjectStage) || 'lead',
          value: typeof args.value === 'number' ? args.value : 0,
          description: String(args.description || ''),
          startDate: today,
          dueDate: String(args.dueDate || today),
        })
        return ok({ project: { id: project.id, title: project.title, stage: project.stage } })
      }

      case 'update_project_stage': {
        const blocked = guardWrite(readOnly)
        if (blocked) return blocked
        const project = findProject(state, String(args.projectRef || ''))
        if (!project) return err('Project not found')
        const stage = args.stage as ProjectStage
        store.updateProject(project.id, { stage })
        return ok({ id: project.id, title: project.title, stage })
      }

      case 'add_time_entry': {
        const blocked = guardWrite(readOnly)
        if (blocked) return blocked
        const client = findClient(state, String(args.clientRef || ''))
        if (!client) return err('Client not found')
        const mins = typeof args.durationMinutes === 'number' ? args.durationMinutes : 60
        const now = new Date().toISOString()
        const entry = store.addTimeEntry({
          projectId: '',
          projectName: String(args.projectName || 'Untitled'),
          clientId: client.id,
          clientName: client.name,
          description: String(args.description || ''),
          startTime: now,
          endTime: now,
          durationMinutes: mins,
          hourlyRate: state.profile.defaultHourlyRate,
          billable: args.billable !== false,
          invoiced: false,
        })
        return ok({ id: entry.id, durationMinutes: mins, projectName: entry.projectName })
      }

      case 'start_timer': {
        const blocked = guardWrite(readOnly)
        if (blocked) return blocked
        if (state.activeTimer) return err('A timer is already running. Stop it first.')
        const client = findClient(state, String(args.clientRef || ''))
        if (!client) return err('Client not found')
        store.startTimer({
          projectId: '',
          projectName: String(args.projectName || 'Untitled'),
          clientId: client.id,
          clientName: client.name,
          description: String(args.description || ''),
          startTime: new Date().toISOString(),
          hourlyRate: state.profile.defaultHourlyRate,
          billable: args.billable !== false,
          invoiced: false,
        })
        return ok({ started: true, projectName: args.projectName, clientName: client.name })
      }

      case 'stop_timer': {
        const blocked = guardWrite(readOnly)
        if (blocked) return blocked
        if (!state.activeTimer) return err('No timer is running')
        store.stopTimer()
        return ok({ stopped: true })
      }

      case 'add_invoice': {
        const blocked = guardWrite(readOnly)
        if (blocked) return blocked
        const client = findClient(state, String(args.clientRef || ''))
        if (!client) return err('Client not found')
        const rawItems = Array.isArray(args.lineItems) ? args.lineItems : []
        if (rawItems.length === 0) return err('At least one line item is required')
        const lineItems = rawItems.map((item) => {
          const row = item as { description?: string; quantity?: number; rate?: number }
          const qty = typeof row.quantity === 'number' ? row.quantity : 1
          const rate = typeof row.rate === 'number' ? row.rate : 0
          return {
            id: crypto.randomUUID(),
            description: String(row.description || 'Service'),
            quantity: qty,
            rate,
            amount: qty * rate,
          }
        })
        const subtotal = lineItems.reduce((s, li) => s + li.amount, 0)
        const taxRate = typeof args.taxRate === 'number' ? args.taxRate : 0
        const taxAmount = subtotal * (taxRate / 100)
        const total = subtotal + taxAmount
        const enabledMethods = getEnabledPaymentMethods(state.profile)
        const invoice = store.addInvoice({
          number: getNextNumber(state.profile.invoicePrefix, state.invoices.map((i) => i.number)),
          clientId: client.id,
          clientName: client.name,
          status: 'draft',
          issueDate: new Date().toISOString().split('T')[0],
          dueDate: String(args.dueDate || new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0]),
          lineItems,
          subtotal,
          taxRate,
          taxAmount,
          total,
          notes: String(args.notes || ''),
          paymentMethodIds: enabledMethods.map((m) => m.id),
          paymentInstructions: state.profile.defaultPaymentInstructions,
          sentAt: null,
          paidAt: null,
          stripeCheckoutUrl: null,
          stripeSessionId: null,
          paymentLinks: [],
        })
        return ok({ invoice: { id: invoice.id, number: invoice.number, total: invoice.total } })
      }

      case 'update_invoice_status': {
        const blocked = guardWrite(readOnly)
        if (blocked) return blocked
        const invoice = findInvoice(state, String(args.invoiceRef || ''))
        if (!invoice) return err('Invoice not found')
        const status = String(args.status || '')
        const patch: Partial<Invoice> = { status: status as Invoice['status'] }
        if (status === 'paid') patch.paidAt = new Date().toISOString()
        if (status === 'sent') patch.sentAt = new Date().toISOString()
        store.updateInvoice(invoice.id, patch)
        if (status === 'paid') {
          void notifySlackEvent(state, 'invoice_paid', {
            number: invoice.number,
            clientName: invoice.clientName,
            amount: formatCurrency(invoice.total, state.profile.defaultCurrency),
          })
        }
        return ok({ id: invoice.id, number: invoice.number, status })
      }

      case 'add_scope_entry': {
        const blocked = guardWrite(readOnly)
        if (blocked) return blocked
        const client = findClient(state, String(args.clientRef || ''))
        if (!client) return err('Client not found')
        const project = args.projectRef ? findProject(state, String(args.projectRef)) : undefined
        const title = String(args.title || '').trim()
        if (!title) return err('title is required')
        const entry = store.addScopeEntry({
          title,
          description: String(args.description || ''),
          clientId: client.id,
          clientName: client.name,
          projectId: project?.id || '',
          projectName: project?.title || 'Unassigned',
          requestedBy: String(args.requestedBy || 'Client'),
          estimatedHours: typeof args.estimatedHours === 'number' ? args.estimatedHours : 0,
          billable: args.billable !== false,
          invoiced: false,
        })
        void notifySlackEvent(state, 'scope_change', {
          title: entry.title,
          clientName: entry.clientName,
          estimatedHours: entry.estimatedHours,
          billable: entry.billable,
        })
        return ok({ id: entry.id, title: entry.title })
      }

      case 'add_proposal': {
        const blocked = guardWrite(readOnly)
        if (blocked) return blocked
        const client = findClient(state, String(args.clientRef || ''))
        if (!client) return err('Client not found')
        const title = String(args.title || '').trim()
        const rawItems = Array.isArray(args.lineItems) ? args.lineItems : []
        if (!title || rawItems.length === 0) return err('title and lineItems required')
        const lineItems = rawItems.map((item) => {
          const row = item as { description?: string; quantity?: number; rate?: number }
          const qty = typeof row.quantity === 'number' ? row.quantity : 1
          const rate = typeof row.rate === 'number' ? row.rate : 0
          return {
            id: crypto.randomUUID(),
            description: String(row.description || 'Service'),
            quantity: qty,
            rate,
            amount: qty * rate,
          }
        })
        const subtotal = lineItems.reduce((s, li) => s + li.amount, 0)
        const proposal = store.addProposal({
          number: getNextNumber('PROP-', state.proposals.map((p) => p.number)),
          title,
          clientId: client.id,
          clientName: client.name,
          status: 'draft',
          lineItems,
          subtotal,
          total: subtotal,
          validUntil: String(args.validUntil || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]),
          notes: String(args.notes || ''),
        })
        return ok({ proposal: { id: proposal.id, number: proposal.number, total: proposal.total } })
      }

      case 'add_expense': {
        const blocked = guardWrite(readOnly)
        if (blocked) return blocked
        const description = String(args.description || '').trim()
        const amount = typeof args.amount === 'number' ? args.amount : 0
        if (!description || amount <= 0) return err('description and positive amount required')
        const client = args.clientRef ? findClient(state, String(args.clientRef)) : undefined
        const expense = store.addExpense({
          description,
          amount,
          category: (args.category as ExpenseCategory) || 'other',
          date: String(args.date || new Date().toISOString().split('T')[0]),
          clientId: client?.id || '',
          clientName: client?.name || '',
          projectId: '',
          projectName: '',
          billable: args.billable === true,
          invoiced: false,
          mileage: 0,
          notes: '',
        })
        return ok({ expense: { id: expense.id, description, amount: expense.amount } })
      }

      case 'create_contract_draft': {
        const blocked = guardWrite(readOnly)
        if (blocked) return blocked
        const client = findClient(state, String(args.clientRef || ''))
        if (!client) return err('Client not found')
        const title = String(args.title || '').trim()
        const value = typeof args.value === 'number' ? args.value : 0
        const templateKey = (String(args.template || 'freelance') as keyof typeof CONTRACT_TEMPLATES)
        const template = CONTRACT_TEMPLATES[templateKey] || CONTRACT_TEMPLATES.freelance
        const startDate = String(args.startDate || new Date().toISOString().split('T')[0])
        const endDate = String(args.endDate || new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0])
        const content = fillContractTemplate(template.content, {
          startDate: formatDate(startDate),
          endDate: formatDate(endDate),
          businessName: state.profile.name || 'Contractor',
          businessEmail: state.profile.email,
          businessAddress: `${state.profile.address}, ${state.profile.city} ${state.profile.state}`,
          clientName: client.name,
          clientEmail: client.email,
          clientCompany: client.company,
          title,
          value: String(value),
          currency: state.profile.defaultCurrency,
          hourlyRate: state.profile.defaultHourlyRate,
        })
        const contract = store.addContract({
          number: getNextNumber(state.profile.contractPrefix, state.contracts.map((c) => c.number)),
          title,
          clientId: client.id,
          clientName: client.name,
          status: 'draft',
          template: templateKey in CONTRACT_TEMPLATES ? templateKey : 'freelance',
          content,
          startDate,
          endDate,
          value,
          terms: '',
          sentAt: null,
          signedAt: null,
        })
        return ok({ contract: { id: contract.id, number: contract.number, title: contract.title } })
      }

      default:
        return err(`Unknown tool: ${name}`)
    }
  } catch (e) {
    return err(e instanceof Error ? e.message : 'Tool execution failed')
  }
}
