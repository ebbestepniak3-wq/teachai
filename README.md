<div align="center">

# TeacherAI

### Die KI-Korrekturplattform für Lehrkräfte in Deutschland

[![Version](https://img.shields.io/badge/version-1.0.0-6271f6?style=flat-square)](./CHANGELOG.md)
[![License: Proprietary](https://img.shields.io/badge/license-Proprietary-red?style=flat-square)](./LICENSE)
[![DSGVO](https://img.shields.io/badge/DSGVO-konform-10b981?style=flat-square)](https://teachai.de/datenschutz)
[![Next.js](https://img.shields.io/badge/Next.js-14.x-black?style=flat-square)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178c6?style=flat-square)](https://typescriptlang.org)

**Klassenarbeiten in Minuten bewerten. Transparent. DSGVO-konform. Für alle 16 Bundesländer.**

[Demo →](https://teachai.de) · [Dokumentation →](./docs/) · [API →](https://teachai.de/api/swagger?format=ui)

</div>

---

## Schnellstart (Entwicklung)

```bash
git clone https://github.com/yourorg/teachai.git && cd teachai
npm install
cp apps/web/.env.example apps/web/.env.local
# .env.local befüllen (mindestens DATABASE_URL, JWT_SECRET, ANTHROPIC_API_KEY)
docker compose -f infrastructure/docker/docker-compose.yml --profile dev up -d
npm run db:migrate && npm run db:seed
npm run dev
```

🌐 **http://localhost:3000**  
👤 **admin@teachai.de / Admin1234!** (Admin)  
👤 **lehrer@teachai.de / Teacher1234!** (Demo-Lehrkraft)

---

## Tech-Stack

| Layer | Technologie |
|-------|------------|
| Framework | Next.js 14 (App Router, RSC) |
| Sprache | TypeScript 5 (100%) |
| Styling | Tailwind CSS 3 + Custom Design System |
| Datenbank | PostgreSQL 16 via Prisma ORM |
| Auth | JWT (HttpOnly Cookies) + TOTP 2FA |
| KI | Claude claude-opus-4-6 / Sonnet 4.6 (Anthropic) |
| Payments | Stripe (Subscriptions) |
| Storage | Supabase Storage (EU Frankfurt) |
| Cache | Redis via Upstash |
| Email | Resend |
| Monitoring | Prometheus + Grafana |
| CI/CD | GitHub Actions + Vercel |

---

## Abonnement-Pläne

| Plan | Preis | Bewertungen/Mo | Besonderheiten |
|------|-------|----------------|----------------|
| **Free** | 0 € | 10 | 24h Dateispeicherung |
| **Basic** | 7,99 €/Mo | 20 | Schnellere KI, PDF-Export |
| **Pro** | 12,99 €/Mo | 40 | + KI-Assistent, Statistiken |
| **Max Pro** | 19,99 €/Mo | 80 | + Höchste Priorität, Beta-Features |

7 Tage kostenlos testen · Jährliche Zahlung spart 20%

---

## Projekt-Struktur

```
teachai/
├── apps/web/                    # Next.js 14 App
│   ├── app/(marketing)/         # Öffentliche Seiten
│   ├── app/(auth)/              # Login, Register, 2FA
│   ├── app/(app)/               # Geschützte App-Seiten
│   ├── app/(admin)/             # Admin-Panel
│   ├── app/api/                 # 54 API-Routen
│   ├── components/              # 31 React-Komponenten
│   ├── lib/                     # 27 Lib-Module
│   └── __tests__/               # 60+ Unit/Integration Tests
├── packages/
│   ├── database/prisma/         # 16-Tabellen-Schema mit Indizes
│   └── types/                   # PLAN_CONFIGS, AuthUser, ApiResponse
├── infrastructure/
│   ├── docker/                  # Multi-Stage Dockerfile + Compose
│   ├── nginx/                   # SSL, Rate Limiting, SSE-Support
│   ├── monitoring/              # Prometheus + Grafana + Alerts
│   └── backup/                  # Automatisches DB-Backup
└── docs/                        # Vollständige Dokumentation
```

---

## Befehle

```bash
npm run dev              # Entwicklungsserver starten
npm run build            # Production Build
npm run test             # Tests ausführen
npm run type-check       # TypeScript prüfen
npm run lint             # ESLint
npm run db:migrate       # DB-Migration (Entwicklung)
npm run db:migrate:prod  # DB-Migration (Produktion)
npm run db:seed          # Demo-Daten laden
npm run db:studio        # Prisma Studio öffnen
```

---

## Deployment

### Vercel (empfohlen)
```bash
cd apps/web && vercel --prod
```

### Docker
```bash
cd infrastructure/docker
docker compose -f docker-compose.production.yml up -d --build
```

📖 [Vollständige Deployment-Anleitung →](./docs/DEPLOYMENT.md)

---

## Dokumentation

| Dokument | Beschreibung |
|---------|-------------|
| [DEPLOYMENT.md](./docs/DEPLOYMENT.md) | Vercel, Docker, Stripe-Setup |
| [TECHNICAL.md](./docs/TECHNICAL.md) | Architektur, API, Datenbank |
| [USER_GUIDE.md](./docs/USER_GUIDE.md) | Benutzerhandbuch für Lehrkräfte |
| [ADMIN_GUIDE.md](./docs/ADMIN_GUIDE.md) | Administratorhandbuch |
| [RELEASE_NOTES_v1.0.0.md](./docs/RELEASE_NOTES_v1.0.0.md) | Release Notes |
| [ABSCHLUSSBERICHT.md](./docs/ABSCHLUSSBERICHT.md) | Technischer Abschlussbericht |
| [enterprise/STRATEGY_V2.md](./docs/enterprise/STRATEGY_V2.md) | Enterprise-Strategie v2.0 |
| [API (Swagger)](https://teachai.de/api/swagger?format=ui) | Interaktive API-Dokumentation |

---

## Sicherheit

- bcrypt-12 Passwort-Hashing
- JWT HttpOnly Cookies (15min/30d)
- TOTP 2FA (RFC 6238) mit Backup-Codes
- Account-Lockout (5 Versuche → 15 Min.)
- Rate Limiting (Auth/API/Upload)
- Magic-Byte-Datei-Validierung
- CSP, HSTS, X-Frame-Options
- Vollständiges Audit-Logging (15 Event-Typen)
- Prisma Prepared Statements (kein SQL-Injection-Risiko)

---

## Tests

```bash
npm run test             # Alle Tests (60+ Tests)
npm run test:coverage    # Mit Coverage-Report
```

Test-Suites: Note-Berechnung · Prompt-Builder · Sicherheit · Upload-Validierung · Integration

---

## Support

| Kanal | Details |
|-------|---------|
| E-Mail | support@teachai.de |
| Datenschutz | datenschutz@teachai.de |
| Status | status.teachai.de |
| Docs | teachai.de/docs |

---

<div align="center">

**© 2024 TeacherAI GmbH · Hamburg · Alle Rechte vorbehalten**

[Impressum](https://teachai.de/impressum) · [Datenschutz](https://teachai.de/datenschutz) · [Nutzungsbedingungen](https://teachai.de/nutzungsbedingungen)

</div>
