import { type ReactNode } from 'react'
import { useAuth } from '../context/AuthContext'
import { useStore } from '../context/StoreContext'
import { LoadingScreen } from './LoadingScreen'
import { Onboarding } from './Onboarding'

export function AppGate({ children }: { children: ReactNode }) {
  const { loading: authLoading } = useAuth()
  const { state, storageReady } = useStore()

  const setupDone = Boolean(
    state.syncMeta.setupComplete || state.profile.name?.trim(),
  )

  if (!storageReady || authLoading) {
    if (setupDone) return null
    return (
      <LoadingScreen
        onComplete={() => {}}
        minDuration={600}
        industryId={state.profile.industryId}
      />
    )
  }

  if (!setupDone) {
    return <Onboarding />
  }

  return <>{children}</>
}
