import type { LucideIcon } from 'lucide-react'
import {
  Palette,
  Code2,
  HardHat,
  Briefcase,
  Megaphone,
  Layers,
  Scale,
  HeartPulse,
  Camera,
  PenLine,
  Building2,
  GraduationCap,
  Calculator,
  PartyPopper,
  HeartHandshake,
  Dumbbell,
  Compass,
  Music,
  ChefHat,
  Languages,
  Microscope,
  SprayCan,
  Car,
  PawPrint,
  Umbrella,
  Shirt,
  Sparkles,
  Shield,
  TreePine,
  Baby,
  Truck,
  Sun,
  Film,
  Plane,
  Printer,
  KeyRound,
} from 'lucide-react'

export type IndustryCategory =
  | 'general'
  | 'creative'
  | 'professional'
  | 'trades'
  | 'care'
  | 'business'

export type IndustryId =
  | 'general'
  | 'creative'
  | 'software'
  | 'construction'
  | 'consulting'
  | 'marketing'
  | 'legal'
  | 'healthcare'
  | 'photography'
  | 'writing'
  | 'real-estate'
  | 'education'
  | 'accounting'
  | 'events'
  | 'nonprofit'
  | 'fitness'
  | 'architecture'
  | 'music'
  | 'culinary'
  | 'translation'
  | 'research'
  | 'cleaning'
  | 'automotive'
  | 'pet-services'
  | 'insurance'
  | 'fashion'
  | 'beauty'
  | 'security'
  | 'landscaping'
  | 'childcare'
  | 'logistics'
  | 'solar'
  | 'film'
  | 'aviation'
  | 'printing'
  | 'property-management'

export type NavRouteId =
  | 'dashboard'
  | 'time'
  | 'pipeline'
  | 'proposals'
  | 'contracts'
  | 'invoices'
  | 'inbox'
  | 'finance'
  | 'tax-1099'
  | 'clients'
  | 'scope'
  | 'documents'
  | 'tools'
  | 'subcontractors'
  | 'protection'
  | 'licenses'
  | 'hosting'
  | 'records'
  | 'team'
  | 'integrations'
  | 'cursor-cli'
  | 'settings'

export interface IndustryTerminology {
  client: string
  clients: string
  contract: string
  contracts: string
  project: string
  workProtection: string
  licenses: string
  subcontractor: string
}

export interface IndustryDashboardConfig {
  badge: string
  subtitle: string
  quickActions: Array<{ route: string; label: string }>
  statLabels: {
    protected: string
    clients: string
  }
  emptyActivity: string
}

export interface IndustryWebsiteConfig {
  metaDescription: string
  heroTitle: string
  heroSubtitle: string
  features: string[]
  footerTagline: string
  whoItsFor: string[]
  workflows: Array<{ title: string; description: string }>
  useCases: Array<{ title: string; example: string }>
  faq: Array<{ q: string; a: string }>
  ctaLabel: string
}

export interface IndustryConfig {
  id: IndustryId
  category: IndustryCategory
  label: string
  shortLabel: string
  description: string
  icon: LucideIcon
  editionLabel: string
  hiddenRoutes: NavRouteId[]
  mobileTabRoutes: NavRouteId[]
  navLabels: Partial<Record<NavRouteId, string>>
  terminology: IndustryTerminology
  onboarding: {
    welcomeTitle: string
    welcomeBody: string
    highlights: string[]
  }
  dashboard: IndustryDashboardConfig
  website: IndustryWebsiteConfig
  loadingFeatures: string[]
}

const BASE_TERMINOLOGY: IndustryTerminology = {
  client: 'Client',
  clients: 'Clients',
  contract: 'Contract',
  contracts: 'Contracts',
  project: 'Project',
  workProtection: 'Work Protection',
  licenses: 'Licenses',
  subcontractor: 'Subcontractor',
}

function config(
  partial: Omit<IndustryConfig, 'id' | 'icon'> & { id: IndustryId; icon: LucideIcon },
): IndustryConfig {
  return partial
}

export const INDUSTRY_CATEGORIES: Record<IndustryCategory, string> = {
  general: 'General',
  creative: 'Creative & Media',
  professional: 'Professional Services',
  trades: 'Trades & Field Services',
  care: 'Care & Education',
  business: 'Business & Operations',
}

function web(
  base: Omit<IndustryWebsiteConfig, 'whoItsFor' | 'workflows' | 'useCases' | 'faq' | 'ctaLabel'>,
  deep: Pick<IndustryWebsiteConfig, 'whoItsFor' | 'workflows' | 'useCases' | 'faq'> & { ctaLabel?: string },
): IndustryWebsiteConfig {
  return { ...base, ctaLabel: deep.ctaLabel ?? 'Get Started', ...deep }
}

export const INDUSTRIES: Record<IndustryId, IndustryConfig> = {
  general: config({
    id: 'general',
    category: 'general',
    icon: Layers,
    label: 'General Contracting',
    shortLabel: 'General',
    description: 'Freelancers and independent contractors across trades and services.',
    editionLabel: 'Pro Edition',
    hiddenRoutes: [],
    mobileTabRoutes: ['dashboard', 'time', 'invoices', 'clients'],
    navLabels: {},
    terminology: { ...BASE_TERMINOLOGY },
    onboarding: {
      welcomeTitle: 'Welcome to WorkVault',
      welcomeBody:
        'The all-in-one platform built for contract workers. Protect your work, send contracts, track time, and manage invoices — all in one place.',
      highlights: ['E-Signatures', 'Time Tracking', 'Invoicing', 'Work Protection'],
    },
    dashboard: {
      badge: 'Command Center',
      subtitle:
        'Your contract work command center — track time, send contracts, protect your work, and get paid.',
      quickActions: [
        { route: '/time', label: 'Start Timer' },
        { route: '/contracts', label: 'New Contract' },
        { route: '/invoices', label: 'Create Invoice' },
      ],
      statLabels: { protected: 'Protected Works', clients: 'clients' },
      emptyActivity: 'No activity yet. Start tracking time or create a contract.',
    },
    website: web(
      {
        metaDescription:
          'WorkVault — local-first platform for contract workers. Contracts, time tracking, invoices, and client workspaces.',
        heroTitle: 'Run your contract business from one vault',
        heroSubtitle:
          'Contracts, time tracking, invoices, and client handoffs — on your device, with optional cloud sync.',
        features: ['E-sign contracts', 'Track billable hours', 'Send invoices', 'Client workspaces'],
        footerTagline: 'YOUR WORK · YOUR CONTROL',
      },
      {
        whoItsFor: [
          'Independent contractors and freelancers',
          'Side-hustlers managing multiple clients',
          'Small agencies without heavy back-office software',
        ],
        workflows: [
          { title: 'Onboard a client', description: 'Add client details, send a contract, and open a shared workspace link.' },
          { title: 'Track & bill', description: 'Log hours against projects, generate invoices, and accept online payments.' },
          { title: 'Close the job', description: 'Archive deliverables, export records, and hand off a client WorkVault if needed.' },
        ],
        useCases: [
          { title: 'Multi-client freelancer', example: 'Track three retainers, separate timers per client, one invoice run at month-end.' },
          { title: 'Project-based work', example: 'Fixed-fee contract, milestone invoices, and document vault for deliverables.' },
        ],
        faq: [
          { q: 'Is my data stored in the cloud?', a: 'By default everything stays on your device. Cloud sync is optional and encrypted.' },
          { q: 'Can clients sign contracts online?', a: 'Yes — send a signing link or use your integrated e-sign provider.' },
        ],
      },
    ),
    loadingFeatures: [
      'Protect your work',
      'Generate contracts',
      'Track every hour',
      'Send invoices',
    ],
  }),

  creative: config({
    id: 'creative',
    category: 'creative',
    icon: Palette,
    label: 'Creative & Design',
    shortLabel: 'Creative',
    description: 'Designers, photographers, illustrators, and visual artists.',
    editionLabel: 'Creative Edition',
    hiddenRoutes: ['tax-1099', 'subcontractors', 'cursor-cli', 'tools'],
    mobileTabRoutes: ['dashboard', 'time', 'invoices', 'clients'],
    navLabels: {
      protection: 'Creative Rights',
      records: 'Portfolio Records',
      pipeline: 'Project Pipeline',
    },
    terminology: {
      ...BASE_TERMINOLOGY,
      workProtection: 'Creative Rights',
      project: 'Creative Project',
    },
    onboarding: {
      welcomeTitle: 'WorkVault for Creatives',
      welcomeBody:
        'Protect drafts and deliverables, send polished proposals, track revision time, and get paid — without juggling five apps.',
      highlights: ['Creative Rights', 'Proposals', 'Revision Tracking', 'Client Previews'],
    },
    dashboard: {
      badge: 'Studio Hub',
      subtitle:
        'Your creative business hub — track project time, send proposals, protect deliverables, and invoice clients.',
      quickActions: [
        { route: '/time', label: 'Log Studio Time' },
        { route: '/proposals', label: 'Send Proposal' },
        { route: '/protection', label: 'Protect Deliverable' },
      ],
      statLabels: { protected: 'Protected Works', clients: 'clients' },
      emptyActivity: 'No activity yet. Log studio time or send a proposal.',
    },
    website: web(
      {
        metaDescription:
          'WorkVault for creatives — proposals, creative rights protection, time tracking, and invoicing for designers and artists.',
        heroTitle: 'Your creative business, protected and organized',
        heroSubtitle:
          'Proposals, deliverable protection, revision tracking, and client previews — built for designers and artists.',
        features: ['Protect deliverables', 'Send proposals', 'Track revision time', 'Client preview rooms'],
        footerTagline: 'CREATE · PROTECT · GET PAID',
      },
      {
        whoItsFor: ['Graphic & UI designers', 'Illustrators and brand artists', 'Motion and visual creatives'],
        workflows: [
          { title: 'Pitch & propose', description: 'Send a scoped proposal with revision limits before work begins.' },
          { title: 'Track revisions', description: 'Log time per revision round so scope creep becomes billable.' },
          { title: 'Deliver & protect', description: 'Watermark drafts, timestamp finals, and hand off via client preview.' },
        ],
        useCases: [
          { title: 'Brand identity package', example: 'Three revision rounds in scope, timer per round, final files after sign-off.' },
          { title: 'Freelance UI sprint', example: 'Weekly retainer, pipeline of screens, protected Figma exports.' },
        ],
        faq: [
          { q: 'Can I limit revision rounds in proposals?', a: 'Yes — scope and revision terms belong in your proposal and contract.' },
          { q: 'Do clients see work before payment?', a: 'You control preview access and file release from the client workspace.' },
        ],
        ctaLabel: 'Start creative workspace',
      },
    ),
    loadingFeatures: [
      'Protect deliverables',
      'Send proposals',
      'Track studio hours',
      'Invoice clients',
    ],
  }),

  software: config({
    id: 'software',
    category: 'professional',
    icon: Code2,
    label: 'Software & Tech',
    shortLabel: 'Software',
    description: 'Developers, engineers, DevOps, and IT consultants.',
    editionLabel: 'Developer Edition',
    hiddenRoutes: ['licenses', 'subcontractors'],
    mobileTabRoutes: ['dashboard', 'time', 'contracts', 'clients'],
    navLabels: {
      protection: 'IP & Code Rights',
      hosting: 'Deployments',
      records: 'Delivery Log',
      'cursor-cli': 'Cursor CLI',
    },
    terminology: {
      ...BASE_TERMINOLOGY,
      workProtection: 'IP & Code Rights',
      contract: 'SOW / Contract',
      contracts: 'SOWs & Contracts',
      project: 'Engagement',
    },
    onboarding: {
      welcomeTitle: 'WorkVault for Developers',
      welcomeBody:
        'Track sprint hours, send SOWs, protect IP, sync with Cursor CLI, and invoice clients — local-first with optional cloud.',
      highlights: ['SOW Templates', 'Time Tracking', 'IP Protection', 'Cursor CLI'],
    },
    dashboard: {
      badge: 'Dev Console',
      subtitle:
        'Your consulting command line — track eng hours, ship SOWs, protect code & IP, and bill accurately.',
      quickActions: [
        { route: '/time', label: 'Log Dev Hours' },
        { route: '/contracts', label: 'New SOW' },
        { route: '/cursor-cli', label: 'Cursor CLI' },
      ],
      statLabels: { protected: 'Protected Assets', clients: 'clients' },
      emptyActivity: 'No activity yet. Log dev hours or create an SOW.',
    },
    website: web(
      {
        metaDescription:
          'WorkVault for software contractors — SOWs, IP protection, time tracking, Cursor CLI integration, and invoicing.',
        heroTitle: 'Built for software contractors',
        heroSubtitle:
          'SOWs, sprint time tracking, IP protection, deployment records, and Cursor CLI — on your machine.',
        features: ['SOW & contracts', 'Track dev hours', 'Protect IP & code', 'Cursor CLI workflows'],
        footerTagline: 'SHIP · PROTECT · INVOICE',
      },
      {
        whoItsFor: ['Freelance developers & engineers', 'DevOps and IT consultants', 'Technical founders on contract'],
        workflows: [
          { title: 'Scope the engagement', description: 'Issue a SOW with deliverables, acceptance criteria, and rate terms.' },
          { title: 'Track sprint time', description: 'Bill hourly or milestone — timer tied to client and engagement.' },
          { title: 'Protect & deliver', description: 'IP claims on repos, delivery log, optional Cursor CLI automation.' },
        ],
        useCases: [
          { title: 'Backend API contract', example: 'SOW for 6-week build, weekly invoices, IP clause on all commits.' },
          { title: 'Fractional CTO', example: 'Monthly retainer, session time log, shared docs with the client team.' },
        ],
        faq: [
          { q: 'Does WorkVault integrate with Cursor?', a: 'Yes — the Developer Edition includes Cursor CLI workflows for contracts and docs.' },
          { q: 'Can I track time per repo or client?', a: 'Time entries link to clients and projects for clean billing exports.' },
        ],
        ctaLabel: 'Start developer workspace',
      },
    ),
    loadingFeatures: [
      'Protect IP & code',
      'Generate SOWs',
      'Track dev hours',
      'Run Cursor CLI',
    ],
  }),

  construction: config({
    id: 'construction',
    category: 'trades',
    icon: HardHat,
    label: 'Construction & Trades',
    shortLabel: 'Trades',
    description: 'General contractors, electricians, plumbers, HVAC, and field trades.',
    editionLabel: 'Trades Edition',
    hiddenRoutes: ['hosting', 'cursor-cli', 'inbox'],
    mobileTabRoutes: ['dashboard', 'time', 'invoices', 'clients'],
    navLabels: {
      clients: 'Customers',
      contracts: 'Job Agreements',
      scope: 'Change Orders',
      subcontractors: 'Subcontractors',
      protection: 'Job Protection',
      licenses: 'Licenses & Certs',
      tools: 'Equipment',
      records: 'Job Records',
    },
    terminology: {
      client: 'Customer',
      clients: 'Customers',
      contract: 'Job Agreement',
      contracts: 'Job Agreements',
      project: 'Job',
      workProtection: 'Job Protection',
      licenses: 'Licenses & Certs',
      subcontractor: 'Sub',
    },
    onboarding: {
      welcomeTitle: 'WorkVault for Trades',
      welcomeBody:
        'Track field hours, manage change orders, store licenses, pay subs, and invoice customers — from the job site or office.',
      highlights: ['Field Time', 'Change Orders', 'Sub Management', 'Licenses'],
    },
    dashboard: {
      badge: 'Job Site Hub',
      subtitle:
        'Your trades command center — log field hours, track change orders, manage subs, and invoice customers.',
      quickActions: [
        { route: '/time', label: 'Log Field Time' },
        { route: '/scope', label: 'Log Change Order' },
        { route: '/invoices', label: 'Invoice Customer' },
      ],
      statLabels: { protected: 'Protected Jobs', clients: 'customers' },
      emptyActivity: 'No activity yet. Log field time or create a job agreement.',
    },
    website: web(
      {
        metaDescription:
          'WorkVault for construction and trades — field time, change orders, subcontractor payments, licenses, and invoicing.',
        heroTitle: 'Run your trades business from the field',
        heroSubtitle:
          'Field time tracking, change orders, sub management, license tracking, and customer invoicing — offline-ready.',
        features: ['Log field hours', 'Track change orders', 'Manage subcontractors', 'Licenses & certs'],
        footerTagline: 'BUILD · TRACK · GET PAID',
      },
      {
        whoItsFor: ['General contractors & remodelers', 'Electricians, plumbers, HVAC pros', 'Trade subs managing multiple job sites'],
        workflows: [
          { title: 'Quote the job', description: 'Job agreement with scope, materials allowance, and payment schedule.' },
          { title: 'Log field & changes', description: 'Daily field hours plus change orders when scope shifts on site.' },
          { title: 'Pay subs & invoice', description: 'Track sub payments and invoice customers with job records attached.' },
        ],
        useCases: [
          { title: 'Kitchen remodel', example: 'Original contract, three change orders, sub electrician payments, final invoice.' },
          { title: 'Commercial service calls', example: 'Time-and-materials logging from the van, license certs on file.' },
        ],
        faq: [
          { q: 'Does it work offline at the job site?', a: 'Yes — the desktop app stores data locally; sync when you have signal.' },
          { q: 'Can I track subcontractor 1099s?', a: 'Subcontractor records and payment history feed your 1099 workflow.' },
        ],
        ctaLabel: 'Start trades workspace',
      },
    ),
    loadingFeatures: [
      'Track field hours',
      'Log change orders',
      'Manage subcontractors',
      'Invoice customers',
    ],
  }),

  consulting: config({
    id: 'consulting',
    category: 'professional',
    icon: Briefcase,
    label: 'Consulting & Coaching',
    shortLabel: 'Consulting',
    description: 'Business consultants, coaches, advisors, and professional services.',
    editionLabel: 'Consulting Edition',
    hiddenRoutes: ['hosting', 'tools', 'subcontractors', 'cursor-cli'],
    mobileTabRoutes: ['dashboard', 'time', 'invoices', 'clients'],
    navLabels: {
      pipeline: 'Engagements',
      proposals: 'Engagement Proposals',
      records: 'Engagement Records',
    },
    terminology: {
      ...BASE_TERMINOLOGY,
      project: 'Engagement',
      contract: 'Engagement Letter',
      contracts: 'Engagement Letters',
    },
    onboarding: {
      welcomeTitle: 'WorkVault for Consultants',
      welcomeBody:
        'Manage engagements, send proposals, track billable sessions, and invoice clients — polished and professional.',
      highlights: ['Engagement Letters', 'Session Tracking', 'Proposals', 'Invoicing'],
    },
    dashboard: {
      badge: 'Practice Hub',
      subtitle:
        'Your consulting practice hub — track billable sessions, send engagement letters, and manage client work.',
      quickActions: [
        { route: '/time', label: 'Log Session' },
        { route: '/proposals', label: 'Send Proposal' },
        { route: '/contracts', label: 'Engagement Letter' },
      ],
      statLabels: { protected: 'Protected Engagements', clients: 'clients' },
      emptyActivity: 'No activity yet. Log a session or send a proposal.',
    },
    website: web(
      {
        metaDescription:
          'WorkVault for consultants and coaches — engagement letters, session tracking, proposals, and invoicing.',
        heroTitle: 'Your consulting practice, organized',
        heroSubtitle:
          'Engagement letters, session time tracking, proposals, and client workspaces — professional and private.',
        features: ['Engagement letters', 'Track sessions', 'Send proposals', 'Client portals'],
        footerTagline: 'ADVISE · TRACK · DELIVER',
      },
      {
        whoItsFor: ['Management & strategy consultants', 'Executive and life coaches', 'Fractional advisors and specialists'],
        workflows: [
          { title: 'Engage formally', description: 'Send an engagement letter with confidentiality and billing terms.' },
          { title: 'Log sessions', description: 'Track billable sessions and prep time per client engagement.' },
          { title: 'Invoice & renew', description: 'Monthly or per-session invoices with engagement history on file.' },
        ],
        useCases: [
          { title: 'Coaching retainer', example: '12-session package, timer per call, renewal proposal at month 10.' },
          { title: 'Strategy sprint', example: 'Fixed-fee engagement letter, milestone deliverables, final readout deck.' },
        ],
        faq: [
          { q: 'Can clients access shared documents?', a: 'Yes — client workspaces can include messages, files, and review flows.' },
          { q: 'Is client data private?', a: 'Data lives on your device by default; you choose if and when to enable cloud sync.' },
        ],
        ctaLabel: 'Start consulting workspace',
      },
    ),
    loadingFeatures: [
      'Send engagement letters',
      'Track billable sessions',
      'Manage proposals',
      'Invoice clients',
    ],
  }),

  marketing: config({
    id: 'marketing',
    category: 'creative',
    icon: Megaphone,
    label: 'Marketing & Agency',
    shortLabel: 'Marketing',
    description: 'Agencies, marketers, content creators, and campaign freelancers.',
    editionLabel: 'Agency Edition',
    hiddenRoutes: ['subcontractors', 'tax-1099', 'tools'],
    mobileTabRoutes: ['dashboard', 'pipeline', 'invoices', 'clients'],
    navLabels: {
      pipeline: 'Campaign Pipeline',
      proposals: 'Pitch Decks',
      hosting: 'Live Campaigns',
      records: 'Campaign Records',
    },
    terminology: {
      ...BASE_TERMINOLOGY,
      project: 'Campaign',
      workProtection: 'Asset Protection',
    },
    onboarding: {
      welcomeTitle: 'WorkVault for Agencies',
      welcomeBody:
        'Run campaign pipelines, send pitch decks, track retainer hours, host live previews, and invoice clients.',
      highlights: ['Campaign Pipeline', 'Pitch Decks', 'Retainer Tracking', 'Live Previews'],
    },
    dashboard: {
      badge: 'Agency HQ',
      subtitle:
        'Your agency headquarters — manage campaigns, track retainer hours, send pitch decks, and bill clients.',
      quickActions: [
        { route: '/pipeline', label: 'View Pipeline' },
        { route: '/proposals', label: 'Send Pitch' },
        { route: '/time', label: 'Log Retainer Time' },
      ],
      statLabels: { protected: 'Protected Assets', clients: 'clients' },
      emptyActivity: 'No activity yet. Add a campaign or send a pitch deck.',
    },
    website: web(
      {
        metaDescription:
          'WorkVault for marketing agencies — campaign pipeline, pitch decks, retainer tracking, and client workspaces.',
        heroTitle: 'Your agency ops, in one vault',
        heroSubtitle:
          'Campaign pipelines, pitch decks, retainer time tracking, live previews, and client billing.',
        features: ['Campaign pipeline', 'Pitch decks', 'Retainer tracking', 'Client preview links'],
        footerTagline: 'PITCH · DELIVER · SCALE',
      },
      {
        whoItsFor: ['Boutique marketing agencies', 'Freelance strategists & media buyers', 'Content and social contractors'],
        workflows: [
          { title: 'Win the pitch', description: 'Pipeline stages from lead to signed retainer with proposal templates.' },
          { title: 'Run the campaign', description: 'Track retainer hours, assets, and live preview links for clients.' },
          { title: 'Report & bill', description: 'Campaign records, scope log for add-ons, and consolidated invoicing.' },
        ],
        useCases: [
          { title: 'Monthly retainer client', example: '40-hour cap, pipeline kanban, mid-month scope check-in.' },
          { title: 'Launch campaign', example: 'Fixed-fee proposal, creative handoff link, post-launch invoice.' },
        ],
        faq: [
          { q: 'Can I show clients live campaign previews?', a: 'Yes — hosting and preview links are built into the agency workflow.' },
          { q: 'How do I track scope creep on retainers?', a: 'Use the scope log when requests exceed the agreed retainer hours.' },
        ],
        ctaLabel: 'Start agency workspace',
      },
    ),
    loadingFeatures: [
      'Manage campaigns',
      'Send pitch decks',
      'Track retainer hours',
      'Invoice clients',
    ],
  }),

  legal: config({
    id: 'legal',
    category: 'professional',
    icon: Scale,
    label: 'Legal & Paralegal',
    shortLabel: 'Legal',
    description: 'Solo practitioners, paralegals, contract attorneys, and legal consultants.',
    editionLabel: 'Legal Edition',
    hiddenRoutes: ['hosting', 'cursor-cli', 'tools', 'subcontractors'],
    mobileTabRoutes: ['dashboard', 'time', 'contracts', 'clients'],
    navLabels: {
      contracts: 'Engagement Agreements',
      documents: 'Case Documents',
      records: 'Matter Records',
      protection: 'Confidentiality & IP',
      scope: 'Matter Scope Log',
    },
    terminology: {
      ...BASE_TERMINOLOGY,
      client: 'Client',
      clients: 'Clients',
      contract: 'Engagement Agreement',
      contracts: 'Engagement Agreements',
      project: 'Matter',
      workProtection: 'Confidentiality & IP',
    },
    onboarding: {
      welcomeTitle: 'WorkVault for Legal Professionals',
      welcomeBody:
        'Manage matters, track billable hours, store case documents, and send engagement agreements — organized and private on your device.',
      highlights: ['Engagement Agreements', 'Billable Hours', 'Matter Documents', 'Client Portals'],
    },
    dashboard: {
      badge: 'Matter Desk',
      subtitle:
        'Your practice desk — track billable time per matter, manage engagement agreements, and keep client documents organized.',
      quickActions: [
        { route: '/time', label: 'Log Billable Time' },
        { route: '/contracts', label: 'New Engagement' },
        { route: '/documents', label: 'Add Document' },
      ],
      statLabels: { protected: 'Protected Matters', clients: 'clients' },
      emptyActivity: 'No activity yet. Log billable time or open a new matter.',
    },
    website: web(
      {
        metaDescription:
          'WorkVault for legal professionals — matter tracking, billable hours, engagement agreements, and secure client documents.',
        heroTitle: 'Practice management that stays on your machine',
        heroSubtitle:
          'Matters, billable hours, engagement agreements, document vault, and client portals — private by default.',
        features: ['Engagement agreements', 'Billable hour tracking', 'Matter document vault', 'Secure client access'],
        footerTagline: 'COUNSEL · RECORD · BILL',
      },
      {
        whoItsFor: ['Solo attorneys and of-counsel practitioners', 'Paralegals and legal assistants', 'Contract and compliance consultants'],
        workflows: [
          { title: 'Open a matter', description: 'Client intake, engagement agreement, and matter folder in one flow.' },
          { title: 'Track billable work', description: 'Timer or manual entries tied to matter with export-ready records.' },
          { title: 'Close & archive', description: 'Final invoice, document export, and matter records for your files.' },
        ],
        useCases: [
          { title: 'Hourly litigation support', example: '0.1-hour increments, matter codes, monthly client billing summary.' },
          { title: 'Flat-fee contract review', example: 'Fixed engagement letter, deliverable checklist, signed PDF archive.' },
        ],
        faq: [
          { q: 'Is WorkVault a case management system?', a: 'It covers matters, time, documents, and billing — lightweight and local-first, not enterprise DMS.' },
          { q: 'Can I control what clients see?', a: 'Client workspaces expose only what you publish — contracts, messages, and selected files.' },
        ],
        ctaLabel: 'Start legal workspace',
      },
    ),
    loadingFeatures: [
      'Open matters',
      'Track billable hours',
      'Store case documents',
      'Send engagements',
    ],
  }),

  healthcare: config({
    id: 'healthcare',
    category: 'care',
    icon: HeartPulse,
    label: 'Healthcare & Wellness',
    shortLabel: 'Wellness',
    description: 'Therapists, counselors, wellness coaches, and private-practice clinicians.',
    editionLabel: 'Wellness Edition',
    hiddenRoutes: ['hosting', 'cursor-cli', 'subcontractors', 'tools', 'tax-1099'],
    mobileTabRoutes: ['dashboard', 'time', 'invoices', 'clients'],
    navLabels: {
      clients: 'Patients / Clients',
      contracts: 'Care Agreements',
      time: 'Session Tracker',
      records: 'Session Records',
      documents: 'Clinical Documents',
    },
    terminology: {
      ...BASE_TERMINOLOGY,
      client: 'Client',
      clients: 'Clients',
      contract: 'Care Agreement',
      contracts: 'Care Agreements',
      project: 'Care Plan',
      workProtection: 'Privacy & Records',
      licenses: 'Credentials',
    },
    onboarding: {
      welcomeTitle: 'WorkVault for Wellness Practitioners',
      welcomeBody:
        'Track sessions, send care agreements, manage client records, and invoice — with privacy-first local storage on your device.',
      highlights: ['Session Tracking', 'Care Agreements', 'Client Records', 'Private Storage'],
    },
    dashboard: {
      badge: 'Practice Hub',
      subtitle:
        'Your wellness practice hub — log sessions, manage care agreements, and keep client records on your device.',
      quickActions: [
        { route: '/time', label: 'Log Session' },
        { route: '/contracts', label: 'Care Agreement' },
        { route: '/invoices', label: 'Invoice Session' },
      ],
      statLabels: { protected: 'Protected Records', clients: 'clients' },
      emptyActivity: 'No activity yet. Log a session or add a client.',
    },
    website: web(
      {
        metaDescription:
          'WorkVault for wellness practitioners — session tracking, care agreements, client records, and invoicing with local-first privacy.',
        heroTitle: 'Private practice tools that respect client trust',
        heroSubtitle:
          'Session tracking, care agreements, credential tracking, and billing — data stays on your device unless you choose to sync.',
        features: ['Session time tracking', 'Care agreements', 'Credential tracking', 'Client invoicing'],
        footerTagline: 'CARE · RECORD · THRIVE',
      },
      {
        whoItsFor: ['Therapists and counselors in private practice', 'Wellness and health coaches', 'Holistic practitioners with session-based billing'],
        workflows: [
          { title: 'Intake & agree', description: 'New client profile, care agreement, and payment terms on file.' },
          { title: 'Run sessions', description: 'Log session duration, notes in documents vault, recurring invoice setup.' },
          { title: 'Renew & review', description: 'Track credentials expiry, session history, and package renewals.' },
        ],
        useCases: [
          { title: 'Weekly therapy sessions', example: '50-minute timer, monthly superbill-style invoice, credential reminders.' },
          { title: 'Coaching package', example: '8-session care agreement, package invoice, client message thread.' },
        ],
        faq: [
          { q: 'Is WorkVault HIPAA compliant?', a: 'WorkVault is local-first productivity software — evaluate compliance requirements for your practice and jurisdiction.' },
          { q: 'Where is client data stored?', a: 'On your device by default. Cloud sync is optional and encrypted if you enable it.' },
        ],
        ctaLabel: 'Start wellness workspace',
      },
    ),
    loadingFeatures: [
      'Log sessions',
      'Send care agreements',
      'Track credentials',
      'Invoice clients',
    ],
  }),

  photography: config({
    id: 'photography',
    category: 'creative',
    icon: Camera,
    label: 'Photo & Video',
    shortLabel: 'Photo/Video',
    description: 'Photographers, videographers, editors, and production freelancers.',
    editionLabel: 'Production Edition',
    hiddenRoutes: ['cursor-cli', 'subcontractors', 'tax-1099', 'tools'],
    mobileTabRoutes: ['dashboard', 'time', 'invoices', 'clients'],
    navLabels: {
      proposals: 'Shoot Proposals',
      protection: 'Usage Rights',
      records: 'Shoot Records',
      pipeline: 'Booking Pipeline',
      hosting: 'Client Galleries',
    },
    terminology: {
      ...BASE_TERMINOLOGY,
      project: 'Shoot',
      contract: 'Booking Agreement',
      contracts: 'Booking Agreements',
      workProtection: 'Usage Rights',
    },
    onboarding: {
      welcomeTitle: 'WorkVault for Photo & Video',
      welcomeBody:
        'Book shoots, send usage-rights agreements, track edit time, deliver galleries, and invoice — from pre-production to final export.',
      highlights: ['Booking Pipeline', 'Usage Rights', 'Edit Time Tracking', 'Client Galleries'],
    },
    dashboard: {
      badge: 'Studio & Field',
      subtitle:
        'Your production hub — manage bookings, track shoot and edit hours, protect usage rights, and deliver galleries.',
      quickActions: [
        { route: '/pipeline', label: 'View Bookings' },
        { route: '/proposals', label: 'Send Proposal' },
        { route: '/time', label: 'Log Edit Time' },
      ],
      statLabels: { protected: 'Protected Shoots', clients: 'clients' },
      emptyActivity: 'No activity yet. Add a booking or send a shoot proposal.',
    },
    website: web(
      {
        metaDescription:
          'WorkVault for photographers and videographers — bookings, usage rights, edit time tracking, galleries, and invoicing.',
        heroTitle: 'From booking to final delivery',
        heroSubtitle:
          'Shoot proposals, usage-rights contracts, edit-hour tracking, client galleries, and invoicing in one workflow.',
        features: ['Booking pipeline', 'Usage-rights contracts', 'Edit time tracking', 'Client gallery links'],
        footerTagline: 'SHOOT · EDIT · DELIVER',
      },
      {
        whoItsFor: ['Wedding & event photographers', 'Commercial video freelancers', 'Editors and retouchers billing by hour'],
        workflows: [
          { title: 'Book the shoot', description: 'Proposal with package tiers, deposit invoice, and booking agreement.' },
          { title: 'Shoot & edit', description: 'Log shoot day and edit hours separately for accurate profitability.' },
          { title: 'Deliver & license', description: 'Gallery link, usage-rights documentation, final payment invoice.' },
        ],
        useCases: [
          { title: 'Wedding package', example: 'Deposit + balance invoices, usage rights on finals, client gallery handoff.' },
          { title: 'Commercial B-roll day', example: 'Day rate contract, overtime in scope log, licensed deliverables record.' },
        ],
        faq: [
          { q: 'Can I track shoot vs edit time separately?', a: 'Yes — time entries support descriptions and projects for each phase.' },
          { q: 'How do usage rights work?', a: 'Document licensing terms in contracts and protect deliverable records in WorkVault.' },
        ],
        ctaLabel: 'Start production workspace',
      },
    ),
    loadingFeatures: [
      'Manage bookings',
      'Protect usage rights',
      'Track edit hours',
      'Deliver galleries',
    ],
  }),

  writing: config({
    id: 'writing',
    category: 'creative',
    icon: PenLine,
    label: 'Writing & Content',
    shortLabel: 'Writing',
    description: 'Copywriters, editors, journalists, and content strategists.',
    editionLabel: 'Writer Edition',
    hiddenRoutes: ['hosting', 'cursor-cli', 'subcontractors', 'tools', 'licenses'],
    mobileTabRoutes: ['dashboard', 'time', 'invoices', 'clients'],
    navLabels: {
      proposals: 'Pitch & Quotes',
      contracts: 'Assignment Agreements',
      protection: 'Copyright & Rights',
      records: 'Publication Log',
      scope: 'Revision Log',
    },
    terminology: {
      ...BASE_TERMINOLOGY,
      project: 'Assignment',
      contract: 'Assignment Agreement',
      contracts: 'Assignment Agreements',
      workProtection: 'Copyright & Rights',
    },
    onboarding: {
      welcomeTitle: 'WorkVault for Writers',
      welcomeBody:
        'Pitch assignments, track word-count deadlines, log research time, protect copyright, and invoice publishers and clients.',
      highlights: ['Assignment Agreements', 'Revision Tracking', 'Copyright Protection', 'Publication Log'],
    },
    dashboard: {
      badge: 'Editorial Desk',
      subtitle:
        'Your editorial desk — manage assignments, track writing and research time, and protect your published work.',
      quickActions: [
        { route: '/proposals', label: 'Send Pitch' },
        { route: '/time', label: 'Log Writing Time' },
        { route: '/contracts', label: 'Assignment Agreement' },
      ],
      statLabels: { protected: 'Protected Pieces', clients: 'clients' },
      emptyActivity: 'No activity yet. Send a pitch or log writing time.',
    },
    website: web(
      {
        metaDescription:
          'WorkVault for writers and content creators — assignments, revision tracking, copyright protection, and invoicing.',
        heroTitle: 'Write, protect, and get paid on your terms',
        heroSubtitle:
          'Assignment agreements, revision logs, copyright timestamps, publication records, and client invoicing.',
        features: ['Assignment agreements', 'Revision & research time', 'Copyright protection', 'Publication log'],
        footerTagline: 'WRITE · OWN · PUBLISH',
      },
      {
        whoItsFor: ['Freelance copywriters and content strategists', 'Editors and ghostwriters', 'Journalists on assignment'],
        workflows: [
          { title: 'Land the assignment', description: 'Pitch with scope, word count, revision rounds, and kill fee terms.' },
          { title: 'Write & revise', description: 'Track drafting and research hours; log extra rounds in the revision log.' },
          { title: 'Publish & protect', description: 'Copyright timestamp, publication record, and final invoice.' },
        ],
        useCases: [
          { title: 'Blog retainer', example: '4 posts/month contract, timer per article, monthly invoice.' },
          { title: 'One-off whitepaper', example: 'Fixed fee assignment, two revision rounds in scope, copyright on delivery.' },
        ],
        faq: [
          { q: 'Can I limit revision rounds?', a: 'Build revision limits into your assignment agreement and track extras in the scope log.' },
          { q: 'How do I prove authorship?', a: 'Work protection timestamps create a dated record of your original work.' },
        ],
        ctaLabel: 'Start writer workspace',
      },
    ),
    loadingFeatures: [
      'Send assignment pitches',
      'Track writing hours',
      'Protect copyright',
      'Log publications',
    ],
  }),

  'real-estate': config({
    id: 'real-estate',
    category: 'business',
    icon: Building2,
    label: 'Real Estate',
    shortLabel: 'Real Estate',
    description: 'Agents, brokers, property managers, and real-estate consultants.',
    editionLabel: 'Real Estate Edition',
    hiddenRoutes: ['cursor-cli', 'hosting', 'tools'],
    mobileTabRoutes: ['dashboard', 'pipeline', 'invoices', 'clients'],
    navLabels: {
      clients: 'Clients & Leads',
      pipeline: 'Deal Pipeline',
      contracts: 'Listing Agreements',
      records: 'Transaction Records',
      scope: 'Deal Amendments',
      licenses: 'License & MLS',
    },
    terminology: {
      ...BASE_TERMINOLOGY,
      client: 'Client',
      clients: 'Clients & Leads',
      contract: 'Listing Agreement',
      contracts: 'Listing Agreements',
      project: 'Listing / Deal',
      workProtection: 'Transaction Protection',
      licenses: 'License & MLS',
    },
    onboarding: {
      welcomeTitle: 'WorkVault for Real Estate',
      welcomeBody:
        'Run your deal pipeline, manage listing agreements, track transaction milestones, and invoice fees — mobile-friendly for life on the go.',
      highlights: ['Deal Pipeline', 'Listing Agreements', 'Transaction Records', 'Commission Invoicing'],
    },
    dashboard: {
      badge: 'Deal Desk',
      subtitle:
        'Your deal desk — pipeline every listing, track milestones, store transaction docs, and invoice commissions.',
      quickActions: [
        { route: '/pipeline', label: 'View Pipeline' },
        { route: '/contracts', label: 'Listing Agreement' },
        { route: '/invoices', label: 'Invoice Fee' },
      ],
      statLabels: { protected: 'Active Deals', clients: 'clients & leads' },
      emptyActivity: 'No activity yet. Add a listing to your pipeline.',
    },
    website: web(
      {
        metaDescription:
          'WorkVault for real estate professionals — deal pipeline, listing agreements, transaction records, and commission invoicing.',
        heroTitle: 'Your deals, documents, and commissions in one place',
        heroSubtitle:
          'Pipeline management, listing agreements, transaction milestones, license tracking, and fee invoicing.',
        features: ['Deal pipeline', 'Listing agreements', 'Transaction records', 'Commission invoicing'],
        footerTagline: 'LIST · CLOSE · COLLECT',
      },
      {
        whoItsFor: ['Independent agents and small teams', 'Property managers with vendor contracts', 'Real-estate consultants on retainer'],
        workflows: [
          { title: 'Capture the lead', description: 'Add to pipeline, send listing or buyer agreement, set milestone checklist.' },
          { title: 'Work the deal', description: 'Document amendments, track showings time, store disclosure files.' },
          { title: 'Close & invoice', description: 'Transaction record archive, commission invoice, client handoff.' },
        ],
        useCases: [
          { title: 'Residential listing', example: 'Pipeline stage tracking, listing agreement, closing checklist, commission bill.' },
          { title: 'Property management retainer', example: 'Monthly management agreement, vendor scope log, owner reporting.' },
        ],
        faq: [
          { q: 'Can I track multiple listings at once?', a: 'Yes — the deal pipeline gives each listing its own stage and document set.' },
          { q: 'Does it replace my MLS?', a: 'No — WorkVault handles your business ops; MLS remains your listing platform.' },
        ],
        ctaLabel: 'Start real estate workspace',
      },
    ),
    loadingFeatures: [
      'Manage deal pipeline',
      'Send listing agreements',
      'Track transactions',
      'Invoice commissions',
    ],
  }),

  education: config({
    id: 'education',
    category: 'care',
    icon: GraduationCap,
    label: 'Education & Tutoring',
    shortLabel: 'Education',
    description: 'Tutors, course creators, trainers, and educational consultants.',
    editionLabel: 'Education Edition',
    hiddenRoutes: ['hosting', 'cursor-cli', 'subcontractors', 'tax-1099'],
    mobileTabRoutes: ['dashboard', 'time', 'invoices', 'clients'],
    navLabels: {
      clients: 'Students / Clients',
      contracts: 'Learning Agreements',
      time: 'Session Tracker',
      records: 'Lesson Records',
      proposals: 'Course Proposals',
      pipeline: 'Enrollment Pipeline',
    },
    terminology: {
      ...BASE_TERMINOLOGY,
      client: 'Student',
      clients: 'Students',
      contract: 'Learning Agreement',
      contracts: 'Learning Agreements',
      project: 'Course / Program',
      workProtection: 'Content Protection',
      licenses: 'Certifications',
      subcontractor: 'Assistant',
    },
    onboarding: {
      welcomeTitle: 'WorkVault for Educators',
      welcomeBody:
        'Track tutoring sessions, send learning agreements, manage enrollments, protect course materials, and invoice parents or institutions.',
      highlights: ['Session Tracking', 'Learning Agreements', 'Enrollment Pipeline', 'Content Protection'],
    },
    dashboard: {
      badge: 'Learning Hub',
      subtitle:
        'Your learning hub — schedule sessions, track teaching hours, manage enrollments, and invoice for programs.',
      quickActions: [
        { route: '/time', label: 'Log Session' },
        { route: '/proposals', label: 'Course Proposal' },
        { route: '/invoices', label: 'Invoice Package' },
      ],
      statLabels: { protected: 'Protected Courses', clients: 'students' },
      emptyActivity: 'No activity yet. Log a session or send a course proposal.',
    },
    website: web(
      {
        metaDescription:
          'WorkVault for tutors and educators — session tracking, learning agreements, enrollment pipeline, and invoicing.',
        heroTitle: 'Teach, track, and get paid without the admin headache',
        heroSubtitle:
          'Session tracking, learning agreements, enrollment pipeline, protected course materials, and package invoicing.',
        features: ['Session tracking', 'Learning agreements', 'Enrollment pipeline', 'Protected course content'],
        footerTagline: 'TEACH · TRACK · GROW',
      },
      {
        whoItsFor: ['Private tutors and test-prep coaches', 'Course creators selling programs', 'Corporate trainers billing by session'],
        workflows: [
          { title: 'Enroll the student', description: 'Learning agreement, package or hourly terms, parent/client portal optional.' },
          { title: 'Deliver sessions', description: 'Log each session, attach lesson notes, track hours against package.' },
          { title: 'Renew & expand', description: 'Package renewal proposal, course content protection, progress records.' },
        ],
        useCases: [
          { title: 'SAT tutoring package', example: '12-session agreement, timer per lesson, mid-package progress note.' },
          { title: 'Corporate training day', example: 'Day-rate contract, attendance record, materials handoff invoice.' },
        ],
        faq: [
          { q: 'Can parents or schools pay online?', a: 'Yes — connect Stripe or other processors in Integrations for payment links.' },
          { q: 'Can I protect course PDFs and videos?', a: 'Store materials in the document vault and control client access via workspaces.' },
        ],
        ctaLabel: 'Start education workspace',
      },
    ),
    loadingFeatures: [
      'Log tutoring sessions',
      'Send learning agreements',
      'Manage enrollments',
      'Invoice packages',
    ],
  }),

  accounting: config({
    id: 'accounting',
    category: 'professional',
    icon: Calculator,
    label: 'Accounting & Bookkeeping',
    shortLabel: 'Accounting',
    description: 'Bookkeepers, tax preparers, fractional CFOs, and accounting consultants.',
    editionLabel: 'Accounting Edition',
    hiddenRoutes: ['hosting', 'cursor-cli', 'tools', 'subcontractors'],
    mobileTabRoutes: ['dashboard', 'time', 'invoices', 'clients'],
    navLabels: {
      clients: 'Clients',
      contracts: 'Engagement Letters',
      finance: 'Books & Reconciliation',
      'tax-1099': '1099 & Tax Filing',
      records: 'Client Records',
    },
    terminology: { ...BASE_TERMINOLOGY, project: 'Engagement', contract: 'Engagement Letter', contracts: 'Engagement Letters' },
    onboarding: {
      welcomeTitle: 'WorkVault for Accounting',
      welcomeBody: 'Manage client engagements, track billable reconciliation hours, run 1099 workflows, and invoice — organized per client.',
      highlights: ['Client Engagements', '1099 Filing', 'Bank Reconciliation', 'Monthly Billing'],
    },
    dashboard: {
      badge: 'Client Ledger',
      subtitle: 'Your accounting practice — client engagements, billable hours, 1099 prep, and monthly billing in one place.',
      quickActions: [
        { route: '/finance', label: 'Reconcile Accounts' },
        { route: '/tax-1099', label: '1099 Workflow' },
        { route: '/invoices', label: 'Bill Client' },
      ],
      statLabels: { protected: 'Active Engagements', clients: 'clients' },
      emptyActivity: 'No activity yet. Add a client engagement or run reconciliation.',
    },
    website: web(
      {
        metaDescription: 'WorkVault for bookkeepers and accountants — client engagements, 1099 filing, reconciliation, and billing.',
        heroTitle: 'Client accounting work, organized per engagement',
        heroSubtitle: 'Engagement letters, billable reconciliation time, 1099 workflows, bank matching, and client invoicing.',
        features: ['Engagement letters', '1099 & tax filing', 'Bank reconciliation', 'Client billing'],
        footerTagline: 'RECONCILE · FILE · BILL',
      },
      {
        whoItsFor: ['Freelance bookkeepers with multiple clients', 'Tax preparers and seasonal CPAs', 'Fractional CFOs and controllers'],
        workflows: [
          { title: 'Onboard client', description: 'Engagement letter, chart-of-accounts notes, and recurring monthly scope.' },
          { title: 'Monthly close', description: 'Log reconciliation hours, match bank transactions, flag open items.' },
          { title: 'Year-end & bill', description: '1099 prep, export records, and issue monthly or project invoices.' },
        ],
        useCases: [
          { title: 'Monthly bookkeeping retainer', example: '10 clients, 3 hours each, recurring invoice, reconciliation log per client.' },
          { title: 'Seasonal tax prep', example: 'Engagement letter per return, document vault, final prep fee invoice.' },
        ],
        faq: [
          { q: 'Does WorkVault replace QuickBooks?', a: 'No — it organizes your client work, time, and billing alongside export integrations.' },
          { q: 'Can I track 1099 contractors for clients?', a: 'Yes — 1099 workflow and subcontractor payment records are built in.' },
        ],
        ctaLabel: 'Start accounting workspace',
      },
    ),
    loadingFeatures: ['Manage engagements', 'Run reconciliation', 'Prep 1099s', 'Bill clients'],
  }),

  events: config({
    id: 'events',
    category: 'business',
    icon: PartyPopper,
    label: 'Events & Weddings',
    shortLabel: 'Events',
    description: 'Event planners, wedding coordinators, caterers, and venue freelancers.',
    editionLabel: 'Events Edition',
    hiddenRoutes: ['cursor-cli', 'hosting', 'tools'],
    mobileTabRoutes: ['dashboard', 'pipeline', 'invoices', 'clients'],
    navLabels: {
      pipeline: 'Event Pipeline',
      proposals: 'Event Proposals',
      contracts: 'Event Contracts',
      scope: 'Change Requests',
      records: 'Event Records',
      subcontractors: 'Vendors',
    },
    terminology: {
      ...BASE_TERMINOLOGY,
      project: 'Event',
      contract: 'Event Contract',
      contracts: 'Event Contracts',
      subcontractor: 'Vendor',
      client: 'Client',
    },
    onboarding: {
      welcomeTitle: 'WorkVault for Event Pros',
      welcomeBody: 'Pipeline every event, send proposals, manage vendors, track day-of hours, and invoice deposits and balances.',
      highlights: ['Event Pipeline', 'Vendor Management', 'Deposit Invoices', 'Day-of Timeline'],
    },
    dashboard: {
      badge: 'Event HQ',
      subtitle: 'Your event headquarters — pipeline bookings, vendor contracts, change requests, and deposit billing.',
      quickActions: [
        { route: '/pipeline', label: 'View Events' },
        { route: '/proposals', label: 'Send Proposal' },
        { route: '/invoices', label: 'Invoice Deposit' },
      ],
      statLabels: { protected: 'Upcoming Events', clients: 'clients' },
      emptyActivity: 'No activity yet. Add an event to your pipeline.',
    },
    website: web(
      {
        metaDescription: 'WorkVault for event planners — event pipeline, vendor management, proposals, and deposit invoicing.',
        heroTitle: 'Plan events without losing the details',
        heroSubtitle: 'Event pipeline, vendor tracking, proposals, change requests, deposit invoices, and day-of records.',
        features: ['Event pipeline', 'Vendor tracking', 'Proposals & contracts', 'Deposit billing'],
        footerTagline: 'PLAN · COORDINATE · CELEBRATE',
      },
      {
        whoItsFor: ['Wedding and private event planners', 'Corporate event freelancers', 'Coordinators managing vendor teams'],
        workflows: [
          { title: 'Book the event', description: 'Proposal, signed contract, deposit invoice, and pipeline stage set.' },
          { title: 'Coordinate vendors', description: 'Vendor records, scope changes, and document vault for run-of-show.' },
          { title: 'Close out', description: 'Final invoice, vendor payment log, and event archive for testimonials.' },
        ],
        useCases: [
          { title: 'Wedding planning package', example: '50% deposit invoice, vendor sub list, change request for extra hours.' },
          { title: 'Corporate retreat', example: 'Fixed-fee proposal, milestone payments, post-event expense reconciliation.' },
        ],
        faq: [
          { q: 'Can I track vendor payments?', a: 'Yes — vendor/subcontractor records and payment history are included.' },
          { q: 'How do deposits work?', a: 'Issue partial invoices at booking and balance invoices before the event date.' },
        ],
        ctaLabel: 'Start events workspace',
      },
    ),
    loadingFeatures: ['Pipeline events', 'Manage vendors', 'Send proposals', 'Bill deposits'],
  }),

  nonprofit: config({
    id: 'nonprofit',
    category: 'business',
    icon: HeartHandshake,
    label: 'Nonprofit & Grants',
    shortLabel: 'Nonprofit',
    description: 'Nonprofit contractors, grant writers, program consultants, and fiscal sponsors.',
    editionLabel: 'Nonprofit Edition',
    hiddenRoutes: ['cursor-cli', 'hosting', 'tools'],
    mobileTabRoutes: ['dashboard', 'finance', 'invoices', 'clients'],
    navLabels: {
      clients: 'Funders / Partners',
      contracts: 'Grant Agreements',
      finance: 'Program Finance',
      records: 'Program Records',
      proposals: 'Grant Proposals',
      pipeline: 'Grant Pipeline',
    },
    terminology: {
      ...BASE_TERMINOLOGY,
      client: 'Funder',
      clients: 'Funders & Partners',
      contract: 'Grant Agreement',
      contracts: 'Grant Agreements',
      project: 'Program',
    },
    onboarding: {
      welcomeTitle: 'WorkVault for Nonprofits',
      welcomeBody: 'Track grant pipelines, manage funder agreements, log program hours, and document deliverables for reporting.',
      highlights: ['Grant Pipeline', 'Program Records', 'Funder Agreements', 'Deliverable Tracking'],
    },
    dashboard: {
      badge: 'Program Office',
      subtitle: 'Your program office — grant pipeline, funder agreements, deliverable records, and reporting-ready exports.',
      quickActions: [
        { route: '/pipeline', label: 'Grant Pipeline' },
        { route: '/proposals', label: 'Grant Proposal' },
        { route: '/records', label: 'Log Deliverable' },
      ],
      statLabels: { protected: 'Active Programs', clients: 'funders' },
      emptyActivity: 'No activity yet. Add a grant to your pipeline.',
    },
    website: web(
      {
        metaDescription: 'WorkVault for nonprofits — grant pipeline, program records, funder agreements, and deliverable tracking.',
        heroTitle: 'Grant and program work, documented for reporting',
        heroSubtitle: 'Grant pipeline, funder agreements, program time, deliverable records, and export-ready documentation.',
        features: ['Grant pipeline', 'Program records', 'Funder agreements', 'Deliverable tracking'],
        footerTagline: 'SERVE · DOCUMENT · REPORT',
      },
      {
        whoItsFor: ['Grant writers and fundraising consultants', 'Program contractors on restricted funds', 'Fiscal sponsor project leads'],
        workflows: [
          { title: 'Pursue funding', description: 'Grant proposal, pipeline stage, and submission checklist.' },
          { title: 'Execute program', description: 'Track hours and expenses against grant budget categories.' },
          { title: 'Report & renew', description: 'Deliverable log, export records, and renewal proposal.' },
        ],
        useCases: [
          { title: 'Foundation grant', example: 'Award agreement, quarterly deliverables, hour log for reporting.' },
          { title: 'Consultant RFP response', example: 'Proposal pipeline, subcontractor budget, signed contract archive.' },
        ],
        faq: [
          { q: 'Can I track restricted vs unrestricted funds?', a: 'Use projects and finance categories to separate program budgets.' },
          { q: 'Is this a fund accounting system?', a: 'It documents program work and billing — pair with your accounting tools for GL.' },
        ],
        ctaLabel: 'Start nonprofit workspace',
      },
    ),
    loadingFeatures: ['Track grant pipeline', 'Log program hours', 'Store agreements', 'Document deliverables'],
  }),

  fitness: config({
    id: 'fitness',
    category: 'care',
    icon: Dumbbell,
    label: 'Fitness & Training',
    shortLabel: 'Fitness',
    description: 'Personal trainers, yoga instructors, coaches, and gym contractors.',
    editionLabel: 'Fitness Edition',
    hiddenRoutes: ['hosting', 'cursor-cli', 'subcontractors', 'tools', 'tax-1099'],
    mobileTabRoutes: ['dashboard', 'time', 'invoices', 'clients'],
    navLabels: {
      clients: 'Clients / Members',
      contracts: 'Training Agreements',
      time: 'Session Tracker',
      records: 'Training Records',
      proposals: 'Program Packages',
    },
    terminology: {
      ...BASE_TERMINOLOGY,
      client: 'Client',
      clients: 'Clients',
      contract: 'Training Agreement',
      contracts: 'Training Agreements',
      project: 'Training Program',
    },
    onboarding: {
      welcomeTitle: 'WorkVault for Fitness Pros',
      welcomeBody: 'Sell training packages, log sessions, track client progress, and invoice — from gym floor or mobile.',
      highlights: ['Session Tracking', 'Training Packages', 'Client Progress', 'Package Billing'],
    },
    dashboard: {
      badge: 'Training Floor',
      subtitle: 'Your training business — session logs, package tracking, client agreements, and recurring billing.',
      quickActions: [
        { route: '/time', label: 'Log Session' },
        { route: '/proposals', label: 'Sell Package' },
        { route: '/invoices', label: 'Invoice Client' },
      ],
      statLabels: { protected: 'Active Programs', clients: 'clients' },
      emptyActivity: 'No activity yet. Log a session or sell a package.',
    },
    website: web(
      {
        metaDescription: 'WorkVault for personal trainers — session tracking, training packages, client agreements, and invoicing.',
        heroTitle: 'Train clients and run your business between sets',
        heroSubtitle: 'Session tracking, training packages, progress records, agreements, and package invoicing.',
        features: ['Session tracking', 'Training packages', 'Client agreements', 'Package billing'],
        footerTagline: 'TRAIN · TRACK · TRANSFORM',
      },
      {
        whoItsFor: ['Independent personal trainers', 'Yoga and Pilates instructors', 'Online fitness coaches'],
        workflows: [
          { title: 'Sell a package', description: 'Training agreement, session bundle, and upfront or split invoice.' },
          { title: 'Run sessions', description: 'Log each session against package balance with notes in records.' },
          { title: 'Renew clients', description: 'Package renewal proposal when sessions run low.' },
        ],
        useCases: [
          { title: '12-session bundle', example: 'Package invoice, session counter via time log, renewal at session 10.' },
          { title: 'Online coaching', example: 'Monthly retainer agreement, weekly check-in time, progress notes.' },
        ],
        faq: [
          { q: 'Can I track sessions remaining in a package?', a: 'Log time entries per client and compare against purchased package size.' },
          { q: 'Does it work on mobile at the gym?', a: 'Yes — use the PWA or mobile app for quick session logging.' },
        ],
        ctaLabel: 'Start fitness workspace',
      },
    ),
    loadingFeatures: ['Log training sessions', 'Sell packages', 'Track client progress', 'Invoice clients'],
  }),

  architecture: config({
    id: 'architecture',
    category: 'professional',
    icon: Compass,
    label: 'Architecture & Design',
    shortLabel: 'Architecture',
    description: 'Architects, interior designers, landscape designers, and drafters.',
    editionLabel: 'Architecture Edition',
    hiddenRoutes: ['cursor-cli', 'hosting'],
    mobileTabRoutes: ['dashboard', 'pipeline', 'contracts', 'clients'],
    navLabels: {
      pipeline: 'Project Pipeline',
      proposals: 'Design Proposals',
      contracts: 'Design Agreements',
      scope: 'Design Changes',
      records: 'Drawing Records',
      licenses: 'Licenses & Stamps',
    },
    terminology: {
      ...BASE_TERMINOLOGY,
      project: 'Design Project',
      contract: 'Design Agreement',
      contracts: 'Design Agreements',
      workProtection: 'Design IP',
    },
    onboarding: {
      welcomeTitle: 'WorkVault for Architects & Designers',
      welcomeBody: 'Manage design phases, track billable hours by phase, log scope changes, and protect drawing IP.',
      highlights: ['Phase Tracking', 'Design Changes', 'Drawing Records', 'License Tracking'],
    },
    dashboard: {
      badge: 'Design Studio',
      subtitle: 'Your design studio — phase-based time, scope changes, drawing records, and license tracking.',
      quickActions: [
        { route: '/pipeline', label: 'View Projects' },
        { route: '/time', label: 'Log Phase Hours' },
        { route: '/scope', label: 'Log Design Change' },
      ],
      statLabels: { protected: 'Protected Designs', clients: 'clients' },
      emptyActivity: 'No activity yet. Add a design project or log phase hours.',
    },
    website: web(
      {
        metaDescription: 'WorkVault for architects and designers — design phases, scope changes, drawing records, and billing.',
        heroTitle: 'Design projects from schematic to stamp',
        heroSubtitle: 'Phase-based time tracking, design change orders, drawing records, license tracking, and client billing.',
        features: ['Design phase tracking', 'Scope change orders', 'Drawing records', 'License tracking'],
        footerTagline: 'DESIGN · DOCUMENT · DELIVER',
      },
      {
        whoItsFor: ['Licensed architects and design studios', 'Interior designers on hourly or fixed fee', 'Landscape and spatial designers'],
        workflows: [
          { title: 'Win the project', description: 'Design proposal, phased fee schedule, and signed agreement.' },
          { title: 'Work by phase', description: 'SD/DD/CD hour tracking, change orders when program shifts.' },
          { title: 'Deliver & archive', description: 'Drawing record, IP protection, final invoice per phase.' },
        ],
        useCases: [
          { title: 'Residential remodel', example: 'Phased hours, two change orders, stamp license on file, final CA hours.' },
          { title: 'Interior design retainer', example: 'Monthly design hours cap, procurement scope log, client preview.' },
        ],
        faq: [
          { q: 'Can I bill by design phase?', a: 'Track time against projects and phases, then invoice per milestone or hourly.' },
          { q: 'How are drawing revisions handled?', a: 'Log extras in the scope change log and attach records to the project vault.' },
        ],
        ctaLabel: 'Start architecture workspace',
      },
    ),
    loadingFeatures: ['Track design phases', 'Log scope changes', 'Archive drawings', 'Bill by milestone'],
  }),

  music: config({
    id: 'music',
    category: 'creative',
    icon: Music,
    label: 'Music & Audio',
    shortLabel: 'Music',
    description: 'Producers, engineers, session musicians, composers, and podcast editors.',
    editionLabel: 'Music Edition',
    hiddenRoutes: ['cursor-cli', 'subcontractors', 'tax-1099', 'tools'],
    mobileTabRoutes: ['dashboard', 'time', 'invoices', 'clients'],
    navLabels: {
      proposals: 'Session Quotes',
      contracts: 'Work-for-Hire / License',
      protection: 'Rights & Royalties',
      records: 'Session Records',
      hosting: 'Stems & Previews',
    },
    terminology: {
      ...BASE_TERMINOLOGY,
      project: 'Session / Release',
      contract: 'Work-for-Hire Agreement',
      contracts: 'Work-for-Hire Agreements',
      workProtection: 'Rights & Royalties',
    },
    onboarding: {
      welcomeTitle: 'WorkVault for Music & Audio',
      welcomeBody: 'Quote sessions, track studio hours, document work-for-hire terms, protect masters, and invoice labels and artists.',
      highlights: ['Session Quotes', 'Studio Time', 'Work-for-Hire Terms', 'Rights Protection'],
    },
    dashboard: {
      badge: 'Studio Desk',
      subtitle: 'Your studio desk — session quotes, studio hour logs, rights documentation, and client billing.',
      quickActions: [
        { route: '/time', label: 'Log Studio Time' },
        { route: '/proposals', label: 'Send Quote' },
        { route: '/protection', label: 'Document Rights' },
      ],
      statLabels: { protected: 'Protected Masters', clients: 'clients' },
      emptyActivity: 'No activity yet. Log studio time or send a session quote.',
    },
    website: web(
      {
        metaDescription: 'WorkVault for music producers and audio engineers — session quotes, studio time, rights, and invoicing.',
        heroTitle: 'Studio sessions, rights, and invoices in sync',
        heroSubtitle: 'Session quotes, studio hour tracking, work-for-hire agreements, rights protection, and client billing.',
        features: ['Session quotes', 'Studio hour tracking', 'Work-for-hire agreements', 'Rights protection'],
        footerTagline: 'RECORD · OWN · RELEASE',
      },
      {
        whoItsFor: ['Producers and mixing engineers', 'Session musicians and composers', 'Podcast editors and audio post houses'],
        workflows: [
          { title: 'Quote the session', description: 'Day rate or hourly quote, work-for-hire terms, deposit invoice.' },
          { title: 'Track studio time', description: 'Log tracking, mixing, and revision hours separately.' },
          { title: 'Deliver masters', description: 'Rights record, stem handoff link, final session invoice.' },
        ],
        useCases: [
          { title: 'Album mixing project', example: 'Per-song quote, revision cap in contract, masters protection record.' },
          { title: 'Podcast editing retainer', example: 'Monthly hour bundle, episode log, recurring invoice.' },
        ],
        faq: [
          { q: 'Can I document work-for-hire vs licensing?', a: 'Yes — contracts and protection records capture terms per project.' },
          { q: 'How do revision rounds work?', a: 'Define revision limits in quotes and log overages in the scope log.' },
        ],
        ctaLabel: 'Start music workspace',
      },
    ),
    loadingFeatures: ['Quote sessions', 'Log studio hours', 'Document rights', 'Invoice clients'],
  }),

  culinary: config({
    id: 'culinary',
    category: 'trades',
    icon: ChefHat,
    label: 'Culinary & Catering',
    shortLabel: 'Culinary',
    description: 'Private chefs, caterers, food trucks, and recipe consultants.',
    editionLabel: 'Culinary Edition',
    hiddenRoutes: ['cursor-cli', 'hosting', 'tools'],
    mobileTabRoutes: ['dashboard', 'pipeline', 'invoices', 'clients'],
    navLabels: {
      pipeline: 'Booking Pipeline',
      proposals: 'Menu Proposals',
      contracts: 'Catering Agreements',
      scope: 'Menu Changes',
      records: 'Event Menus',
      subcontractors: 'Vendor Suppliers',
    },
    terminology: {
      ...BASE_TERMINOLOGY,
      project: 'Event / Service',
      contract: 'Catering Agreement',
      contracts: 'Catering Agreements',
      subcontractor: 'Supplier',
      client: 'Client',
    },
    onboarding: {
      welcomeTitle: 'WorkVault for Culinary Pros',
      welcomeBody: 'Book events, send menu proposals, track prep and service hours, manage suppliers, and invoice deposits.',
      highlights: ['Menu Proposals', 'Event Bookings', 'Prep Time Tracking', 'Deposit Billing'],
    },
    dashboard: {
      badge: 'Kitchen Ops',
      subtitle: 'Your kitchen ops — menu proposals, event bookings, prep hour logs, and deposit invoicing.',
      quickActions: [
        { route: '/pipeline', label: 'View Bookings' },
        { route: '/proposals', label: 'Send Menu Proposal' },
        { route: '/invoices', label: 'Invoice Deposit' },
      ],
      statLabels: { protected: 'Booked Events', clients: 'clients' },
      emptyActivity: 'No activity yet. Add a catering booking or send a menu proposal.',
    },
    website: web(
      {
        metaDescription: 'WorkVault for caterers and private chefs — menu proposals, event bookings, prep time, and invoicing.',
        heroTitle: 'From menu proposal to final service',
        heroSubtitle: 'Menu proposals, catering agreements, prep and service time tracking, supplier records, and deposit billing.',
        features: ['Menu proposals', 'Event bookings', 'Prep time tracking', 'Deposit billing'],
        footerTagline: 'PREP · SERVE · SATISFY',
      },
      {
        whoItsFor: ['Private chefs and personal caterers', 'Food truck operators booking events', 'Recipe and menu consultants'],
        workflows: [
          { title: 'Propose the menu', description: 'Menu proposal, headcount pricing, and tasting deposit invoice.' },
          { title: 'Prep & execute', description: 'Log prep and service hours, menu change log, supplier payments.' },
          { title: 'Close the event', description: 'Final invoice, menu archive, client feedback record.' },
        ],
        useCases: [
          { title: 'Wedding catering', example: 'Menu tiers in proposal, 40% deposit, final guest-count adjustment invoice.' },
          { title: 'Weekly meal prep client', example: 'Retainer agreement, recurring delivery log, monthly invoice.' },
        ],
        faq: [
          { q: 'Can I handle last-minute guest count changes?', a: 'Log adjustments in the scope change log and issue a revised invoice.' },
          { q: 'Do you track supplier costs?', a: 'Record vendor/supplier payments alongside event records for margin tracking.' },
        ],
        ctaLabel: 'Start culinary workspace',
      },
    ),
    loadingFeatures: ['Send menu proposals', 'Book events', 'Log prep hours', 'Bill deposits'],
  }),

  translation: config({
    id: 'translation',
    category: 'professional',
    icon: Languages,
    label: 'Translation & Interpretation',
    shortLabel: 'Translation',
    description: 'Translators, interpreters, localization specialists, and subtitlers.',
    editionLabel: 'Translation Edition',
    hiddenRoutes: ['hosting', 'cursor-cli', 'subcontractors', 'tools', 'licenses'],
    mobileTabRoutes: ['dashboard', 'time', 'invoices', 'clients'],
    navLabels: {
      proposals: 'Project Quotes',
      contracts: 'Assignment Agreements',
      protection: 'IP & Confidentiality',
      records: 'Delivery Log',
      scope: 'Revision Log',
    },
    terminology: {
      ...BASE_TERMINOLOGY,
      project: 'Translation Project',
      contract: 'Assignment Agreement',
      contracts: 'Assignment Agreements',
      workProtection: 'Confidentiality & IP',
    },
    onboarding: {
      welcomeTitle: 'WorkVault for Translators',
      welcomeBody: 'Quote per-word projects, track translation hours, protect confidential source files, and invoice agencies and clients.',
      highlights: ['Project Quotes', 'Word-Count Projects', 'Confidentiality', 'Delivery Log'],
    },
    dashboard: {
      badge: 'Translation Desk',
      subtitle: 'Your translation desk — project quotes, delivery logs, confidentiality records, and agency billing.',
      quickActions: [
        { route: '/proposals', label: 'Send Quote' },
        { route: '/time', label: 'Log Project Time' },
        { route: '/records', label: 'Log Delivery' },
      ],
      statLabels: { protected: 'Protected Projects', clients: 'clients' },
      emptyActivity: 'No activity yet. Send a project quote or log delivery.',
    },
    website: web(
      {
        metaDescription: 'WorkVault for translators — project quotes, delivery logs, confidentiality, and invoicing.',
        heroTitle: 'Translate, deliver, and bill with confidence',
        heroSubtitle: 'Project quotes, translation time tracking, confidentiality protection, delivery logs, and client invoicing.',
        features: ['Project quotes', 'Delivery logging', 'Confidentiality protection', 'Agency invoicing'],
        footerTagline: 'TRANSLATE · DELIVER · INVOICE',
      },
      {
        whoItsFor: ['Freelance translators for agencies', 'Conference interpreters', 'Localization and subtitling specialists'],
        workflows: [
          { title: 'Quote the project', description: 'Word-count or hourly quote, NDA terms, and deadline in contract.' },
          { title: 'Translate & QA', description: 'Log hours, protect source files, track revision rounds.' },
          { title: 'Deliver & bill', description: 'Delivery log entry, final file handoff, invoice with PO reference.' },
        ],
        useCases: [
          { title: 'Agency translation batch', example: 'Per-word quote, confidentiality record, delivery log, net-30 invoice.' },
          { title: 'Conference interpreting day', example: 'Day rate contract, session time log, expense receipt in documents.' },
        ],
        faq: [
          { q: 'Can I protect confidential source documents?', a: 'Store files in the vault with confidentiality and IP protection records.' },
          { q: 'How do I track revision rounds?', a: 'Use the revision log when agencies request changes beyond the agreed scope.' },
        ],
        ctaLabel: 'Start translation workspace',
      },
    ),
    loadingFeatures: ['Send project quotes', 'Log translation time', 'Protect source files', 'Log deliveries'],
  }),

  research: config({
    id: 'research',
    category: 'professional',
    icon: Microscope,
    label: 'Research & Academia',
    shortLabel: 'Research',
    description: 'Research consultants, lab contractors, grant researchers, and academic freelancers.',
    editionLabel: 'Research Edition',
    hiddenRoutes: ['hosting', 'cursor-cli', 'tools'],
    mobileTabRoutes: ['dashboard', 'time', 'contracts', 'clients'],
    navLabels: {
      clients: 'Institutions / PIs',
      contracts: 'Research Agreements',
      records: 'Lab & Study Records',
      proposals: 'Grant Proposals',
      finance: 'Grant Finance',
    },
    terminology: {
      ...BASE_TERMINOLOGY,
      client: 'Institution',
      clients: 'Institutions',
      contract: 'Research Agreement',
      contracts: 'Research Agreements',
      project: 'Study / Grant',
    },
    onboarding: {
      welcomeTitle: 'WorkVault for Researchers',
      welcomeBody: 'Manage study timelines, track lab hours, document deliverables for grants, and invoice institutions.',
      highlights: ['Study Records', 'Grant Proposals', 'Lab Hour Tracking', 'Deliverable Logs'],
    },
    dashboard: {
      badge: 'Research Lab',
      subtitle: 'Your research ops — study timelines, lab hour logs, grant deliverables, and institutional billing.',
      quickActions: [
        { route: '/time', label: 'Log Lab Hours' },
        { route: '/records', label: 'Log Deliverable' },
        { route: '/proposals', label: 'Grant Proposal' },
      ],
      statLabels: { protected: 'Active Studies', clients: 'institutions' },
      emptyActivity: 'No activity yet. Log lab hours or add a study record.',
    },
    website: web(
      {
        metaDescription: 'WorkVault for researchers — study records, lab hours, grant proposals, and institutional billing.',
        heroTitle: 'Research deliverables and hours, grant-ready',
        heroSubtitle: 'Study records, lab hour tracking, grant proposals, deliverable logs, and institutional invoicing.',
        features: ['Study records', 'Lab hour tracking', 'Grant proposals', 'Deliverable logs'],
        footerTagline: 'RESEARCH · RECORD · REPORT',
      },
      {
        whoItsFor: ['Independent research consultants', 'Lab contractors on sponsored studies', 'Grant writers in academia'],
        workflows: [
          { title: 'Set up study', description: 'Research agreement, milestone timeline, and budget categories.' },
          { title: 'Execute & log', description: 'Lab hours, experiment notes in records, expense tracking.' },
          { title: 'Report deliverable', description: 'Milestone log, export bundle, invoice institution or PI.' },
        ],
        useCases: [
          { title: 'NIH subaward consulting', example: 'Hourly consulting agreement, monthly deliverable log, institutional invoice.' },
          { title: 'Industry-sponsored study', example: 'Fixed milestone contract, lab hour cap, final report archive.' },
        ],
        faq: [
          { q: 'Can I separate hours by grant?', a: 'Yes — tie time entries and records to specific study/project IDs.' },
          { q: 'Is this an ELN (electronic lab notebook)?', a: 'It logs study records and hours — use alongside your lab systems as needed.' },
        ],
        ctaLabel: 'Start research workspace',
      },
    ),
    loadingFeatures: ['Log lab hours', 'Track study milestones', 'Store grant proposals', 'Report deliverables'],
  }),

  cleaning: config({
    id: 'cleaning',
    category: 'trades',
    icon: SprayCan,
    label: 'Cleaning Services',
    shortLabel: 'Cleaning',
    description: 'Residential and commercial cleaners, janitorial contractors, and move-out specialists.',
    editionLabel: 'Cleaning Edition',
    hiddenRoutes: ['hosting', 'cursor-cli', 'proposals', 'tools'],
    mobileTabRoutes: ['dashboard', 'time', 'invoices', 'clients'],
    navLabels: {
      clients: 'Customers',
      contracts: 'Service Agreements',
      time: 'Job Time Log',
      scope: 'Extra Services',
      records: 'Job Records',
      pipeline: 'Recurring Schedule',
    },
    terminology: {
      ...BASE_TERMINOLOGY,
      client: 'Customer',
      clients: 'Customers',
      contract: 'Service Agreement',
      contracts: 'Service Agreements',
      project: 'Job / Route',
      workProtection: 'Service Guarantee',
    },
    onboarding: {
      welcomeTitle: 'WorkVault for Cleaning Pros',
      welcomeBody: 'Manage recurring routes, log job time, track extra services, and invoice residential and commercial customers.',
      highlights: ['Recurring Routes', 'Job Time Logs', 'Extra Service Tracking', 'Customer Billing'],
    },
    dashboard: {
      badge: 'Route Manager',
      subtitle: 'Your route manager — recurring customers, job time logs, extra service charges, and monthly billing.',
      quickActions: [
        { route: '/pipeline', label: 'View Routes' },
        { route: '/time', label: 'Log Job Time' },
        { route: '/invoices', label: 'Invoice Customer' },
      ],
      statLabels: { protected: 'Active Routes', clients: 'customers' },
      emptyActivity: 'No activity yet. Add a customer or log a job.',
    },
    website: web(
      {
        metaDescription: 'WorkVault for cleaning businesses — recurring routes, job time, extra services, and customer invoicing.',
        heroTitle: 'Run your cleaning routes and billing in one place',
        heroSubtitle: 'Recurring service agreements, job time logs, extra service tracking, and customer invoicing.',
        features: ['Recurring routes', 'Job time logs', 'Extra service tracking', 'Customer billing'],
        footerTagline: 'CLEAN · TRACK · BILL',
      },
      {
        whoItsFor: ['Residential cleaning business owners', 'Commercial janitorial contractors', 'Move-out and deep-clean specialists'],
        workflows: [
          { title: 'Sign up customer', description: 'Service agreement, recurring schedule, and first-month invoice.' },
          { title: 'Complete jobs', description: 'Log time per visit, note extra services in scope log.' },
          { title: 'Bill monthly', description: 'Recurring invoice plus any extra-service line items.' },
        ],
        useCases: [
          { title: 'Weekly home cleaning', example: 'Bi-weekly route, 2-hour visit log, quarterly deep-clean upsell invoice.' },
          { title: 'Office janitorial contract', example: 'Commercial agreement, nightly job logs, monthly consolidated billing.' },
        ],
        faq: [
          { q: 'Can I track recurring vs one-time jobs?', a: 'Use the pipeline for recurring routes and one-off jobs as separate entries.' },
          { q: 'How do I bill for extras like oven cleaning?', a: 'Log extras in the scope change log and add line items to the invoice.' },
        ],
        ctaLabel: 'Start cleaning workspace',
      },
    ),
    loadingFeatures: ['Manage routes', 'Log job time', 'Track extra services', 'Bill customers'],
  }),

  automotive: config({
    id: 'automotive',
    category: 'trades',
    icon: Car,
    label: 'Automotive & Repair',
    shortLabel: 'Automotive',
    description: 'Mobile mechanics, auto detailers, independent repair shops, and fleet contractors.',
    editionLabel: 'Automotive Edition',
    hiddenRoutes: ['hosting', 'cursor-cli', 'proposals'],
    mobileTabRoutes: ['dashboard', 'time', 'invoices', 'clients'],
    navLabels: {
      clients: 'Customers',
      contracts: 'Service Agreements',
      scope: 'Repair Orders',
      tools: 'Equipment',
      records: 'Service Records',
      licenses: 'Certs & ASE',
    },
    terminology: {
      ...BASE_TERMINOLOGY,
      client: 'Customer',
      clients: 'Customers',
      contract: 'Service Agreement',
      contracts: 'Service Agreements',
      project: 'Repair Job',
      workProtection: 'Warranty Record',
      licenses: 'Certs & ASE',
    },
    onboarding: {
      welcomeTitle: 'WorkVault for Auto Pros',
      welcomeBody: 'Write repair orders, log bay hours, track parts and warranty, and invoice customers — shop or mobile.',
      highlights: ['Repair Orders', 'Bay Time Tracking', 'Warranty Records', 'Customer Invoices'],
    },
    dashboard: {
      badge: 'Service Bay',
      subtitle: 'Your service bay — repair orders, bay hour logs, warranty records, and customer invoicing.',
      quickActions: [
        { route: '/scope', label: 'New Repair Order' },
        { route: '/time', label: 'Log Bay Time' },
        { route: '/invoices', label: 'Invoice Customer' },
      ],
      statLabels: { protected: 'Open Repair Orders', clients: 'customers' },
      emptyActivity: 'No activity yet. Open a repair order or log bay time.',
    },
    website: web(
      {
        metaDescription: 'WorkVault for auto repair and detailing — repair orders, bay time, warranty records, and invoicing.',
        heroTitle: 'Repair orders to paid invoices, bay to bay',
        heroSubtitle: 'Repair orders, bay hour tracking, warranty documentation, ASE cert tracking, and customer billing.',
        features: ['Repair orders', 'Bay time tracking', 'Warranty records', 'Customer billing'],
        footerTagline: 'DIAGNOSE · REPAIR · INVOICE',
      },
      {
        whoItsFor: ['Independent mobile mechanics', 'Auto detailing business owners', 'Small shop owners and fleet contractors'],
        workflows: [
          { title: 'Open repair order', description: 'Customer intake, estimate scope, and authorization to proceed.' },
          { title: 'Work the job', description: 'Log bay hours, parts notes, and photos in service records.' },
          { title: 'Close & warranty', description: 'Final invoice, warranty record, and service history for repeat customers.' },
        ],
        useCases: [
          { title: 'Brake job', example: 'Repair order, 2.5 bay hours, parts markup in invoice, 90-day warranty log.' },
          { title: 'Fleet maintenance contract', example: 'Monthly service agreement, recurring visit logs, consolidated billing.' },
        ],
        faq: [
          { q: 'Can I track warranty periods?', a: 'Yes — attach warranty records to completed repair orders in service records.' },
          { q: 'Does it integrate with parts suppliers?', a: 'Log parts costs in scope/repair orders; use integrations for exports as needed.' },
        ],
        ctaLabel: 'Start automotive workspace',
      },
    ),
    loadingFeatures: ['Open repair orders', 'Log bay hours', 'Document warranties', 'Invoice customers'],
  }),

  'pet-services': config({
    id: 'pet-services',
    category: 'care',
    icon: PawPrint,
    label: 'Pet Services',
    shortLabel: 'Pet Care',
    description: 'Dog walkers, pet sitters, groomers, trainers, and mobile vet contractors.',
    editionLabel: 'Pet Care Edition',
    hiddenRoutes: ['hosting', 'cursor-cli', 'subcontractors', 'tools', 'tax-1099'],
    mobileTabRoutes: ['dashboard', 'time', 'invoices', 'clients'],
    navLabels: {
      clients: 'Pet Parents',
      contracts: 'Care Agreements',
      time: 'Visit Tracker',
      records: 'Pet Care Records',
      pipeline: 'Booking Schedule',
    },
    terminology: {
      ...BASE_TERMINOLOGY,
      client: 'Pet Parent',
      clients: 'Pet Parents',
      contract: 'Care Agreement',
      contracts: 'Care Agreements',
      project: 'Pet / Booking',
    },
    onboarding: {
      welcomeTitle: 'WorkVault for Pet Pros',
      welcomeBody: 'Schedule walks and visits, log care notes, send care agreements, and invoice pet parents — perfect for mobile work.',
      highlights: ['Visit Tracking', 'Care Agreements', 'Pet Records', 'Recurring Billing'],
    },
    dashboard: {
      badge: 'Pet Care Hub',
      subtitle: 'Your pet care hub — visit logs, care notes, pet parent agreements, and recurring billing.',
      quickActions: [
        { route: '/time', label: 'Log Visit' },
        { route: '/pipeline', label: 'View Schedule' },
        { route: '/invoices', label: 'Invoice Parent' },
      ],
      statLabels: { protected: 'Active Pets', clients: 'pet parents' },
      emptyActivity: 'No activity yet. Log a visit or add a pet parent.',
    },
    website: web(
      {
        metaDescription: 'WorkVault for pet sitters and groomers — visit tracking, care agreements, pet records, and invoicing.',
        heroTitle: 'Pet care visits, notes, and billing — all leashed together',
        heroSubtitle: 'Visit tracking, care agreements, pet health notes, booking schedule, and recurring parent billing.',
        features: ['Visit tracking', 'Care agreements', 'Pet care records', 'Recurring billing'],
        footerTagline: 'CARE · LOG · EARN',
      },
      {
        whoItsFor: ['Dog walkers and pet sitters', 'Mobile groomers', 'Pet trainers with package billing'],
        workflows: [
          { title: 'Onboard pet parent', description: 'Care agreement, pet profile notes, and recurring schedule setup.' },
          { title: 'Log each visit', description: 'Visit timer, care notes, and photo record optional in documents.' },
          { title: 'Bill regularly', description: 'Weekly or monthly recurring invoice based on visit log.' },
        ],
        useCases: [
          { title: 'Daily dog walking', example: '5-day schedule, 30-min visit logs, monthly parent invoice.' },
          { title: 'Pet sitting vacation', example: 'Flat-rate care agreement, daily visit notes, deposit + balance invoice.' },
        ],
        faq: [
          { q: 'Can I manage multiple pets per household?', a: 'Use client records and notes to track each pet under one pet parent.' },
          { q: 'Does it work on mobile during walks?', a: 'Yes — log visits from the PWA or phone with one tap.' },
        ],
        ctaLabel: 'Start pet care workspace',
      },
    ),
    loadingFeatures: ['Log pet visits', 'Schedule bookings', 'Store care notes', 'Bill pet parents'],
  }),

  insurance: config({
    id: 'insurance',
    category: 'professional',
    icon: Umbrella,
    label: 'Insurance & Adjusting',
    shortLabel: 'Insurance',
    description: 'Independent agents, brokers, adjusters, and insurance consultants.',
    editionLabel: 'Insurance Edition',
    hiddenRoutes: ['hosting', 'cursor-cli', 'tools', 'subcontractors'],
    mobileTabRoutes: ['dashboard', 'pipeline', 'contracts', 'clients'],
    navLabels: { pipeline: 'Policy Pipeline', contracts: 'Policy Agreements', records: 'Policy Records', clients: 'Policyholders' },
    terminology: { ...BASE_TERMINOLOGY, client: 'Policyholder', clients: 'Policyholders', contract: 'Policy Agreement', contracts: 'Policy Agreements', project: 'Policy' },
    onboarding: {
      welcomeTitle: 'WorkVault for Insurance Pros',
      welcomeBody: 'Pipeline policies, track client renewals, store compliance docs, and invoice consulting fees.',
      highlights: ['Policy Pipeline', 'Renewal Tracking', 'Compliance Docs', 'Fee Invoicing'],
    },
    dashboard: {
      badge: 'Agency Desk',
      subtitle: 'Your agency desk — policy pipeline, renewal reminders, client records, and fee billing.',
      quickActions: [{ route: '/pipeline', label: 'Policy Pipeline' }, { route: '/contracts', label: 'New Policy' }, { route: '/invoices', label: 'Invoice Fee' }],
      statLabels: { protected: 'Active Policies', clients: 'policyholders' },
      emptyActivity: 'No activity yet. Add a policyholder or open the pipeline.',
    },
    website: web(
      { metaDescription: 'WorkVault for insurance agents — policy pipeline, renewals, compliance records, and fee billing.', heroTitle: 'Policies, renewals, and client records organized', heroSubtitle: 'Policy pipeline, renewal tracking, compliance document vault, and consulting fee invoicing.', features: ['Policy pipeline', 'Renewal tracking', 'Compliance docs', 'Fee billing'], footerTagline: 'COVER · RENEW · SERVE' },
      { whoItsFor: ['Independent P&C agents', 'Claims adjusters on contract', 'Benefits consultants'], workflows: [{ title: 'Quote & bind', description: 'Pipeline stage from quote to bound policy with agreement on file.' }, { title: 'Service the policy', description: 'Document endorsements, log service hours, store compliance files.' }, { title: 'Renew & bill', description: 'Renewal reminder, updated agreement, consulting fee invoice.' }], useCases: [{ title: 'Commercial policy renewal', example: '90-day renewal alert, endorsement log, renewal fee invoice.' }, { title: 'Claims consulting', example: 'Hourly adjuster contract, site visit time log, weekly invoice.' }], faq: [{ q: 'Is this an AMS replacement?', a: 'No — it organizes your client work and billing alongside your carrier systems.' }, { q: 'Can I track renewal dates?', a: 'Use pipeline stages and license/credential expiry alerts for renewals.' }], ctaLabel: 'Start insurance workspace' },
    ),
    loadingFeatures: ['Manage policy pipeline', 'Track renewals', 'Store compliance docs', 'Bill fees'],
  }),

  fashion: config({
    id: 'fashion',
    category: 'creative',
    icon: Shirt,
    label: 'Fashion & Apparel',
    shortLabel: 'Fashion',
    description: 'Stylists, tailors, custom clothiers, and fashion designers.',
    editionLabel: 'Fashion Edition',
    hiddenRoutes: ['cursor-cli', 'subcontractors', 'tax-1099', 'tools'],
    mobileTabRoutes: ['dashboard', 'pipeline', 'invoices', 'clients'],
    navLabels: { pipeline: 'Order Pipeline', proposals: 'Design Quotes', protection: 'Design IP', records: 'Lookbook Records' },
    terminology: { ...BASE_TERMINOLOGY, project: 'Collection / Order', contract: 'Custom Order Agreement', contracts: 'Order Agreements', workProtection: 'Design IP' },
    onboarding: {
      welcomeTitle: 'WorkVault for Fashion',
      welcomeBody: 'Quote custom orders, track fittings, protect design IP, and invoice clients for bespoke work.',
      highlights: ['Custom Quotes', 'Fitting Schedule', 'Design IP', 'Order Invoicing'],
    },
    dashboard: {
      badge: 'Atelier',
      subtitle: 'Your atelier — custom order pipeline, fitting logs, design protection, and client billing.',
      quickActions: [{ route: '/proposals', label: 'Send Quote' }, { route: '/pipeline', label: 'View Orders' }, { route: '/invoices', label: 'Invoice Order' }],
      statLabels: { protected: 'Protected Designs', clients: 'clients' },
      emptyActivity: 'No activity yet. Send a custom order quote.',
    },
    website: web(
      { metaDescription: 'WorkVault for fashion designers and tailors — custom orders, fittings, design IP, and invoicing.', heroTitle: 'Custom fashion from sketch to final stitch', heroSubtitle: 'Design quotes, order pipeline, fitting tracking, IP protection, and client invoicing.', features: ['Custom order quotes', 'Fitting pipeline', 'Design IP protection', 'Client invoicing'], footerTagline: 'DESIGN · FIT · FINISH' },
      { whoItsFor: ['Bespoke tailors and clothiers', 'Freelance fashion designers', 'Personal stylists on retainer'], workflows: [{ title: 'Quote the order', description: 'Measurement notes, fabric allowance, deposit invoice.' }, { title: 'Fit & adjust', description: 'Log fitting sessions, scope changes for alterations.' }, { title: 'Deliver & bill', description: 'Final garment record, IP documentation, balance invoice.' }], useCases: [{ title: 'Bespoke suit', example: 'Three fitting appointments logged, 50% deposit, final balance on pickup.' }, { title: 'Capsule collection', example: 'Per-piece quotes, pipeline by look, wholesale client invoice run.' }], faq: [{ q: 'Can I track multiple fittings?', a: 'Log each fitting as time entries or notes tied to the order project.' }, { q: 'How do I protect original designs?', a: 'Use work protection records and contracts defining IP ownership.' }], ctaLabel: 'Start fashion workspace' },
    ),
    loadingFeatures: ['Quote custom orders', 'Track fittings', 'Protect designs', 'Invoice clients'],
  }),

  beauty: config({
    id: 'beauty',
    category: 'care',
    icon: Sparkles,
    label: 'Beauty & Salon',
    shortLabel: 'Beauty',
    description: 'Hair stylists, estheticians, makeup artists, and mobile beauty pros.',
    editionLabel: 'Beauty Edition',
    hiddenRoutes: ['hosting', 'cursor-cli', 'subcontractors', 'tools'],
    mobileTabRoutes: ['dashboard', 'time', 'invoices', 'clients'],
    navLabels: { clients: 'Clients', time: 'Appointment Log', contracts: 'Service Agreements', pipeline: 'Booking Calendar', records: 'Service Records' },
    terminology: { ...BASE_TERMINOLOGY, contract: 'Service Agreement', contracts: 'Service Agreements', project: 'Appointment / Package' },
    onboarding: {
      welcomeTitle: 'WorkVault for Beauty Pros',
      welcomeBody: 'Book appointments, sell service packages, log chair time, and invoice — booth renter or mobile.',
      highlights: ['Appointment Tracking', 'Service Packages', 'Client Records', 'Mobile Booking'],
    },
    dashboard: {
      badge: 'Salon Suite',
      subtitle: 'Your salon suite — appointment logs, package sales, client formulas in records, and billing.',
      quickActions: [{ route: '/time', label: 'Log Appointment' }, { route: '/proposals', label: 'Sell Package' }, { route: '/invoices', label: 'Invoice Client' }],
      statLabels: { protected: 'Active Packages', clients: 'clients' },
      emptyActivity: 'No activity yet. Log an appointment or sell a package.',
    },
    website: web(
      { metaDescription: 'WorkVault for salon and beauty professionals — appointments, packages, client records, and invoicing.', heroTitle: 'Beauty business behind the chair', heroSubtitle: 'Appointment tracking, service packages, client formula records, and mobile-friendly billing.', features: ['Appointment tracking', 'Service packages', 'Client records', 'Mobile billing'], footerTagline: 'STYLE · BOOK · BILL' },
      { whoItsFor: ['Booth renters and suite stylists', 'Mobile makeup artists', 'Estheticians with package billing'], workflows: [{ title: 'Book & agree', description: 'Service agreement or package purchase, appointment on pipeline.' }, { title: 'Serve the client', description: 'Log appointment time, note formulas and preferences in records.' }, { title: 'Renew & upsell', description: 'Package renewal proposal when visits run low.' }], useCases: [{ title: 'Bridal makeup package', example: 'Trial + event day logged, deposit invoice, final balance before wedding.' }, { title: 'Monthly color clients', example: 'Standing appointment log, product upsell notes, recurring invoice.' }], faq: [{ q: 'Can I store client color formulas?', a: 'Yes — keep notes and photos in client service records.' }, { q: 'Does it work mobile at weddings?', a: 'Log appointments and invoice from the PWA on your phone.' }], ctaLabel: 'Start beauty workspace' },
    ),
    loadingFeatures: ['Log appointments', 'Sell packages', 'Store client formulas', 'Invoice clients'],
  }),

  security: config({
    id: 'security',
    category: 'trades',
    icon: Shield,
    label: 'Security Services',
    shortLabel: 'Security',
    description: 'Private security contractors, event security, and patrol services.',
    editionLabel: 'Security Edition',
    hiddenRoutes: ['hosting', 'cursor-cli', 'proposals', 'tools'],
    mobileTabRoutes: ['dashboard', 'time', 'invoices', 'clients'],
    navLabels: { clients: 'Clients / Sites', contracts: 'Service Contracts', time: 'Shift Log', licenses: 'Guard Certs', records: 'Incident Records', scope: 'Post Orders' },
    terminology: { ...BASE_TERMINOLOGY, client: 'Client / Site', clients: 'Clients & Sites', contract: 'Security Contract', contracts: 'Security Contracts', project: 'Post / Detail', licenses: 'Guard Certifications' },
    onboarding: {
      welcomeTitle: 'WorkVault for Security',
      welcomeBody: 'Contract sites, log guard shifts, track certifications, document incidents, and invoice clients.',
      highlights: ['Shift Logging', 'Guard Certifications', 'Incident Records', 'Site Billing'],
    },
    dashboard: {
      badge: 'Operations Center',
      subtitle: 'Your ops center — shift logs, guard cert tracking, incident records, and client site billing.',
      quickActions: [{ route: '/time', label: 'Log Shift' }, { route: '/records', label: 'Incident Report' }, { route: '/invoices', label: 'Invoice Site' }],
      statLabels: { protected: 'Active Posts', clients: 'sites' },
      emptyActivity: 'No activity yet. Log a shift or add a client site.',
    },
    website: web(
      { metaDescription: 'WorkVault for security contractors — shift logs, guard certifications, incident records, and site billing.', heroTitle: 'Security ops from shift log to invoice', heroSubtitle: 'Site contracts, shift time tracking, guard cert management, incident documentation, and client billing.', features: ['Shift logging', 'Guard certifications', 'Incident records', 'Site billing'], footerTagline: 'GUARD · LOG · REPORT' },
      { whoItsFor: ['Event security companies', 'Mobile patrol contractors', 'Executive protection freelancers'], workflows: [{ title: 'Win the contract', description: 'Site assessment, security contract, post order documentation.' }, { title: 'Staff shifts', description: 'Guard shift logs, cert verification, incident reports as needed.' }, { title: 'Bill the client', description: 'Weekly hour summary invoice per site or event.' }], useCases: [{ title: 'Retail store patrol', example: 'Nightly shift logs, monthly site invoice, cert expiry alerts.' }, { title: 'Festival event security', example: 'Event contract, per-shift time entries, final event invoice.' }], faq: [{ q: 'Can I track guard license expiry?', a: 'Yes — use the licenses section for guard cards and certifications.' }, { q: 'How are incidents documented?', a: 'Create incident records linked to the site and attach reports in documents.' }], ctaLabel: 'Start security workspace' },
    ),
    loadingFeatures: ['Log guard shifts', 'Track certifications', 'Document incidents', 'Bill client sites'],
  }),

  landscaping: config({
    id: 'landscaping',
    category: 'trades',
    icon: TreePine,
    label: 'Landscaping & Lawn Care',
    shortLabel: 'Landscaping',
    description: 'Landscapers, lawn care crews, arborists, and irrigation specialists.',
    editionLabel: 'Landscaping Edition',
    hiddenRoutes: ['hosting', 'cursor-cli', 'proposals'],
    mobileTabRoutes: ['dashboard', 'time', 'invoices', 'clients'],
    navLabels: { clients: 'Customers', pipeline: 'Route Schedule', scope: 'Extra Work Orders', tools: 'Equipment', records: 'Property Records' },
    terminology: { ...BASE_TERMINOLOGY, client: 'Customer', clients: 'Customers', contract: 'Service Contract', contracts: 'Service Contracts', project: 'Property / Job', subcontractor: 'Crew Partner' },
    onboarding: {
      welcomeTitle: 'WorkVault for Landscapers',
      welcomeBody: 'Schedule routes, log crew hours, track seasonal extras, manage equipment, and invoice customers.',
      highlights: ['Route Scheduling', 'Crew Time Logs', 'Seasonal Extras', 'Customer Billing'],
    },
    dashboard: {
      badge: 'Crew HQ',
      subtitle: 'Your crew HQ — property routes, crew hour logs, extra work orders, and customer billing.',
      quickActions: [{ route: '/pipeline', label: 'View Routes' }, { route: '/time', label: 'Log Crew Hours' }, { route: '/invoices', label: 'Invoice Customer' }],
      statLabels: { protected: 'Active Properties', clients: 'customers' },
      emptyActivity: 'No activity yet. Add a property route or log crew hours.',
    },
    website: web(
      { metaDescription: 'WorkVault for landscapers — route scheduling, crew time, seasonal extras, and customer invoicing.', heroTitle: 'Landscaping routes and billing, season to season', heroSubtitle: 'Property routes, crew hour tracking, seasonal extra work orders, equipment logs, and customer billing.', features: ['Route scheduling', 'Crew time logs', 'Seasonal extras', 'Customer billing'], footerTagline: 'MOW · TRIM · GROW' },
      { whoItsFor: ['Lawn care route owners', 'Landscape design-build firms', 'Seasonal cleanup contractors'], workflows: [{ title: 'Sign the property', description: 'Service contract, visit frequency, first-month invoice.' }, { title: 'Service & extras', description: 'Crew time per visit, upsell mulch/trim in scope log.' }, { title: 'Bill & renew', description: 'Monthly recurring invoice plus seasonal project proposals.' }], useCases: [{ title: 'Weekly mowing route', example: '40 properties on pipeline, crew hour log per day, monthly billing run.' }, { title: 'Spring cleanup project', example: 'One-time proposal, day-rate crew log, completion invoice.' }], faq: [{ q: 'Can I track crew time per property?', a: 'Log time entries with client/property notes for accurate job costing.' }, { q: 'How do seasonal upsells work?', a: 'Add aeration or mulch jobs in the scope log and invoice as line items.' }], ctaLabel: 'Start landscaping workspace' },
    ),
    loadingFeatures: ['Schedule routes', 'Log crew hours', 'Track seasonal extras', 'Bill customers'],
  }),

  childcare: config({
    id: 'childcare',
    category: 'care',
    icon: Baby,
    label: 'Childcare & Nanny',
    shortLabel: 'Childcare',
    description: 'Nannies, home daycare providers, and childcare contractors.',
    editionLabel: 'Childcare Edition',
    hiddenRoutes: ['hosting', 'cursor-cli', 'subcontractors', 'tools', 'tax-1099'],
    mobileTabRoutes: ['dashboard', 'time', 'invoices', 'clients'],
    navLabels: { clients: 'Families', contracts: 'Care Agreements', time: 'Care Log', records: 'Daily Records', licenses: 'Certifications' },
    terminology: { ...BASE_TERMINOLOGY, client: 'Family', clients: 'Families', contract: 'Care Agreement', contracts: 'Care Agreements', project: 'Care Schedule', licenses: 'Certifications' },
    onboarding: {
      welcomeTitle: 'WorkVault for Childcare',
      welcomeBody: 'Care agreements, daily logs, certification tracking, and family invoicing for nannies and home providers.',
      highlights: ['Care Agreements', 'Daily Logs', 'Cert Tracking', 'Family Billing'],
    },
    dashboard: {
      badge: 'Care Hub',
      subtitle: 'Your care hub — family agreements, daily care logs, certification reminders, and billing.',
      quickActions: [{ route: '/time', label: 'Log Care Hours' }, { route: '/records', label: 'Daily Log' }, { route: '/invoices', label: 'Invoice Family' }],
      statLabels: { protected: 'Active Families', clients: 'families' },
      emptyActivity: 'No activity yet. Log care hours or add a family.',
    },
    website: web(
      { metaDescription: 'WorkVault for nannies and childcare providers — care agreements, daily logs, certifications, and family billing.', heroTitle: 'Childcare with clear agreements and logs', heroSubtitle: 'Care agreements, daily activity logs, certification tracking, and family invoicing.', features: ['Care agreements', 'Daily care logs', 'Certification tracking', 'Family billing'], footerTagline: 'CARE · LOG · NURTURE' },
      { whoItsFor: ['Independent nannies', 'Licensed home daycare providers', 'After-school care contractors'], workflows: [{ title: 'Agree with family', description: 'Care agreement, schedule, rate, and background cert on file.' }, { title: 'Daily care', description: 'Log hours, daily notes for parents in records.' }, { title: 'Bill weekly', description: 'Recurring invoice based on logged care hours.' }], useCases: [{ title: 'Full-time nanny', example: 'Weekly hour log, monthly invoice, CPR cert expiry reminder.' }, { title: 'Home daycare', example: 'Per-child care agreement, daily log, multi-family billing.' }], faq: [{ q: 'Can parents see daily logs?', a: 'Share selected records through a client workspace if you choose.' }, { q: 'Can I track certifications like CPR?', a: 'Yes — licenses/credentials section tracks expiry dates.' }], ctaLabel: 'Start childcare workspace' },
    ),
    loadingFeatures: ['Log care hours', 'Write daily logs', 'Track certifications', 'Bill families'],
  }),

  logistics: config({
    id: 'logistics',
    category: 'trades',
    icon: Truck,
    label: 'Logistics & Delivery',
    shortLabel: 'Logistics',
    description: 'Couriers, last-mile delivery contractors, and freight owner-operators.',
    editionLabel: 'Logistics Edition',
    hiddenRoutes: ['hosting', 'cursor-cli', 'proposals', 'tools'],
    mobileTabRoutes: ['dashboard', 'time', 'invoices', 'clients'],
    navLabels: { clients: 'Shippers / Clients', pipeline: 'Dispatch Queue', records: 'Delivery Records', scope: 'Accessorial Charges', tools: 'Fleet / Equipment' },
    terminology: { ...BASE_TERMINOLOGY, client: 'Shipper', clients: 'Shippers', contract: 'Carrier Agreement', contracts: 'Carrier Agreements', project: 'Load / Route' },
    onboarding: {
      welcomeTitle: 'WorkVault for Logistics',
      welcomeBody: 'Dispatch loads, log drive time, track accessorial charges, and invoice shippers and brokers.',
      highlights: ['Dispatch Queue', 'Drive Time Logs', 'Accessorial Billing', 'Delivery Records'],
    },
    dashboard: {
      badge: 'Dispatch Desk',
      subtitle: 'Your dispatch desk — load queue, drive time logs, accessorial charges, and shipper billing.',
      quickActions: [{ route: '/pipeline', label: 'Dispatch Queue' }, { route: '/time', label: 'Log Drive Time' }, { route: '/invoices', label: 'Invoice Load' }],
      statLabels: { protected: 'Active Loads', clients: 'shippers' },
      emptyActivity: 'No activity yet. Add a load to the dispatch queue.',
    },
    website: web(
      { metaDescription: 'WorkVault for couriers and carriers — dispatch, drive time, accessorial charges, and invoicing.', heroTitle: 'Loads dispatched, miles logged, invoices sent', heroSubtitle: 'Dispatch queue, drive time tracking, accessorial charge log, delivery records, and shipper billing.', features: ['Dispatch queue', 'Drive time logs', 'Accessorial charges', 'Shipper billing'], footerTagline: 'LOAD · DRIVE · DELIVER' },
      { whoItsFor: ['Owner-operator truckers', 'Same-day courier services', 'Last-mile delivery contractors'], workflows: [{ title: 'Accept the load', description: 'Carrier agreement or rate confirmation, load on dispatch queue.' }, { title: 'Run & log', description: 'Drive time entries, accessorial notes for detention or lumper.' }, { title: 'POD & invoice', description: 'Delivery record, proof attached, invoice shipper or broker.' }], useCases: [{ title: 'Regional freight runs', example: 'Load pipeline, mile/time log, fuel surcharge line on invoice.' }, { title: 'Medical courier', example: 'Per-delivery time log, chain-of-custody note in records, weekly billing.' }], faq: [{ q: 'Can I bill accessorial fees?', a: 'Log detention, lumper, or extra stops in the scope/accessorial log and add to invoices.' }, { q: 'Does it integrate with load boards?', a: 'Track loads manually or import details — focus is ops and billing, not dispatch TMS.' }], ctaLabel: 'Start logistics workspace' },
    ),
    loadingFeatures: ['Dispatch loads', 'Log drive time', 'Track accessorials', 'Invoice shippers'],
  }),

  solar: config({
    id: 'solar',
    category: 'trades',
    icon: Sun,
    label: 'Solar & Energy',
    shortLabel: 'Solar',
    description: 'Solar installers, energy auditors, and EV charger contractors.',
    editionLabel: 'Solar Edition',
    hiddenRoutes: ['hosting', 'cursor-cli', 'proposals'],
    mobileTabRoutes: ['dashboard', 'pipeline', 'invoices', 'clients'],
    navLabels: { clients: 'Customers', pipeline: 'Install Pipeline', contracts: 'Install Agreements', scope: 'Change Orders', licenses: 'Installer Certs', records: 'System Records' },
    terminology: { ...BASE_TERMINOLOGY, client: 'Customer', clients: 'Customers', contract: 'Install Agreement', contracts: 'Install Agreements', project: 'Install Job', licenses: 'Installer Certifications' },
    onboarding: {
      welcomeTitle: 'WorkVault for Solar Pros',
      welcomeBody: 'Pipeline installs, track site survey and install hours, manage certs, and invoice customers with change orders.',
      highlights: ['Install Pipeline', 'Site & Install Hours', 'Installer Certs', 'Change Orders'],
    },
    dashboard: {
      badge: 'Install Hub',
      subtitle: 'Your install hub — job pipeline, survey/install hour logs, cert tracking, and customer billing.',
      quickActions: [{ route: '/pipeline', label: 'Install Pipeline' }, { route: '/time', label: 'Log Site Hours' }, { route: '/scope', label: 'Change Order' }],
      statLabels: { protected: 'Active Installs', clients: 'customers' },
      emptyActivity: 'No activity yet. Add an install to the pipeline.',
    },
    website: web(
      { metaDescription: 'WorkVault for solar installers — install pipeline, site hours, certifications, and customer invoicing.', heroTitle: 'Solar installs from survey to activation', heroSubtitle: 'Install pipeline, site survey and crew hour tracking, installer certifications, change orders, and billing.', features: ['Install pipeline', 'Site hour tracking', 'Installer certifications', 'Change order billing'], footerTagline: 'SURVEY · INSTALL · POWER' },
      { whoItsFor: ['Residential solar crews', 'Commercial install subcontractors', 'Energy auditors and assessors'], workflows: [{ title: 'Sell the job', description: 'Proposal, install agreement, permit docs in vault.' }, { title: 'Survey & install', description: 'Log survey and install hours, change orders for roof issues.' }, { title: 'Activate & bill', description: 'System record, final inspection docs, milestone invoice.' }], useCases: [{ title: 'Residential rooftop', example: 'Pipeline stages, 2-day install hour log, change order for panel upgrade.' }, { title: 'EV charger add-on', example: 'Service agreement, single-day install log, completion invoice.' }], faq: [{ q: 'Can I track NABCEP or state certs?', a: 'Yes — store installer certifications with expiry reminders.' }, { q: 'How do change orders work?', a: 'Log roof repairs or panel upgrades in scope log and revise the invoice.' }], ctaLabel: 'Start solar workspace' },
    ),
    loadingFeatures: ['Pipeline installs', 'Log site hours', 'Track certifications', 'Bill customers'],
  }),

  film: config({
    id: 'film',
    category: 'creative',
    icon: Film,
    label: 'Film & Production',
    shortLabel: 'Film',
    description: 'Producers, directors, crew contractors, and production coordinators.',
    editionLabel: 'Production Edition',
    hiddenRoutes: ['cursor-cli', 'tax-1099'],
    mobileTabRoutes: ['dashboard', 'pipeline', 'invoices', 'clients'],
    navLabels: { pipeline: 'Production Schedule', proposals: 'Bid Packages', contracts: 'Deal Memos', subcontractors: 'Crew & Vendors', records: 'Production Records', scope: 'Overages' },
    terminology: { ...BASE_TERMINOLOGY, project: 'Production', contract: 'Deal Memo', contracts: 'Deal Memos', subcontractor: 'Crew / Vendor' },
    onboarding: {
      welcomeTitle: 'WorkVault for Film & Production',
      welcomeBody: 'Bid productions, crew deal memos, log shoot days, track vendor payments, and invoice producers.',
      highlights: ['Production Bids', 'Deal Memos', 'Shoot Day Logs', 'Crew Payments'],
    },
    dashboard: {
      badge: 'Production Office',
      subtitle: 'Your production office — bids, deal memos, shoot day logs, vendor tracking, and billing.',
      quickActions: [{ route: '/proposals', label: 'Send Bid' }, { route: '/time', label: 'Log Shoot Day' }, { route: '/contracts', label: 'Deal Memo' }],
      statLabels: { protected: 'Active Productions', clients: 'clients' },
      emptyActivity: 'No activity yet. Send a production bid or log a shoot day.',
    },
    website: web(
      { metaDescription: 'WorkVault for film production — bids, deal memos, shoot day logs, crew payments, and invoicing.', heroTitle: 'Production paperwork that keeps pace with set life', heroSubtitle: 'Production bids, deal memos, shoot day time logs, crew/vendor tracking, and client billing.', features: ['Production bids', 'Deal memos', 'Shoot day logs', 'Crew & vendor tracking'], footerTagline: 'BID · SHOOT · WRAP' },
      { whoItsFor: ['Commercial production freelancers', 'Department heads hiring crew', 'Indie producers managing vendors'], workflows: [{ title: 'Bid the job', description: 'Bid package, deal memo terms, deposit if awarded.' }, { title: 'Shoot & track', description: 'Daily shoot logs, crew times, vendor POs in subcontractor records.' }, { title: 'Wrap & bill', description: 'Overage log, final production invoice, archive records.' }], useCases: [{ title: '3-day commercial shoot', example: 'Deal memos per role, daily hour logs, kit rental line items on invoice.' }, { title: 'Documentary segment', example: 'Fixed bid, travel overages in scope log, deliverable handoff record.' }], faq: [{ q: 'Can I track crew and vendor payments?', a: 'Yes — subcontractor/vendor records with payment history for wrap reports.' }, { q: 'How do overages get billed?', a: 'Log overtime, extra days, or kit fees in the overage/scope log.' }], ctaLabel: 'Start production workspace' },
    ),
    loadingFeatures: ['Send production bids', 'Log shoot days', 'Track crew payments', 'Invoice productions'],
  }),

  aviation: config({
    id: 'aviation',
    category: 'professional',
    icon: Plane,
    label: 'Aviation & Flight',
    shortLabel: 'Aviation',
    description: 'Flight instructors, charter pilots, drone operators, and aviation consultants.',
    editionLabel: 'Aviation Edition',
    hiddenRoutes: ['hosting', 'cursor-cli', 'tools'],
    mobileTabRoutes: ['dashboard', 'time', 'invoices', 'clients'],
    navLabels: { clients: 'Students / Clients', contracts: 'Training Agreements', time: 'Flight Log', licenses: 'Ratings & Certs', records: 'Flight Records' },
    terminology: { ...BASE_TERMINOLOGY, client: 'Student / Client', clients: 'Students & Clients', contract: 'Training Agreement', contracts: 'Training Agreements', project: 'Training Program', licenses: 'Ratings & Certificates' },
    onboarding: {
      welcomeTitle: 'WorkVault for Aviation',
      welcomeBody: 'Training agreements, flight hour logs, certificate tracking, and student or client billing.',
      highlights: ['Flight Hour Logs', 'Training Agreements', 'Certificate Tracking', 'Student Billing'],
    },
    dashboard: {
      badge: 'Flight Desk',
      subtitle: 'Your flight desk — hour logs, training agreements, cert reminders, and client billing.',
      quickActions: [{ route: '/time', label: 'Log Flight Hours' }, { route: '/contracts', label: 'Training Agreement' }, { route: '/invoices', label: 'Invoice Student' }],
      statLabels: { protected: 'Active Students', clients: 'students' },
      emptyActivity: 'No activity yet. Log flight hours or add a student.',
    },
    website: web(
      { metaDescription: 'WorkVault for flight instructors and aviation contractors — flight logs, training agreements, certs, and billing.', heroTitle: 'Flight training and charter ops, documented', heroSubtitle: 'Flight hour logs, training agreements, rating/certificate tracking, and student or client billing.', features: ['Flight hour logs', 'Training agreements', 'Certificate tracking', 'Student billing'], footerTagline: 'FLY · LOG · CERTIFY' },
      { whoItsFor: ['CFIs and flight schools on contract', 'Charter pilots billing hours', 'Part 107 drone operators'], workflows: [{ title: 'Enroll student', description: 'Training agreement, hour package, medical/rating notes.' }, { title: 'Log each flight', description: 'Dual/solo hours in time log tied to student profile.' }, { title: 'Checkride & bill', description: 'Stage check record, package renewal or hourly invoice.' }], useCases: [{ title: 'Private pilot training', example: '40-hour package agreement, per-lesson time log, progress milestones.' }, { title: 'Drone mapping contract', example: 'Part 107 on file, per-site flight log, deliverable invoice.' }], faq: [{ q: 'Can I track certificate expirations?', a: 'Yes — medical, BFR, and rating renewals in the licenses section.' }, { q: 'Does it replace a formal logbook?', a: 'It supplements business billing and client records — pilots should keep official logs as required.' }], ctaLabel: 'Start aviation workspace' },
    ),
    loadingFeatures: ['Log flight hours', 'Track certificates', 'Send training agreements', 'Bill students'],
  }),

  printing: config({
    id: 'printing',
    category: 'trades',
    icon: Printer,
    label: 'Print & Signage',
    shortLabel: 'Print',
    description: 'Print shops, sign makers, wide-format contractors, and apparel printers.',
    editionLabel: 'Print Edition',
    hiddenRoutes: ['hosting', 'cursor-cli'],
    mobileTabRoutes: ['dashboard', 'pipeline', 'invoices', 'clients'],
    navLabels: { pipeline: 'Job Queue', proposals: 'Print Quotes', contracts: 'Print Orders', scope: 'Rush / Changes', records: 'Job Records' },
    terminology: { ...BASE_TERMINOLOGY, project: 'Print Job', contract: 'Print Order', contracts: 'Print Orders' },
    onboarding: {
      welcomeTitle: 'WorkVault for Print Shops',
      welcomeBody: 'Quote print jobs, queue production, track rush fees, and invoice clients for signs, apparel, and wide-format.',
      highlights: ['Print Quotes', 'Job Queue', 'Rush Fee Tracking', 'Client Invoicing'],
    },
    dashboard: {
      badge: 'Print Floor',
      subtitle: 'Your print floor — job queue, production time, rush change log, and client billing.',
      quickActions: [{ route: '/proposals', label: 'Send Quote' }, { route: '/pipeline', label: 'Job Queue' }, { route: '/invoices', label: 'Invoice Job' }],
      statLabels: { protected: 'Jobs in Queue', clients: 'clients' },
      emptyActivity: 'No activity yet. Send a print quote or add a job.',
    },
    website: web(
      { metaDescription: 'WorkVault for print shops — job quotes, production queue, rush fees, and client invoicing.', heroTitle: 'Print jobs from quote to pickup', heroSubtitle: 'Print quotes, production job queue, rush fee tracking, job records, and client invoicing.', features: ['Print quotes', 'Production queue', 'Rush fee tracking', 'Client invoicing'], footerTagline: 'QUOTE · PRINT · SHIP' },
      { whoItsFor: ['Local print and copy shops', 'Sign and wide-format producers', 'Screen printers and apparel decorators'], workflows: [{ title: 'Quote the job', description: 'Specs, quantity breaks, proof approval in proposal.' }, { title: 'Produce', description: 'Job on queue, production time log, rush changes noted.' }, { title: 'Deliver & bill', description: 'Pickup/delivery record, final invoice with rush line items.' }], useCases: [{ title: 'Business card run', example: '500-unit quote, 2-day turnaround, single invoice on pickup.' }, { title: 'Event banner rush', example: 'Rush fee in scope log, same-day production note, premium invoice.' }], faq: [{ q: 'Can I charge rush fees?', a: 'Log rush or change requests in the scope log and add fees to the invoice.' }, { q: 'How do I track jobs in production?', a: 'Use the pipeline queue with stages from proof approved to ready.' }], ctaLabel: 'Start print workspace' },
    ),
    loadingFeatures: ['Send print quotes', 'Queue production jobs', 'Track rush fees', 'Invoice clients'],
  }),

  'property-management': config({
    id: 'property-management',
    category: 'business',
    icon: KeyRound,
    label: 'Property Management',
    shortLabel: 'Property Mgmt',
    description: 'Property managers, HOA managers, and rental portfolio contractors.',
    editionLabel: 'Property Edition',
    hiddenRoutes: ['cursor-cli', 'hosting', 'proposals'],
    mobileTabRoutes: ['dashboard', 'pipeline', 'invoices', 'clients'],
    navLabels: { clients: 'Owners / Tenants', pipeline: 'Unit Pipeline', contracts: 'Management Agreements', scope: 'Work Orders', records: 'Property Records', subcontractors: 'Vendors' },
    terminology: { ...BASE_TERMINOLOGY, client: 'Owner', clients: 'Owners & Tenants', contract: 'Management Agreement', contracts: 'Management Agreements', project: 'Property / Unit', subcontractor: 'Vendor' },
    onboarding: {
      welcomeTitle: 'WorkVault for Property Managers',
      welcomeBody: 'Manage units, track work orders, vendor payments, owner agreements, and fee invoicing.',
      highlights: ['Unit Pipeline', 'Work Orders', 'Vendor Management', 'Owner Billing'],
    },
    dashboard: {
      badge: 'Portfolio Desk',
      subtitle: 'Your portfolio desk — unit pipeline, work order log, vendor payments, and owner fee billing.',
      quickActions: [{ route: '/pipeline', label: 'Unit Pipeline' }, { route: '/scope', label: 'Work Order' }, { route: '/invoices', label: 'Invoice Owner' }],
      statLabels: { protected: 'Managed Units', clients: 'owners' },
      emptyActivity: 'No activity yet. Add a unit or log a work order.',
    },
    website: web(
      { metaDescription: 'WorkVault for property managers — unit pipeline, work orders, vendor tracking, and owner billing.', heroTitle: 'Property portfolios without the spreadsheet chaos', heroSubtitle: 'Unit pipeline, work order tracking, vendor payments, management agreements, and owner fee billing.', features: ['Unit pipeline', 'Work order tracking', 'Vendor management', 'Owner billing'], footerTagline: 'MANAGE · MAINTAIN · COLLECT' },
      { whoItsFor: ['Independent property managers', 'HOA management contractors', 'Short-term rental portfolio operators'], workflows: [{ title: 'Onboard property', description: 'Management agreement, unit on pipeline, owner contact on file.' }, { title: 'Maintain', description: 'Work orders logged, vendor assigned, cost tracked.' }, { title: 'Report & bill', description: 'Owner statement export, monthly management fee invoice.' }], useCases: [{ title: '10-door rental portfolio', example: 'Per-unit pipeline, maintenance work orders, monthly owner fee run.' }, { title: 'HOA contract', example: 'Annual management agreement, vendor RFP records, quarterly owner report.' }], faq: [{ q: 'Can I track maintenance vendors?', a: 'Yes — vendor/subcontractor records with payment history per property.' }, { q: 'Does it handle rent collection?', a: 'Focus is management ops and owner billing — pair with your payment tools for rent.' }], ctaLabel: 'Start property workspace' },
    ),
    loadingFeatures: ['Manage unit pipeline', 'Log work orders', 'Track vendors', 'Bill owners'],
  }),
}

export const INDUSTRY_LIST = Object.values(INDUSTRIES)

export const INDUSTRY_IDS = Object.keys(INDUSTRIES) as IndustryId[]

export function industriesByCategory(): Record<IndustryCategory, IndustryConfig[]> {
  const grouped = {} as Record<IndustryCategory, IndustryConfig[]>
  for (const cat of Object.keys(INDUSTRY_CATEGORIES) as IndustryCategory[]) {
    grouped[cat] = INDUSTRY_LIST.filter((i) => i.category === cat)
  }
  return grouped
}

export function isIndustryId(value: string | null | undefined): value is IndustryId {
  return Boolean(value && value in INDUSTRIES)
}

export function resolveIndustryId(value: string | null | undefined): IndustryId {
  return isIndustryId(value) ? value : 'general'
}

export function getIndustryConfig(id: string | null | undefined): IndustryConfig {
  return INDUSTRIES[resolveIndustryId(id)]
}

export function getNavLabel(config: IndustryConfig, routeId: NavRouteId, fallback: string): string {
  return config.navLabels[routeId] ?? fallback
}

export function isRouteHidden(config: IndustryConfig, routeId: NavRouteId): boolean {
  return config.hiddenRoutes.includes(routeId)
}

export const PREVIEW_INDUSTRY_KEY = 'workvault-preview-industry'

export function readPreviewIndustry(): IndustryId | null {
  if (typeof sessionStorage === 'undefined') return null
  const raw = sessionStorage.getItem(PREVIEW_INDUSTRY_KEY)
  return isIndustryId(raw) ? raw : null
}

export function writePreviewIndustry(id: IndustryId): void {
  sessionStorage.setItem(PREVIEW_INDUSTRY_KEY, id)
}

export function clearPreviewIndustry(): void {
  sessionStorage.removeItem(PREVIEW_INDUSTRY_KEY)
}
