import type { LucideIcon } from 'lucide-react'
import {
  LayoutDashboard,
  Clock,
  FileText,
  Receipt,
  Shield,
  BadgeCheck,
  Globe,
  Archive,
  Users,
  Settings,
  Kanban,
  FileSignature,
  Wallet,
  AlertTriangle,
  FolderOpen,
  Wrench,
  HardHat,
  Plug,
  FileSpreadsheet,
  UserCircle2,
  Terminal,
  Inbox,
} from 'lucide-react'
import type { IndustryConfig, NavRouteId } from './industries'
import { getNavLabel, isRouteHidden } from './industries'

export interface NavItem {
  id: NavRouteId
  to: string
  icon: LucideIcon
  label: string
}

export interface NavSection {
  label: string
  items: NavItem[]
}

const NAV_CATALOG: Array<{ section: string; items: Array<Omit<NavItem, 'label'> & { defaultLabel: string }> }> = [
  {
    section: 'Overview',
    items: [
      { id: 'dashboard', to: '/', icon: LayoutDashboard, defaultLabel: 'Dashboard' },
      { id: 'time', to: '/time', icon: Clock, defaultLabel: 'Time Tracker' },
      { id: 'pipeline', to: '/pipeline', icon: Kanban, defaultLabel: 'Pipeline' },
    ],
  },
  {
    section: 'Business',
    items: [
      { id: 'proposals', to: '/proposals', icon: FileSignature, defaultLabel: 'Proposals' },
      { id: 'contracts', to: '/contracts', icon: FileText, defaultLabel: 'Contracts' },
      { id: 'invoices', to: '/invoices', icon: Receipt, defaultLabel: 'Invoices' },
      { id: 'inbox', to: '/inbox', icon: Inbox, defaultLabel: 'Inbox' },
      { id: 'finance', to: '/finance', icon: Wallet, defaultLabel: 'Finance' },
      { id: 'tax-1099', to: '/tax-1099', icon: FileSpreadsheet, defaultLabel: '1099 Filing' },
      { id: 'clients', to: '/clients', icon: Users, defaultLabel: 'Clients' },
    ],
  },
  {
    section: 'Operations',
    items: [
      { id: 'scope', to: '/scope', icon: AlertTriangle, defaultLabel: 'Scope Log' },
      { id: 'documents', to: '/documents', icon: FolderOpen, defaultLabel: 'Documents' },
      { id: 'tools', to: '/tools', icon: Wrench, defaultLabel: 'Tools' },
      { id: 'subcontractors', to: '/subcontractors', icon: HardHat, defaultLabel: 'Subcontractors' },
    ],
  },
  {
    section: 'Protection',
    items: [
      { id: 'protection', to: '/protection', icon: Shield, defaultLabel: 'Work Protection' },
      { id: 'licenses', to: '/licenses', icon: BadgeCheck, defaultLabel: 'Licenses' },
      { id: 'hosting', to: '/hosting', icon: Globe, defaultLabel: 'Hosting' },
      { id: 'records', to: '/records', icon: Archive, defaultLabel: 'Work Records' },
    ],
  },
  {
    section: 'Account',
    items: [
      { id: 'team', to: '/team', icon: UserCircle2, defaultLabel: 'Team' },
      { id: 'integrations', to: '/integrations', icon: Plug, defaultLabel: 'Integrations' },
      { id: 'cursor-cli', to: '/cursor-cli', icon: Terminal, defaultLabel: 'Cursor CLI' },
      { id: 'settings', to: '/settings', icon: Settings, defaultLabel: 'Settings' },
    ],
  },
]

export function buildNavSections(config: IndustryConfig): NavSection[] {
  return NAV_CATALOG.map(({ section, items }) => ({
    label: section,
    items: items
      .filter(({ id }) => !isRouteHidden(config, id))
      .map(({ id, to, icon, defaultLabel }) => ({
        id,
        to,
        icon,
        label: getNavLabel(config, id, defaultLabel),
      })),
  })).filter((s) => s.items.length > 0)
}

export function buildMobileTabs(config: IndustryConfig): NavItem[] {
  const flat = buildNavSections(config).flatMap((s) => s.items)
  const byId = new Map(flat.map((item) => [item.id, item]))
  return config.mobileTabRoutes
    .map((id) => byId.get(id))
    .filter((item): item is NavItem => Boolean(item))
}

export function findNavItem(config: IndustryConfig, routeId: NavRouteId): NavItem | undefined {
  return buildNavSections(config)
    .flatMap((s) => s.items)
    .find((item) => item.id === routeId)
}

export function pageTitleForPath(config: IndustryConfig, path: string): string {
  const normalized = path === '' ? '/' : path
  const match = buildNavSections(config)
    .flatMap((s) => s.items)
    .find((item) => item.to === normalized)
  return match?.label ?? 'WorkVault'
}
