import { Capacitor } from '@capacitor/core'

export type RuntimePlatform = 'desktop' | 'capacitor' | 'mobile-web' | 'web'

const DEFAULT_API_BASE = 'https://workvault.netlify.app'

/** True when running inside the WorkVault desktop app (Tauri). */
export function isDesktopApp(): boolean {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window
}

/** True when running as a native iOS/Android Capacitor shell. */
export function isCapacitorNative(): boolean {
  return Capacitor.isNativePlatform()
}

/** Phone/tablet browser or installed PWA (not desktop Tauri/Capacitor). */
export function isMobileWeb(): boolean {
  if (typeof window === 'undefined' || isDesktopApp() || isCapacitorNative()) return false
  const coarse = window.matchMedia('(pointer: coarse)').matches
  const narrow = window.matchMedia('(max-width: 768px)').matches
  return coarse || narrow
}

export function getRuntimePlatform(): RuntimePlatform {
  if (isDesktopApp()) return 'desktop'
  if (isCapacitorNative()) return 'capacitor'
  if (isMobileWeb()) return 'mobile-web'
  return 'web'
}

/** API origin for serverless functions (Netlify or self-hosted). */
export function getApiBase(): string {
  const fromEnv = import.meta.env.VITE_API_BASE?.trim()
  if (fromEnv) return fromEnv.replace(/\/$/, '')
  if (isDesktopApp() || isCapacitorNative() || import.meta.env.VITE_DESKTOP === '1') {
    return DEFAULT_API_BASE
  }
  return ''
}

/** @deprecated Use getApiBase() */
export const DESKTOP_API_BASE = DEFAULT_API_BASE

export function dataDirectoryHint(): string {
  if (isCapacitorNative()) {
    return Capacitor.getPlatform() === 'ios'
      ? 'On-device app storage (iOS)'
      : 'On-device app storage (Android)'
  }
  if (!isDesktopApp()) return 'Browser storage (this device)'
  const ua = navigator.userAgent
  if (/Win/i.test(ua)) return '%APPDATA%\\com.workvault.desktop\\'
  if (/Mac/i.test(ua)) return '~/Library/Application Support/com.workvault.desktop/'
  if (/Linux/i.test(ua)) return '~/.local/share/com.workvault.desktop/'
  return 'App data folder on this device'
}

export function isStandalonePwa(): boolean {
  if (typeof window === 'undefined') return false
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  )
}
