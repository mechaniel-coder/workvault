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

export default function TermsOfService() {
  return (
    <LegalShell title="Terms of Service">
      <section>
        <h2 className="text-lg font-semibold text-white mb-2">Agreement</h2>
        <p>
          By downloading, installing, or using WorkVault (desktop app, web app, or related services), you
          agree to these Terms. If you do not agree, do not use the software.
        </p>
      </section>
      <section>
        <h2 className="text-lg font-semibold text-white mb-2">License</h2>
        <p>
          WorkVault software is proprietary. Use of official release builds is permitted for personal or
          internal business use. Source code may not be cloned, modified, or redistributed without a
          separate written license. See the{' '}
          <a
            href="https://github.com/mechaniel-coder/workvault/blob/main/LICENSE"
            className="text-brand-300 hover:underline"
            rel="noopener noreferrer"
          >
            LICENSE
          </a>{' '}
          file for full terms.
        </p>
      </section>
      <section>
        <h2 className="text-lg font-semibold text-white mb-2">Your data</h2>
        <p>
          You retain ownership of the business data you enter into WorkVault. You are responsible for
          backups, compliance with laws applicable to your work (including tax and client confidentiality),
          and the accuracy of contracts and invoices you send to clients.
        </p>
      </section>
      <section>
        <h2 className="text-lg font-semibold text-white mb-2">Cloud and third-party services</h2>
        <p>
          Optional online features rely on Netlify and third-party providers (payment processors, email,
          accounting integrations). Their terms and privacy policies apply to those services. WorkVault is
          not responsible for outages or actions of third-party providers.
        </p>
      </section>
      <section>
        <h2 className="text-lg font-semibold text-white mb-2">Disclaimer</h2>
        <p>
          WorkVault is provided &quot;as is&quot; without warranty. We do not guarantee uninterrupted
          operation, legal compliance of generated documents, or suitability for any particular purpose.
          Consult a qualified professional for legal, tax, or accounting advice.
        </p>
      </section>
      <section>
        <h2 className="text-lg font-semibold text-white mb-2">Limitation of liability</h2>
        <p>
          To the maximum extent permitted by law, WorkVault and its authors shall not be liable for indirect,
          incidental, or consequential damages arising from use of the software, including lost profits or
          data loss. Your sole remedy for dissatisfaction is to stop using the software.
        </p>
      </section>
      <section>
        <h2 className="text-lg font-semibold text-white mb-2">Changes</h2>
        <p>
          We may update these Terms. Continued use after changes are posted constitutes acceptance. Material
          changes will be reflected in the &quot;Last updated&quot; date above.
        </p>
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
