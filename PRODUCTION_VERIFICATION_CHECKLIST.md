# Production Verification Checklist (veveve.io login/app migration)

Use this as a **copy/paste runbook** immediately after a deploy or config change.

## Preconditions
- [ ] `veveve.io` and `www.veveve.io` resolve to the expected server/IP
- [ ] HTTPS works (valid certificate, no mixed-content warnings)
- [ ] You have test credentials for:
  - [ ] existing user
  - [ ] (optional) newly registered user

---

## 1) Redirects (veveve.dk → veveve.io)
- [ ] `https://veveve.dk/login` → `https://veveve.io/login`
- [ ] `https://veveve.dk/register` → `https://veveve.io/register` (if enabled)
- [ ] `https://veveve.dk/dashboard` → `https://veveve.io/dashboard`
- [ ] Deep link on dk redirects and preserves path/query (pick 1–2 real app routes)
- [ ] No redirect loops

Quick checks:

```bash
curl -I https://veveve.dk/login
curl -I https://veveve.dk/register
curl -I https://veveve.dk/dashboard
```

Expected: `Location:` header points to `https://veveve.io/...` and status is 301/302 as configured.

---

## 2) Public pages (marketing)
- [ ] `https://veveve.dk/` loads (marketing only)
- [ ] `https://veveve.io/` loads (marketing)

---

## 3) Authentication (veveve.io)

### Login
- [ ] Login success → lands on dashboard (or intended post-login route)
- [ ] Login failure (bad password) → friendly error, no 500

### Logout
- [ ] Logout works and blocks access to protected routes after refresh

### Registration (if enabled)
- [ ] Register → user created → can login

### Password reset (if enabled)
- [ ] Request reset email
- [ ] Follow reset link → set new password → login succeeds

---

## 4) Protected routes + deep links
- [ ] Visiting a protected route while logged out redirects to `https://veveve.io/login`
- [ ] Deep link after login works (return-to behavior if supported)

---

## 5) Cookie / session sanity (most common production failure)
In the browser devtools (Application → Cookies):
- [ ] Cookies are set on `veveve.io` (not `veveve.dk`)
- [ ] Cookies have `Secure` enabled on production HTTPS
- [ ] `SameSite` is appropriate for your flow (avoid breaking login redirects)
- [ ] No attempt is made to share cookies between `veveve.dk` and `veveve.io`

---

## 6) CSRF / CORS sanity (if you use cookies or CSRF-protected endpoints)
- [ ] Authenticated API calls from `https://veveve.io` succeed (no CORS errors in console)
- [ ] Forms/actions that require CSRF succeed (no “CSRF origin” failures)

---

## 7) App smoke test (pick the “top 5”)
- [ ] Dashboard loads (no console errors)
- [ ] One “read” flow works (view data)
- [ ] One “write” flow works (create/update)
- [ ] Account/settings flow works
- [ ] Billing/subscription flow works (if applicable)

---

## 8) Observability (10 minutes after deploy)
- [ ] Check server logs for spikes in 4xx/5xx
- [ ] Check auth error rate (login failures vs. expected)
- [ ] Check redirect volume/loops (repeated 301/302 chains)

---

## 9) Rollback plan (minimum viable)
If users cannot login or are stuck in redirects:
- [ ] Revert the last deploy (app) or config change (nginx / env / backend settings)
- [ ] Confirm `veveve.io/login` is reachable and returns 200
- [ ] Confirm `veveve.dk/login` redirects correctly (or temporarily disable problematic redirects)
- [ ] Re-run sections 1 and 3 above

