/** True when running inside the WorkVault desktop app (Tauri). */
export function isDesktopApp(): boolean {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window
}

export const DESKTOP_API_BASE = 'https://workvault.netlify.app'

export function dataDirectoryHint(): string {
  return isDesktopApp()
    ? '~/Library/Application Support/com.workvault.desktop/'
    : 'Browser storage (this device)'
}
