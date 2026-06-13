import { useRef, useState } from 'react'
import { Upload, Loader2 } from 'lucide-react'
import { useStore } from '../context/StoreContext'
import { Button } from './ui/Button'
import { Card } from './ui/Card'
import { importClientWorkspaceFile } from '../lib/client-app-bundle'
import { getClientAppUrl } from '../lib/client-app'

export function ClientWorkspaceImportCard() {
  const { state } = useStore()
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')

  const handleImport = async (file: File) => {
    setBusy(true)
    setMessage('')
    try {
      const session = await importClientWorkspaceFile(file)
      setMessage(`Imported workspace for ${session.clientName}.`)
      if (!state.profile.name) {
        window.location.href = getClientAppUrl(session.token)
      }
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Import failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card className="p-6">
      <h2 className="text-base font-semibold text-surface-900 mb-1">Client workspace file</h2>
      <p className="text-sm text-surface-500 mb-4">
        Received a <strong>.workvault</strong> file from a contractor? Import it here — it runs locally on this device
        and can sync via Netlify when a hosted link exists.
      </p>
      <input
        ref={inputRef}
        type="file"
        accept=".workvault,application/json"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) void handleImport(file)
        }}
      />
      <Button variant="secondary" onClick={() => inputRef.current?.click()} disabled={busy}>
        {busy ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
        Import client workspace
      </Button>
      {message && <p className="text-xs text-surface-600 mt-3">{message}</p>}
    </Card>
  )
}
