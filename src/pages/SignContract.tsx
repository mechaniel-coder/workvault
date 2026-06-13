import { useEffect, useState } from 'react'
import { apiFetch } from '../lib/api-client'
import { useParams } from 'react-router-dom'
import { FileText, CheckCircle, Shield } from 'lucide-react'
import { SignaturePad, SignatureDisplay } from '../components/SignaturePad'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Card } from '../components/ui/Card'

interface SigningData {
  number: string
  title: string
  content: string
  clientName: string
  contractorName: string
  value: number
  currency: string
  contractorSignature: { name: string; signatureImage: string; signedAt: string } | null
  clientSignature: { name: string; signatureImage: string; signedAt: string } | null
  alreadySigned: boolean
}

export default function SignContractPage() {
  const { token } = useParams<{ token: string }>()
  const [data, setData] = useState<SigningData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [signerName, setSignerName] = useState('')
  const [signatureImage, setSignatureImage] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [completed, setCompleted] = useState(false)

  useEffect(() => {
    if (!token) return
    apiFetch(`/api/sign/${token}`)
      .then((res) => {
        if (!res.ok) throw new Error('Contract not found or link expired')
        return res.json()
      })
      .then((d: SigningData) => {
        setData(d)
        setSignerName(d.clientName)
        if (d.alreadySigned) setCompleted(true)
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [token])

  const handleSubmit = async () => {
    if (!token || !signatureImage || !signerName.trim()) return
    setSubmitting(true)
    try {
      const res = await apiFetch(`/api/sign/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: signerName, signatureImage }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error((err as { error?: string }).error || 'Failed to submit signature')
      }
      setCompleted(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Submission failed')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-50 flex items-center justify-center">
        <p className="text-surface-500">Loading contract...</p>
      </div>
    )
  }

  if (error && !data) {
    return (
      <div className="min-h-screen bg-surface-50 flex items-center justify-center p-4">
        <Card className="p-8 max-w-md text-center">
          <p className="text-red-600 font-medium">{error}</p>
          <p className="text-sm text-surface-500 mt-2">This signing link may be invalid or expired.</p>
        </Card>
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="min-h-screen bg-surface-50">
      <header className="border-b border-surface-200 bg-white">
        <div className="max-w-3xl mx-auto px-6 py-5 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg gradient-brand">
            <FileText size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold text-surface-900">WorkVault E-Signature</h1>
            <p className="text-xs text-surface-400">Secure contract signing</p>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8 space-y-6">
        <Card className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-bold text-surface-900">{data.title}</h2>
              <p className="text-sm text-surface-500 mt-1">{data.number} · {data.contractorName}</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-brand-600">
                {new Intl.NumberFormat('en-US', { style: 'currency', currency: data.currency }).format(data.value)}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-sm font-semibold text-surface-700 mb-3">Contract Terms</h3>
          <pre className="whitespace-pre-wrap text-sm text-surface-600 font-sans leading-relaxed max-h-80 overflow-y-auto">
            {data.content}
          </pre>
        </Card>

        {data.contractorSignature && (
          <div>
            <h3 className="text-sm font-semibold text-surface-700 mb-2">Contractor Signature</h3>
            <SignatureDisplay signature={data.contractorSignature} />
          </div>
        )}

        {completed ? (
          <Card className="p-8 text-center">
            <CheckCircle size={48} className="mx-auto text-emerald-500 mb-4" />
            <h3 className="text-lg font-semibold text-surface-900">Contract Signed Successfully</h3>
            <p className="text-sm text-surface-500 mt-2">
              Your signature has been recorded. The contractor will be notified.
            </p>
          </Card>
        ) : (
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Shield size={16} className="text-brand-600" />
              <h3 className="text-sm font-semibold text-surface-900">Your Signature</h3>
            </div>
            <Input
              label="Full Legal Name"
              value={signerName}
              onChange={(e) => setSignerName(e.target.value)}
            />
            <div className="mt-4">
              {!signatureImage ? (
                <SignaturePad
                  defaultName={signerName}
                  onSignature={(img) => setSignatureImage(img)}
                />
              ) : (
                <div className="space-y-4">
                  <img src={signatureImage} alt="Your signature" className="h-20 border border-surface-200 rounded-lg p-2 bg-white" />
                  <div className="flex gap-2">
                    <Button variant="secondary" size="sm" onClick={() => setSignatureImage(null)}>Redo</Button>
                    <Button onClick={handleSubmit} disabled={submitting || !signerName.trim()}>
                      {submitting ? 'Submitting...' : 'Sign Contract'}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </Card>
        )}

        <p className="text-center text-xs text-surface-400 pb-8">
          Secured by WorkVault · Your signature is cryptographically timestamped
        </p>
      </main>
    </div>
  )
}
