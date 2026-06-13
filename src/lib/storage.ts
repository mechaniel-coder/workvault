import { isDesktopApp } from './platform'

const STORAGE_KEY = 'workvault-state'
const STATE_FILE = 'workvault-state.json'

export async function readStateJson(): Promise<string | null> {
  if (!isDesktopApp()) {
    return localStorage.getItem(STORAGE_KEY)
  }

  const { exists, readTextFile, mkdir } = await import('@tauri-apps/plugin-fs')
  const { appDataDir, join } = await import('@tauri-apps/api/path')
  const dir = await appDataDir()
  await mkdir(dir, { recursive: true })
  const path = await join(dir, STATE_FILE)
  if (!(await exists(path))) return null
  return readTextFile(path)
}

export async function writeStateJson(json: string): Promise<void> {
  if (!isDesktopApp()) {
    localStorage.setItem(STORAGE_KEY, json)
    return
  }

  const { writeTextFile, mkdir } = await import('@tauri-apps/plugin-fs')
  const { appDataDir, join } = await import('@tauri-apps/api/path')
  const dir = await appDataDir()
  await mkdir(dir, { recursive: true })
  const path = await join(dir, STATE_FILE)
  await writeTextFile(path, json)
}

/** Migrate browser localStorage → disk on first desktop launch. */
export async function migrateBrowserStateToDisk(): Promise<boolean> {
  if (!isDesktopApp()) return false

  const legacy = localStorage.getItem(STORAGE_KEY)
  if (!legacy) return false

  const onDisk = await readStateJson()
  if (onDisk) return false

  await writeStateJson(legacy)
  return true
}
