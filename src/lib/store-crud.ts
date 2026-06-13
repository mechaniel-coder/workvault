import type {
  AppState, AvailabilityBlock, ClientGuestInvite, CursorCliWorkflow, EmailTemplate, Expense,
  Form1099NECRecord, IntegrationSettings, IntegrationCredentials, CalendarSyncMeta, Milestone,
  Project, Proposal, RecurringInvoice, ScopeEntry, Subcontractor, SubcontractorPayment,
  Tax1099Settings, TaxSettings, TeamMember, VaultDocument, CursorCliSettings,
  BookkeepingSyncMeta, SchedulingMeta, PlaidSyncMeta, BankTransaction, GmailThreadSummary,
  CloudStorageMeta,
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
    subcontractorPayments: crud<SubcontractorPayment>(mutate, 'subcontractorPayments', (d, now) => ({
      ...d,
      id: crypto.randomUUID(),
      createdAt: now,
    })),
    form1099Records: {
      sync: (records: Form1099NECRecord[]) => {
        mutate((s) => ({ ...s, form1099Records: records }))
      },
      update: (id: string, data: Partial<Form1099NECRecord>) => {
        mutate((s) => ({
          ...s,
          form1099Records: s.form1099Records.map((r) =>
            r.id === id ? { ...r, ...data, updatedAt: new Date().toISOString() } : r
          ),
        }))
      },
    },
    updateTax1099Settings: (data: Partial<Tax1099Settings>) => {
      mutate((s) => ({
        ...s,
        tax1099Settings: { ...s.tax1099Settings, ...data },
      }))
    },
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
    teamMembers: crud<TeamMember>(mutate, 'teamMembers', (d, now) => ({
      ...d,
      id: crypto.randomUUID(),
      createdAt: now,
    })),
    clientGuestInvites: crud<ClientGuestInvite>(mutate, 'clientGuestInvites', (d, now) => ({
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
    updateIntegrationCredentials: (data: Partial<IntegrationCredentials>) => {
      mutate((s) => ({
        ...s,
        integrationCredentials: { ...s.integrationCredentials, ...data },
      }))
    },
    updateCalendarSyncMeta: (data: Partial<CalendarSyncMeta>) => {
      mutate((s) => ({
        ...s,
        calendarSyncMeta: { ...s.calendarSyncMeta, ...data },
      }))
    },
    updateBookkeepingSyncMeta: (data: Partial<BookkeepingSyncMeta>) => {
      mutate((s) => ({
        ...s,
        bookkeepingSyncMeta: { ...s.bookkeepingSyncMeta, ...data },
      }))
    },
    updateSchedulingMeta: (data: Partial<SchedulingMeta>) => {
      mutate((s) => ({
        ...s,
        schedulingMeta: { ...s.schedulingMeta, ...data },
      }))
    },
    updatePlaidSyncMeta: (data: Partial<PlaidSyncMeta>) => {
      mutate((s) => ({
        ...s,
        plaidSyncMeta: { ...s.plaidSyncMeta, ...data },
      }))
    },
    bankTransactions: crud<BankTransaction>(mutate, 'bankTransactions', (d, now) => ({
      ...d,
      id: crypto.randomUUID(),
      createdAt: now,
    })),
    setGmailInboxCache: (threads: GmailThreadSummary[]) => {
      mutate((s) => ({ ...s, gmailInboxCache: threads }))
    },
    updateCloudStorageMeta: (data: Partial<CloudStorageMeta>) => {
      mutate((s) => ({
        ...s,
        cloudStorageMeta: { ...s.cloudStorageMeta, ...data },
      }))
    },
    updateCursorCliSettings: (data: Partial<CursorCliSettings>) => {
      mutate((s) => ({
        ...s,
        cursorCli: { ...s.cursorCli, settings: { ...s.cursorCli.settings, ...data } },
      }))
    },
    addCursorCliWorkflow: (data: Omit<CursorCliWorkflow, 'id' | 'createdAt'>) => {
      const now = new Date().toISOString()
      const item: CursorCliWorkflow = { ...data, id: crypto.randomUUID(), createdAt: now }
      mutate((s) => ({
        ...s,
        cursorCli: { ...s.cursorCli, workflows: [...s.cursorCli.workflows, item] },
      }))
      return item
    },
    updateCursorCliWorkflow: (id: string, data: Partial<CursorCliWorkflow>) => {
      mutate((s) => ({
        ...s,
        cursorCli: {
          ...s.cursorCli,
          workflows: s.cursorCli.workflows.map((w) => (w.id === id ? { ...w, ...data } : w)),
        },
      }))
    },
    deleteCursorCliWorkflow: (id: string) => {
      mutate((s) => ({
        ...s,
        cursorCli: {
          ...s.cursorCli,
          workflows: s.cursorCli.workflows.filter((w) => w.id !== id),
        },
      }))
    },
  }
}

export type ExtendedCrud = ReturnType<typeof createExtendedCrud>
