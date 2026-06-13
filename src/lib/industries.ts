import type { LucideIcon } from 'lucide-react'
import {
  Palette,
  Code2,
  HardHat,
  Briefcase,
  Megaphone,
  Layers,
} from 'lucide-react'

export type IndustryId =
  | 'general'
  | 'creative'
  | 'software'
  | 'construction'
  | 'consulting'
  | 'marketing'

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
}

export interface IndustryConfig {
  id: IndustryId
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

export const INDUSTRIES: Record<IndustryId, IndustryConfig> = {
  general: config({
    id: 'general',
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
    website: {
      metaDescription:
        'WorkVault — local-first platform for contract workers. Contracts, time tracking, invoices, and client workspaces.',
      heroTitle: 'Run your contract business from one vault',
      heroSubtitle:
        'Contracts, time tracking, invoices, and client handoffs — on your device, with optional cloud sync.',
      features: ['E-sign contracts', 'Track billable hours', 'Send invoices', 'Client workspaces'],
      footerTagline: 'YOUR WORK · YOUR CONTROL',
    },
    loadingFeatures: [
      'Protect your work',
      'Generate contracts',
      'Track every hour',
      'Send invoices',
    ],
  }),

  creative: config({
    id: 'creative',
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
    website: {
      metaDescription:
        'WorkVault for creatives — proposals, creative rights protection, time tracking, and invoicing for designers and artists.',
      heroTitle: 'Your creative business, protected and organized',
      heroSubtitle:
        'Proposals, deliverable protection, revision tracking, and client previews — built for designers and artists.',
      features: ['Protect deliverables', 'Send proposals', 'Track revision time', 'Client preview rooms'],
      footerTagline: 'CREATE · PROTECT · GET PAID',
    },
    loadingFeatures: [
      'Protect deliverables',
      'Send proposals',
      'Track studio hours',
      'Invoice clients',
    ],
  }),

  software: config({
    id: 'software',
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
    website: {
      metaDescription:
        'WorkVault for software contractors — SOWs, IP protection, time tracking, Cursor CLI integration, and invoicing.',
      heroTitle: 'Built for software contractors',
      heroSubtitle:
        'SOWs, sprint time tracking, IP protection, deployment records, and Cursor CLI — on your machine.',
      features: ['SOW & contracts', 'Track dev hours', 'Protect IP & code', 'Cursor CLI workflows'],
      footerTagline: 'SHIP · PROTECT · INVOICE',
    },
    loadingFeatures: [
      'Protect IP & code',
      'Generate SOWs',
      'Track dev hours',
      'Run Cursor CLI',
    ],
  }),

  construction: config({
    id: 'construction',
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
    website: {
      metaDescription:
        'WorkVault for construction and trades — field time, change orders, subcontractor payments, licenses, and invoicing.',
      heroTitle: 'Run your trades business from the field',
      heroSubtitle:
        'Field time tracking, change orders, sub management, license tracking, and customer invoicing — offline-ready.',
      features: ['Log field hours', 'Track change orders', 'Manage subcontractors', 'Licenses & certs'],
      footerTagline: 'BUILD · TRACK · GET PAID',
    },
    loadingFeatures: [
      'Track field hours',
      'Log change orders',
      'Manage subcontractors',
      'Invoice customers',
    ],
  }),

  consulting: config({
    id: 'consulting',
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
    website: {
      metaDescription:
        'WorkVault for consultants and coaches — engagement letters, session tracking, proposals, and invoicing.',
      heroTitle: 'Your consulting practice, organized',
      heroSubtitle:
        'Engagement letters, session time tracking, proposals, and client workspaces — professional and private.',
      features: ['Engagement letters', 'Track sessions', 'Send proposals', 'Client portals'],
      footerTagline: 'ADVISE · TRACK · DELIVER',
    },
    loadingFeatures: [
      'Send engagement letters',
      'Track billable sessions',
      'Manage proposals',
      'Invoice clients',
    ],
  }),

  marketing: config({
    id: 'marketing',
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
    website: {
      metaDescription:
        'WorkVault for marketing agencies — campaign pipeline, pitch decks, retainer tracking, and client workspaces.',
      heroTitle: 'Your agency ops, in one vault',
      heroSubtitle:
        'Campaign pipelines, pitch decks, retainer time tracking, live previews, and client billing.',
      features: ['Campaign pipeline', 'Pitch decks', 'Retainer tracking', 'Client preview links'],
      footerTagline: 'PITCH · DELIVER · SCALE',
    },
    loadingFeatures: [
      'Manage campaigns',
      'Send pitch decks',
      'Track retainer hours',
      'Invoice clients',
    ],
  }),
}

export const INDUSTRY_LIST = Object.values(INDUSTRIES)

export const INDUSTRY_IDS = Object.keys(INDUSTRIES) as IndustryId[]

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
