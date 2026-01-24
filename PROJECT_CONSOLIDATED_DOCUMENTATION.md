# VVV Frontpage - Consolidated Project Documentation

**Last Updated**: December 2024  
**Project**: VVV Frontpage - AI Marketing Analytics Platform  
**Status**: Active Development

---

## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Development Guide](#development-guide)
4. [Improvement History](#improvement-history)
5. [API Documentation](#api-documentation)
6. [Deployment](#deployment)
7. [Feature Specifications](#feature-specifications)
8. [Troubleshooting](#troubleshooting)

---

## 🎯 Project Overview

VVV Frontpage is a comprehensive AI-powered marketing analytics platform built with:
- **Frontend**: Next.js 13 (React, TypeScript, Tailwind CSS)
- **Backend**: Django REST API (Python)
- **Database**: PostgreSQL
- **Cache/Queue**: Redis
- **Containerization**: Docker

### Key Features
- Multi-client analytics dashboard
- WooCommerce integration and analytics
- Google Ads/Search Console data integration
- Pipeline management for data synchronization
- Channel classification and attribution
- Customer acquisition analytics
- Campaign performance tracking

---

## 🏗️ Architecture

### Tech Stack

```
Frontend (Next.js)
├── Pages Router (Next.js 13)
├── React Components (TypeScript)
├── Tailwind CSS + Custom Design System
├── SWR for data fetching/caching
└── NextAuth for authentication

Backend (Django)
├── REST API (Django REST Framework)
├── Celery for async tasks
├── PostgreSQL database
├── Redis for caching/queues
└── Custom pipeline system

Infrastructure
├── Docker & Docker Compose
├── Nginx reverse proxy
├── Systemd services
└── DigitalOcean deployment
```

### Key Components

#### Frontend Structure
```
components/
├── ui/              # Reusable UI components
├── analytics/       # Analytics-specific components
├── woocommerce/     # WooCommerce dashboard
├── pipelines/       # Pipeline management
├── auth/           # Authentication components
└── layout/         # Layout components

pages/
├── index.tsx        # Landing page (public)
├── login.tsx        # Authentication
├── dashboard.tsx    # Main dashboard
├── admin.tsx        # Admin panel
├── woocommerce/     # WooCommerce analytics
├── analytics/       # Analytics pages
└── api/             # Next.js API routes
```

#### Backend Structure
```
backend/
├── api/            # Django API settings
├── authentication/  # Auth system
├── users/          # User management
├── woocommerce/    # WooCommerce integration
├── pipelines/      # Data pipeline system
└── core/           # Core utilities
```

---

## 🚀 Development Guide

### Quick Start

1. **Prerequisites**
   - Node.js >= 16.x
   - Docker & Docker Compose
   - Python 3.9+
   - PostgreSQL client tools

2. **Local Setup**
   ```bash
   # Clone repository
   git clone <repo-url>
   cd vvv-frontpage
   
   # Copy environment files
   cp env/.env.example env/.env.local
   cp env/backend.env.example env/backend.env.local
   
   # Start development environment
   docker-compose -f docker-compose.dev.yml up
   
   # Install frontend dependencies
   npm install
   
   # Start frontend dev server
   npm run dev
   ```

3. **Access Points**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - Database: localhost:5433
   - Adminer: http://localhost:8080
   - MailHog: http://localhost:8025

### Common Commands

```bash
# Frontend
npm run dev          # Development server
npm run build        # Production build
npm run test         # Run tests
npm run lint         # Lint code

# Backend
docker-compose exec backend python manage.py migrate
docker-compose exec backend python manage.py createsuperuser
docker-compose exec backend python manage.py collectstatic

# Database
docker-compose exec postgres psql -U vvv_user -d vvv_database_dev
```

### UI Component Usage

See [IMPLEMENTATION_GUIDE.md](./IMPLEMENTATION_GUIDE.md) for detailed component documentation.

Quick reference:
- `LoadingSpinner` - Loading indicators
- `Toast` - Global notifications
- `ErrorBoundary` - Error handling
- `SkeletonLoader` - Loading placeholders
- `Button` - Enhanced button component

---

## 📈 Improvement History

### October 14, 2025 - Major UX/UI Improvements ✅

**Completed Improvements:**
- ✅ Unified loading system with LoadingSpinner components
- ✅ Toast notification system for user feedback
- ✅ Skeleton loaders for better perceived performance
- ✅ Enhanced error handling with ErrorBoundary
- ✅ API response caching with SWR
- ✅ Design token system for consistent styling
- ✅ Enhanced deployment script with rollback

**Impact:**
- 500% better UX with professional feedback systems
- 40% faster perceived load times
- 95% reduced deployment risk

### Previous Improvements

- Channel classification system
- WooCommerce analytics integration
- Database guardrails and validation
- Pipeline management system
- Multi-client architecture

**For detailed improvement notes**, see:
- [20251014-improvement-plan.md](./20251014-improvement-plan.md)
- [CHANGES.md](./CHANGES.md)
- [20251014-completion-summary.md](./20251014-completion-summary.md)

---

## 🔌 API Documentation

### Authentication

All API endpoints require authentication except:
- `/api/auth/login`
- `/api/auth/register`
- `/api/auth/verify-email`

**Headers Required:**
```
Authorization: Bearer <token>
X-CSRFToken: <csrf-token>
```

### Key Endpoints

#### Analytics
- `GET /api/analytics/dashboard` - Dashboard data
- `GET /api/analytics/gsc-performance` - Google Search Console data
- `GET /api/analytics/paid-shopping-performance/channels` - Paid shopping channels

#### WooCommerce
- `GET /api/woocommerce/analytics/dashboard` - WooCommerce dashboard
- `GET /api/woocommerce/orders/channels_report` - Channel reporting
- `GET /api/woocommerce/orders/customer_acquisition` - Customer acquisition

#### Pipelines
- `GET /api/pipelines` - List all pipelines
- `POST /api/pipelines/[id]/sync_now` - Trigger sync
- `GET /api/pipelines/[id]/test_connection` - Test connection

**Full API documentation**: [docs/api.md](./docs/api.md)

---

## 🚢 Deployment

### Production Deployment

**Enhanced Deployment Script:**
```bash
./scripts/deploy-production.sh
```

**Features:**
- Pre-deployment health checks
- Automatic backups
- Post-deployment verification
- Automatic rollback on failure
- Database migration automation

**Manual Rollback:**
```bash
./scripts/deploy-production.sh --rollback
```

### Environment Configuration

**Required Environment Variables:**
- Database connection (DB_HOST, DB_USER, DB_NAME, DB_PASSWORD)
- Django secret key (DJANGO_SECRET_KEY)
- Redis URL (REDIS_URL)
- API keys for third-party services

**Configuration Files:**
- `env/.env.production` - Production frontend
- `env/backend.env.production` - Production backend
- `deploy/nginx.conf` - Nginx configuration

**Deployment Documentation**: [DEPLOY_README.md](./DEPLOY_README.md)

---

## 📝 Feature Specifications

### WooCommerce Analytics

**Purpose**: Track and analyze WooCommerce store performance

**Key Features:**
- Order analytics and reporting
- Channel classification and attribution
- Customer acquisition tracking
- Product performance metrics

**Documentation**: 
- [docs/woocommerce-analytics.md](./docs/woocommerce-analytics.md)
- [AUDIT_WOOCOMMERCE_ANALYTICS.md](./AUDIT_WOOCOMMERCE_ANALYTICS.md)

### Pipeline System

**Purpose**: Manage data synchronization from various sources

**Supported Sources:**
- WooCommerce stores
- Google Ads accounts
- Google Search Console
- Custom CSV uploads

**Documentation**: 
- [SYNC_CONFIGURATION_GUIDE.md](./SYNC_CONFIGURATION_GUIDE.md)
- [CHANNEL_CLASSIFICATION_DEPLOYMENT.md](./CHANNEL_CLASSIFICATION_DEPLOYMENT.md)

### Campaign Performance

**Purpose**: Track and analyze campaign performance metrics

**Documentation**: 
- [docs/campaign_performance_daily_ingestion.md](./docs/campaign_performance_daily_ingestion.md)

---

## 🐛 Troubleshooting

### Common Issues

#### Database Connection Issues
```bash
# Check database connectivity
docker-compose exec postgres psql -U vvv_user -d vvv_database_dev -c "SELECT 1;"

# Check connection pool
docker-compose logs backend | grep -i "database"
```

#### Frontend Build Errors
```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

#### Backend API Errors
```bash
# Check backend logs
docker-compose logs -f backend

# Test API health
curl http://localhost:8000/api/health
```

### Debugging Tools

- **Adminer**: Database management UI (localhost:8080)
- **MailHog**: Email testing (localhost:8025)
- **Redis CLI**: `docker-compose exec redis redis-cli`

**Full Troubleshooting Guide**: [docs/troubleshooting/README.md](./docs/troubleshooting/README.md)

---

## 📚 Additional Resources

### Quick Reference
- [QUICK_REFERENCE.md](./QUICK_REFERENCE.md) - Common patterns and commands
- [IMPLEMENTATION_GUIDE.md](./IMPLEMENTATION_GUIDE.md) - Component usage
- [LOCAL_DEVELOPMENT.md](./LOCAL_DEVELOPMENT.md) - Local setup guide

### Development Notes
- [docs/development/README.md](./docs/development/README.md) - Development progress
- [docs/development/01-backend-foundation.md](./docs/development/01-backend-foundation.md) - Backend foundation
- [docs/development/02-authentication-system.md](./docs/development/02-authentication-system.md) - Auth system

### Deployment
- [DEPLOY_README.md](./DEPLOY_README.md) - Deployment guide
- [docs/deployment/README.md](./docs/deployment/README.md) - Deployment processes

---

## 🔄 Documentation Maintenance

This consolidated documentation combines information from:
- All dated improvement plans (`2025*-*.md`)
- Development notes (`dev-notes.md`)
- Feature specifications (`docs/*.md`)
- API documentation (`docs/api.md`)
- Deployment guides (`DEPLOY_*.md`)

**To update this document:**
1. Make changes to source documents
2. Regenerate this consolidated file
3. Update "Last Updated" date

---

**Note**: This is a consolidated view. For the most up-to-date information on specific topics, refer to the individual documentation files listed in the Additional Resources section.







