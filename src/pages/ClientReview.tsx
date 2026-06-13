import { useState } from 'react'
import {
  ListChecks, PenLine, CheckCircle2, Star, ThumbsUp, AlertCircle,
} from 'lucide-react'
import { useClientRoom } from '../context/ClientRoomContext'
import { useClientApp } from '../context/ClientAppContext'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Textarea } from '../components/ui/Textarea'
import { Badge } from '../components/ui/Badge'
import { PageHeader } from '../components/ui/Modal'
import { formatDate } from '../lib/utils'

function ReviewContent() {
  const app = useClientApp()
  const {
    session, data, clientName, setClientName,
    submitFeedback, submitSignOff, toggleChecklist, submitSurvey,
  } = useClientRoom()

  const [feedbackComment, setFeedbackComment] = useState('')
  const [feedbackStatus, setFeedbackStatus] = useState<'approve' | 'changes'>('approve')
  const [signOffNote, setSignOffNote] = useState('')
  const [surveyRating, setSurveyRating] = useState(0)
  const [surveyComment, setSurveyComment] = useState('')
  const cfg = session.config

  return (
    <div>
      <PageHeader
        title="Review & Sign-off"
        description="Approve deliverables and sign off when ready for production."
      />

      {!clientName && (
        <Card className="p-4 mb-4">
          <Input label="Your name" value={clientName} onChange={(e) => setClientName(e.target.value)} />
        </Card>
      )}

      {cfg.versionLabel && (
        <p className="text-sm text-surface-500 mb-4">Reviewing: <Badge status="sent">{cfg.versionLabel}</Badge></p>
      )}

      {cfg.checklist.length > 0 && (
        <Card className="p-5 mb-6">
          <h2 className="text-sm font-semibold text-surface-900 flex items-center gap-2 mb-3">
            <ListChecks size={16} /> Review checklist
          </h2>
          <div className="space-y-2">
            {cfg.checklist.map((item) => {
              const prog = data.checklistProgress.find((p) => p.itemId === item.id)
              return (
                <label key={item.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-surface-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={prog?.checked || false}
                    onChange={(e) => toggleChecklist(item.id, e.target.checked)}
                    className="mt-1 rounded text-brand-600"
                  />
                  <span className="text-sm text-surface-800">
                    {item.label}{item.required && <span className="text-red-500 ml-1">*</span>}
                  </span>
                </label>
              )
            })}
          </div>
        </Card>
      )}

      <Card className="p-5 mb-6">
        <h2 className="text-sm font-semibold text-surface-900 flex items-center gap-2 mb-3">
          <PenLine size={16} /> Feedback
        </h2>
        <div className="flex gap-2 mb-3">
          <Button variant={feedbackStatus === 'approve' ? 'primary' : 'secondary'} size="sm" onClick={() => setFeedbackStatus('approve')}>
            <ThumbsUp size={14} /> Approve
          </Button>
          <Button variant={feedbackStatus === 'changes' ? 'primary' : 'secondary'} size="sm" onClick={() => setFeedbackStatus('changes')}>
            <AlertCircle size={14} /> Request changes
          </Button>
        </div>
        <Textarea placeholder="Your comments…" value={feedbackComment} onChange={(e) => setFeedbackComment(e.target.value)} />
        <Button
          className="mt-3"
          size="sm"
          disabled={!clientName.trim()}
          onClick={() => {
            submitFeedback({
              targetType: 'general',
              targetId: '',
              targetLabel: app.label,
              status: feedbackStatus,
              comment: feedbackComment,
            })
            setFeedbackComment('')
          }}
        >
          Submit feedback
        </Button>
      </Card>

      <Card className="p-5 mb-6 border-emerald-200 bg-emerald-50/30">
        <h2 className="text-sm font-semibold text-surface-900 flex items-center gap-2 mb-2">
          <CheckCircle2 size={16} className="text-emerald-600" /> Production sign-off
        </h2>
        {data.signOff ? (
          <p className="text-sm text-emerald-800">
            Approved by {data.signOff.clientName} on {formatDate(data.signOff.signedAt)}
          </p>
        ) : (
          <>
            <Textarea placeholder="Optional note…" value={signOffNote} onChange={(e) => setSignOffNote(e.target.value)} />
            <Button className="mt-3" disabled={!clientName.trim()} onClick={() => submitSignOff(signOffNote)}>
              Approve for production
            </Button>
          </>
        )}
      </Card>

      {!data.survey && (
        <Card className="p-5">
          <h2 className="text-sm font-semibold text-surface-900 flex items-center gap-2 mb-3">
            <Star size={16} /> How was your experience?
          </h2>
          <div className="flex gap-1 mb-3">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} type="button" onClick={() => setSurveyRating(n)} className={`p-2 rounded-lg ${surveyRating >= n ? 'text-amber-500' : 'text-surface-300'}`}>
                <Star size={24} fill={surveyRating >= n ? 'currentColor' : 'none'} />
              </button>
            ))}
          </div>
          <Textarea placeholder="Optional comment…" value={surveyComment} onChange={(e) => setSurveyComment(e.target.value)} />
          <Button className="mt-3" disabled={surveyRating === 0} onClick={() => submitSurvey(surveyRating, surveyComment)}>
            Submit survey
          </Button>
        </Card>
      )}
    </div>
  )
}

export default function ClientReview() {
  return <ReviewContent />
}
