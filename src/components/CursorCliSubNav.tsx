import { NavLink } from 'react-router-dom'
import { Terminal, Zap, BookOpen, MessageSquare } from 'lucide-react'
import { Button } from './ui/Button'

const links = [
  { to: '/cursor-cli/chat', label: 'Chat', icon: MessageSquare, end: false },
  { to: '/cursor-cli', label: 'Workflows', icon: Zap, end: true },
  { to: '/cursor-cli/setup', label: 'Setup', icon: Terminal, end: false },
  { to: '/cursor-cli/reference', label: 'Reference', icon: BookOpen, end: false },
] as const

export function CursorCliSubNav() {
  return (
    <div className="mb-6 flex flex-wrap gap-2">
      {links.map(({ to, label, icon: Icon, end }) => (
        <NavLink key={to} to={to} end={end}>
          {({ isActive }) => (
            <Button variant={isActive ? 'primary' : 'secondary'}>
              <Icon size={16} /> {label}
            </Button>
          )}
        </NavLink>
      ))}
    </div>
  )
}
