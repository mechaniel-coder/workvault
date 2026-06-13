import { CursorCliPageShell } from '../components/CursorCliPageShell'
import { CursorCliChatPanel } from '../components/CursorCliChatPanel'

export default function CursorCliChat() {
  return (
    <CursorCliPageShell description="Chat with WorkVault context to draft agent prompts and copy terminal commands.">
      <CursorCliChatPanel />
    </CursorCliPageShell>
  )
}
