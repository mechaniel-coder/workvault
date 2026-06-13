import { useState } from 'react'
import { Send } from 'lucide-react'
import { useClientRoom } from '../context/ClientRoomContext'
import { useClientApp } from '../context/ClientAppContext'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { PageHeader } from '../components/ui/Modal'

function MessagesContent() {
  const app = useClientApp()
  const { data, clientName, setClientName, postMessage } = useClientRoom()
  const [msg, setMsg] = useState('')

  return (
    <div>
      <PageHeader
        title="Messages"
        description={`Q&A thread with ${app.contractorName}`}
      />

      {!clientName && (
        <Card className="p-4 mb-4">
          <Input label="Your name" value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="So your contractor knows who replied" />
        </Card>
      )}

      <Card className="p-5">
        <div className="max-h-96 overflow-y-auto space-y-3 mb-4">
          {data.messages.length === 0 ? (
            <p className="text-sm text-surface-400 text-center py-8">No messages yet. Ask your first question below.</p>
          ) : (
            data.messages.map((m) => (
              <div
                key={m.id}
                className={`text-sm p-3 rounded-xl ${m.from === 'client' ? 'bg-brand-50 ml-6' : 'bg-surface-100 mr-6'}`}
              >
                <p className="text-[10px] font-semibold text-surface-500 mb-1">{m.authorName}</p>
                <p className="text-surface-800">{m.body}</p>
              </div>
            ))
          )}
        </div>
        <div className="flex gap-2 border-t border-surface-100 pt-4">
          <Input
            value={msg}
            onChange={(e) => setMsg(e.target.value)}
            placeholder="Type your question…"
            className="flex-1"
          />
          <Button
            disabled={!msg.trim() || !clientName.trim()}
            onClick={() => { postMessage(msg.trim()); setMsg('') }}
          >
            <Send size={14} /> Send
          </Button>
        </div>
      </Card>
    </div>
  )
}

export default function ClientMessages() {
  return <MessagesContent />
}
