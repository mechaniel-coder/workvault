# Security Policy

## Supported versions

| Version | Supported |
|---------|-----------|
| 0.2.x   | Yes       |
| < 0.2   | No        |

## Reporting a vulnerability

**Please do not open a public GitHub issue for security problems.**

Report vulnerabilities privately:

1. Open a [GitHub Security Advisory](https://github.com/mechaniel-coder/workvault/security/advisories/new) (preferred), or
2. Email the repository owner via a [license inquiry issue](https://github.com/mechaniel-coder/workvault/issues/new?template=license_inquiry.yml) with subject **Security vulnerability** and mark it sensitive if possible.

Include:

- Description of the issue and potential impact
- Steps to reproduce
- Affected version(s) and platform (desktop, web, functions)
- Any proof-of-concept if available

We aim to acknowledge reports within **5 business days** and will coordinate disclosure once a fix is available.

## Scope

In scope:

- WorkVault desktop app (Tauri)
- The hosted web app at [workvault.netlify.app](https://workvault.netlify.app)
- Netlify Functions in this repository that handle auth, sync, payments, or client data

Out of scope:

- Third-party services you connect (Stripe, Google, etc.) — report those to the respective provider
- Social engineering or physical attacks
- Denial-of-service against Netlify infrastructure

## Safe harbor

We support good-faith security research on the public web app and published release builds. Do not access other users' data, disrupt production services, or exceed what is necessary to demonstrate a vulnerability.
