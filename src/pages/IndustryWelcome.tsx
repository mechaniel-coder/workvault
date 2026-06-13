import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowRight, CheckCircle2, HelpCircle, Layers, Search, Workflow } from 'lucide-react'
import { SiteFooter } from '../components/layout/SiteFooter'
import {
  INDUSTRY_CATEGORIES,
  INDUSTRY_LIST,
  type IndustryCategory,
  type IndustryConfig,
  type IndustryId,
  getIndustryConfig,
  industriesByCategory,
  isIndustryId,
  writePreviewIndustry,
} from '../lib/industries'
import { Button } from '../components/ui/Button'

function IndustryDetailPage({
  config,
  onStart,
  onBrowse,
}: {
  config: IndustryConfig
  onStart: () => void
  onBrowse: () => void
}) {
  const Icon = config.icon
  const { website } = config

  return (
    <div className="min-h-screen gradient-dark text-white">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(99,102,241,0.35)_0%,transparent_70%)]" />
      <div className="relative z-10 mx-auto max-w-5xl px-6 py-12 sm:py-16">
        <p className="text-xs font-semibold uppercase tracking-widest text-brand-300/80 mb-4">
          WorkVault · {config.editionLabel} · {INDUSTRY_CATEGORIES[config.category]}
        </p>
        <div className="flex flex-col sm:flex-row sm:items-start gap-5 mb-10">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl gradient-brand shadow-lg shadow-brand-600/30">
            <Icon size={32} />
          </div>
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight leading-tight">{website.heroTitle}</h1>
            <p className="mt-3 text-base text-white/65 max-w-2xl leading-relaxed">{website.heroSubtitle}</p>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-3 mb-12">
          {website.features.map((feature) => (
            <div
              key={feature}
              className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80"
            >
              <CheckCircle2 size={16} className="text-brand-300 shrink-0" />
              {feature}
            </div>
          ))}
        </div>

        <section className="mb-12">
          <h2 className="text-lg font-semibold text-white mb-4">Built for</h2>
          <div className="grid sm:grid-cols-3 gap-3">
            {website.whoItsFor.map((item) => (
              <div key={item} className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white/70">
                {item}
              </div>
            ))}
          </div>
        </section>

        <section className="mb-12">
          <div className="flex items-center gap-2 mb-4">
            <Workflow size={18} className="text-brand-300" />
            <h2 className="text-lg font-semibold text-white">Typical workflow</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {website.workflows.map((step, i) => (
              <div key={step.title} className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-brand-500/30 text-xs font-bold text-brand-200 mb-3">
                  {i + 1}
                </span>
                <h3 className="text-sm font-semibold text-white mb-1.5">{step.title}</h3>
                <p className="text-sm text-white/55 leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-12">
          <div className="flex items-center gap-2 mb-4">
            <Layers size={18} className="text-brand-300" />
            <h2 className="text-lg font-semibold text-white">Real-world examples</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {website.useCases.map((uc) => (
              <div key={uc.title} className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-transparent p-5">
                <h3 className="text-sm font-semibold text-brand-200 mb-2">{uc.title}</h3>
                <p className="text-sm text-white/60 leading-relaxed">{uc.example}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-12">
          <div className="flex items-center gap-2 mb-4">
            <HelpCircle size={18} className="text-brand-300" />
            <h2 className="text-lg font-semibold text-white">Common questions</h2>
          </div>
          <div className="space-y-3">
            {website.faq.map((item) => (
              <details key={item.q} className="group rounded-xl border border-white/10 bg-white/[0.03] open:bg-white/5">
                <summary className="cursor-pointer list-none px-5 py-4 text-sm font-medium text-white/90 flex items-center justify-between gap-4">
                  {item.q}
                  <span className="text-brand-400 text-lg leading-none group-open:rotate-45 transition-transform">+</span>
                </summary>
                <p className="px-5 pb-4 text-sm text-white/55 leading-relaxed">{item.a}</p>
              </details>
            ))}
          </div>
        </section>

        <div className="rounded-2xl border border-brand-400/30 bg-brand-500/10 p-8 text-center">
          <h2 className="text-xl font-bold text-white mb-2">Ready to set up your {config.shortLabel.toLowerCase()} workspace?</h2>
          <p className="text-sm text-white/60 mb-6 max-w-md mx-auto">
            Local-first on your device. Navigation, labels, and dashboard tailored for {config.label.toLowerCase()}.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button size="lg" onClick={onStart}>
              {website.ctaLabel} <ArrowRight size={16} />
            </Button>
            <Button
              size="lg"
              variant="secondary"
              className="!bg-white/10 !text-white !border-white/20 hover:!bg-white/20"
              onClick={onBrowse}
            >
              Browse all industries
            </Button>
          </div>
        </div>

        <p className="mt-10 text-center text-[11px] uppercase tracking-widest text-white/30">
          {website.footerTagline}
        </p>
      </div>
      <SiteFooter />
    </div>
  )
}

function IndustryIndexPage({ onSelect, onStartGeneral }: { onSelect: (id: IndustryId) => void; onStartGeneral: () => void }) {
  const [query, setQuery] = useState('')
  const grouped = useMemo(() => industriesByCategory(), [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return grouped
    const result = {} as Record<IndustryCategory, IndustryConfig[]>
    for (const [cat, list] of Object.entries(grouped) as [IndustryCategory, IndustryConfig[]][]) {
      const matches = list.filter(
        (i) =>
          i.label.toLowerCase().includes(q) ||
          i.description.toLowerCase().includes(q) ||
          i.shortLabel.toLowerCase().includes(q),
      )
      if (matches.length) result[cat] = matches
    }
    return result
  }, [grouped, query])

  const total = INDUSTRY_LIST.length

  return (
    <div className="min-h-screen gradient-dark text-white">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_10%,rgba(99,102,241,0.3)_0%,transparent_60%)]" />
      <div className="relative z-10 mx-auto max-w-6xl px-6 py-16">
        <div className="text-center mb-10">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">WorkVault for your industry</h1>
          <p className="mt-3 text-white/60 max-w-xl mx-auto">
            {total} tailored workspaces — same local-first platform, matched to how you work.
          </p>
        </div>

        <div className="relative max-w-md mx-auto mb-12">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search industries…"
            className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-white/40 focus:border-brand-400/50 focus:outline-none"
          />
        </div>

        <div className="space-y-10">
          {(Object.keys(INDUSTRY_CATEGORIES) as IndustryCategory[]).map((cat) => {
            const list = filtered[cat]
            if (!list?.length) return null
            return (
              <section key={cat}>
                <h2 className="text-xs font-semibold uppercase tracking-widest text-brand-300/80 mb-4">
                  {INDUSTRY_CATEGORIES[cat]}
                </h2>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {list.map((industry) => {
                    const Icon = industry.icon
                    return (
                      <button
                        key={industry.id}
                        type="button"
                        onClick={() => onSelect(industry.id)}
                        className="group rounded-2xl border border-white/10 bg-white/5 p-5 text-left transition-all hover:border-brand-400/40 hover:bg-white/10"
                      >
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl gradient-brand mb-4 shadow-md group-hover:scale-105 transition-transform">
                          <Icon size={22} />
                        </div>
                        <h3 className="text-base font-semibold text-white">{industry.label}</h3>
                        <p className="mt-1.5 text-sm text-white/55 leading-relaxed line-clamp-2">{industry.description}</p>
                        <p className="mt-2 text-[10px] font-semibold uppercase tracking-wider text-brand-300/70">
                          {industry.editionLabel}
                        </p>
                      </button>
                    )
                  })}
                </div>
              </section>
            )
          })}
        </div>

        <div className="mt-12 text-center">
          <Button size="lg" onClick={onStartGeneral}>
            Skip — use general setup <ArrowRight size={16} />
          </Button>
        </div>
      </div>
      <SiteFooter />
    </div>
  )
}

export default function IndustryWelcome() {
  const { industryId: paramId } = useParams()
  const navigate = useNavigate()
  const selectedId = isIndustryId(paramId) ? paramId : null
  const config = selectedId ? getIndustryConfig(selectedId) : null

  useEffect(() => {
    if (selectedId) writePreviewIndustry(selectedId)
  }, [selectedId])

  const startWithIndustry = (id: IndustryId) => {
    writePreviewIndustry(id)
    navigate('/')
  }

  if (config) {
    return (
      <IndustryDetailPage
        config={config}
        onStart={() => startWithIndustry(config.id)}
        onBrowse={() => navigate('/welcome')}
      />
    )
  }

  return (
    <IndustryIndexPage
      onSelect={(id) => navigate(`/welcome/${id}`)}
      onStartGeneral={() => startWithIndustry('general')}
    />
  )
}
