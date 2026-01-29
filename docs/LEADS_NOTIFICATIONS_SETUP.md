# Leads: notifications setup (email + Slack)

## What happens on submit
`POST /api/leads`:
- saves the lead to Postgres table `leads`
- sends email notification (if SMTP configured)
- sends Slack notification (if webhook configured)

Notifications are **best-effort**: the lead is still saved even if email/Slack fails.

---

## Env vars

### Who gets notified (email)
- `LEAD_NOTIFY_EMAILS="andreas@veveve.dk,anders@veveve.dk"`
  - comma-separated list
  - fallback: `LEAD_NOTIFY_EMAIL`
  - fallback: `hello@veveve.dk`

### Slack (webhook)
- `SLACK_LEADS_WEBHOOK_URL="https://hooks.slack.com/services/…"`
  - fallback: `SLACK_WEBHOOK_URL`

### SMTP (required for email sending)
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_SECURE` (`true`/`false`)
- `SMTP_USER`
- `SMTP_PASS`
- `SMTP_FROM`

---

## Local development
Your `npm run dev` loads `.env.local` (and `.env`).

Recommended:
- put secrets in `.env.local`:
  - `SLACK_LEADS_WEBHOOK_URL=...`
  - `SMTP_*` values

---

## Production / server
Set secrets as **server environment variables** (or GitHub Actions/DO secrets):
- `SLACK_LEADS_WEBHOOK_URL`
- `SMTP_*`
- `LEAD_NOTIFY_EMAILS`

Then deploy, and verify by submitting a test lead on `/kontakt`.

