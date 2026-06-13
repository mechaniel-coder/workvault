import { DESKTOP_API_BASE, isDesktopApp } from './platform'

/** Resolve `/api/...` to Netlify when running the desktop app. */
export function apiUrl(path: string): string {
  const normalized = path.startsWith('/') ? path : `/${path}`
  if (isDesktopApp() || import.meta.env.VITE_DESKTOP === '1') {
    return `${DESKTOP_API_BASE}${normalized}`
  }
  return normalized
}

export function apiFetch(input: string, init?: RequestInit): Promise<Response> {
  return fetch(apiUrl(input), init)
}
