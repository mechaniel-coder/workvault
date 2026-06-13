import { useEffect, useState } from 'react'
import { Download, X } from 'lucide-react'
import { isDesktopApp, isCapacitorNative, isStandalonePwa, isMobileWeb } from '../../lib/platform'

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const DISMISS_KEY = 'workvault-pwa-install-dismissed'

export function PwaInstallBanner() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null)
  const [dismissed, setDismissed] = useState(() => localStorage.getItem(DISMISS_KEY) === '1')
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (isDesktopApp() || isCapacitorNative() || isStandalonePwa() || dismissed) return

    const onBeforeInstall = (e: Event) => {
      e.preventDefault()
      setDeferred(e as BeforeInstallPromptEvent)
      setVisible(true)
    }

    window.addEventListener('beforeinstallprompt', onBeforeInstall)
    return () => window.removeEventListener('beforeinstallprompt', onBeforeInstall)
  }, [dismissed])

  useEffect(() => {
    if (!isMobileWeb() || isStandalonePwa() || dismissed) return
    const isIos = /iPhone|iPad|iPod/i.test(navigator.userAgent)
    if (isIos && !deferred) setVisible(true)
  }, [deferred, dismissed])

  if (!visible || dismissed) return null

  const isIos = /iPhone|iPad|iPod/i.test(navigator.userAgent)

  async function install() {
    if (deferred) {
      await deferred.prompt()
      await deferred.userChoice
      setVisible(false)
      return
    }
  }

  function dismiss() {
    localStorage.setItem(DISMISS_KEY, '1')
    setDismissed(true)
    setVisible(false)
  }

  return (
    <div className="fixed bottom-20 left-4 right-4 z-40 md:bottom-6 md:left-auto md:right-6 md:max-w-sm">
      <div className="rounded-2xl border border-brand-200/80 bg-white/95 p-4 shadow-xl backdrop-blur-xl">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl gradient-brand text-white">
            <Download size={18} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-surface-900">Install WorkVault</p>
            <p className="mt-0.5 text-xs text-surface-500 leading-relaxed">
              {isIos && !deferred
                ? 'Tap Share, then Add to Home Screen for quick access on this device.'
                : 'Add WorkVault to your home screen for an app-like experience.'}
            </p>
            {deferred && (
              <button
                type="button"
                onClick={install}
                className="mt-2 rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-700"
              >
                Install app
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={dismiss}
            className="rounded-lg p-1 text-surface-400 hover:bg-surface-100"
            aria-label="Dismiss"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}
