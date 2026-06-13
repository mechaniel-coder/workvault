import { useState } from 'react'
import { Plus, Trash2, CreditCard, ExternalLink } from 'lucide-react'
import { useStore } from '../context/StoreContext'
import { Button } from './ui/Button'
import { Input } from './ui/Input'
import { Select } from './ui/Select'
import { Card } from './ui/Card'
import type { PaymentMethod, PaymentMethodType } from '../lib/types'
import { PAYMENT_METHOD_META, getPaymentLink } from '../lib/payments'
import { Textarea } from './ui/Textarea'

const TYPE_OPTIONS = Object.entries(PAYMENT_METHOD_META).map(([value, meta]) => ({
  value,
  label: meta.label,
}))

export function PaymentMethodsSettings() {
  const { state, updateProfile } = useStore()
  const { profile } = state
  const [adding, setAdding] = useState(false)
  const [draft, setDraft] = useState<{ type: PaymentMethodType; label: string; details: string }>({
    type: 'bank_transfer',
    label: '',
    details: '',
  })

  const saveMethods = (methods: PaymentMethod[]) => {
    updateProfile({ paymentMethods: methods })
  }

  const addMethod = () => {
    if (!draft.details.trim()) return
    const method: PaymentMethod = {
      id: crypto.randomUUID(),
      type: draft.type,
      label: draft.label || PAYMENT_METHOD_META[draft.type].label,
      details: draft.details.trim(),
      enabled: true,
    }
    saveMethods([...profile.paymentMethods, method])
    setDraft({ type: 'bank_transfer', label: '', details: '' })
    setAdding(false)
  }

  const toggleMethod = (id: string) => {
    saveMethods(
      profile.paymentMethods.map((m) => (m.id === id ? { ...m, enabled: !m.enabled } : m))
    )
  }

  const removeMethod = (id: string) => {
    saveMethods(profile.paymentMethods.filter((m) => m.id !== id))
  }

  return (
    <Card className="lg:col-span-2">
      <div className="px-6 py-4 border-b border-surface-100">
        <h2 className="text-base font-semibold text-surface-900 flex items-center gap-2">
          <CreditCard size={16} /> Payment Methods
        </h2>
        <p className="text-xs text-surface-400 mt-1">
          Configure how clients pay you — shown on every invoice, PDF, and email
        </p>
      </div>

      <div className="p-6 space-y-4">
        {profile.paymentMethods.length === 0 && !adding && (
          <div className="rounded-xl border border-dashed border-surface-200 bg-surface-50 p-6 text-center">
            <CreditCard size={24} className="mx-auto text-surface-300 mb-2" />
            <p className="text-sm text-surface-500">No payment methods configured yet</p>
            <p className="text-xs text-surface-400 mt-1">Add bank transfer, PayPal, Stripe, Venmo, Zelle, and more</p>
          </div>
        )}

        <div className="space-y-3">
          {profile.paymentMethods.map((method) => {
            const link = getPaymentLink(method)
            return (
              <div
                key={method.id}
                className={`flex items-start gap-4 rounded-xl border p-4 transition-colors ${
                  method.enabled ? 'border-surface-200 bg-white' : 'border-surface-100 bg-surface-50 opacity-60'
                }`}
              >
                <input
                  type="checkbox"
                  checked={method.enabled}
                  onChange={() => toggleMethod(method.id)}
                  className="mt-1 rounded border-surface-300 text-brand-600 focus:ring-brand-500"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-surface-900">{method.label}</p>
                    <span className="text-[10px] font-medium uppercase tracking-wider text-surface-400 bg-surface-100 px-1.5 py-0.5 rounded">
                      {PAYMENT_METHOD_META[method.type].label.split(' ')[0]}
                    </span>
                  </div>
                  <p className="text-sm text-surface-600 mt-0.5 break-all">{method.details}</p>
                  {link && (
                    <a
                      href={link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 mt-1.5 text-xs text-brand-600 hover:text-brand-700"
                    >
                      Pay link <ExternalLink size={11} />
                    </a>
                  )}
                </div>
                <button
                  onClick={() => removeMethod(method.id)}
                  className="text-surface-400 hover:text-red-500 p-1 shrink-0"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            )
          })}
        </div>

        {adding ? (
          <div className="rounded-xl border border-brand-200 bg-brand-50/50 p-4 space-y-3">
            <Select
              label="Payment Type"
              options={TYPE_OPTIONS}
              value={draft.type}
              onChange={(e) => setDraft({ ...draft, type: e.target.value as PaymentMethodType })}
            />
            <Input
              label="Display Label (optional)"
              value={draft.label}
              onChange={(e) => setDraft({ ...draft, label: e.target.value })}
              placeholder={PAYMENT_METHOD_META[draft.type].label}
            />
            <Input
              label="Payment Details"
              value={draft.details}
              onChange={(e) => setDraft({ ...draft, details: e.target.value })}
              placeholder={PAYMENT_METHOD_META[draft.type].placeholder}
            />
            <p className="text-xs text-surface-500">{PAYMENT_METHOD_META[draft.type].hint}</p>
            <div className="flex gap-2">
              <Button onClick={addMethod} disabled={!draft.details.trim()}>
                Save Method
              </Button>
              <Button variant="secondary" onClick={() => setAdding(false)}>Cancel</Button>
            </div>
          </div>
        ) : (
          <Button variant="secondary" onClick={() => setAdding(true)}>
            <Plus size={16} /> Add Payment Method
          </Button>
        )}

        <Textarea
          label="Default Payment Instructions"
          value={profile.defaultPaymentInstructions}
          onChange={(e) => updateProfile({ defaultPaymentInstructions: e.target.value })}
          placeholder="e.g. Please include invoice number in payment memo. Net 30 terms apply."
        />
      </div>
    </Card>
  )
}
