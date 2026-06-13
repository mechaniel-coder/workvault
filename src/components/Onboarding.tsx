import { useState } from 'react'
import { ArrowRight, Box, CheckCircle2, Sparkles } from 'lucide-react'
import { useStore } from '../context/StoreContext'
import { useIndustryOptional } from '../context/IndustryContext'
import { Button } from './ui/Button'
import { Input } from './ui/Input'
import {
  INDUSTRY_LIST,
  clearPreviewIndustry,
  readPreviewIndustry,
  type IndustryId,
} from '../lib/industries'

const ONBOARDING_KEY = 'workvault-onboarded'

/** @deprecated Use syncMeta.setupComplete in app state */
export function isOnboardingComplete(): boolean {
  return localStorage.getItem(ONBOARDING_KEY) === 'true'
}

function markOnboardingComplete(): void {
  localStorage.setItem(ONBOARDING_KEY, 'true')
}

export function Onboarding() {
  const { updateProfile, updateSyncMeta } = useStore()
  const industryCtx = useIndustryOptional()
  const previewIndustry = readPreviewIndustry()
  const [step, setStep] = useState(0)
  const [industryId, setIndustryId] = useState<IndustryId>(
    industryCtx?.industryId ?? previewIndustry ?? 'general',
  )
  const [form, setForm] = useState({
    name: '',
    email: '',
    business: '',
    rate: '75',
  })

  const config = INDUSTRY_LIST.find((i) => i.id === industryId) ?? INDUSTRY_LIST[0]
  const totalSteps = 4

  const completeSetup = (profile?: {
    name?: string
    email?: string
    defaultHourlyRate?: number
    industryId?: IndustryId
  }) => {
    if (profile) {
      updateProfile(profile)
    }
    updateSyncMeta({ setupComplete: true })
    markOnboardingComplete()
    clearPreviewIndustry()
    industryCtx?.setIndustry(industryId)
  }

  const finish = () => {
    completeSetup({
      name: form.business || form.name,
      email: form.email,
      defaultHourlyRate: parseFloat(form.rate) || 75,
      industryId,
    })
  }

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
      <div className="absolute inset-0 gradient-dark" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(99,102,241,0.3)_0%,transparent_70%)]" />

      <div className="relative z-10 w-full max-w-lg">
        <div className="flex justify-center gap-2 mb-8">
          {Array.from({ length: totalSteps }).map((_, s) => (
            <div
              key={s}
              className={`h-1.5 rounded-full transition-all duration-500 ${
                s === step ? 'w-8 bg-brand-400' : s < step ? 'w-4 bg-brand-600' : 'w-4 bg-white/20'
              }`}
            />
          ))}
        </div>

        <div className="rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 p-8 shadow-2xl onboarding-card">
          {step === 0 && (
            <div className="text-center onboarding-step">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl gradient-brand mb-6 shadow-lg shadow-brand-600/30">
                <Box size={28} className="text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-3">{config.onboarding.welcomeTitle}</h2>
              <p className="text-white/60 text-sm leading-relaxed mb-8">{config.onboarding.welcomeBody}</p>
              <div className="grid grid-cols-2 gap-3 mb-8 text-left">
                {config.onboarding.highlights.map((f) => (
                  <div key={f} className="flex items-center gap-2 text-sm text-white/70">
                    <CheckCircle2 size={14} className="text-brand-400 shrink-0" />
                    {f}
                  </div>
                ))}
              </div>
              <Button size="lg" className="w-full" onClick={() => setStep(1)}>
                Get Started <ArrowRight size={16} />
              </Button>
            </div>
          )}

          {step === 1 && (
            <div className="onboarding-step">
              <div className="flex items-center gap-2 mb-1">
                <Sparkles size={16} className="text-brand-400" />
                <span className="text-xs font-medium text-brand-300 uppercase tracking-wider">Your industry</span>
              </div>
              <h2 className="text-xl font-bold text-white mb-1">What kind of work do you do?</h2>
              <p className="text-white/50 text-sm mb-5">
                We&apos;ll tailor navigation, labels, and your dashboard for your trade.
              </p>
              <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1">
                {INDUSTRY_LIST.map((industry) => {
                  const Icon = industry.icon
                  const selected = industryId === industry.id
                  return (
                    <button
                      key={industry.id}
                      type="button"
                      onClick={() => setIndustryId(industry.id)}
                      className={`rounded-xl border p-3 text-left transition-all ${
                        selected
                          ? 'border-brand-400 bg-brand-500/20'
                          : 'border-white/10 bg-white/5 hover:bg-white/10'
                      }`}
                    >
                      <Icon size={18} className={selected ? 'text-brand-200' : 'text-white/60'} />
                      <p className="mt-2 text-sm font-medium text-white">{industry.shortLabel}</p>
                    </button>
                  )
                })}
              </div>
              <div className="flex gap-3 mt-6">
                <Button
                  variant="secondary"
                  className="flex-1 !bg-white/10 !text-white !border-white/20 hover:!bg-white/20"
                  onClick={() => setStep(0)}
                >
                  Back
                </Button>
                <Button className="flex-1" onClick={() => setStep(2)}>
                  Continue <ArrowRight size={16} />
                </Button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="onboarding-step">
              <div className="flex items-center gap-2 mb-1">
                <Sparkles size={16} className="text-brand-400" />
                <span className="text-xs font-medium text-brand-300 uppercase tracking-wider">Setup</span>
              </div>
              <h2 className="text-xl font-bold text-white mb-1">Tell us about yourself</h2>
              <p className="text-white/50 text-sm mb-6">Used on {config.terminology.contracts.toLowerCase()} and invoices</p>
              <div className="space-y-4">
                <Input
                  label="Your Name"
                  variant="dark"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Jane Smith"
                />
                <Input
                  label="Business / Trade Name"
                  variant="dark"
                  value={form.business}
                  onChange={(e) => setForm({ ...form, business: e.target.value })}
                  placeholder="Smith Design Co."
                />
                <Input
                  label="Email"
                  variant="dark"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="jane@example.com"
                />
                <Input
                  label="Default Hourly Rate ($)"
                  variant="dark"
                  type="number"
                  value={form.rate}
                  onChange={(e) => setForm({ ...form, rate: e.target.value })}
                />
              </div>
              <div className="flex gap-3 mt-6">
                <Button
                  variant="secondary"
                  className="flex-1 !bg-white/10 !text-white !border-white/20 hover:!bg-white/20"
                  onClick={() => setStep(1)}
                >
                  Back
                </Button>
                <Button className="flex-1" onClick={() => setStep(3)} disabled={!form.name}>
                  Continue <ArrowRight size={16} />
                </Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="text-center onboarding-step">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20 mb-6">
                <CheckCircle2 size={32} className="text-emerald-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-3">You&apos;re all set!</h2>
              <p className="text-white/60 text-sm leading-relaxed mb-2">
                Welcome, <strong className="text-white">{form.name}</strong>.
              </p>
              <p className="text-white/50 text-sm mb-2">
                Your <strong className="text-white/70">{config.editionLabel}</strong> workspace is ready.
              </p>
              <p className="text-white/50 text-sm mb-8">
                All data stays on your device — private and secure.
              </p>
              <Button size="lg" className="w-full" onClick={finish}>
                Open WorkVault <ArrowRight size={16} />
              </Button>
              <button
                onClick={() => completeSetup({ industryId })}
                className="mt-4 text-xs text-white/30 hover:text-white/50 transition-colors"
              >
                Skip for now
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
