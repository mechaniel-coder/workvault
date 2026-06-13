import { Link } from 'react-router-dom'

const linkClass = 'text-white/50 hover:text-white/80 transition-colors'

export function SiteFooter({ className = '' }: { className?: string }) {
  const year = new Date().getFullYear()
  return (
    <footer className={`border-t border-white/10 py-8 px-6 text-center text-xs text-white/40 ${className}`}>
      <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 mb-3">
        <Link to="/privacy" className={linkClass}>Privacy</Link>
        <Link to="/terms" className={linkClass}>Terms</Link>
        <a href="https://github.com/mechaniel-coder/workvault/releases/latest" className={linkClass} rel="noopener noreferrer">
          Download
        </a>
        <a
          href="https://github.com/mechaniel-coder/workvault/issues/new?template=license_inquiry.yml"
          className={linkClass}
          rel="noopener noreferrer"
        >
          License
        </a>
        <a href="https://github.com/mechaniel-coder/workvault/blob/main/SECURITY.md" className={linkClass} rel="noopener noreferrer">
          Security
        </a>
      </nav>
      <p>© {year} WorkVault. All rights reserved.</p>
    </footer>
  )
}

export function AppFooter({ className = '' }: { className?: string }) {
  const year = new Date().getFullYear()
  return (
    <footer className={`border-t border-surface-200 py-6 px-4 text-center text-xs text-surface-400 ${className}`}>
      <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 mb-2">
        <Link to="/privacy" className="hover:text-surface-600">Privacy</Link>
        <Link to="/terms" className="hover:text-surface-600">Terms</Link>
        <a href="https://github.com/mechaniel-coder/workvault/releases/latest" className="hover:text-surface-600" rel="noopener noreferrer">
          Download
        </a>
      </nav>
      <p>© {year} WorkVault</p>
    </footer>
  )
}
