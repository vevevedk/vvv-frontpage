# Sprint 1: Migrate Login and App Functionality to veveve.io

## 🎯 Sprint Goal
Make **`veveve.io` the only supported domain for login + app** and make **`veveve.dk` marketing-only** (with safe redirects), without breaking existing users/sessions.

- **Duration**: 2–3 weeks
- **Status**: Some work already done (Next.js middleware redirects, backend host/origin config)
- **Primary focus**: **Testing, verification, cleanup**

---

## 📌 Scope (what “done” means)

### In scope
- **Authentication** on `veveve.io`: login, registration, password reset, logout
- **App routes** on `veveve.io`: dashboard + all authenticated pages
- **Redirects** from `veveve.dk` → `veveve.io` for any login/app entrypoint
- **Verification**: repeatable test plan, production sanity checks, logging/monitoring expectations
- **Cleanup**: remove/disable `veveve.dk` app entrypoints, hardcoded domain references, stale docs

### Out of scope (Sprint 2/3)
- Full visual redesign of `veveve.io` marketing pages (Sprint 2)
- Full redesign of `veveve.dk` marketing site (Sprint 3)

---

## ✅ Work already completed (confirm, don’t redo)
- [x] Next.js middleware redirects `veveve.dk/login` → `veveve.io/login`
- [x] Backend config updated to include `veveve.io` for hosts/origins (ALLOWED_HOSTS / CORS / CSRF)

---

## 🔁 Redirect map (must be true in production)

### veveve.dk → veveve.io
- `/login` → `https://veveve.io/login`
- `/register` → `https://veveve.io/register`
- `/dashboard` → `https://veveve.io/dashboard`
- Any other app route (e.g. `/app/*`, `/settings`, `/billing`, etc.) → equivalent path on `veveve.io`

### Non-app pages on veveve.dk
- Stay on `veveve.dk` (marketing only)

---

## 👥 User-facing acceptance criteria

### Story 1: Login is on veveve.io
- [ ] `https://veveve.io/login` works end-to-end (success + error states)
- [ ] `https://veveve.io/register` works end-to-end (if enabled)
- [ ] Password reset works end-to-end (email request + token confirm + new password)
- [ ] Logout works and clears client auth state
- [ ] `https://veveve.dk/login` redirects to `https://veveve.io/login` (no loops)

### Story 2: App is on veveve.io
- [ ] `https://veveve.io/dashboard` loads for authenticated users
- [ ] All authenticated routes behave correctly on `veveve.io`
- [ ] Unauthenticated users get redirected to `veveve.io/login` (with return-to if supported)

### Story 3: veveve.dk is marketing-only
- [ ] There is **no reachable app UI** on `veveve.dk`
- [ ] Any existing bookmarks to app pages on `veveve.dk` redirect safely to `veveve.io`
- [ ] Marketing pages on `veveve.dk` still work normally

---

## 🧪 Verification plan (the sprint is mostly this)

### Environments to test
- **Local**: confirms code paths (middleware + routing)
- **Staging (preferred)**: validates cookies/headers/SSL safely
- **Production**: short, high-signal sanity checklist + monitoring

### A. Redirect verification (high priority)
- [ ] From `veveve.dk`, hit `/login`, `/register`, `/dashboard`, and a couple of deep links; confirm:
  - correct target host (`veveve.io`)
  - correct path preserved
  - status codes make sense (301/302 as intended)
  - **no redirect loops**

### B. Authentication flow verification
- [ ] Login success (valid creds) → redirected to dashboard
- [ ] Login failure (bad creds) → correct error handling (no 500s)
- [ ] Registration (if enabled) → user created + can login
- [ ] Password reset request → email sent
- [ ] Password reset confirm → token valid + password changes + login succeeds
- [ ] Logout → tokens/cookies cleared + protected routes block access

### C. Session/cookie/security verification (critical edge cases)
- [ ] Cookies are set with correct attributes for HTTPS:
  - `Secure` true in production
  - `SameSite` value matches cross-site needs (avoid breaking redirects)
  - Domain is correct (do **not** try to share cookies between `veveve.dk` and `veveve.io`)
- [ ] CSRF flows work from `veveve.io` (no trusted-origin failures)
- [ ] API requests from `veveve.io` succeed with expected CORS headers

### D. App regression checklist (pick the “top 5” most-used flows)
- [ ] Dashboard loads (no console errors)
- [ ] One “read” action (view data)
- [ ] One “write” action (create/update something)
- [ ] One “settings/account” action
- [ ] One “billing/subscription” action (if applicable)

### E. Browser/device matrix (minimum)
- [ ] Chrome (latest)
- [ ] Safari (macOS)
- [ ] Mobile Safari (iOS) or iOS simulator

---

## 🧹 Cleanup checklist (make the separation permanent)

### Remove/avoid veveve.dk app exposure
- [ ] Remove any `veveve.dk` navigation items that deep-link into app pages
- [ ] Ensure there are no public routes on `veveve.dk` that render app UI
- [ ] Remove or refactor domain conditionals that keep “app on dk” behavior alive

### Eliminate hardcoded domain references
- [ ] Search and replace hardcoded `veveve.dk` links in app/auth flows
- [ ] Ensure canonical/absolute URLs for auth emails point to `veveve.io`

### Docs + runbooks
- [ ] Update any docs that instruct users to login via `veveve.dk`
- [ ] Add a short “production verification” checklist for future deploys (see `PRODUCTION_VERIFICATION_CHECKLIST.md`)

---

## 📅 Execution plan (2–3 weeks)

### Week 1 — Verify routing + backend behavior
- Lock redirect map
- Validate auth endpoints from `veveve.io`
- Fix any cookie/CSRF/CORS issues

### Week 2 — Full QA pass + regression fixes
- Run full verification plan (A–E)
- Fix bugs + remove remaining `veveve.dk` app entrypoints
- Update docs

### Week 3 (optional) — Controlled rollout + monitoring
- Soft launch window (watch errors, auth failures, redirects)
- Address any edge cases from real traffic

---

## 🚨 Risks + mitigations (focused)

### Session/cookie misconfiguration (most likely)
- **Mitigation**: explicitly validate cookie attributes under HTTPS and do not assume cross-domain session sharing.

### Redirect loops / broken deep links
- **Mitigation**: maintain the redirect map and test deep links explicitly (bookmark tests).

---

## ✅ Definition of Done (sign-off)
- [ ] All login/app flows work on `veveve.io` per verification plan
- [ ] `veveve.dk` is marketing-only and redirects all app entrypoints
- [ ] No hardcoded `veveve.dk` remains in app/auth flows (or it’s intentionally documented)
- [ ] Documentation updated and a production verification checklist exists
