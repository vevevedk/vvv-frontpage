# Sprint 2: Redesign veveve.io as International SaaS for PPC Marketing with Agentic Systems

## 🎯 Sprint Goal
Transform veveve.io into a modern, international SaaS platform that positions the company as a leader in AI-powered, agentic systems for scaling PPC marketing campaigns.

**Duration**: 4-6 weeks  
**Priority**: High  
**Dependencies**: Can start in parallel with Sprint 1

---

## 📋 Overview

### Current State
- veveve.io shows basic English frontpage with PPC-focused messaging
- Generic SaaS look and feel
- Limited emphasis on AI/agentic systems
- Basic feature descriptions

### Target State
- Modern, international SaaS platform design (multi-page, not just one landing page)
- Strong emphasis on **AI-powered agentic systems** for PPC automation (autonomous decision-making)
- Professional, tech-forward visual identity (distinct from veveve.dk agency brand)
- Clear value proposition for **PPC marketing scaling** (outcomes + ROI, not just features)
- Compelling case studies and social proof
- Clear pricing + self-serve trial onboarding
- SEO-ready, fast, accessible marketing site that supports global positioning

---

## ✅ Sprint Deliverables (hard outputs)

### Marketing site (veveve.io)
- **Page IA implemented under `pages/io/`** (see below) with consistent layout, navigation, footer, SEO meta, and analytics hooks.
- **Home**: Agentic PPC positioning + product narrative + CTAs.
- **Product**: Agentic systems explained (how it works), feature deep-dives, integrations, security posture.
- **Pricing**: Clear tiers, usage-based levers, FAQ, and enterprise path.
- **Case Studies**: 3–5 strong, metrics-driven stories with industry variety.
- **Trust**: Security & compliance page, SLAs/support, and “why us” proof.

### Design system (veveve.io)
- **Design tokens** finalized in `styles/veveve-io-tokens.css` (colors, typography, spacing, elevation).
- **Reusable components** created for veveve.io pages (layout shell, hero, feature cards, pricing table, testimonial/case study blocks, FAQ accordion, CTA blocks).
- **Content templates** for case studies, comparisons, and feature pages (repeatable structure).

### Growth instrumentation
- Conversion events defined (trial, demo, newsletter, contact) and wired into the tracking layer (tooling choice documented).
- A/B testing plan for hero + pricing messaging (even if experimentation infra ships in Sprint 3).

---

## 🧭 Information Architecture & Routing (important for this repo)

### Current routing reality
- `middleware.ts` rewrites `veveve.io/` → `/io` (English frontpage lives at `pages/io/index.tsx`).
- The Danish marketing site remains at `/` for `veveve.dk`.

### Target IA (recommendation)
Implement a clean “marketing site subtree” for veveve.io:
- `pages/io/index.tsx` — Home
- `pages/io/product.tsx` — Product overview + agentic systems
- `pages/io/pricing.tsx` — Pricing
- `pages/io/case-studies/index.tsx` — Case studies listing
- `pages/io/case-studies/[slug].tsx` — Case study detail template
- `pages/io/security.tsx` — Security & compliance (GDPR-ready positioning)
- `pages/io/contact.tsx` (optional) — Contact / book demo

### Required routing behavior
To make URLs look “normal” on veveve.io (e.g. `veveve.io/pricing`):
- Update `middleware.ts` to rewrite **all non-API** veveve.io paths:
  - `/pricing` → `/io/pricing`
  - `/product` → `/io/product`
  - `/case-studies/...` → `/io/case-studies/...`
  - Keep `/api/*` behavior unchanged.

This avoids duplicated content paths (`/io/pricing` vs `/pricing`) and keeps SEO canonical clean.

### Coordination with Sprint 1 (canonical app host)
Sprint 1 is moving **all login + app functionality** to `veveve.io`.

- **Rule**: `veveve.io` is the canonical host for **login/app**.
- **Requirement for Sprint 2**:
  - Marketing UI “Login / Sign in / Dashboard” links must resolve to **`https://veveve.io/login`** (and app deep links remain on `veveve.io`).
  - Do **not** rewrite platform/app routes into the `/io/*` marketing subtree (e.g. `/login`, `/register`, `/dashboard`, etc. must continue to work as platform pages).

---

## 🧩 Epics & Milestones (4–6 weeks)

### Epic A — SaaS Positioning + Content Architecture (Week 1)
- Messaging map: “agentic systems” explained in business language (what it does, why better, proof).
- IA + page outlines for Home/Product/Pricing/Case Studies/Security.
- Copy skeletons shipped early (so design + dev can parallelize).

### Epic B — veveve.io Design System & Components (Week 1–2)
- Finalize tokens + layout primitives.
- Build reusable sections: hero, credibility bar, feature grids, “how it works”, pricing table, FAQ, CTA strips.
- Accessibility baseline: semantic headings, keyboard nav, contrast, reduced motion support.

### Epic C — Home Page (Week 2)
- New hero + “agentic systems” explanation module (diagram + narrative).
- Outcome-driven benefit section (time saved, ROAS lift, risk reduction, faster experimentation).
- Proof blocks (logos/testimonials placeholders if needed, metrics-backed statements).

### Epic D — Product + Trust Pages (Week 3)
- Product deep-dive + integrations + “agent actions” examples (bids, budgets, queries, creatives).
- Security page: data handling, permissions, audit logs (even if some are roadmap—be explicit).

### Epic E — Case Studies (Week 3–4)
- 3–5 case studies written and designed (consistent template).
- Each includes baseline → intervention → outcome, with specific metrics and timeframe.

### Epic F — Pricing + Conversion Paths (Week 4)
- Pricing tiers (self-serve vs pro vs enterprise) + usage levers (spend, accounts, seats, features).
- FAQ + objection handling (“Do you replace humans?”, “How safe is automation?”, “What markets?”).

### Epic G — SEO, Performance, Analytics, Launch (Week 5–6)
- Technical SEO: titles, meta, OG, canonical, sitemap, schema (Organization, Product, FAQ).
- Performance: image optimization, bundle check, Lighthouse targets.
- Tracking: conversion events + dashboards.
- Final QA: mobile, cross-browser, copy review, broken links, 404 handling.

---

## 🎨 Design Vision

### Brand Identity
- **Positioning**: Leading AI-powered SaaS for PPC marketing automation
- **Tone**: Professional, innovative, data-driven, cutting-edge
- **Visual Style**: Modern, clean, tech-forward, premium
- **Color Palette**: 
  - Primary: Tech blue (#0066CC) - trust, technology
  - Secondary: Growth teal (#00CC99) - growth, success
  - Accent: Energy coral (#FF6B6B) - action, results
  - Neutral: Modern grays and whites

### Key Messaging
- **Headline**: "Scale Your PPC Ads with AI-Powered Agentic Systems"
- **Value Prop**: "Automate campaign optimization, bid management, and scaling decisions with autonomous AI agents"
- **Differentiator**: "The only platform that uses agentic AI to make real-time PPC decisions"

---

## 🌍 International SaaS Requirements (minimum bar)

### Positioning
- “International” is reflected in content: multi-market scaling, localization, compliance, and operational maturity.

### Localization (phased)
- Sprint 2: English-first, but **structure copy/components to support i18n** (no hardcoded locale assumptions).
- Sprint 3+: Add i18n framework + locales (e.g. EN primary, then DE/DA/SE based on strategy).

### Pricing display (phased)
- Sprint 2: Primary currency (EUR or USD) + “contact for local pricing” note where relevant.
- Sprint 3+: Multi-currency + tax/VAT messaging and localized billing details.

### Legal & compliance baseline
- Cookie consent strategy (even if implemented later): document requirement and intended solution.
- Security/GDPR page ships in Sprint 2 with accurate statements (no overpromising).

---

## 👥 User Stories

### Story 1: Hero Section Redesign
**As a** potential customer  
**I want to** immediately understand this is an AI-powered PPC automation platform  
**So that** I know if it's relevant to my needs

**Acceptance Criteria**:
- [ ] Hero section clearly communicates AI-powered PPC automation
- [ ] Emphasis on "agentic systems" and autonomous decision-making
- [ ] Compelling headline and subheadline
- [ ] Clear CTA buttons (Start Free Trial, Book Demo)
- [ ] Visual elements (illustrations/animations) showing AI/automation

### Story 2: Features Section - Agentic Systems
**As a** potential customer  
**I want to** understand how agentic AI systems work for PPC  
**So that** I can evaluate if this solves my problems

**Acceptance Criteria**:
- [ ] Dedicated section explaining agentic systems
- [ ] Clear explanation of autonomous decision-making
- [ ] Visual representation of how agents work
- [ ] Benefits of agentic approach vs. traditional automation
- [ ] Examples of agent actions (bid adjustments, keyword optimization, etc.)

### Story 3: Platform Capabilities
**As a** potential customer  
**I want to** see all platform capabilities and features  
**So that** I understand the full value proposition

**Acceptance Criteria**:
- [ ] Comprehensive features section
- [ ] Multi-channel PPC management (Google Ads, Facebook, LinkedIn, Microsoft)
- [ ] AI-powered optimization features
- [ ] Agentic system capabilities
- [ ] Analytics and reporting features
- [ ] Integration capabilities

### Story 4: Social Proof and Case Studies
**As a** potential customer  
**I want to** see proof that this works for other companies  
**So that** I can trust the platform

**Acceptance Criteria**:
- [ ] Customer testimonials
- [ ] Case studies with metrics (ROAS improvements, time savings, etc.)
- [ ] Company logos (if available)
- [ ] Success metrics and statistics
- [ ] Industry recognition/awards (if any)

### Story 5: Pricing and Plans
**As a** potential customer  
**I want to** understand pricing and plans  
**So that** I can make a purchase decision

**Acceptance Criteria**:
- [ ] Clear pricing tiers
- [ ] Feature comparison table
- [ ] Transparent pricing (no hidden fees)
- [ ] Free trial option
- [ ] Enterprise/contact sales option

---

## 🔧 Technical Tasks

### Phase 1: Design System (Week 1)

#### Task 1.1: Create Design Tokens
- [ ] Define color palette (already started in `styles/veveve-io-tokens.css`)
- [ ] Define typography scale
- [ ] Define spacing system
- [ ] Define component styles
- [ ] Create design system documentation

#### Task 1.2: Component Library
- [ ] Create reusable UI components
- [ ] Build component showcase/storybook
- [ ] Document component usage
- [ ] Ensure accessibility standards
- [ ] Responsive design patterns

#### Task 1.3: Visual Assets
- [ ] Create/commission illustrations for agentic systems
- [ ] Design icons for features
- [ ] Create animations/micro-interactions
- [ ] Design dashboard mockups/screenshots
- [ ] Create video content (if needed)

### Phase 2: Hero and Above-the-Fold (Week 1-2)

#### Task 2.1: Hero Section Redesign
- [ ] New headline emphasizing agentic AI
- [ ] Compelling subheadline
- [ ] Updated CTA buttons
- [ ] Visual elements (illustrations/animations)
- [ ] Trust indicators (metrics, logos)

#### Task 2.2: Value Proposition Section
- [ ] Clear value proposition statement
- [ ] Key benefits highlighted
- [ ] Visual representation
- [ ] Social proof elements

### Phase 3: Features and Capabilities (Week 2-3)

#### Task 3.1: Agentic Systems Section
- [ ] Explanation of agentic AI
- [ ] How it works (diagram/visualization)
- [ ] Benefits over traditional automation
- [ ] Real-world examples
- [ ] Interactive demo (if possible)

#### Task 3.2: Platform Features
- [ ] Multi-channel PPC management
- [ ] AI optimization features
- [ ] Analytics and reporting
- [ ] Integration capabilities
- [ ] Security and compliance

#### Task 3.3: Feature Demonstrations
- [ ] Screenshots/mockups of platform
- [ ] Feature walkthroughs
- [ ] Interactive elements
- [ ] Video demos (optional)

### Phase 4: Social Proof and Trust (Week 3-4)

#### Task 4.1: Case Studies
- [ ] Write 3-5 case studies
- [ ] Include metrics and results
- [ ] Customer quotes
- [ ] Visual presentation
- [ ] Industry-specific examples

#### Task 4.2: Testimonials
- [ ] Collect customer testimonials
- [ ] Design testimonial section
- [ ] Include photos/logos
- [ ] Highlight key quotes

#### Task 4.3: Metrics and Statistics
- [ ] Display key metrics (ROAS improvements, time savings, etc.)
- [ ] Animated counters
- [ ] Visual charts/graphs
- [ ] Industry benchmarks

### Phase 5: Pricing and CTA (Week 4)

#### Task 5.1: Pricing Section
- [ ] Design pricing tiers
- [ ] Feature comparison table
- [ ] Clear pricing display
- [ ] CTA buttons for each tier
- [ ] FAQ section

#### Task 5.2: Final CTAs
- [ ] Multiple CTA sections throughout page
- [ ] Sticky CTA (optional)
- [ ] A/B testing setup
- [ ] Conversion tracking

### Phase 6: Polish and Optimization (Week 5-6)

#### Task 6.1: Performance Optimization
- [ ] Image optimization
- [ ] Code splitting
- [ ] Lazy loading
- [ ] Performance testing
- [ ] Lighthouse score > 90

#### Task 6.2: SEO Optimization
- [ ] Meta tags optimization
- [ ] Structured data
- [ ] Content optimization
- [ ] Internal linking
- [ ] Sitemap updates

#### Task 6.3: Testing and Refinement
- [ ] Cross-browser testing
- [ ] Mobile responsiveness
- [ ] Accessibility testing
- [ ] User testing (if possible)
- [ ] Bug fixes and refinements

---

## 🎨 Design Requirements

### Visual Design
- **Modern SaaS aesthetic**: Clean, professional, tech-forward
- **AI/Technology theme**: Subtle tech elements, data visualizations
- **Premium feel**: High-quality visuals, smooth animations
- **International appeal**: Works for global audience

### Content Strategy
- **Focus on outcomes**: Results, ROI, growth
- **Technical credibility**: Show expertise in AI/PPC
- **Clear differentiation**: Why agentic systems are better
- **Compelling storytelling**: Customer success stories

### User Experience
- **Fast loading**: < 3s page load
- **Smooth scrolling**: Parallax effects, animations
- **Clear navigation**: Easy to understand
- **Strong CTAs**: Multiple conversion opportunities

---

## 📊 Success Metrics

### Design Metrics
- [ ] Lighthouse score > 90
- [ ] Page load time < 3s
- [ ] Mobile-friendly score 100%
- [ ] Accessibility score > 95

### Business Metrics
- [ ] Increased sign-ups/trials
- [ ] Lower bounce rate
- [ ] Higher time on page
- [ ] More demo requests
- [ ] Better conversion rates

---

## 🚨 Risks and Mitigation

### Risk 1: Over-Complexity
**Risk**: Design might be too complex or confusing  
**Mitigation**: 
- User testing
- Clear information hierarchy
- Progressive disclosure

### Risk 2: Performance Issues
**Risk**: Rich visuals might slow down page  
**Mitigation**:
- Image optimization
- Lazy loading
- Code splitting
- Performance monitoring

### Risk 3: Messaging Clarity
**Risk**: "Agentic systems" might be too technical  
**Mitigation**:
- Clear explanations
- Visual aids
- Simple language where possible
- Examples and use cases

---

## 📅 Timeline

### Week 1-2: Design System & Hero
- Design tokens and component library
- Hero section redesign
- Value proposition section

### Week 3-4: Features & Social Proof
- Agentic systems section
- Platform features
- Case studies and testimonials

### Week 5-6: Pricing & Polish
- Pricing section
- Performance optimization
- Testing and refinement
- Launch preparation

---

## ✅ Definition of Done

- [ ] Complete redesign implemented
- [ ] All sections redesigned with new content
- [ ] veveve.io multi-page IA shipped under `pages/io/` (Home/Product/Pricing/Case Studies/Security at minimum)
- [ ] Middleware routing supports clean veveve.io URLs (rewrite to `/io/*` subtree)
- [ ] Marketing UI login/app links resolve to `https://veveve.io/login` (no DK-hosted app entrypoints)
- [ ] Performance optimized (Lighthouse > 90)
- [ ] Mobile responsive
- [ ] Accessibility compliant
- [ ] SEO optimized
- [ ] Content reviewed and approved
- [ ] Analytics tracking implemented
- [ ] A/B testing setup (if applicable)

---

## 🔗 Dependencies

- **Can start**: Immediately (in parallel with Sprint 1)
- **Blocks**: None
- **Helps**: Sprint 1 (better positioning for migrated app)
- **Coordination**: Sprint 1 migration makes `veveve.io` canonical for login/app; Sprint 2 must keep marketing vs app routing clearly separated.

---

## 📝 Notes

- Current veveve.io frontpage is basic - needs complete overhaul
- Focus on AI/agentic systems as key differentiator
- International SaaS positioning is critical
- Consider video content for better engagement
- Plan for ongoing content updates

