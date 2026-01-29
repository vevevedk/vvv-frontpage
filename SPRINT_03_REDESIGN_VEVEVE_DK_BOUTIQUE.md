# Sprint 3: Redesign veveve.dk as Boutique Agency for Danish SMB Market

## 🎯 Sprint Goal
Transform veveve.dk into a boutique digital marketing agency website that appeals to small and mid-sized companies in Denmark, emphasizing personal service, local expertise, and Danish market understanding.

**Duration**: 4-6 weeks  
**Priority**: High  
**Dependencies**: Can start in parallel with Sprints 1 & 2

---

## 📋 Overview

### Current State
- veveve.dk shows generic marketing analytics platform messaging
- Mixed Danish/English content
- Not clearly positioned as a boutique agency
- Generic SaaS look

### Target State
- Boutique agency positioning
- Danish language content (primary)
- Focus on small and mid-sized Danish companies
- Personal, relationship-driven messaging
- Local market expertise emphasized
- Clear agency services and approach

---

## ✅ Scope (In / Out)

### In scope
- Danish-first marketing website for `veveve.dk` with boutique positioning
- Clear service offering for Danish SMBs (packages, process, proof)
- Conversion funnel: contact + “book a meeting” (frictionless)
- Local SEO foundation (Danish keywords, structured data, internal linking)
- Fast, accessible, mobile-first implementation
- Sprint 1 coordination: `veveve.dk` stays marketing-only; “Login” links to `https://veveve.io/login`

### Out of scope (for this sprint)
- Building/expanding the SaaS app inside `veveve.dk` (Sprint 1 handles app separation)
- Complex lead-routing/CRM automation beyond basic form delivery
- Large multi-language system beyond “Danish primary + optional English fallback”

---

## 📦 Key Deliverables
- **New boutique homepage** (Danish-first) with clear CTA flow
- **Services**: overview + 3–6 service pages (or packages) aimed at SMBs
- **About**: story, principles, credibility, “how we work”
- **Case studies / results**: 3–5 Danish SMB examples (anonymized if needed)
- **Contact + meeting booking**: form + calendar integration (or simple request flow)
- **Local SEO baseline**: meta, schema, sitemap/robots sanity, Danish copy + keywords
- **Analytics**: basic conversion events for booking + contact submissions

---

## 🗺️ Information Architecture (Page Map)

### Required pages
- **Forside** (home)
- **Ydelser** (services overview)
- **Ydelse** (template): e.g. Google Ads, Meta Ads, SEO, Tracking/GA4, CRO
- **Cases / Resultater**
- **Om os**
- **Kontakt** (+ booking)

### Optional pages (time permitting)
- **Priser / Pakker**
- **FAQ**
- **Ressourcer / Blog** (lightweight, for future SEO growth)

---

## 🗣️ Danish Tone of Voice (Guidelines)
- **Human + direct**: short sentences, clear promises, no buzzword overload
- **Boutique signal**: “få faste kontaktpersoner”, “vi svarer hurtigt”, “vi kender DK”
- **Confidence without arrogance**: show process + proof; avoid “world-leading” claims
- **SMB empathy**: budget reality, time constraints, simple next steps

### Example hero copy (draft)
- **Headline**: “Personlig performance marketing for danske virksomheder”
- **Sub**: “Vi hjælper SMB’er med at få mere ud af Google Ads, Meta og tracking — med tæt samarbejde og tydelige resultater.”
- **Primary CTA**: “Book et møde”
- **Secondary CTA**: “Se cases”

---

## 🎨 Design Vision

### Brand Identity
- **Positioning**: Boutique digital marketing agency specializing in Danish SMB market
- **Tone**: Personal, trustworthy, approachable, expert but not intimidating
- **Visual Style**: Warm, professional, Danish aesthetic, human-centered
- **Color Palette**: 
  - Primary: Danish blue (#003D82) - trust, professionalism
  - Secondary: Warm orange (#FF6B35) - energy, approachability
  - Accent: Forest green (#2D5016) - growth, sustainability
  - Neutral: Warm grays and creams

### Key Messaging
- **Headline**: "Din digitale marketing partner i Danmark" (Your digital marketing partner in Denmark)
- **Value Prop**: "Personlig service og lokal ekspertise for danske virksomheder" (Personal service and local expertise for Danish companies)
- **Differentiator**: "Vi forstår det danske marked" (We understand the Danish market)

---

## 👥 User Stories

### Story 1: Danish-First Content
**As a** Danish business owner  
**I want to** see content in Danish  
**So that** I can easily understand the services

**Acceptance Criteria**:
- [ ] All primary content in Danish
- [ ] English available as secondary option
- [ ] Danish cultural references and examples
- [ ] Local market understanding demonstrated

### Story 2: Boutique Agency Positioning
**As a** small/mid-sized Danish company  
**I want to** see this is a boutique agency, not a big corporation  
**So that** I know I'll get personal attention

**Acceptance Criteria**:
- [ ] Clear boutique agency messaging
- [ ] Emphasis on personal service
- [ ] Team/people-focused content
- [ ] Relationship-driven approach highlighted

### Story 3: Services for Danish SMBs
**As a** Danish business owner  
**I want to** see services relevant to my business size  
**So that** I know this agency understands my needs

**Acceptance Criteria**:
- [ ] Services tailored to SMB market
- [ ] Pricing appropriate for SMBs
- [ ] Case studies from Danish SMBs
- [ ] Clear service packages

### Story 4: Local Market Expertise
**As a** Danish business owner  
**I want to** see proof of Danish market knowledge  
**So that** I trust the agency understands my market

**Acceptance Criteria**:
- [ ] Danish market insights
- [ ] Local case studies
- [ ] Danish business examples
- [ ] Cultural understanding demonstrated

### Story 5: Easy Contact and Consultation
**As a** potential client  
**I want to** easily contact the agency  
**So that** I can start a conversation

**Acceptance Criteria**:
- [ ] Prominent contact information
- [ ] Easy consultation booking
- [ ] Multiple contact methods
- [ ] Quick response promise

---

## 🔧 Technical Tasks

### Phase 1: Content Strategy (Week 1)

#### Task 1.1: Content Audit and Planning
- [ ] Audit current veveve.dk content
- [ ] Define target audience (Danish SMBs)
- [ ] Create content strategy
- [ ] Plan Danish language content
- [ ] Define key messages

#### Task 1.2: Content Creation
- [ ] Write Danish homepage content
- [ ] Create service descriptions in Danish
- [ ] Write "About Us" in Danish
- [ ] Create case studies (Danish companies)
- [ ] Write blog content strategy

#### Task 1.3: Translation and Localization
- [ ] Translate all content to Danish
- [ ] Localize for Danish market
- [ ] Cultural adaptation
- [ ] Review by native Danish speaker

#### Task 1.4: Offer & Packaging
- [ ] Define 3–4 service “packages” for SMB budgets (starter / growth / scale)
- [ ] Define what’s included, what’s not, and typical timelines
- [ ] Create a simple “process” narrative (Kickoff → Setup → Optimization → Reporting)

### Phase 2: Design System (Week 1-2)

#### Task 2.1: Create Danish Design Tokens
- [ ] Define Danish color palette
- [ ] Define typography (Danish-friendly fonts)
- [ ] Define spacing and layout
- [ ] Create component styles
- [ ] Ensure Danish text readability

#### Task 2.2: Component Library
- [ ] Create Danish-specific components
- [ ] Build component showcase
- [ ] Document component usage
- [ ] Ensure accessibility
- [ ] Responsive design patterns

#### Task 2.3: Visual Assets
- [ ] Create/commission Danish-themed illustrations
- [ ] Design icons for services
- [ ] Create team photos/illustrations
- [ ] Design Danish business imagery
- [ ] Create local market visuals

#### Task 2.4: Conversion Components
- [ ] Reusable CTA blocks (book/contact) with consistent copy
- [ ] “Trust strip” component (logos/metrics/testimonials)
- [ ] Case-study card components (result → approach → outcome)

### Phase 3: Homepage Redesign (Week 2-3)

#### Task 3.1: Hero Section
- [ ] Danish headline and messaging
- [ ] Boutique agency positioning
- [ ] Personal, approachable tone
- [ ] Clear CTAs (Kontakt os, Book møde)
- [ ] Warm, inviting visuals

#### Task 3.2: Services Section
- [ ] Services for Danish SMBs
- [ ] Clear service descriptions
- [ ] Pricing transparency
- [ ] Service packages
- [ ] Visual representation

#### Task 3.3: About/Team Section
- [ ] Team introduction
- [ ] Agency story
- [ ] Danish market expertise
- [ ] Personal approach
- [ ] Trust building elements

#### Task 3.4: Process Section
- [ ] Clear 3–5 step “how we work” flow
- [ ] What clients can expect week-by-week (especially first 30 days)
- [ ] Reporting cadence + transparency promises

### Phase 4: Case Studies and Social Proof (Week 3-4)

#### Task 4.1: Danish Case Studies
- [ ] Write 3-5 Danish company case studies
- [ ] Include metrics and results
- [ ] Client testimonials in Danish
- [ ] Visual presentation
- [ ] Industry diversity

#### Task 4.2: Testimonials
- [ ] Collect Danish client testimonials
- [ ] Design testimonial section
- [ ] Include client photos/logos
- [ ] Highlight key quotes
- [ ] Danish language testimonials

#### Task 4.3: Results and Metrics
- [ ] Display client results
- [ ] Danish market success stories
- [ ] Visual charts/graphs
- [ ] Industry-specific examples

#### Task 4.4: Credibility & Trust
- [ ] Add “who we’re a fit for / not a fit for”
- [ ] Add promises carefully (response times, transparency; avoid “guaranteed results”)
- [ ] Add privacy/tracking note (GDPR-friendly phrasing)

### Phase 5: Contact and Conversion (Week 4)

#### Task 5.1: Contact Section
- [ ] Prominent contact information
- [ ] Contact form in Danish
- [ ] Consultation booking
- [ ] Multiple contact methods
- [ ] Response time promise

#### Task 5.2: CTAs Throughout
- [ ] Multiple CTA sections
- [ ] "Book et møde" buttons
- [ ] "Kontakt os" buttons
- [ ] Conversion tracking
- [ ] A/B testing setup

#### Task 5.2b: Login Link Coordination (Sprint 1)
- [ ] Optional “Login” button visible on `veveve.dk` header/menu (allowed UX)
- [ ] Login button uses absolute URL `https://veveve.io/login` (no relative `/login`)
- [ ] Verify `veveve.dk/login` still redirects to `https://veveve.io/login` (middleware safety net)

#### Task 5.3: Booking Integration
- [ ] Implement “request meeting” lead form (store in DB + notify + manual follow-up)
- [ ] Confirmation UX (thank you page + expectations)
- [ ] Anti-spam (honeypot / rate limiting)

### Phase 6: Additional Pages (Week 5)

#### Task 6.1: Services Pages
- [ ] Individual service pages
- [ ] Detailed service descriptions
- [ ] Pricing information
- [ ] Process explanations
- [ ] FAQs

#### Task 6.2: About Page
- [ ] Agency story
- [ ] Team profiles
- [ ] Values and approach
- [ ] Danish market expertise
- [ ] Why choose us

#### Task 6.3: Blog/Resources
- [ ] Danish market insights
- [ ] Marketing tips for Danish businesses
- [ ] Case study deep dives
- [ ] Industry news
- [ ] SEO content

#### Task 6.4: Local SEO & Structured Data
- [ ] Danish keyword map per page (1 primary + 3–5 secondary)
- [ ] Titles/meta in Danish; OG tags for sharing
- [ ] Add schema.org (Organization/LocalBusiness as appropriate)
- [ ] Internal linking plan (services ↔ cases ↔ contact)

### Phase 7: Polish and Optimization (Week 6)

#### Task 7.1: Performance Optimization
- [ ] Image optimization
- [ ] Code splitting
- [ ] Lazy loading
- [ ] Performance testing
- [ ] Lighthouse score > 90

#### Task 7.2: SEO Optimization (Danish)
- [ ] Danish SEO keywords
- [ ] Meta tags in Danish
- [ ] Structured data
- [ ] Local SEO optimization
- [ ] Danish business directories

#### Task 7.3: Testing and Refinement
- [ ] Cross-browser testing
- [ ] Mobile responsiveness
- [ ] Accessibility testing
- [ ] User testing with Danish users
- [ ] Bug fixes and refinements

#### Task 7.4: Analytics & Events
- [ ] Track: booking started, booking completed, contact submitted, phone/email clicks
- [ ] Track: CTA clicks by section (hero/services/cases/footer)
- [ ] Add simple notes on what “good” looks like post-launch

---

## 🎨 Design Requirements

### Visual Design
- **Boutique aesthetic**: Warm, personal, professional
- **Danish identity**: Subtle Danish design elements
- **Human-centered**: People-focused, not tech-focused
- **Approachable**: Friendly, not intimidating

### Content Strategy
- **Danish-first**: Primary language is Danish
- **SMB focus**: Tailored to small/mid-sized businesses
- **Local expertise**: Emphasize Danish market knowledge
- **Personal service**: Relationship-driven messaging

### User Experience
- **Fast loading**: < 3s page load
- **Easy navigation**: Clear, simple structure
- **Clear CTAs**: Multiple contact opportunities
- **Mobile-friendly**: Danish businesses use mobile

---

## 📊 Success Metrics

### Design Metrics
- [ ] Lighthouse score > 90
- [ ] Page load time < 3s
- [ ] Mobile-friendly score 100%
- [ ] Accessibility score > 95

### Business Metrics
- [ ] Increased consultation bookings
- [ ] Lower bounce rate
- [ ] Higher time on page
- [ ] More contact form submissions
- [ ] Better conversion rates
- [ ] Danish market engagement

---

## 🚨 Risks and Mitigation

### Risk 1: Language Quality
**Risk**: Danish content might not be native-quality  
**Mitigation**: 
- Native Danish speaker review
- Professional translation if needed
- Cultural adaptation

### Risk 2: Over-Complexity
**Risk**: Too many services might confuse SMBs  
**Mitigation**:
- Clear service packages
- Simple navigation
- Focused messaging

### Risk 3: Not Boutique Enough
**Risk**: Might still feel too corporate  
**Mitigation**:
- Personal team introductions
- Relationship-focused messaging
- Small agency feel
- Human-centered design

---

## 📅 Timeline

### Week 1-2: Content & Design System
- Content strategy and creation
- Design tokens and components
- Danish language content

### Week 3-4: Homepage & Social Proof
- Homepage redesign
- Case studies and testimonials
- Services section

### Week 5: Additional Pages
- Services pages
- About page
- Blog/resources

### Week 6: Polish & Launch
- Performance optimization
- SEO optimization
- Testing and refinement
- Launch

---

## ✅ Definition of Done

- [ ] Complete redesign implemented
- [ ] All content in Danish (primary)
- [ ] Boutique agency positioning clear
- [ ] SMB-focused messaging
- [ ] Performance optimized (Lighthouse > 90)
- [ ] Mobile responsive
- [ ] Accessibility compliant
- [ ] Danish SEO optimized
- [ ] Content reviewed by native speaker
- [ ] Analytics tracking implemented
- [ ] Contact + booking flow tested end-to-end (including confirmations)
- [ ] Page map implemented (Forside/Ydelser/Cases/Om/Kontakt at minimum)
- [ ] Any “Login” link on `veveve.dk` points to `https://veveve.io/login` (absolute URL)

---

## 🔗 Dependencies

- **Can start**: Immediately (in parallel with Sprints 1 & 2)
- **Blocks**: None
- **Helps**: Sprint 1 (clean separation from app functionality)

---

## 📝 Notes

- Current veveve.dk needs complete overhaul
- Focus on boutique agency, not SaaS platform
- Danish language is critical
- SMB market requires different messaging than enterprise
- Personal service and local expertise are key differentiators
- Consider Danish business culture and communication style

