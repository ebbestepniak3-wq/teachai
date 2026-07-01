# Changelog – TeacherAI

All notable changes are documented in this file.
Format based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [1.0.0] – 2024-12-01 – Initial Release 🎉

### 🆕 Added – Core Platform

**Authentication & User Management**
- Complete registration with email verification
- Secure login with account lockout (5 attempts → 15 min)
- Two-factor authentication (TOTP, RFC 6238) with backup codes
- Password reset via email, change password, change email
- JWT-based sessions (HttpOnly cookies, 15min access / 30d refresh)
- User roles: TEACHER, ADMIN, SUPPORT
- Login history and active session management
- Account deactivation and DSGVO-compliant deletion (Art. 17)

**Upload System**
- Drag & Drop upload: PDF, DOCX, ODT, JPG, PNG, WebP, HEIC, TIFF
- Magic byte security validation (prevents file spoofing)
- OCR pipeline: Claude Vision (handwriting), pdf-parse (digital), mammoth (DOCX)
- Image preprocessing: auto-rotation, contrast, sharpening
- Per-plan file limits: Free 2 / Basic 5 / Pro 10 / Max Pro 20
- Storage: 24h (Free), unlimited (paid) – auto-cleanup via cron
- Document preview with zoom, rotation, page navigation

**AI Grading Engine**
- Claude claude-opus-4-6 integration with structured JSON output
- Subject-specific grading: Deutsch, Mathematik, Englisch, Physik, Chemie, Biologie + 4 more
- Bundesland-specific Notenschlüssel (Standard, Bayern, STRENG, KULANT)
- Teilpunkte, alternative Lösungswege, Fehler-Erklärungen
- Teacher review: adjust points, add comments, confirm grading
- Plausibility validation (sum checks, range validation)
- Retry system: 3 attempts with 5s/15s/60s backoff
- Timeout: 120 seconds, concurrent job limit: 3

**AI Assistant**
- Streaming Claude Sonnet 4.6 chat (SSE)
- Context-aware (Bundesland, Schulform, Fächer)
- Conversation management: create, rename, delete, search
- Export as Markdown and PDF
- 6 quick suggestion prompts
- Copy message functionality

**Payment System (Stripe)**
- Monthly and yearly billing (20% yearly discount)
- Plans: Free, Basic (7,99€), Pro (12,99€), Max Pro (19,99€)
- Payment methods: Card, SEPA, Apple Pay, Google Pay
- 7-day free trial for paid plans
- Coupon/discount codes
- Automatic subscription renewal
- Billing portal (change card, download invoices)
- Webhook handling: checkout, subscription changes, invoices, trials
- Invoice storage with PDF links

**Dashboard**
- Personalized greeting with time-of-day detection
- Monthly quota progress with upgrade CTA
- Recent grading jobs with status
- Quick access to all features
- Notification center
- Estimated time saved display

**Settings**
- Profile: name, school, subjects, classes, avatar
- Subscription: upgrade/downgrade/cancel/resume with Stripe
- Billing: invoice history, payment portal
- Security: password, email, 2FA, active sessions, login history
- Notifications: 5 toggleable notification types
- Privacy: DSGVO data export, deletion request, legal links

**Admin Panel**
- User search, edit, ban, delete, role change
- Subscription management
- Billing overview with MRR/ARR
- AI Grading Monitor: costs, tokens, jobs per subject
- Live Analytics: KPIs, service health, system metrics
- Feature Flags: per-plan rollouts
- Maintenance Mode
- Support Tickets
- System Logs + Error Protocols
- Prometheus metrics endpoint

**DSGVO & Legal**
- Datenschutzerklärung (full, with processor list)
- Impressum (§5 TMG compliant)
- Nutzungsbedingungen (10 sections)
- Data export API (Art. 20)
- Deletion request API (Art. 17)
- Audit logging for all sensitive actions
- Auto-expiry of uploads for Free plan

**Infrastructure**
- Next.js 14 App Router (SSR + RSC)
- PostgreSQL 16 via Prisma ORM
- Supabase Storage for files
- Redis (Upstash) for caching and rate limiting
- Nginx with SSL, rate limiting, security headers
- Docker + Docker Compose (dev + production)
- GitHub Actions CI/CD (lint → test → build → deploy)
- Vercel deployment configuration
- Prometheus + Grafana monitoring stack
- Automated daily database backup with S3 upload
- Health check endpoint for load balancers

**SEO & PWA**
- Full OpenGraph and Twitter Card metadata
- JSON-LD structured data (SoftwareApplication, Organization)
- XML Sitemap auto-generation
- robots.txt with AI bot blocking
- PWA manifest (installable on all platforms)
- WCAG accessibility improvements

### 🔒 Security
- bcrypt-12 password hashing
- Zod input validation on all API endpoints
- File magic byte verification
- PDF script injection detection
- Rate limiting: Auth 10/15min, API 60/min, Upload 5/min
- Content Security Policy headers
- HSTS, X-Frame-Options, X-XSS-Protection
- HttpOnly, Secure, SameSite=Lax cookies
- Session rotation on sensitive actions
- Account lockout after 5 failed attempts

### 🧪 Tests
- 4 test suites, 40+ unit and integration tests
- Calculator: note calculation, Bayern, STRENG/KULANT modes
- Security: password strength, TOTP, account lockout, sanitization
- Upload validation: magic bytes, MIME types, size limits, plan limits
- Grading flow: prompt generation, grade consistency, passing thresholds

---

## Known Limitations (Version 1.0.0)

1. **Batch grading** (multiple files at once) not yet available – planned for v1.1
2. **OCR for HEIC/HEIF** files uses relaxed magic byte check – full support in v1.1
3. **PDF generation** requires Puppeteer (optional dependency) – HTML fallback for serverless
4. **Push notifications** (browser/mobile) prepared but not wired – planned for v1.2
5. **OAuth** (Google/Apple/Microsoft) routes exist but provider callbacks need configuration
6. **API rate limits** use in-memory storage – requires Redis for multi-instance setups

---

## Planned – Version 1.1

- Batch grading (upload multiple files, grade as class set)
- Advanced class statistics (per student tracking)
- API access for Max Pro users
- HEIC/HEIF full native support
- Enhanced chart/analytics with Recharts
- WhatsApp notification integration
- School-level multi-seat licenses

## Planned – Version 2.0

- Multi-language support (English, French)
- Tablet/stylus input for markup
- LMS integration (Moodle, IServ)
- Automated report delivery to students
- Team/school accounts with shared settings
- Custom grading rubric templates
- AI-powered Zeugnisbemerkungen generator (full flow)
