import { useEffect, useState } from 'react'
import { Box, CheckCircle2 } from 'lucide-react'
import { getIndustryConfig, readPreviewIndustry, resolveIndustryId } from '../lib/industries'

interface LoadingScreenProps {
  onComplete: () => void
  minDuration?: number
  industryId?: string | null
}

export function LoadingScreen({ onComplete, minDuration = 2200, industryId }: LoadingScreenProps) {
  const [progress, setProgress] = useState(0)
  const [featureIndex, setFeatureIndex] = useState(0)
  const [exiting, setExiting] = useState(false)

  const config = getIndustryConfig(
    industryId ?? readPreviewIndustry() ?? 'general',
  )
  const features = config.loadingFeatures

  useEffect(() => {
    const start = Date.now()
    const interval = setInterval(() => {
      const elapsed = Date.now() - start
      const pct = Math.min(100, (elapsed / minDuration) * 100)
      setProgress(pct)
      if (elapsed >= minDuration) {
        clearInterval(interval)
        setExiting(true)
        setTimeout(onComplete, 600)
      }
    }, 16)
    return () => clearInterval(interval)
  }, [minDuration, onComplete])

  useEffect(() => {
    document.documentElement.dataset.industry = resolveIndustryId(config.id)
    const id = setInterval(() => {
      setFeatureIndex((i) => (i + 1) % features.length)
    }, 700)
    return () => clearInterval(id)
  }, [config.id, features.length])

  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden transition-opacity duration-600 ${
        exiting ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      <div className="absolute inset-0 gradient-dark" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,rgba(99,102,241,0.35)_0%,transparent_60%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_80%,rgba(129,140,248,0.2)_0%,transparent_50%)]" />

      <div className="absolute top-1/4 left-1/4 h-64 w-64 rounded-full bg-brand-500/10 blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 h-48 w-48 rounded-full bg-brand-400/10 blur-3xl animate-pulse [animation-delay:1s]" />

      <div className="relative z-10 flex flex-col items-center px-6">
        <div className="relative mb-8">
          <div className="absolute inset-0 rounded-2xl bg-brand-500/30 blur-xl scale-150 animate-pulse" />
          <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl gradient-brand shadow-2xl shadow-brand-600/40 loading-logo">
            <Box size={36} className="text-white" strokeWidth={1.5} />
          </div>
        </div>

        <h1 className="text-3xl font-bold text-white tracking-tight mb-1">WorkVault</h1>
        <p className="text-sm text-brand-200/80 font-medium tracking-wide uppercase mb-10">
          {config.editionLabel}
        </p>

        <div className="flex items-center gap-2.5 h-8 mb-10">
          <CheckCircle2 size={16} className="text-brand-300 loading-feature-icon" key={featureIndex} />
          <span className="text-sm text-white/70 loading-feature-text" key={`text-${featureIndex}`}>
            {features[featureIndex]}
          </span>
        </div>

        <div className="w-56 h-1 rounded-full bg-white/10 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-brand-400 to-brand-300 transition-all duration-100 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="mt-3 text-xs text-white/30 tabular-nums">{Math.round(progress)}%</p>
      </div>

      <p className="absolute bottom-8 text-[11px] text-white/25 tracking-wider">
        {config.website.footerTagline}
      </p>
    </div>
  )
}
