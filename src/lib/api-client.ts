import { getApiBase, isCapacitorNative, isDesktopApp } from './platform'

/** Resolve `/api/...` to remote backend when not same-origin (desktop, mobile app, self-host). */
export function apiUrl(path: string): string {
  const normalized = path.startsWith('/') ? path : `/${path}`
  const base = getApiBase()
  if (base) return `${base}${normalized}`
  if (isDesktopApp() || isCapacitorNative() || import.meta.env.VITE_DESKTOP === '1') {
    return `https://workvault.netlify.app${normalized}`
  }
  return normalized
}

export function apiFetch(input: string, init?: RequestInit): Promise<Response> {
  return fetch(apiUrl(input), init)
}
