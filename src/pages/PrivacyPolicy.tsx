import { Link } from 'react-router-dom'
import { SiteFooter } from '../components/layout/SiteFooter'

function LegalShell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen gradient-dark text-white flex flex-col">
      <div className="flex-1 mx-auto max-w-3xl px-6 py-16">
        <Link to="/welcome" className="text-sm text-white/50 hover:text-white/80 mb-8 inline-block">
          ← WorkVault
        </Link>
        <h1 className="text-3xl font-bold tracking-tight mb-2">{title}</h1>
        <p className="text-sm text-white/40 mb-10">Last updated: June 13, 2026</p>
        <div className="prose prose-invert prose-sm max-w-none space-y-6 text-white/75 leading-relaxed">
          {children}
        </div>
      </div>
      <SiteFooter />
    </div>
  )
}

export default function PrivacyPolicy() {
  return (
    <LegalShell title="Privacy Policy">
      <section>
        <h2 className="text-lg font-semibold text-white mb-2">Overview</h2>
        <p>
          WorkVault is local-first: your business data is stored on your device by default. This policy
          describes what we collect when you use the desktop app, web app, or optional cloud features at{' '}
          <a href="https://workvault.netlify.app" className="text-brand-300 hover:underline">workvault.netlify.app</a>.
        </p>
      </section>
      <section>
        <h2 className="text-lg font-semibold text-white mb-2">Data on your device</h2>
        <p>
          The desktop and web apps store contracts, clients, invoices, time entries, and related files
          locally. We do not receive this data unless you enable cloud sync or use online features that
          require it.
        </p>
      </section>
      <section>
        <h2 className="text-lg font-semibold text-white mb-2">Cloud sync (optional)</h2>
        <p>
          If you create an account and enable sync, encrypted backup data is stored on Netlify infrastructure
          associated with your account. You choose the encryption passphrase; we cannot decrypt your synced
          vault without it.
        </p>
      </section>
      <section>
        <h2 className="text-lg font-semibold text-white mb-2">Account information</h2>
        <p>
          When you sign up for cloud features, we collect your email address and authentication credentials
          through Netlify Identity. We use this to authenticate you and provide sync, client links, and
          integrations you enable.
        </p>
      </section>
      <section>
        <h2 className="text-lg font-semibold text-white mb-2">Payments</h2>
        <p>
          Online payments are processed by third-party providers (e.g. Stripe, PayPal, Square) that you or
          your clients connect. Payment card data is handled by those providers, not stored by WorkVault
          directly.
        </p>
      </section>
      <section>
        <h2 className="text-lg font-semibold text-white mb-2">Integrations</h2>
        <p>
          If you connect Gmail, Google Drive, QuickBooks, Slack, or other services, WorkVault exchanges
          data with those providers only as needed to perform the integration. OAuth tokens may be stored
          securely server-side when required for background sync.
        </p>
      </section>
      <section>
        <h2 className="text-lg font-semibold text-white mb-2">Your choices</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>Use WorkVault fully offline without an account</li>
          <li>Delete local data by uninstalling or clearing app storage</li>
          <li>Request account deletion by contacting us through GitHub issues</li>
        </ul>
      </section>
      <section>
        <h2 className="text-lg font-semibold text-white mb-2">Contact</h2>
        <p>
          Questions:{' '}
          <a
            href="https://github.com/mechaniel-coder/workvault/issues/new?template=bug_report.yml"
            className="text-brand-300 hover:underline"
            rel="noopener noreferrer"
          >
            open an issue
          </a>{' '}
          on GitHub.
        </p>
      </section>
    </LegalShell>
  )
}
