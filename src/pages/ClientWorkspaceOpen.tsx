import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2, Monitor, Upload, Cloud } from 'lucide-react'
import { importClientWorkspaceFile } from '../lib/client-app-bundle'
import { getClientAppUrl } from '../lib/client-app'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'

export default function ClientWorkspaceOpen() {
  const navigate = useNavigate()
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [status, setStatus] = useState('')

  const handleFile = async (file: File) => {
    setBusy(true)
    setError('')
    try {
      const session = await importClientWorkspaceFile(file)
      setStatus(`Opened workspace for ${session.clientName}.`)
      navigate(getClientAppUrl(session.token).replace(window.location.origin, ''))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not open workspace file')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-50/40 to-surface-50 flex items-center justify-center p-6">
      <Card className="max-w-lg w-full p-8">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl gradient-brand text-white mb-4">
          <Monitor size={24} />
        </div>
        <h1 className="text-2xl font-bold text-surface-900">Open Client WorkVault</h1>
        <p className="text-sm text-surface-600 mt-2 leading-relaxed">
          Your contractor sent you a <strong>.workvault</strong> file or a link. Data stays on your device;
          Netlify syncs updates when you&apos;re online.
        </p>

        <div className="mt-6 space-y-3">
          <input
            ref={inputRef}
            type="file"
            accept=".workvault,application/json"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) void handleFile(file)
            }}
          />
          <Button
            className="w-full"
            onClick={() => inputRef.current?.click()}
            disabled={busy}
          >
            {busy ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
            Import .workvault file
          </Button>
        </div>

        <div className="mt-6 rounded-xl border border-surface-200 bg-surface-50 p-4 space-y-2 text-xs text-surface-600">
          <p className="font-semibold text-surface-800 flex items-center gap-1.5">
            <Cloud size={14} /> Have a link instead?
          </p>
          <p>
            Open the URL your contractor sent (e.g. <code className="bg-white px-1 rounded">/client/…</code>).
            The app loads from your device first, then checks Netlify for updates.
          </p>
        </div>

        {error && <p className="text-sm text-red-600 mt-4">{error}</p>}
        {status && <p className="text-sm text-emerald-700 mt-4">{status}</p>}

        <p className="text-[10px] text-surface-400 mt-6 text-center">
          Contractor? <a href="/" className="text-brand-600 hover:underline">Sign in to WorkVault</a>
        </p>
      </Card>
    </div>
  )
}
