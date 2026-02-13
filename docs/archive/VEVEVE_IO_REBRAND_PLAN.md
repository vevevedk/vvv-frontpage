# veveve.io Rebranding Plan - International PPC Ads Scaling Agency

## Current Status
- ✅ Domain setup complete
- ✅ SSL configured
- ✅ Backend configured
- ⚠️ Routing issue: veveve.io showing Danish content (fixing now)
- 📋 Next: Rebrand content for PPC ads scaling focus

---

## 1. Fix Domain Routing (In Progress)

**Issue**: veveve.io is showing Danish content instead of English frontpage

**Fix**: Updated `pages/index.tsx` to use server-side domain detection via `getServerSideProps`

**Status**: ✅ Code updated, needs deployment

---

## 2. Rebrand veveve.io Content

### Brand Positioning
**veveve.io** = International agency specializing in scaling PPC (Pay-Per-Click) advertising campaigns

**Key Messages**:
- Scale your PPC ads without scaling your team
- International expertise in Google Ads, Facebook Ads, LinkedIn Ads
- Data-driven optimization and automation
- Focus on ROI and growth

### Content Updates Needed

#### Hero Section
**Current**: "Scale Your Paid Marketing Without Scaling Your Team"
**Update to**: "Scale Your PPC Ads Globally - Without Scaling Your Team"

**Subheading**: 
- Focus on PPC channels: Google Ads, Facebook Ads, LinkedIn Ads
- Emphasize international reach
- Highlight automation and optimization

#### Features Section
**Update to focus on PPC-specific features**:
1. **Multi-Channel PPC Management**
   - Google Ads, Facebook Ads, LinkedIn Ads, Microsoft Ads
   - Unified dashboard for all PPC channels
   
2. **PPC Campaign Optimization**
   - AI-powered bid management
   - Automated A/B testing
   - Keyword optimization
   - Ad copy optimization

3. **PPC Analytics & Reporting**
   - Real-time performance tracking
   - ROI and ROAS reporting
   - Conversion attribution
   - Automated reports

#### Services Section
**Add PPC-specific services**:
- Google Ads Management
- Facebook & Instagram Ads
- LinkedIn Ads for B2B
- PPC Campaign Setup & Optimization
- Landing Page Optimization
- Conversion Rate Optimization

#### Benefits Section
**Update metrics to be PPC-focused**:
- "50%+ ROAS improvement" (instead of generic ROI)
- "3x faster campaign optimization"
- "10+ hours saved per week on PPC management"

---

## 3. Move Login from veveve.dk to veveve.io

### Current State
- Login page exists at `pages/login.tsx`
- veveve.dk navigation has login link (redirects to veveve.io/login)
- Middleware redirects `/login` on veveve.dk to `https://veveve.io/login`

### Actions Needed

#### ✅ Already Done
- [x] Middleware redirects veveve.dk/login → veveve.io/login
- [x] Login link in veveve.dk nav redirects to veveve.io/login

#### 📋 To Do
- [ ] Verify login page works on veveve.io
- [ ] Update login page branding for veveve.io (if needed)
- [ ] Test login flow end-to-end
- [ ] Update any hardcoded references to veveve.dk/login

---

## 4. Content Strategy for PPC Focus

### Target Audience
- International businesses scaling PPC campaigns
- Marketing teams managing multiple PPC channels
- Agencies managing client PPC accounts
- E-commerce businesses with high ad spend

### Key Value Propositions
1. **Scale Without Headcount**: Manage more campaigns with same team
2. **Multi-Channel Expertise**: Google, Facebook, LinkedIn, Microsoft
3. **Data-Driven Optimization**: AI-powered insights and automation
4. **International Reach**: Support for global campaigns
5. **ROI Focus**: Proven results and transparent reporting

### Messaging Tone
- Professional but approachable
- Data-focused and results-oriented
- International and scalable
- Tech-forward and modern

---

## 5. Implementation Checklist

### Phase 1: Fix Routing ✅
- [x] Update `pages/index.tsx` with server-side domain detection
- [ ] Deploy and test
- [ ] Verify veveve.io shows English frontpage

### Phase 2: Rebrand Content
- [ ] Update hero section with PPC focus
- [ ] Update features section (PPC-specific)
- [ ] Update services section
- [ ] Update benefits/metrics
- [ ] Update meta tags and SEO content
- [ ] Review and update all copy for PPC focus

### Phase 3: Login Migration
- [ ] Verify login works on veveve.io
- [ ] Test login flow
- [ ] Update any login-related branding
- [ ] Remove login references from veveve.dk (already done)

### Phase 4: Testing & Launch
- [ ] Test veveve.io frontpage
- [ ] Test login on veveve.io
- [ ] Test veveve.dk (should show Danish, no login)
- [ ] SEO check
- [ ] Performance check

---

## 6. Content Updates Needed

### Hero Section (`pages/io/index.tsx`)
**Update**:
- Title: "Scale Your PPC Ads Globally"
- Subtitle: Focus on Google Ads, Facebook Ads, LinkedIn Ads
- CTA: "Start Scaling PPC" or "Get PPC Audit"

### Features Section
**Replace generic marketing features with PPC-specific**:
1. Multi-Channel PPC Management
2. AI-Powered Campaign Optimization
3. Automated PPC Reporting

### Services Section
**Add PPC services**:
- Google Ads Management
- Facebook & Instagram Ads
- LinkedIn Ads
- PPC Strategy & Consulting

---

## 7. Next Steps

1. **Fix routing** (in progress) - Deploy updated `pages/index.tsx`
2. **Rebrand content** - Update `pages/io/index.tsx` with PPC focus
3. **Test login** - Verify login works on veveve.io
4. **Deploy and test** - Full end-to-end testing

---

**Priority**: Fix routing first, then rebrand content, then verify login migration.
