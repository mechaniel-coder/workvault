import type { ReactNode } from 'react'
import { useStore } from '../context/StoreContext'
import { CursorCliSubNav } from './CursorCliSubNav'
import { PageHeader } from './ui/Modal'

export function CursorCliPageShell({
  description,
  children,
}: {
  description: string
  children: ReactNode
}) {
  const { state, updateCursorCliSettings } = useStore()

  return (
    <div>
      <PageHeader
        title="Cursor CLI"
        description={description}
        action={
          <label className="flex items-center gap-2 text-sm font-medium text-surface-700 cursor-pointer">
            <input
              type="checkbox"
              checked={state.cursorCli.settings.enabled}
              onChange={(e) => updateCursorCliSettings({ enabled: e.target.checked })}
              className="rounded border-surface-300 text-brand-600 focus:ring-brand-500"
            />
            Enable CLI integration
          </label>
        }
      />
      <CursorCliSubNav />
      {children}
    </div>
  )
}
