import { useState } from 'react'
import { ArrowRight, Box, CheckCircle2, Sparkles } from 'lucide-react'
import { useStore } from '../context/StoreContext'
import { Button } from './ui/Button'
import { Input } from './ui/Input'

const ONBOARDING_KEY = 'workvault-onboarded'

export function isOnboardingComplete(): boolean {
  return localStorage.getItem(ONBOARDING_KEY) === 'true'
}

export function markOnboardingComplete(): void {
  localStorage.setItem(ONBOARDING_KEY, 'true')
}

interface OnboardingProps {
  onComplete: () => void
}

export function Onboarding({ onComplete }: OnboardingProps) {
  const { updateProfile } = useStore()
  const [step, setStep] = useState(0)
  const [form, setForm] = useState({
    name: '',
    email: '',
    business: '',
    rate: '75',
  })

  const finish = () => {
    updateProfile({
      name: form.business || form.name,
      email: form.email,
      defaultHourlyRate: parseFloat(form.rate) || 75,
    })
    markOnboardingComplete()
    onComplete()
  }

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
      <div className="absolute inset-0 gradient-dark" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(99,102,241,0.3)_0%,transparent_70%)]" />

      <div className="relative z-10 w-full max-w-lg">
        {/* Step indicators */}
        <div className="flex justify-center gap-2 mb-8">
          {[0, 1, 2].map((s) => (
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
              <h2 className="text-2xl font-bold text-white mb-3">Welcome to WorkVault</h2>
              <p className="text-white/60 text-sm leading-relaxed mb-8">
                The all-in-one platform built for contract workers. Protect your work,
                send contracts, track time, and manage invoices — all in one place.
              </p>
              <div className="grid grid-cols-2 gap-3 mb-8 text-left">
                {['E-Signatures', 'Time Tracking', 'Invoicing', 'Work Protection'].map((f) => (
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
                <span className="text-xs font-medium text-brand-300 uppercase tracking-wider">Setup</span>
              </div>
              <h2 className="text-xl font-bold text-white mb-1">Tell us about yourself</h2>
              <p className="text-white/50 text-sm mb-6">Used on contracts and invoices</p>
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
                <Button variant="secondary" className="flex-1 !bg-white/10 !text-white !border-white/20 hover:!bg-white/20" onClick={() => setStep(0)}>
                  Back
                </Button>
                <Button className="flex-1" onClick={() => setStep(2)} disabled={!form.name}>
                  Continue <ArrowRight size={16} />
                </Button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="text-center onboarding-step">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20 mb-6">
                <CheckCircle2 size={32} className="text-emerald-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-3">You're all set!</h2>
              <p className="text-white/60 text-sm leading-relaxed mb-2">
                Welcome, <strong className="text-white">{form.name}</strong>.
              </p>
              <p className="text-white/50 text-sm mb-8">
                Your workspace is ready. All data stays on your device — private and secure.
              </p>
              <Button size="lg" className="w-full" onClick={finish}>
                Open WorkVault <ArrowRight size={16} />
              </Button>
              <button
                onClick={() => { markOnboardingComplete(); onComplete() }}
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
