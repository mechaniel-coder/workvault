import { createContext, useContext, useCallback, useEffect, useState, useMemo, type ReactNode } from 'react'
import type {
  AppState, AvailabilityBlock, BusinessProfile, Client, Contract, ContractSignature,
  EmailTemplate, Expense, HostedProject, IntegrationSettings, Invoice, License,
  Milestone, Project, Proposal, RecurringInvoice, ScopeEntry, Subcontractor,
  SyncMeta, TaxSettings, TimeEntry, VaultDocument, WorkProtection, WorkRecord,
  DemoSettings,
} from '../lib/types'
import { applySignatureToContract, createInitialState, loadState, saveState } from '../lib/utils'
import { autoSyncIfEnabled } from '../lib/sync'
import { createExtendedCrud } from '../lib/store-crud'

type StoreContextType = {
  state: AppState
  updateProfile: (profile: Partial<BusinessProfile>) => void
  addClient: (client: Omit<Client, 'id' | 'createdAt' | 'portalToken' | 'clientAppToken'>) => Client
  updateClient: (id: string, data: Partial<Client>) => void
  deleteClient: (id: string) => void
  addTimeEntry: (entry: Omit<TimeEntry, 'id' | 'createdAt'>) => TimeEntry
  updateTimeEntry: (id: string, data: Partial<TimeEntry>) => void
  deleteTimeEntry: (id: string) => void
  startTimer: (entry: Omit<TimeEntry, 'id' | 'createdAt' | 'endTime' | 'durationMinutes'>) => void
  stopTimer: () => void
  addContract: (contract: Omit<Contract, 'id' | 'createdAt' | 'updatedAt' | 'signatures' | 'signingToken' | 'clientFileAccess'> & { clientFileAccess?: Contract['clientFileAccess'] }) => Contract
  updateContract: (id: string, data: Partial<Contract>) => void
  signContract: (id: string, signature: ContractSignature) => void
  deleteContract: (id: string) => void
  addInvoice: (invoice: Omit<Invoice, 'id' | 'createdAt'>) => Invoice
  updateInvoice: (id: string, data: Partial<Invoice>) => void
  deleteInvoice: (id: string) => void
  addLicense: (license: Omit<License, 'id' | 'createdAt'>) => License
  updateLicense: (id: string, data: Partial<License>) => void
  deleteLicense: (id: string) => void
  addWorkProtection: (item: Omit<WorkProtection, 'id' | 'createdAt'>) => WorkProtection
  deleteWorkProtection: (id: string) => void
  addHostedProject: (project: Omit<HostedProject, 'id' | 'createdAt'>) => HostedProject
  updateHostedProject: (id: string, data: Partial<HostedProject>) => void
  deleteHostedProject: (id: string) => void
  addWorkRecord: (record: Omit<WorkRecord, 'id' | 'createdAt'>) => WorkRecord
  updateWorkRecord: (id: string, data: Partial<WorkRecord>) => void
  deleteWorkRecord: (id: string) => void
  importData: (state: AppState) => void
  updateSyncMeta: (meta: Partial<SyncMeta>) => void
  updateTaxSettings: (data: Partial<TaxSettings>) => void
  updateIntegrations: (data: Partial<IntegrationSettings>) => void
  resetAll: () => void
  addProject: (data: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => Project
  updateProject: (id: string, data: Partial<Project>) => void
  deleteProject: (id: string) => void
  addProposal: (data: Omit<Proposal, 'id' | 'createdAt' | 'updatedAt'>) => Proposal
  updateProposal: (id: string, data: Partial<Proposal>) => void
  deleteProposal: (id: string) => void
  addExpense: (data: Omit<Expense, 'id' | 'createdAt'>) => Expense
  updateExpense: (id: string, data: Partial<Expense>) => void
  deleteExpense: (id: string) => void
  addRecurringInvoice: (data: Omit<RecurringInvoice, 'id' | 'createdAt'>) => RecurringInvoice
  updateRecurringInvoice: (id: string, data: Partial<RecurringInvoice>) => void
  deleteRecurringInvoice: (id: string) => void
  addScopeEntry: (data: Omit<ScopeEntry, 'id' | 'createdAt'>) => ScopeEntry
  updateScopeEntry: (id: string, data: Partial<ScopeEntry>) => void
  deleteScopeEntry: (id: string) => void
  addVaultDocument: (data: Omit<VaultDocument, 'id' | 'createdAt'>) => VaultDocument
  updateVaultDocument: (id: string, data: Partial<VaultDocument>) => void
  deleteVaultDocument: (id: string) => void
  addSubcontractor: (data: Omit<Subcontractor, 'id' | 'createdAt'>) => Subcontractor
  updateSubcontractor: (id: string, data: Partial<Subcontractor>) => void
  deleteSubcontractor: (id: string) => void
  addEmailTemplate: (data: Omit<EmailTemplate, 'id' | 'createdAt'>) => EmailTemplate
  updateEmailTemplate: (id: string, data: Partial<EmailTemplate>) => void
  deleteEmailTemplate: (id: string) => void
  addAvailabilityBlock: (data: Omit<AvailabilityBlock, 'id' | 'createdAt'>) => AvailabilityBlock
  updateAvailabilityBlock: (id: string, data: Partial<AvailabilityBlock>) => void
  deleteAvailabilityBlock: (id: string) => void
  addMilestone: (data: Omit<Milestone, 'id' | 'createdAt'>) => Milestone
  updateMilestone: (id: string, data: Partial<Milestone>) => void
  deleteMilestone: (id: string) => void
  generateClientPortalToken: (clientId: string) => string
  generateClientAppToken: (clientId: string) => string
  updateDemoSettings: (data: Partial<DemoSettings>) => void
  isIsolated: boolean
  isReadOnly: boolean
}

const StoreContext = createContext<StoreContextType | null>(null)

function persist(state: AppState, isolated: boolean) {
  if (!isolated) saveState(state)
  return state
}

type StoreProviderProps = {
  children: ReactNode
  isolated?: boolean
  initialState?: AppState
  readOnly?: boolean
  onBlockedAction?: () => void
}

export function StoreProvider({
  children,
  isolated = false,
  initialState,
  readOnly = false,
  onBlockedAction,
}: StoreProviderProps) {
  const [state, setState] = useState<AppState>(() => (isolated ? (initialState ?? createInitialState()) : loadState()))

  useEffect(() => {
    if (!isolated) saveState(state)
  }, [state, isolated])

  useEffect(() => {
    if (isolated || !state.syncMeta.autoSync) return
    const timer = setTimeout(() => {
      autoSyncIfEnabled(state)
    }, 3000)
    return () => clearTimeout(timer)
  }, [state, isolated])

  const mutate = useCallback((fn: (s: AppState) => AppState) => {
    if (readOnly) {
      onBlockedAction?.()
      return
    }
    setState((prev) => persist(fn(prev), isolated))
  }, [isolated, readOnly, onBlockedAction])

  const ext = useMemo(() => createExtendedCrud(mutate), [mutate])

  const updateProfile = useCallback((profile: Partial<BusinessProfile>) => {
    mutate((s) => ({ ...s, profile: { ...s.profile, ...profile } }))
  }, [mutate])

  const addClient = useCallback((data: Omit<Client, 'id' | 'createdAt' | 'portalToken' | 'clientAppToken'>) => {
    const client: Client = { ...data, portalToken: null, clientAppToken: null, id: crypto.randomUUID(), createdAt: new Date().toISOString() }
    mutate((s) => ({ ...s, clients: [...s.clients, client] }))
    return client
  }, [mutate])

  const generateClientPortalToken = useCallback((clientId: string) => {
    const token = crypto.randomUUID()
    mutate((s) => ({
      ...s,
      clients: s.clients.map((c) => (c.id === clientId ? { ...c, portalToken: token } : c)),
    }))
    return token
  }, [mutate])

  const generateClientAppToken = useCallback((clientId: string) => {
    const token = crypto.randomUUID()
    mutate((s) => ({
      ...s,
      clients: s.clients.map((c) => (c.id === clientId ? { ...c, clientAppToken: token } : c)),
    }))
    return token
  }, [mutate])

  const updateClient = useCallback((id: string, data: Partial<Client>) => {
    mutate((s) => ({ ...s, clients: s.clients.map((c) => (c.id === id ? { ...c, ...data } : c)) }))
  }, [mutate])

  const deleteClient = useCallback((id: string) => {
    mutate((s) => ({ ...s, clients: s.clients.filter((c) => c.id !== id) }))
  }, [mutate])

  const addTimeEntry = useCallback((data: Omit<TimeEntry, 'id' | 'createdAt'>) => {
    const entry: TimeEntry = { ...data, id: crypto.randomUUID(), createdAt: new Date().toISOString() }
    mutate((s) => ({ ...s, timeEntries: [entry, ...s.timeEntries] }))
    return entry
  }, [mutate])

  const updateTimeEntry = useCallback((id: string, data: Partial<TimeEntry>) => {
    mutate((s) => ({ ...s, timeEntries: s.timeEntries.map((e) => (e.id === id ? { ...e, ...data } : e)) }))
  }, [mutate])

  const deleteTimeEntry = useCallback((id: string) => {
    mutate((s) => ({ ...s, timeEntries: s.timeEntries.filter((e) => e.id !== id) }))
  }, [mutate])

  const startTimer = useCallback((data: Omit<TimeEntry, 'id' | 'createdAt' | 'endTime' | 'durationMinutes'>) => {
    const entry: TimeEntry = {
      ...data,
      id: crypto.randomUUID(),
      endTime: null,
      durationMinutes: 0,
      createdAt: new Date().toISOString(),
    }
    mutate((s) => ({
      ...s,
      timeEntries: [entry, ...s.timeEntries],
      activeTimer: { entryId: entry.id, startedAt: new Date().toISOString() },
    }))
  }, [mutate])

  const stopTimer = useCallback(() => {
    mutate((s) => {
      if (!s.activeTimer) return s
      const end = new Date()
      const start = new Date(s.activeTimer.startedAt)
      const durationMinutes = Math.round((end.getTime() - start.getTime()) / 60000)
      return {
        ...s,
        activeTimer: null,
        timeEntries: s.timeEntries.map((e) =>
          e.id === s.activeTimer!.entryId
            ? { ...e, endTime: end.toISOString(), durationMinutes: Math.max(durationMinutes, 1) }
            : e
        ),
      }
    })
  }, [mutate])

  const addContract = useCallback((data: Omit<Contract, 'id' | 'createdAt' | 'updatedAt' | 'signatures' | 'signingToken' | 'clientFileAccess'> & { clientFileAccess?: Contract['clientFileAccess'] }) => {
    const now = new Date().toISOString()
    const contract: Contract = {
      ...data,
      clientFileAccess: data.clientFileAccess ?? 'none',
      signatures: [],
      signingToken: null,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    }
    mutate((s) => ({ ...s, contracts: [contract, ...s.contracts] }))
    return contract
  }, [mutate])

  const signContract = useCallback((id: string, signature: ContractSignature) => {
    mutate((s) => ({
      ...s,
      contracts: s.contracts.map((c) =>
        c.id === id ? applySignatureToContract(c, signature) : c
      ),
    }))
  }, [mutate])

  const updateContract = useCallback((id: string, data: Partial<Contract>) => {
    mutate((s) => ({
      ...s,
      contracts: s.contracts.map((c) =>
        c.id === id ? { ...c, ...data, updatedAt: new Date().toISOString() } : c
      ),
    }))
  }, [mutate])

  const deleteContract = useCallback((id: string) => {
    mutate((s) => ({ ...s, contracts: s.contracts.filter((c) => c.id !== id) }))
  }, [mutate])

  const addInvoice = useCallback((data: Omit<Invoice, 'id' | 'createdAt'>) => {
    const invoice: Invoice = { ...data, id: crypto.randomUUID(), createdAt: new Date().toISOString() }
    mutate((s) => ({ ...s, invoices: [invoice, ...s.invoices] }))
    return invoice
  }, [mutate])

  const updateInvoice = useCallback((id: string, data: Partial<Invoice>) => {
    mutate((s) => ({ ...s, invoices: s.invoices.map((i) => (i.id === id ? { ...i, ...data } : i)) }))
  }, [mutate])

  const deleteInvoice = useCallback((id: string) => {
    mutate((s) => ({ ...s, invoices: s.invoices.filter((i) => i.id !== id) }))
  }, [mutate])

  const addLicense = useCallback((data: Omit<License, 'id' | 'createdAt'>) => {
    const license: License = { ...data, id: crypto.randomUUID(), createdAt: new Date().toISOString() }
    mutate((s) => ({ ...s, licenses: [...s.licenses, license] }))
    return license
  }, [mutate])

  const updateLicense = useCallback((id: string, data: Partial<License>) => {
    mutate((s) => ({ ...s, licenses: s.licenses.map((l) => (l.id === id ? { ...l, ...data } : l)) }))
  }, [mutate])

  const deleteLicense = useCallback((id: string) => {
    mutate((s) => ({ ...s, licenses: s.licenses.filter((l) => l.id !== id) }))
  }, [mutate])

  const addWorkProtection = useCallback((data: Omit<WorkProtection, 'id' | 'createdAt'>) => {
    const item: WorkProtection = { ...data, id: crypto.randomUUID(), createdAt: new Date().toISOString() }
    mutate((s) => ({ ...s, workProtections: [item, ...s.workProtections] }))
    return item
  }, [mutate])

  const deleteWorkProtection = useCallback((id: string) => {
    mutate((s) => ({ ...s, workProtections: s.workProtections.filter((w) => w.id !== id) }))
  }, [mutate])

  const addHostedProject = useCallback((data: Omit<HostedProject, 'id' | 'createdAt'>) => {
    const project: HostedProject = { ...data, id: crypto.randomUUID(), createdAt: new Date().toISOString() }
    mutate((s) => ({ ...s, hostedProjects: [project, ...s.hostedProjects] }))
    return project
  }, [mutate])

  const updateHostedProject = useCallback((id: string, data: Partial<HostedProject>) => {
    mutate((s) => ({
      ...s,
      hostedProjects: s.hostedProjects.map((p) => (p.id === id ? { ...p, ...data } : p)),
    }))
  }, [mutate])

  const deleteHostedProject = useCallback((id: string) => {
    mutate((s) => ({ ...s, hostedProjects: s.hostedProjects.filter((p) => p.id !== id) }))
  }, [mutate])

  const addWorkRecord = useCallback((data: Omit<WorkRecord, 'id' | 'createdAt'>) => {
    const record: WorkRecord = { ...data, id: crypto.randomUUID(), createdAt: new Date().toISOString() }
    mutate((s) => ({ ...s, workRecords: [record, ...s.workRecords] }))
    return record
  }, [mutate])

  const updateWorkRecord = useCallback((id: string, data: Partial<WorkRecord>) => {
    mutate((s) => ({
      ...s,
      workRecords: s.workRecords.map((r) => (r.id === id ? { ...r, ...data } : r)),
    }))
  }, [mutate])

  const deleteWorkRecord = useCallback((id: string) => {
    mutate((s) => ({ ...s, workRecords: s.workRecords.filter((r) => r.id !== id) }))
  }, [mutate])

  const importData = useCallback((newState: AppState) => {
    if (isolated) {
      onBlockedAction?.()
      return
    }
    setState(persist(newState, false))
  }, [isolated, onBlockedAction])

  const updateSyncMeta = useCallback((meta: Partial<SyncMeta>) => {
    mutate((s) => ({ ...s, syncMeta: { ...s.syncMeta, ...meta } }))
  }, [mutate])

  const updateDemoSettings = useCallback((data: Partial<DemoSettings>) => {
    mutate((s) => ({ ...s, demoSettings: { ...s.demoSettings, ...data } }))
  }, [mutate])

  const resetAll = useCallback(() => {
    if (isolated) {
      onBlockedAction?.()
      return
    }
    setState(persist(createInitialState(), false))
  }, [isolated, onBlockedAction])

  return (
    <StoreContext.Provider
      value={{
        state,
        updateProfile,
        addClient,
        updateClient,
        deleteClient,
        addTimeEntry,
        updateTimeEntry,
        deleteTimeEntry,
        startTimer,
        stopTimer,
        addContract,
        updateContract,
        signContract,
        deleteContract,
        addInvoice,
        updateInvoice,
        deleteInvoice,
        addLicense,
        updateLicense,
        deleteLicense,
        addWorkProtection,
        deleteWorkProtection,
        addHostedProject,
        updateHostedProject,
        deleteHostedProject,
        addWorkRecord,
        updateWorkRecord,
        deleteWorkRecord,
        importData,
        updateSyncMeta,
        updateTaxSettings: ext.updateTaxSettings,
        updateIntegrations: ext.updateIntegrations,
        resetAll,
        addProject: ext.projects.add,
        updateProject: ext.projects.update,
        deleteProject: ext.projects.delete,
        addProposal: ext.proposals.add,
        updateProposal: ext.proposals.update,
        deleteProposal: ext.proposals.delete,
        addExpense: ext.expenses.add,
        updateExpense: ext.expenses.update,
        deleteExpense: ext.expenses.delete,
        addRecurringInvoice: ext.recurringInvoices.add,
        updateRecurringInvoice: ext.recurringInvoices.update,
        deleteRecurringInvoice: ext.recurringInvoices.delete,
        addScopeEntry: ext.scopeEntries.add,
        updateScopeEntry: ext.scopeEntries.update,
        deleteScopeEntry: ext.scopeEntries.delete,
        addVaultDocument: ext.vaultDocuments.add,
        updateVaultDocument: ext.vaultDocuments.update,
        deleteVaultDocument: ext.vaultDocuments.delete,
        addSubcontractor: ext.subcontractors.add,
        updateSubcontractor: ext.subcontractors.update,
        deleteSubcontractor: ext.subcontractors.delete,
        addEmailTemplate: ext.emailTemplates.add,
        updateEmailTemplate: ext.emailTemplates.update,
        deleteEmailTemplate: ext.emailTemplates.delete,
        addAvailabilityBlock: ext.availabilityBlocks.add,
        updateAvailabilityBlock: ext.availabilityBlocks.update,
        deleteAvailabilityBlock: ext.availabilityBlocks.delete,
        addMilestone: ext.milestones.add,
        updateMilestone: ext.milestones.update,
        deleteMilestone: ext.milestones.delete,
        generateClientPortalToken,
        generateClientAppToken,
        updateDemoSettings,
        isIsolated: isolated,
        isReadOnly: readOnly,
      }}
    >
      {children}
    </StoreContext.Provider>
  )
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used within StoreProvider')
  return ctx
}
