import type {
  AppState, AvailabilityBlock, EmailTemplate, Expense, IntegrationSettings,
  Milestone, Project, Proposal, RecurringInvoice, ScopeEntry, Subcontractor,
  TaxSettings, VaultDocument,
} from './types'

type Mutate = (fn: (s: AppState) => AppState) => void

type ArrayStateKey = {
  [K in keyof AppState]: AppState[K] extends (infer _E)[] ? K : never
}[keyof AppState]

function getArray<T>(state: AppState, key: ArrayStateKey): T[] {
  return state[key] as unknown as T[]
}

function crud<T extends { id: string; createdAt: string }>(
  mutate: Mutate,
  key: ArrayStateKey,
  factory: (data: Omit<T, 'id' | 'createdAt'>, now: string) => T
) {
  return {
    add: (data: Omit<T, 'id' | 'createdAt'>) => {
      const now = new Date().toISOString()
      const item = factory(data, now)
      mutate((s) => ({ ...s, [key]: [...getArray<T>(s, key), item] }))
      return item
    },
    update: (id: string, data: Partial<T>) => {
      mutate((s) => ({
        ...s,
        [key]: getArray<T>(s, key).map((item) => (item.id === id ? { ...item, ...data } : item)),
      }))
    },
    delete: (id: string) => {
      mutate((s) => ({ ...s, [key]: getArray<T>(s, key).filter((item) => item.id !== id) }))
    },
  }
}

export function createExtendedCrud(mutate: Mutate) {
  const projects = {
    add: (data: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => {
      const now = new Date().toISOString()
      const item: Project = { ...data, id: crypto.randomUUID(), createdAt: now, updatedAt: now }
      mutate((s) => ({ ...s, projects: [...s.projects, item] }))
      return item
    },
    update: (id: string, data: Partial<Project>) => {
      mutate((s) => ({
        ...s,
        projects: s.projects.map((p) =>
          p.id === id ? { ...p, ...data, updatedAt: new Date().toISOString() } : p
        ),
      }))
    },
    delete: (id: string) => {
      mutate((s) => ({ ...s, projects: s.projects.filter((p) => p.id !== id) }))
    },
  }

  const proposals = {
    add: (data: Omit<Proposal, 'id' | 'createdAt' | 'updatedAt'>) => {
      const now = new Date().toISOString()
      const item: Proposal = { ...data, id: crypto.randomUUID(), createdAt: now, updatedAt: now }
      mutate((s) => ({ ...s, proposals: [...s.proposals, item] }))
      return item
    },
    update: (id: string, data: Partial<Proposal>) => {
      mutate((s) => ({
        ...s,
        proposals: s.proposals.map((p) =>
          p.id === id ? { ...p, ...data, updatedAt: new Date().toISOString() } : p
        ),
      }))
    },
    delete: (id: string) => {
      mutate((s) => ({ ...s, proposals: s.proposals.filter((p) => p.id !== id) }))
    },
  }

  return {
    projects,
    proposals,
    expenses: crud<Expense>(mutate, 'expenses', (d, now) => ({
      ...d,
      id: crypto.randomUUID(),
      createdAt: now,
    })),
    recurringInvoices: crud<RecurringInvoice>(mutate, 'recurringInvoices', (d, now) => ({
      ...d,
      id: crypto.randomUUID(),
      createdAt: now,
    })),
    scopeEntries: crud<ScopeEntry>(mutate, 'scopeEntries', (d, now) => ({
      ...d,
      id: crypto.randomUUID(),
      createdAt: now,
    })),
    vaultDocuments: crud<VaultDocument>(mutate, 'vaultDocuments', (d, now) => ({
      ...d,
      id: crypto.randomUUID(),
      createdAt: now,
    })),
    subcontractors: crud<Subcontractor>(mutate, 'subcontractors', (d, now) => ({
      ...d,
      id: crypto.randomUUID(),
      createdAt: now,
    })),
    emailTemplates: crud<EmailTemplate>(mutate, 'emailTemplates', (d, now) => ({
      ...d,
      id: crypto.randomUUID(),
      createdAt: now,
    })),
    availabilityBlocks: crud<AvailabilityBlock>(mutate, 'availabilityBlocks', (d, now) => ({
      ...d,
      id: crypto.randomUUID(),
      createdAt: now,
    })),
    milestones: crud<Milestone>(mutate, 'milestones', (d, now) => ({
      ...d,
      id: crypto.randomUUID(),
      createdAt: now,
    })),
    updateTaxSettings: (data: Partial<TaxSettings>) => {
      mutate((s) => ({ ...s, taxSettings: { ...s.taxSettings, ...data } }))
    },
    updateIntegrations: (data: Partial<IntegrationSettings>) => {
      mutate((s) => ({ ...s, integrations: { ...s.integrations, ...data } }))
    },
  }
}

export type ExtendedCrud = ReturnType<typeof createExtendedCrud>
