import { createContext, useContext, useEffect, useMemo, type ReactNode } from 'react'
import { useStore } from './StoreContext'
import {
  type IndustryConfig,
  type IndustryId,
  clearPreviewIndustry,
  getIndustryConfig,
  readPreviewIndustry,
  resolveIndustryId,
} from '../lib/industries'

interface IndustryContextValue {
  industryId: IndustryId
  config: IndustryConfig
  setIndustry: (id: IndustryId) => void
}

const IndustryContext = createContext<IndustryContextValue | null>(null)

function applyIndustryMeta(config: IndustryConfig) {
  document.documentElement.dataset.industry = config.id
  document.title = `WorkVault — ${config.shortLabel}`

  const desc = document.querySelector('meta[name="description"]')
  if (desc) desc.setAttribute('content', config.website.metaDescription)

  const theme = document.querySelector('meta[name="theme-color"]')
  if (theme) {
    const brand = getComputedStyle(document.documentElement).getPropertyValue('--color-brand-600').trim()
    if (brand) theme.setAttribute('content', brand)
  }
}

export function IndustryProvider({ children }: { children: ReactNode }) {
  const { state, updateProfile } = useStore()

  const industryId = useMemo(() => {
    const fromProfile = resolveIndustryId(state.profile.industryId)
    if (fromProfile !== 'general' || state.profile.name?.trim()) return fromProfile
    return readPreviewIndustry() ?? fromProfile
  }, [state.profile.industryId, state.profile.name])

  const config = useMemo(() => getIndustryConfig(industryId), [industryId])

  useEffect(() => {
    applyIndustryMeta(config)
  }, [config])

  const setIndustry = (id: IndustryId) => {
    updateProfile({ industryId: id })
    clearPreviewIndustry()
  }

  return (
    <IndustryContext.Provider value={{ industryId, config, setIndustry }}>
      {children}
    </IndustryContext.Provider>
  )
}

export function useIndustry(): IndustryContextValue {
  const ctx = useContext(IndustryContext)
  if (!ctx) throw new Error('useIndustry must be used within IndustryProvider')
  return ctx
}

export function useIndustryOptional(): IndustryContextValue | null {
  return useContext(IndustryContext)
}
