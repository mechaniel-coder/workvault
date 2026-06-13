import { useState, useEffect, type ReactNode } from 'react'
import { useAuth } from '../context/AuthContext'
import { useStore } from '../context/StoreContext'
import { LoadingScreen } from './LoadingScreen'
import { Onboarding, isOnboardingComplete } from './Onboarding'

type AppPhase = 'loading' | 'onboarding' | 'ready'

export function AppGate({ children }: { children: ReactNode }) {
  const { loading: authLoading } = useAuth()
  const { state } = useStore()
  const [phase, setPhase] = useState<AppPhase>('loading')
  const [loadingDone, setLoadingDone] = useState(false)

  useEffect(() => {
    if (loadingDone && !authLoading) {
      const needsOnboarding = !isOnboardingComplete() && !state.profile.name
      setPhase(needsOnboarding ? 'onboarding' : 'ready')
    }
  }, [loadingDone, authLoading, state.profile.name])

  if (phase === 'loading') {
    return <LoadingScreen onComplete={() => setLoadingDone(true)} />
  }

  if (phase === 'onboarding') {
    return <Onboarding onComplete={() => setPhase('ready')} />
  }

  return <>{children}</>
}
