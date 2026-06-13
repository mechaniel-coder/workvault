import { useState, type ReactNode } from 'react'
import { Lock, Shield } from 'lucide-react'
import { useClientRoom } from '../context/ClientRoomContext'
import { Card } from './ui/Card'
import { Input } from './ui/Input'
import { Button } from './ui/Button'

export function ClientAccessGates({ children }: { children: ReactNode }) {
  const { session, unlocked, ndaAccepted, clientName, setClientName, tryPassword, acceptNda } = useClientRoom()
  const [password, setPassword] = useState('')
  const [pwError, setPwError] = useState(false)

  if (session.config.linkPassword && !unlocked) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-4">
        <Card className="max-w-sm w-full p-8">
          <Lock className="mx-auto text-brand-600 mb-3" size={28} />
          <h1 className="text-xl font-semibold text-center text-surface-900">Protected workspace</h1>
          <p className="text-sm text-surface-500 text-center mt-2">Enter the password from {session.contractorName}.</p>
          <Input label="Password" type="password" value={password} className="mt-4" onChange={(e) => setPassword(e.target.value)} />
          {pwError && <p className="text-xs text-red-600 mt-2">Incorrect password.</p>}
          <Button className="w-full mt-4" onClick={() => setPwError(!tryPassword(password))}>Continue</Button>
        </Card>
      </div>
    )
  }

  if (session.config.ndaRequired && !ndaAccepted) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-4">
        <Card className="max-w-lg w-full p-8">
          <Shield className="mx-auto text-brand-600 mb-3" size={28} />
          <h1 className="text-xl font-semibold text-center text-surface-900">Confidentiality agreement</h1>
          <p className="text-sm text-surface-600 mt-4 whitespace-pre-wrap leading-relaxed">{session.config.ndaText}</p>
          <Input label="Your full name" value={clientName} onChange={(e) => setClientName(e.target.value)} className="mt-4" />
          <Button className="w-full mt-4" disabled={!clientName.trim()} onClick={acceptNda}>I agree — continue</Button>
        </Card>
      </div>
    )
  }

  return <>{children}</>
}
