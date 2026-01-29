# Lead form brainstorm (replace Calendly)

## Goal
Replace “book a meeting” (Calendly) with a **high-intent lead form** where prospects share enough context for you to:
- qualify quickly
- respond personally
- schedule manually (email/phone) with the right prep

Primary outcome: **more qualified inbound leads** with less back-and-forth.

---

## UX flow ideas

### Option A — Single-page “request a call” form (fastest)
- Section on `/kontakt` with a clear promise:
  - “Vi vender tilbage indenfor 1 hverdag.”
- Form submission → **thank-you state** + next steps
- Automatic notification to you (email/Slack) + stored lead

### Option B — 2-step wizard (better completion + qualification)
- Step 1: basics (name/email/phone/company)
- Step 2: needs (budget, channels, goals, timeline)
- Optional: “upload” (e.g. PDF brief) later

### Option C — “Choose your path”
- Buttons:
  - “Jeg vil have flere leads/salg”
  - “Jeg vil have bedre tracking”
  - “Jeg vil have lavere CPA”
- Each path shows 3–5 tailored questions (feels personal, boosts quality)

---

## What makes a great lead form for a boutique agency
- **Short but specific**: fewer questions, but each question should help you decide *what to do next*.
- **Signals boutique positioning**:
  - “Du får en fast kontaktperson”
  - “Vi kommer med en 30-dages plan”
- **Sets expectations**:
  - response time
  - what info they’ll receive
  - what happens next (phone/email)

---

## Suggested form fields (Danish-first)

### Must-have (minimum viable)
- **Navn** (required)
- **Email** (required)
- **Telefon** (optional, but you said OK to show/use phone—consider making it required for higher intent)
- **Virksomhed** (required)
- **Website** (optional but useful)
- **Kort om opgaven** (required textarea)
- **Samtykke** (required checkbox): “Jeg accepterer at I kontakter mig vedr. min henvendelse.”

### Strong qualifiers (recommended)
- **Primært mål** (select):
  - Flere leads
  - Flere salg (e-commerce)
  - Bedre tracking/data
  - Lavere CPA / bedre ROAS
  - Andet
- **Kanaler i dag** (multi-select):
  - Google Ads
  - Meta
  - SEO
  - Email
  - “Ingen (endnu)”
- **Budgetniveau** (select, ranges):
  - < 10.000 kr./md
  - 10–30k kr./md
  - 30–75k kr./md
  - 75k+ kr./md
- **Tidshorisont** (select):
  - Hurtigst muligt
  - 2–4 uger
  - 1–3 mdr
  - “Bare nysgerrig”

### Optional “boutique” questions (nice to have)
- “Hvad har I prøvet før — og hvad virkede ikke?”
- “Hvem godkender beslutninger?” (owner/marketing lead)
- “Hvilken branche/region?”

---

## Lead “quality” scoring (simple)
Compute a score server-side to prioritize follow-up.

Example scoring:
- +2 if message length > 200 chars
- +2 if website provided
- +2 if budget >= 10k
- +1 if timeline “hurtigst muligt”
- +1 if phone provided
- -3 if suspicious patterns (spam keywords, many links, etc.)

Use score to:
- decide response urgency
- route to “call first” vs “email first”

---

## Anti-spam + abuse protection (recommended)
- **Honeypot** hidden field (already pattern exists)
- **Rate limiting** per IP (and per email) on the API route
- **Validation**:
  - email format
  - message length min/max
  - URL sanity (website)
- **Optional**: Turnstile/reCAPTCHA only if spam becomes a problem
- **Don’t reveal too much** in error messages (avoid helping bots)

---

## Data model for a lead (what to store)
Minimum:
- id
- createdAt
- name, email, phone, company, website
- message
- source page (e.g. `/kontakt`)
- user agent + IP (careful with GDPR; consider truncation or hashing)
- status:
  - new
  - contacted
  - qualified
  - won
  - not a fit

Nice to have:
- tags (google-ads, tracking, ecommerce)
- budgetRange, timeline, channels[]
- notes (internal)

---

## Where to store leads (options)

### Option 1 — Store in existing DB (recommended)
- If you already have Postgres + Prisma / backend DB:
  - Add a `Lead` table/model
  - API route writes to DB
  - Simple admin list page later

Pros: searchable history, analytics, follow-up pipeline.
Cons: schema + migration work.

### Option 2 — Email-only (fastest but weakest)
- API route sends you an email and returns 200

Pros: quickest to ship.
Cons: messy, hard to track status, can be lost.

### Option 3 — External CRM (HubSpot/Pipedrive)
- API route creates a lead in CRM (and optionally sends email)

Pros: pipeline management.
Cons: vendor lock-in + setup + cost.

---

## Notifications (how you get alerted)
- **Email** to `hello@veveve.dk` + internal address
- **Slack** webhook “New lead”
- **Daily digest** email for low-priority leads

Include in notification:
- name/company
- short summary + goal + budget + timeline
- quick links: “reply email”, “call phone”, “open lead in admin”

---

## Copy ideas (Danish)
- Headline: “Fortæl os kort hvad du vil opnå”
- Sub: “Du får svar indenfor 1 hverdag — og vi vender tilbage med næste skridt.”
- Microcopy near budget field:
  - “Brug et estimat — det hjælper os med at foreslå den rigtige pakke.”
- “Not a fit” honesty:
  - “Hvis vi ikke er det rigtige match, siger vi det ærligt.”

---

## Thank-you page/state ideas
- “Tak! Vi vender tilbage indenfor 1 hverdag.”
- “Næste skridt” bullets:
  - Vi læser din henvendelse
  - Vi svarer med 2–3 tider til et kort afklaringsopkald
  - Du får en 30-dages plan (hvis relevant)
- Optional: link to cases/priser while they wait

---

## Implementation notes (next coding task)
- Replace Calendly embed with:
  - “Request meeting” form (fields above)
  - API route that **stores lead**
  - Notification (email/Slack)
  - Basic admin view (optional)

Open questions to decide before coding:
- Should **phone** be required?
- Do you want **budget ranges** publicly asked?
- Where should leads live: **DB vs CRM**?

