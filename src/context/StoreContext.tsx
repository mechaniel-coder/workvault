import { createContext, useContext, useCallback, useEffect, useState, type ReactNode } from 'react'
import type { AppState, BusinessProfile, Client, Contract, ContractSignature, HostedProject, Invoice, License, SyncMeta, TimeEntry, WorkProtection, WorkRecord } from '../lib/types'
import { applySignatureToContract, createInitialState, loadState, saveState } from '../lib/utils'
import { autoSyncIfEnabled } from '../lib/sync'

type StoreContextType = {
  state: AppState
  updateProfile: (profile: Partial<BusinessProfile>) => void
  addClient: (client: Omit<Client, 'id' | 'createdAt'>) => Client
  updateClient: (id: string, data: Partial<Client>) => void
  deleteClient: (id: string) => void
  addTimeEntry: (entry: Omit<TimeEntry, 'id' | 'createdAt'>) => TimeEntry
  updateTimeEntry: (id: string, data: Partial<TimeEntry>) => void
  deleteTimeEntry: (id: string) => void
  startTimer: (entry: Omit<TimeEntry, 'id' | 'createdAt' | 'endTime' | 'durationMinutes'>) => void
  stopTimer: () => void
  addContract: (contract: Omit<Contract, 'id' | 'createdAt' | 'updatedAt' | 'signatures' | 'signingToken'>) => Contract
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
  resetAll: () => void
}

const StoreContext = createContext<StoreContextType | null>(null)

function persist(state: AppState) {
  saveState(state)
  return state
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(() => loadState())

  useEffect(() => {
    saveState(state)
  }, [state])

  useEffect(() => {
    if (!state.syncMeta.autoSync) return
    const timer = setTimeout(() => {
      autoSyncIfEnabled(state)
    }, 3000)
    return () => clearTimeout(timer)
  }, [state])

  const mutate = useCallback((fn: (s: AppState) => AppState) => {
    setState((prev) => persist(fn(prev)))
  }, [])

  const updateProfile = useCallback((profile: Partial<BusinessProfile>) => {
    mutate((s) => ({ ...s, profile: { ...s.profile, ...profile } }))
  }, [mutate])

  const addClient = useCallback((data: Omit<Client, 'id' | 'createdAt'>) => {
    const client: Client = { ...data, id: crypto.randomUUID(), createdAt: new Date().toISOString() }
    mutate((s) => ({ ...s, clients: [...s.clients, client] }))
    return client
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

  const addContract = useCallback((data: Omit<Contract, 'id' | 'createdAt' | 'updatedAt' | 'signatures' | 'signingToken'>) => {
    const now = new Date().toISOString()
    const contract: Contract = {
      ...data,
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
    setState(persist(newState))
  }, [])

  const updateSyncMeta = useCallback((meta: Partial<SyncMeta>) => {
    mutate((s) => ({ ...s, syncMeta: { ...s.syncMeta, ...meta } }))
  }, [mutate])

  const resetAll = useCallback(() => {
    setState(persist(createInitialState()))
  }, [])

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
        resetAll,
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
