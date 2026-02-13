# Sprint: veveve.io Launch

**Sprint Goal**: Launch veveve.io as the international platform with English frontpage and centralized login/backend, while keeping veveve.dk as the Danish agency page.

**Duration**: 3-4 weeks  
**Start Date**: TBD  
**Target Launch**: TBD

---

## 📋 Project Overview

### Current State
- **veveve.dk**: Danish agency page + login + Django backend (all-in-one)
- **Target Audience**: Danish customers
- **Language**: Danish

### Target State
- **veveve.dk**: Danish agency page only (marketing site)
- **veveve.io**: 
  - English mini frontpage for international users
  - Login system (moved from veveve.dk)
  - Django backend (moved from veveve.dk)
  - New visual identity

### Key Requirements
1. Purchase and configure veveve.io domain
2. Set up DNS in DigitalOcean
3. Create new visual identity for veveve.io
4. Build English mini frontpage
5. Migrate login system from veveve.dk to veveve.io
6. Migrate Django backend from veveve.dk to veveve.io
7. Update veveve.dk to remove login/backend (keep as marketing site)
8. Ensure both domains work independently

---

## 🎯 User Stories

### Epic 1: Domain & Infrastructure Setup
**As a** system administrator  
**I want to** set up veveve.io domain and infrastructure  
**So that** the new platform can be deployed

### Epic 2: Visual Identity
**As a** brand manager  
**I want** a distinct visual identity for veveve.io  
**So that** it differentiates from veveve.dk and appeals to international users

### Epic 3: English Frontpage
**As an** international user  
**I want** to find veveve.io with an English frontpage  
**So that** I can understand the services and scale my paid marketing efforts

### Epic 4: Login Migration
**As a** user  
**I want** to log in at veveve.io  
**So that** I can access the platform regardless of my location

### Epic 5: Backend Migration
**As a** developer  
**I want** the Django backend on veveve.io  
**So that** all API endpoints are centralized and accessible

### Epic 6: veveve.dk Cleanup
**As a** Danish user  
**I want** veveve.dk to remain a clean marketing site  
**So that** I can find information about the agency without login prompts

---

## 📦 Sprint Backlog

### Phase 1: Domain & Infrastructure (Week 1)

#### Task 1.1: Purchase veveve.io Domain
**Priority**: Critical  
**Estimate**: 1 hour  
**Owner**: DevOps/Admin

**Acceptance Criteria**:
- [ ] Domain purchased through registrar
- [ ] Domain ownership verified
- [ ] Domain unlocked and ready for DNS configuration
- [ ] Domain expiration date noted and renewal set up

**Notes**:
- Check domain availability first
- Consider purchasing for multiple years
- Set up auto-renewal

---

#### Task 1.2: Set Up DNS in DigitalOcean
**Priority**: Critical  
**Estimate**: 2 hours  
**Owner**: DevOps

**Acceptance Criteria**:
- [ ] DNS records created in DigitalOcean
- [ ] A record: `veveve.io` → server IP
- [ ] A record: `www.veveve.io` → server IP
- [ ] DNS propagation verified
- [ ] TTL set appropriately (300s for initial setup)

**Technical Details**:
```bash
# DNS Records needed:
veveve.io          A    143.198.105.78
www.veveve.io      A    143.198.105.78
```

**Dependencies**: Task 1.1

---

#### Task 1.3: Server Infrastructure Setup
**Priority**: Critical  
**Estimate**: 4 hours  
**Owner**: DevOps

**Acceptance Criteria**:
- [ ] New application directory created: `/var/www/veveve-io` or `/var/www/veveve.io`
- [ ] User permissions configured (vvv-web-deploy)
- [ ] Nginx configuration file created
- [ ] SSL certificate ready to be configured (after DNS)
- [ ] GitHub Actions secrets updated for veveve.io deployment

**Technical Details**:
```bash
# Server setup
sudo mkdir -p /var/www/veveve-io
sudo chown -R vvv-web-deploy:vvv-web-deploy /var/www/veveve-io

# Nginx config location
/etc/nginx/sites-available/veveve-io
```

**Dependencies**: Task 1.2

---

#### Task 1.4: SSL Certificate Setup
**Priority**: Critical  
**Estimate**: 1 hour  
**Owner**: DevOps

**Acceptance Criteria**:
- [ ] Certbot installed
- [ ] SSL certificate obtained for veveve.io and www.veveve.io
- [ ] Nginx configured for HTTPS
- [ ] HTTP to HTTPS redirect working
- [ ] Auto-renewal configured

**Technical Details**:
```bash
sudo certbot --nginx -d veveve.io -d www.veveve.io
```

**Dependencies**: Task 1.2, Task 1.3

**Reference**: See `SSL_MIGRATION_GUIDE.md` for detailed process

---

### Phase 2: Visual Identity & Design (Week 1-2)

#### Task 2.1: Visual Identity Brainstorming
**Priority**: High  
**Estimate**: 4 hours  
**Owner**: Design Team

**Acceptance Criteria**:
- [ ] Brand positioning defined (international vs Danish)
- [ ] Color palette selected (distinct from veveve.dk)
- [ ] Typography choices made
- [ ] Logo variations created (if needed)
- [ ] Design system documented

**Deliverables**:
- Brand guidelines document
- Color palette (hex codes)
- Typography specifications
- Logo files (if new logo needed)

**Notes**:
- veveve.dk uses: Primary #004658, Secondary #ff9101
- veveve.io should be distinct but related
- Consider: More modern, tech-forward, international appeal

---

#### Task 2.2: Design System Implementation
**Priority**: High  
**Estimate**: 8 hours  
**Owner**: Frontend Developer

**Acceptance Criteria**:
- [ ] CSS variables defined for new color palette
- [ ] Typography system implemented
- [ ] Component library updated (if shared)
- [ ] Design tokens documented
- [ ] Dark mode considered (optional)

**Technical Details**:
```css
/* Example: styles/veveve-io-tokens.css */
:root {
  --io-primary: #0066cc;
  --io-secondary: #00cc99;
  --io-accent: #ff6b6b;
  /* ... */
}
```

**Dependencies**: Task 2.1

---

### Phase 3: English Frontpage Development (Week 2)

#### Task 3.1: Content Strategy for English Frontpage
**Priority**: High  
**Estimate**: 4 hours  
**Owner**: Content/Marketing

**Acceptance Criteria**:
- [ ] Key messaging defined for international audience
- [ ] Value propositions identified
- [ ] Call-to-action strategy defined
- [ ] Content outline created
- [ ] SEO keywords researched

**Content Sections** (Mini Frontpage):
1. **Hero**: Clear value prop for scaling paid marketing
2. **Services**: Key services (paid marketing scaling)
3. **Benefits**: Why choose veveve
4. **CTA**: Login/Sign up
5. **Footer**: Contact info, links

**Deliverables**:
- Content document with all copy
- SEO keyword list
- Meta descriptions

---

#### Task 3.2: English Frontpage Component Development
**Priority**: High  
**Estimate**: 12 hours  
**Owner**: Frontend Developer

**Acceptance Criteria**:
- [ ] Hero section with English content
- [ ] Services section (focused on paid marketing scaling)
- [ ] Benefits/Features section
- [ ] CTA section (Login/Sign up buttons)
- [ ] Footer with contact info
- [ ] Responsive design (mobile, tablet, desktop)
- [ ] Fast loading (< 3s)
- [ ] SEO optimized

**Technical Details**:
- Create new page: `pages/io/index.tsx` or separate route
- Use new design tokens from Task 2.2
- Reuse existing components where possible
- Ensure English-only content

**Components Needed**:
- `components/io/Hero.tsx`
- `components/io/Services.tsx`
- `components/io/Benefits.tsx`
- `components/io/CTA.tsx`
- `components/io/Footer.tsx`

**Dependencies**: Task 2.2, Task 3.1

---

#### Task 3.3: Routing Configuration
**Priority**: High  
**Estimate**: 2 hours  
**Owner**: Frontend Developer

**Acceptance Criteria**:
- [ ] Domain-based routing configured
- [ ] veveve.io shows English frontpage
- [ ] veveve.dk shows Danish frontpage
- [ ] Login redirects to veveve.io/login
- [ ] API routes point to veveve.io/api

**Technical Details**:
```typescript
// next.config.js or middleware
// Detect domain and route accordingly
if (req.headers.host === 'veveve.io') {
  // Show English frontpage
} else if (req.headers.host === 'veveve.dk') {
  // Show Danish frontpage
}
```

**Dependencies**: Task 3.2

---

### Phase 4: Backend Migration (Week 2-3)

#### Task 4.1: Backend Configuration for veveve.io
**Priority**: Critical  
**Estimate**: 4 hours  
**Owner**: Backend Developer

**Acceptance Criteria**:
- [ ] Django ALLOWED_HOSTS updated to include veveve.io
- [ ] CORS configured for veveve.io
- [ ] Environment variables updated
- [ ] Database connection verified
- [ ] API endpoints accessible at veveve.io/api

**Technical Details**:
```python
# backend/api/settings/prod.py
ALLOWED_HOSTS = [
    'veveve.io',
    'www.veveve.io',
    'veveve.dk',  # Keep for backward compatibility during migration
    'www.veveve.dk',
]

CORS_ALLOWED_ORIGINS = [
    'https://veveve.io',
    'https://www.veveve.io',
    'https://veveve.dk',
    'https://www.veveve.dk',
]
```

**Dependencies**: Task 1.3, Task 1.4

---

#### Task 4.2: Login System Migration
**Priority**: Critical  
**Estimate**: 6 hours  
**Owner**: Full-stack Developer

**Acceptance Criteria**:
- [ ] Login page accessible at veveve.io/login
- [ ] Login API endpoints working at veveve.io/api/auth/login
- [ ] Authentication flow tested
- [ ] JWT tokens working correctly
- [ ] Session management working
- [ ] Redirects after login working

**Technical Details**:
- Move `/pages/login.tsx` logic to veveve.io
- Update API URLs to point to veveve.io/api
- Update frontend environment variables
- Test authentication flow end-to-end

**Files to Update**:
- `pages/login.tsx` (or create `pages/io/login.tsx`)
- `lib/auth/AuthContext.tsx` (update API URLs)
- `env/frontend.env` (update NEXT_PUBLIC_API_URL)

**Dependencies**: Task 4.1, Task 3.3

---

#### Task 4.3: API Endpoints Migration
**Priority**: Critical  
**Estimate**: 8 hours  
**Owner**: Backend Developer

**Acceptance Criteria**:
- [ ] All API endpoints accessible at veveve.io/api
- [ ] Authentication endpoints working
- [ ] User management endpoints working
- [ ] Data pipeline endpoints working
- [ ] Analytics endpoints working
- [ ] WooCommerce endpoints working
- [ ] Health check endpoint working

**Technical Details**:
- Update nginx configuration to proxy /api/ to Django
- Verify all endpoints respond correctly
- Test with Postman/curl
- Update API documentation

**Dependencies**: Task 4.1

---

#### Task 4.4: Database & Data Migration
**Priority**: Critical  
**Estimate**: 4 hours  
**Owner**: Backend Developer

**Acceptance Criteria**:
- [ ] Database accessible from veveve.io backend
- [ ] All existing data accessible
- [ ] User accounts working
- [ ] No data loss
- [ ] Database migrations run successfully

**Technical Details**:
- Same database can be used (shared)
- Or migrate to new database (if needed)
- Run migrations: `python manage.py migrate`
- Verify data integrity

**Dependencies**: Task 4.1

---

### Phase 5: veveve.dk Cleanup (Week 3)

#### Task 5.1: Remove Login from veveve.dk
**Priority**: High  
**Estimate**: 2 hours  
**Owner**: Frontend Developer

**Acceptance Criteria**:
- [ ] Login link removed from veveve.dk navigation
- [ ] Login page redirects to veveve.io/login
- [ ] All login references updated
- [ ] Navigation updated (remove "Login" link)

**Technical Details**:
```typescript
// pages/index.tsx (veveve.dk)
// Remove login link, add link to veveve.io/login if needed
const Links: LinkingModel[] = [
  // ... other links
  // Remove: new LinkingModel("6", "Login", "/login"),
  // Or redirect: new LinkingModel("6", "Login", "https://veveve.io/login"),
];
```

**Dependencies**: Task 4.2

---

#### Task 5.2: Remove API Routes from veveve.dk
**Priority**: High  
**Estimate**: 2 hours  
**Owner**: Backend Developer

**Acceptance Criteria**:
- [ ] API routes no longer accessible at veveve.dk/api
- [ ] API requests redirect to veveve.io/api
- [ ] Nginx configuration updated
- [ ] No broken API calls from veveve.dk

**Technical Details**:
```nginx
# /etc/nginx/sites-available/veveve-dk
# Remove or redirect /api/ location block
location /api/ {
    return 301 https://veveve.io$request_uri;
}
```

**Dependencies**: Task 4.3

---

#### Task 5.3: Update veveve.dk Content
**Priority**: Medium  
**Estimate**: 2 hours  
**Owner**: Content/Marketing

**Acceptance Criteria**:
- [ ] All references to login updated
- [ ] Links point to veveve.io where appropriate
- [ ] Content reviewed for accuracy
- [ ] No broken links

**Dependencies**: Task 5.1, Task 5.2

---

### Phase 6: Testing & Launch (Week 3-4)

#### Task 6.1: Integration Testing
**Priority**: Critical  
**Estimate**: 8 hours  
**Owner**: QA/Developer

**Acceptance Criteria**:
- [ ] veveve.io frontpage loads correctly
- [ ] Login flow works end-to-end
- [ ] All API endpoints tested
- [ ] Dashboard accessible after login
- [ ] veveve.dk still works as marketing site
- [ ] No broken functionality
- [ ] Cross-browser testing completed

**Test Cases**:
1. Access veveve.io → See English frontpage
2. Click Login → Redirect to veveve.io/login
3. Login with credentials → Access dashboard
4. API calls work → All endpoints respond
5. veveve.dk → Shows Danish marketing site
6. veveve.dk navigation → No login link (or redirects to veveve.io)

**Dependencies**: All previous tasks

---

#### Task 6.2: Performance Testing
**Priority**: High  
**Estimate**: 4 hours  
**Owner**: Developer

**Acceptance Criteria**:
- [ ] Page load time < 3 seconds
- [ ] API response time < 500ms
- [ ] Lighthouse score > 90
- [ ] No console errors
- [ ] No broken images/assets

**Tools**:
- Lighthouse
- Google PageSpeed Insights
- WebPageTest

**Dependencies**: Task 6.1

---

#### Task 6.3: SEO Setup
**Priority**: High  
**Estimate**: 4 hours  
**Owner**: Marketing/Developer

**Acceptance Criteria**:
- [ ] Meta tags configured for veveve.io
- [ ] Open Graph tags set
- [ ] Sitemap.xml created
- [ ] robots.txt configured
- [ ] Google Search Console set up
- [ ] Analytics tracking configured

**Technical Details**:
```html
<!-- pages/io/index.tsx -->
<Head>
  <title>Veveve - Scale Your Paid Marketing Efforts</title>
  <meta name="description" content="..." />
  <meta property="og:title" content="..." />
  <!-- ... -->
</Head>
```

**Dependencies**: Task 3.2

---

#### Task 6.4: Documentation
**Priority**: Medium  
**Estimate**: 4 hours  
**Owner**: Developer

**Acceptance Criteria**:
- [ ] Deployment guide updated
- [ ] Architecture documented
- [ ] Domain setup documented
- [ ] Troubleshooting guide created
- [ ] Runbook for operations team

**Deliverables**:
- `VEVEVE_IO_DEPLOYMENT.md`
- `VEVEVE_IO_ARCHITECTURE.md`
- Update existing migration docs

**Dependencies**: All tasks

---

#### Task 6.5: Launch Preparation
**Priority**: Critical  
**Estimate**: 4 hours  
**Owner**: DevOps/Team Lead

**Acceptance Criteria**:
- [ ] All tests passing
- [ ] Monitoring set up
- [ ] Backup strategy in place
- [ ] Rollback plan documented
- [ ] Team briefed on new setup
- [ ] Launch checklist completed

**Launch Checklist**:
- [ ] Domain DNS verified
- [ ] SSL certificate valid
- [ ] All services running
- [ ] Monitoring active
- [ ] Backups configured
- [ ] Team notified
- [ ] Support channels ready

**Dependencies**: All previous tasks

---

## 🔧 Technical Architecture

### Domain Structure

```
veveve.dk (Danish Marketing Site)
├── / (Danish frontpage)
├── /#services
├── /#about
├── /#cases
├── /#prices
└── /#contact
    └── Links to veveve.io/login

veveve.io (International Platform)
├── / (English mini frontpage)
├── /login (Login system)
├── /register
├── /dashboard
├── /api/* (Django backend)
└── All authenticated routes
```

### Infrastructure

```
DigitalOcean Droplet (143.198.105.78)
├── /var/www/vvv-frontpage (veveve.dk)
└── /var/www/veveve-io (veveve.io)
    ├── Frontend (Next.js)
    └── Backend (Django) - shared or separate
```

### Nginx Configuration

```nginx
# veveve.dk
server {
    server_name veveve.dk www.veveve.dk;
    # Marketing site only
    location / {
        proxy_pass http://127.0.0.1:3000;  # Danish frontpage
    }
    # Redirect API calls
    location /api/ {
        return 301 https://veveve.io$request_uri;
    }
}

# veveve.io
server {
    server_name veveve.io www.veveve.io;
    # English frontpage
    location / {
        proxy_pass http://127.0.0.1:3001;  # English frontpage
    }
    # API backend
    location /api/ {
        proxy_pass http://127.0.0.1:8001/api/;
    }
    # Login
    location /login {
        proxy_pass http://127.0.0.1:3001/login;
    }
}
```

### Database Strategy

**Option A: Shared Database** (Recommended initially)
- Both domains use same database
- Simpler setup
- Users can access from either domain

**Option B: Separate Databases**
- veveve.dk: No database (static site)
- veveve.io: Full database access
- More complex but better isolation

---

## 🎨 Design Requirements

### Visual Identity for veveve.io

**Brand Positioning**:
- International, tech-forward
- Professional but approachable
- Focus on scaling and growth
- Modern, clean design

**Color Palette** (Suggested):
- Primary: #0066CC (Blue - trust, technology)
- Secondary: #00CC99 (Teal - growth, innovation)
- Accent: #FF6B6B (Coral - energy, action)
- Neutral: #2D3748 (Dark gray)
- Background: #F7FAFC (Light gray)

**Typography**:
- Headings: Inter or Poppins (modern, clean)
- Body: System font stack or Inter
- Code: Monaco or Fira Code

**Logo**:
- Use existing veveve logo or create variation
- Consider .io suffix treatment
- Ensure scalability

---

## 📊 Success Metrics

### Launch Metrics
- [ ] veveve.io accessible and loading < 3s
- [ ] Login success rate > 95%
- [ ] API response time < 500ms
- [ ] Zero critical bugs
- [ ] SEO score > 90

### Post-Launch Metrics (First Month)
- [ ] International traffic to veveve.io
- [ ] Login conversion rate
- [ ] User sign-ups from veveve.io
- [ ] veveve.dk traffic maintained
- [ ] Error rate < 1%

---

## 🚨 Risks & Mitigation

### Risk 1: Domain Purchase Issues
**Risk**: Domain not available or expensive  
**Mitigation**: Check availability early, have backup domain options

### Risk 2: DNS Propagation Delays
**Risk**: DNS takes longer than expected  
**Mitigation**: Set low TTL early, plan buffer time

### Risk 3: Backend Migration Issues
**Risk**: Data loss or broken functionality  
**Mitigation**: Thorough testing, backup strategy, gradual rollout

### Risk 4: User Confusion
**Risk**: Users don't know where to log in  
**Mitigation**: Clear messaging, redirects, communication

### Risk 5: SEO Impact
**Risk**: Search rankings affected  
**Mitigation**: Proper redirects, sitemap updates, monitoring

---

## 📅 Timeline Estimate

### Week 1: Infrastructure & Design
- Domain purchase & DNS setup
- Server infrastructure
- SSL certificates
- Visual identity design
- Design system implementation

### Week 2: Development
- English frontpage development
- Backend configuration
- Login migration
- API migration
- Routing configuration

### Week 3: Migration & Cleanup
- veveve.dk cleanup
- Integration testing
- Performance optimization
- SEO setup

### Week 4: Testing & Launch
- Comprehensive testing
- Documentation
- Launch preparation
- Go-live
- Post-launch monitoring

**Total Estimate**: 3-4 weeks with 1-2 developers

---

## 🔗 Dependencies

### External Dependencies
- Domain registrar (purchase veveve.io)
- DigitalOcean DNS configuration
- SSL certificate issuance
- Design assets (if new logo needed)

### Internal Dependencies
- Design team for visual identity
- Content team for English copy
- DevOps for infrastructure
- QA for testing

---

## 📝 Notes & Considerations

### Technical Considerations
1. **Shared vs Separate Backend**: Decide if veveve.io and veveve.dk share same Django backend or separate
2. **Database Strategy**: Shared database vs separate databases
3. **Session Management**: How to handle sessions across domains
4. **CORS Configuration**: Ensure proper CORS for both domains
5. **CDN**: Consider CDN for static assets

### Business Considerations
1. **User Communication**: Notify existing users about login URL change
2. **Marketing**: Update all marketing materials with new login URL
3. **Support**: Update support documentation
4. **Analytics**: Set up separate analytics for veveve.io

### Future Enhancements
- Multi-language support (beyond English/Danish)
- Separate branding for different markets
- A/B testing capabilities
- Advanced analytics

---

## ✅ Definition of Done

A task is considered done when:
- [ ] Code is written and reviewed
- [ ] Tests are passing
- [ ] Documentation is updated
- [ ] Deployed to staging (if applicable)
- [ ] Acceptance criteria met
- [ ] No critical bugs
- [ ] Performance requirements met

---

## 📞 Team & Responsibilities

- **Project Lead**: Overall coordination
- **DevOps**: Domain, DNS, infrastructure, SSL
- **Designer**: Visual identity, design system
- **Frontend Developer**: Frontpage, login migration, routing
- **Backend Developer**: API migration, backend configuration
- **QA**: Testing, quality assurance
- **Content/Marketing**: English content, SEO

---

**Document Version**: 1.0  
**Last Updated**: January 11, 2026  
**Status**: Planning Phase
