import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowRight, CheckCircle2 } from 'lucide-react'
import {
  INDUSTRY_LIST,
  getIndustryConfig,
  isIndustryId,
  writePreviewIndustry,
} from '../lib/industries'
import type { IndustryId } from '../lib/industries'
import { Button } from '../components/ui/Button'

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
    const Icon = config.icon
    return (
      <div className="min-h-screen gradient-dark text-white">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(99,102,241,0.35)_0%,transparent_70%)]" />
        <div className="relative z-10 mx-auto max-w-4xl px-6 py-16">
          <p className="text-xs font-semibold uppercase tracking-widest text-brand-300/80 mb-4">
            WorkVault · {config.shortLabel}
          </p>
          <div className="flex items-start gap-4 mb-6">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl gradient-brand shadow-lg">
              <Icon size={28} />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">{config.website.heroTitle}</h1>
              <p className="mt-3 text-base text-white/65 max-w-2xl leading-relaxed">
                {config.website.heroSubtitle}
              </p>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-3 mb-10">
            {config.website.features.map((feature) => (
              <div
                key={feature}
                className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80"
              >
                <CheckCircle2 size={16} className="text-brand-300 shrink-0" />
                {feature}
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-3">
            <Button size="lg" onClick={() => startWithIndustry(config.id)}>
              Get Started <ArrowRight size={16} />
            </Button>
            <Button
              size="lg"
              variant="secondary"
              className="!bg-white/10 !text-white !border-white/20 hover:!bg-white/20"
              onClick={() => navigate('/welcome')}
            >
              Browse all industries
            </Button>
          </div>

          <p className="mt-12 text-center text-[11px] uppercase tracking-widest text-white/30">
            {config.website.footerTagline}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen gradient-dark text-white">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_10%,rgba(99,102,241,0.3)_0%,transparent_60%)]" />
      <div className="relative z-10 mx-auto max-w-5xl px-6 py-16">
        <div className="text-center mb-12">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">WorkVault for your industry</h1>
          <p className="mt-3 text-white/60 max-w-xl mx-auto">
            Same powerful local-first platform — tailored navigation, terminology, and workflows for how you work.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {INDUSTRY_LIST.map((industry) => {
            const Icon = industry.icon
            return (
              <button
                key={industry.id}
                type="button"
                onClick={() => navigate(`/welcome/${industry.id}`)}
                className="group rounded-2xl border border-white/10 bg-white/5 p-5 text-left transition-all hover:border-brand-400/40 hover:bg-white/10"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl gradient-brand mb-4 shadow-md group-hover:scale-105 transition-transform">
                  <Icon size={22} />
                </div>
                <h2 className="text-base font-semibold text-white">{industry.label}</h2>
                <p className="mt-1.5 text-sm text-white/55 leading-relaxed">{industry.description}</p>
              </button>
            )
          })}
        </div>

        <div className="mt-12 text-center">
          <Button size="lg" onClick={() => startWithIndustry('general')}>
            Skip — use general setup <ArrowRight size={16} />
          </Button>
        </div>
      </div>
    </div>
  )
}
