# Netlify environment variables

Set these in **Netlify → Site → Environment variables** (production context). Most integrations are optional — enable only what you use.

## Core (recommended for cloud features)

| Variable | Required | Purpose |
|----------|----------|---------|
| `SITE_URL` | Yes* | Public site URL, e.g. `https://workvault.netlify.app` |
| `URL` | Auto | Set by Netlify |

\*Used in OAuth redirect URLs and client links.

Netlify **Identity** and **Blobs** are enabled in the Netlify UI (Extensions), not via env vars.

## Payments

| Variable | Purpose |
|----------|---------|
| `STRIPE_SECRET_KEY` | Stripe server-side API |
| `STRIPE_PUBLISHABLE_KEY` | Returned to client checkout flows |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook verification |
| `PAYPAL_CLIENT_ID` | PayPal checkout |
| `PAYPAL_CLIENT_SECRET` | PayPal checkout |
| `PAYPAL_MODE` | `sandbox` or `live` |
| `SQUARE_ACCESS_TOKEN` | Square payments |
| `SQUARE_LOCATION_ID` | Square location |
| `SQUARE_ENV` | Set to `production` for live Square |
| `PADDLE_API_KEY` | Paddle billing |
| `LEMON_SQUEEZY_API_KEY` | Lemon Squeezy |
| `LEMON_SQUEEZY_TEST_MODE` | `true` for test store |

Per-user processor keys can also be stored in app Settings; env vars are site-wide defaults.

## Email

| Variable | Purpose |
|----------|---------|
| `RESEND_API_KEY` | Transactional email via Resend |

## OAuth & integrations

| Variable | Purpose |
|----------|---------|
| `GOOGLE_CLIENT_ID` | Google OAuth (Calendar, Gmail, Drive) |
| `GOOGLE_CLIENT_SECRET` | Google OAuth |
| `DROPBOX_APP_KEY` | Dropbox |
| `DROPBOX_APP_SECRET` | Dropbox |
| `INTUIT_CLIENT_ID` | QuickBooks |
| `INTUIT_CLIENT_SECRET` | QuickBooks |
| `XERO_CLIENT_ID` | Xero |
| `XERO_CLIENT_SECRET` | Xero |
| `PLAID_CLIENT_ID` | Bank linking |
| `PLAID_SECRET` | Bank linking |
| `PLAID_ENV` | `sandbox` or `production` |
| `SLACK_WEBHOOK_URL` | Slack notifications (incoming webhook) |
| `SLACK_BOT_TOKEN` | Slack API (optional) |
| `SLACK_CHANNEL` | Default Slack channel |

## Scheduling (optional)

| Variable | Purpose |
|----------|---------|
| `CALENDLY_API_KEY` | Calendly integration |
| `CALCOM_API_KEY` | Cal.com |
| `CALCOM_USERNAME` | Cal.com username |
| `CALCOM_EVENT_SLUG` | Cal.com event slug |

## Other

| Variable | Purpose |
|----------|---------|
| `DOCUSIGN_ACCESS_TOKEN` | DocuSign envelopes |
| `DOCUSIGN_ACCOUNT_ID` | DocuSign account |
| `DOCUSIGN_BASE_URL` | DocuSign API base |
| `QUICKBOOKS_EXPENSE_ACCOUNT_ID` | QuickBooks sync default account |

## AI assistant

The assistant function uses **Netlify AI Gateway** / OpenAI SDK with Netlify-managed credentials when deployed on Netlify. No `OPENAI_API_KEY` is required on Netlify when the gateway is enabled for the site.

## Local development

Copy `.env.example` to `.env.local` for Vite. Function env vars are loaded by `netlify dev` from `.env` or Netlify CLI linked site config.

## Audit checklist

- [ ] Identity enabled in Netlify UI
- [ ] Blobs enabled (sync, payments, OAuth codes)
- [ ] `SITE_URL` matches production domain
- [ ] Stripe webhook endpoint points to `/.netlify/functions/stripe-webhook`
- [ ] Google OAuth redirect URIs include `https://workvault.netlify.app/.netlify/functions/google-oauth`
- [ ] Secrets scoped to **Production** only where possible
