import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useStore } from '../context/StoreContext'
import { Button } from './ui/Button'
import { Input } from './ui/Input'
import { Card } from './ui/Card'
import { Cloud, CloudUpload, CloudDownload, Lock, LogOut, UserPlus, LogIn } from 'lucide-react'
import { pushToCloud, pullFromCloud } from '../lib/sync'
import { getStoredPassphrase, setStoredPassphrase, clearStoredPassphrase } from '../lib/crypto'

export function CloudSyncPanel() {
  const { user, loading, login, signup, logout } = useAuth()
  const { state, importData, updateSyncMeta } = useStore()
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [passphrase, setPassphrase] = useState(getStoredPassphrase() || '')
  const [confirmPassphrase, setConfirmPassphrase] = useState('')
  const [syncing, setSyncing] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const handleAuth = async () => {
    setMessage(null)
    const result = mode === 'login'
      ? await login(email, password)
      : await signup(email, password, name)
    if (!result.ok) {
      setMessage({ type: 'error', text: result.error || 'Authentication failed' })
    }
  }

  const savePassphrase = () => {
    if (passphrase.length < 8) {
      setMessage({ type: 'error', text: 'Passphrase must be at least 8 characters' })
      return
    }
    if (passphrase !== confirmPassphrase && confirmPassphrase) {
      setMessage({ type: 'error', text: 'Passphrases do not match' })
      return
    }
    setStoredPassphrase(passphrase)
    setMessage({ type: 'success', text: 'Encryption passphrase saved for this session' })
  }

  const handlePush = async () => {
    if (!passphrase) {
      setMessage({ type: 'error', text: 'Set an encryption passphrase first' })
      return
    }
    setSyncing(true)
    setMessage(null)
    const result = await pushToCloud(state, passphrase)
    setSyncing(false)
    if (result.ok) {
      updateSyncMeta({ lastSyncedAt: result.syncedAt || new Date().toISOString() })
      setMessage({ type: 'success', text: 'Data synced to cloud successfully' })
    } else {
      setMessage({ type: 'error', text: result.error || 'Sync failed' })
    }
  }

  const handlePull = async () => {
    if (!passphrase) {
      setMessage({ type: 'error', text: 'Enter your encryption passphrase' })
      return
    }
    if (!confirm('This will replace all local data with your cloud backup. Continue?')) return
    setSyncing(true)
    setMessage(null)
    const result = await pullFromCloud(passphrase)
    setSyncing(false)
    if (result.ok && result.state) {
      importData(result.state)
      updateSyncMeta({ lastSyncedAt: result.syncedAt || new Date().toISOString() })
      setMessage({ type: 'success', text: 'Cloud data restored successfully' })
    } else {
      setMessage({ type: 'error', text: result.error || 'Pull failed' })
    }
  }

  if (loading) {
    return <Card className="p-6 text-sm text-surface-500">Loading account...</Card>
  }

  return (
    <Card className="lg:col-span-2">
      <div className="px-6 py-4 border-b border-surface-100">
        <h2 className="text-base font-semibold text-surface-900 flex items-center gap-2">
          <Cloud size={16} /> Cloud Sync
        </h2>
        <p className="text-xs text-surface-400 mt-1">
          End-to-end encrypted backup. Your passphrase never leaves your device.
        </p>
      </div>

      <div className="p-6 space-y-6">
        {!user ? (
          <div className="space-y-4">
            <div className="flex gap-2">
              <button
                onClick={() => setMode('login')}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium ${
                  mode === 'login' ? 'bg-brand-100 text-brand-700' : 'text-surface-600 hover:bg-surface-100'
                }`}
              >
                <LogIn size={14} /> Sign In
              </button>
              <button
                onClick={() => setMode('signup')}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium ${
                  mode === 'signup' ? 'bg-brand-100 text-brand-700' : 'text-surface-600 hover:bg-surface-100'
                }`}
              >
                <UserPlus size={14} /> Create Account
              </button>
            </div>
            {mode === 'signup' && (
              <Input label="Full Name" value={name} onChange={(e) => setName(e.target.value)} />
            )}
            <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <Input label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            <Button onClick={handleAuth}>
              {mode === 'login' ? 'Sign In' : 'Create Account'}
            </Button>
            <p className="text-xs text-surface-400">
              Requires Netlify Identity enabled on your deployed site.
            </p>
          </div>
        ) : (
          <div className="flex items-center justify-between rounded-lg bg-brand-50 px-4 py-3">
            <div>
              <p className="text-sm font-medium text-brand-800">{user.name || user.email}</p>
              <p className="text-xs text-brand-600">{user.email}</p>
            </div>
            <Button variant="ghost" size="sm" onClick={logout}>
              <LogOut size={14} /> Sign Out
            </Button>
          </div>
        )}

        <div className="border-t border-surface-100 pt-6 space-y-4">
          <div className="flex items-center gap-2 text-sm font-medium text-surface-700">
            <Lock size={14} /> Encryption Passphrase
          </div>
          <Input
            label="Passphrase"
            type="password"
            value={passphrase}
            onChange={(e) => setPassphrase(e.target.value)}
            placeholder="Min. 8 characters — used to encrypt your data"
          />
          <Input
            label="Confirm Passphrase"
            type="password"
            value={confirmPassphrase}
            onChange={(e) => setConfirmPassphrase(e.target.value)}
          />
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={savePassphrase}>Save Passphrase</Button>
            <Button variant="ghost" size="sm" onClick={() => { clearStoredPassphrase(); setPassphrase(''); setMessage({ type: 'success', text: 'Passphrase cleared' }) }}>
              Clear
            </Button>
          </div>
        </div>

        {user && (
          <div className="border-t border-surface-100 pt-6 space-y-4">
            <div className="flex flex-wrap gap-3">
              <Button onClick={handlePush} disabled={syncing}>
                <CloudUpload size={16} /> {syncing ? 'Syncing...' : 'Push to Cloud'}
              </Button>
              <Button variant="secondary" onClick={handlePull} disabled={syncing}>
                <CloudDownload size={16} /> Pull from Cloud
              </Button>
            </div>
            <label className="flex items-center gap-2 text-sm text-surface-600">
              <input
                type="checkbox"
                checked={state.syncMeta.autoSync}
                onChange={(e) => updateSyncMeta({ autoSync: e.target.checked })}
                className="rounded border-surface-300 text-brand-600 focus:ring-brand-500"
              />
              Auto-sync on changes (requires passphrase saved)
            </label>
            {state.syncMeta.lastSyncedAt && (
              <p className="text-xs text-surface-400">
                Last synced: {new Date(state.syncMeta.lastSyncedAt).toLocaleString()}
              </p>
            )}
          </div>
        )}

        {message && (
          <div className={`rounded-lg px-4 py-3 text-sm ${
            message.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
          }`}>
            {message.text}
          </div>
        )}
      </div>
    </Card>
  )
}
