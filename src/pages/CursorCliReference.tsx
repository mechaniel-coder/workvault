import { useState } from 'react'
import { Copy, Check } from 'lucide-react'
import { useStore } from '../context/StoreContext'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { CursorCliPageShell } from '../components/CursorCliPageShell'
import { CURSOR_CLI_REFERENCE } from '../lib/cursor-cli'

export default function CursorCliReference() {
  const { state } = useStore()
  const { settings } = state.cursorCli
  const [copied, setCopied] = useState('')

  const copyText = async (key: string, text: string) => {
    await navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(''), 2000)
  }

  return (
    <CursorCliPageShell description="Cursor CLI command reference — copy commands for your terminal.">
      {!settings.enabled && (
        <Card className="mb-6 p-4 border-amber-200 bg-amber-50/60">
          <p className="text-sm text-amber-800">
            Cursor CLI is disabled. Turn it on to use CLI integration across WorkVault.
          </p>
        </Card>
      )}

      <Card className="p-5">
        <h2 className="text-base font-semibold text-surface-900 mb-4">Command reference</h2>
        <div className="divide-y divide-surface-100">
          {CURSOR_CLI_REFERENCE.map((row) => (
            <div key={row.cmd} className="flex flex-col sm:flex-row sm:items-center gap-2 py-3">
              <code className="text-sm font-mono text-brand-700 bg-brand-50 px-2 py-1 rounded shrink-0">{row.cmd}</code>
              <p className="text-sm text-surface-600">{row.desc}</p>
              <Button variant="ghost" size="sm" className="sm:ml-auto shrink-0" onClick={() => copyText(row.cmd, row.cmd)}>
                {copied === row.cmd ? <Check size={14} /> : <Copy size={14} />}
              </Button>
            </div>
          ))}
        </div>
      </Card>
    </CursorCliPageShell>
  )
}
