# CLAUDE.md — VVV Frontpage

## Project Overview

SaaS platform with a Django REST backend and Next.js frontend. Multi-tenant architecture with agencies, companies, and accounts. Data pipelines sync external sources (WooCommerce, GA4, GSC) into the platform.

## Tech Stack

- **Backend:** Django 4.2, DRF, Celery + Redis, PostgreSQL (prod) / SQLite (dev)
- **Frontend:** Next.js 13, React 18, TypeScript, TailwindCSS
- **Auth:** JWT via djangorestframework-simplejwt
- **Deployment:** Docker Compose, GitHub Actions, DigitalOcean

## Project Structure

```
backend/             # Django project
  api/               # Project config (settings, urls, celery, wsgi)
    settings/        # base.py, dev.py, prod.py, test.py
  authentication/    # JWT auth, registration, email verification, invites
  core/              # Middleware, Slack integration, utilities
  users/             # User, Agency, Company, Account, AccountConfiguration
  woocommerce/       # WooCommerce sync pipeline
  pipelines/         # DataPipeline, PipelineJob, PipelineLog infra
  google_pipelines/  # GA4 + GSC data pipelines
pages/               # Next.js pages and API routes
components/          # React components
lib/                 # Frontend utilities (AuthContext, API helpers)
types/               # TypeScript type definitions
deploy/              # Nginx configs, systemd units
```

## Dev Commands

```bash
# Backend
source venv/bin/activate
DJANGO_SETTINGS_MODULE=api.settings.dev python backend/manage.py runserver
DJANGO_SETTINGS_MODULE=api.settings.dev python backend/manage.py makemigrations --skip-checks
DJANGO_SETTINGS_MODULE=api.settings.dev python backend/manage.py migrate

# Frontend
npm run dev          # starts on port 3000

# Tests
python backend/manage.py test
npm test

# Docker
docker compose -f docker-compose.dev.yml up
```

## Key Conventions

- **Celery tasks:** Use `@shared_task` decorator, fan-out with `.delay()`
- **Tenant filtering:** Role-based access in ViewSet `get_queryset()` — roles are `super_admin`, `agency_admin`, `agency_user`, `company_admin`, `company_user`
- **Settings:** Always set `DJANGO_SETTINGS_MODULE=api.settings.dev` for local dev
- **Migrations:** Use `--skip-checks` flag to avoid WooCommerce URL basename conflict warning
- **AccountConfiguration:** Central config store — `config_type` determines pipeline type, `config_data` JSONField holds credentials/settings
- **Pipeline pattern:** `DataPipeline` → `PipelineJob` → `PipelineLog` / `DataQualityCheck` / `PipelineAnalytics`

## Known Gotchas

- `makemigrations` without `--skip-checks` warns about WooCommerce views basename conflict — harmless but noisy
- `backend/api/celery.py` must NOT call `django.setup()` at module level (it's imported via `api/__init__.py`)
- `.env.local` is not in `.gitignore` — don't put secrets there
- WooCommerce model has pre-existing nullable field issues; may prompt during makemigrations — write migrations manually if needed

## Git / PR Workflow

- Main branch: `main`, staging branch: `staging`
- GitHub Actions deploy on push to `main` (production) and `staging`
- Commit messages: conventional style (`feat:`, `fix:`, `refactor:`, etc.)
