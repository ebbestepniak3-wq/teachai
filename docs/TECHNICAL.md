# TeacherAI – Technische Dokumentation

> Version 1.0 · Stand: 2024 · Intern · DSGVO-konform

---

## Inhaltsverzeichnis

1. [Architekturübersicht](#architektur)
2. [Installation & Entwicklung](#installation)
3. [Deployment (Produktion)](#deployment)
4. [Datenbank](#datenbank)
5. [API-Dokumentation](#api)
6. [Stripe-Integration](#stripe)
7. [Claude API (KI)](#claude-api)
8. [Wartung & Monitoring](#wartung)
9. [Backup & Recovery](#backup)
10. [Updates & Migrationen](#updates)
11. [Sicherheit](#sicherheit)
12. [DSGVO-Compliance](#dsgvo)

---

## 1. Architekturübersicht {#architektur}

```
┌─────────────────────────────────────────────────────────────┐
│                    NUTZER (Browser / App)                    │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTPS
┌────────────────────────▼────────────────────────────────────┐
│              NGINX (SSL-Termination, Rate Limiting)          │
│              Cloudflare CDN + DDoS-Schutz                    │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────┐
│              NEXT.JS 14 (App Router)                         │
│              Vercel / Docker (EU, Frankfurt)                  │
│                                                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │   Server    │  │   API       │  │   Middleware         │  │
│  │ Components  │  │  Routes     │  │ (Auth, Rate Limit)   │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└──────────┬───────────────────────────────────────────────────┘
           │
    ┌──────┼──────────────────────┐
    │      │                      │
┌───▼──┐ ┌─▼──────────┐ ┌────────▼─────────┐
│ DB   │ │  Supabase  │ │   Anthropic      │
│ PG   │ │  Storage   │ │   Claude API     │
│      │ │            │ │                  │
└──────┘ └────────────┘ └──────────────────┘
    │
┌───▼──────────────┐
│    Stripe API    │
│  (Zahlungen)     │
└──────────────────┘
```

### Tech-Stack

| Layer | Technologie | Version |
|-------|------------|---------|
| Framework | Next.js | 14.x |
| Sprache | TypeScript | 5.x |
| UI | React + Tailwind CSS | 18.x / 3.x |
| Datenbank | PostgreSQL | 16 |
| ORM | Prisma | 5.x |
| Auth | JWT (HttpOnly Cookies) | jose 5.x |
| KI | Claude API (Anthropic) | claude-opus-4-6 / sonnet-4-6 |
| Payments | Stripe | 2024-06-20 |
| Storage | Supabase Storage | 2.x |
| Cache | Redis (Upstash) | 7.x |
| OCR | Claude Vision + pdf-parse | – |
| Email | Resend | – |
| PDF | Puppeteer | 23.x |

---

## 2. Installation & Entwicklung {#installation}

### Voraussetzungen

```bash
node --version  # >= 20.0.0
npm --version   # >= 10.0.0
git --version
# PostgreSQL >= 16 (lokal oder via Docker)
```

### Repository klonen

```bash
git clone https://github.com/yourorg/teachai.git
cd teachai
```

### Abhängigkeiten installieren

```bash
npm install
```

### Umgebungsvariablen konfigurieren

```bash
cp apps/web/.env.example apps/web/.env.local
# Datei mit eigenen Werten befüllen (siehe Abschnitt 6 für Stripe)
```

**Mindest-Konfiguration für Entwicklung:**
```env
DATABASE_URL=postgresql://teachai:pass@localhost:5432/teachai
DIRECT_URL=postgresql://teachai:pass@localhost:5432/teachai
JWT_SECRET=min-32-zeichen-zufallsstring-hier
JWT_REFRESH_SECRET=anderer-min-32-zeichen-string
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Datenbank einrichten

```bash
# Docker starten (PostgreSQL + Redis)
docker compose -f infrastructure/docker/docker-compose.yml --profile dev up -d

# Prisma Schema anwenden
npm run db:migrate

# Testdaten laden
npm run db:seed
```

### Entwicklungsserver starten

```bash
npm run dev
# → http://localhost:3000
```

### Tests ausführen

```bash
npm run test           # alle Tests
npm run test:watch     # Watch-Modus
npm run test:coverage  # Coverage-Report
```

---

## 3. Deployment (Produktion) {#deployment}

### Option A: Vercel (empfohlen)

```bash
# 1. Vercel CLI installieren
npm i -g vercel

# 2. Deployen
cd apps/web
vercel --prod

# 3. Umgebungsvariablen im Vercel-Dashboard setzen
# (alle aus .env.example)
```

**Vercel-spezifische Einstellungen:**
- Build Command: `cd ../.. && npm run build`
- Output Directory: `.next`
- Root Directory: `apps/web`
- Node.js: 20.x

### Option B: Docker (eigener Server)

```bash
# 1. Production-Image bauen
docker build -f infrastructure/docker/Dockerfile -t teachai:latest .

# 2. Production-Stack starten
cd infrastructure/docker
docker compose -f docker-compose.production.yml up -d

# 3. Datenbank migrieren
docker exec teachai_web npx prisma migrate deploy
```

### Umgebungsvariablen Produktion

Alle Variablen aus `.env.example` + diese:

```env
NODE_ENV=production
CRON_SECRET=<random-secret-for-cron-jobs>
STRIPE_WEBHOOK_SECRET=<aus-stripe-dashboard>
POSTGRES_PASSWORD=<starkes-passwort>
REDIS_PASSWORD=<starkes-passwort>
```

### CI/CD (GitHub Actions)

Pipeline (`.github/workflows/ci.yml`):
1. **Lint** → `npm run lint`
2. **Type Check** → `npm run type-check`
3. **Tests** → `npm run test`
4. **Build** → `npm run build`
5. **Deploy** → Vercel (main branch only)

**Secrets in GitHub:**
- `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`
- `DATABASE_URL`, `JWT_SECRET`, `ANTHROPIC_API_KEY`, etc.

---

## 4. Datenbank {#datenbank}

### Schema-Übersicht

| Tabelle | Beschreibung |
|---------|-------------|
| `users` | Nutzerdaten, Rollen, 2FA |
| `sessions` | JWT-Sessions |
| `subscriptions` | Stripe-Abonnements |
| `invoices` | Rechnungen |
| `uploads` | Hochgeladene Dateien |
| `grading_jobs` | KI-Bewertungsaufträge |
| `grading_reports` | KI-Bewertungsergebnisse |
| `assistant_conversations` | KI-Chat-Verlauf |
| `support_tickets` | Support-Tickets |
| `notifications` | Nutzer-Benachrichtigungen |
| `usage_logs` | Nutzungsprotokoll |
| `system_logs` | System- und Audit-Logs |

### Prisma-Befehle

```bash
# Schema ändern → Migration erstellen
npx prisma migrate dev --name beschreibung

# Produktion migrieren
npx prisma migrate deploy

# Schema visualisieren
npx prisma studio

# Prisma Client neu generieren
npx prisma generate
```

### Performance-Indizes

```sql
-- Empfohlene Indizes für 100k+ User
CREATE INDEX CONCURRENTLY idx_grading_jobs_user_status ON grading_jobs(user_id, status);
CREATE INDEX CONCURRENTLY idx_grading_jobs_created ON grading_jobs(created_at DESC);
CREATE INDEX CONCURRENTLY idx_uploads_user_status ON uploads(user_id, status);
CREATE INDEX CONCURRENTLY idx_notifications_user_unread ON notifications(user_id, is_read);
CREATE INDEX CONCURRENTLY idx_system_logs_created ON system_logs(created_at DESC);
CREATE INDEX CONCURRENTLY idx_sessions_token ON sessions(token);
CREATE INDEX CONCURRENTLY idx_sessions_user ON sessions(user_id, expires_at);
```

---

## 5. API-Dokumentation {#api}

### Authentifizierung

Alle geschützten Endpunkte erfordern einen gültigen `access_token` Cookie.

```
Cookie: access_token=<JWT>
```

### Endpunkte

#### Auth
| Methode | Pfad | Beschreibung |
|---------|------|-------------|
| POST | `/api/auth/register` | Registrierung |
| POST | `/api/auth/login` | Anmeldung |
| POST | `/api/auth/logout` | Abmeldung |
| GET | `/api/auth/me` | Aktueller Nutzer |
| POST | `/api/auth/refresh` | Token erneuern |
| POST | `/api/auth/forgot-password` | Passwort-Reset anfordern |
| POST | `/api/auth/reset-password` | Neues Passwort setzen |
| GET/POST | `/api/auth/verify-email` | E-Mail bestätigen |
| POST | `/api/auth/2fa/setup` | 2FA einrichten |
| POST | `/api/auth/2fa/verify` | 2FA aktivieren |
| POST | `/api/auth/2fa/disable` | 2FA deaktivieren |

#### Upload
| Methode | Pfad | Beschreibung |
|---------|------|-------------|
| POST | `/api/upload` | Datei hochladen |
| GET | `/api/upload` | Eigene Uploads |
| GET | `/api/upload/status` | Upload-Status |
| DELETE | `/api/upload/delete` | Datei löschen |
| GET/POST | `/api/upload/ocr` | OCR-Text |

#### Bewertung
| Methode | Pfad | Beschreibung |
|---------|------|-------------|
| POST | `/api/grading/prepare` | Job erstellen |
| POST | `/api/grading/execute` | KI starten |
| GET | `/api/grading/result` | Ergebnis abrufen |
| PATCH | `/api/grading/adjust` | Anpassen |
| GET | `/api/grading/pdf` | PDF laden |

#### Stripe
| Methode | Pfad | Beschreibung |
|---------|------|-------------|
| POST | `/api/stripe/checkout` | Checkout-Session |
| POST | `/api/stripe/portal` | Billing-Portal |
| POST | `/api/stripe/webhook` | Webhook (Stripe → TeacherAI) |
| GET | `/api/stripe/prices` | Preise |
| POST | `/api/stripe/cancel` | Kündigen/Fortsetzen |

#### KI-Assistent
| Methode | Pfad | Beschreibung |
|---------|------|-------------|
| POST | `/api/assistant/chat` | Nachricht senden (SSE) |
| GET | `/api/assistant/conversations` | Gespräche |
| PATCH | `/api/assistant/conversations` | Umbenennen |
| DELETE | `/api/assistant/conversations` | Löschen |
| GET | `/api/assistant/export` | Export (MD/PDF) |

### Response-Format

```json
{
  "success": true,
  "data": { ... }
}
// oder
{
  "success": false,
  "error": "Fehlermeldung"
}
```

---

## 6. Stripe-Integration {#stripe}

### Einrichtung

1. **Stripe-Account** unter [stripe.com](https://stripe.com) erstellen
2. **Products & Prices** im Dashboard erstellen:
   - BASIC Monatlich: `price_...`
   - BASIC Jährlich: `price_...`
   - PRO Monatlich: `price_...`
   - PRO Jährlich: `price_...`
   - MAX_PRO Monatlich: `price_...`
   - MAX_PRO Jährlich: `price_...`

3. **Webhook-Endpunkt** konfigurieren:
   - URL: `https://teachai.de/api/stripe/webhook`
   - Events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.paid`, `invoice.payment_failed`, `customer.subscription.trial_will_end`

4. **Umgebungsvariablen setzen:**
```env
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_BASIC=price_...
STRIPE_PRICE_PRO=price_...
STRIPE_PRICE_MAX_PRO=price_...
STRIPE_PRICE_BASIC_YEARLY=price_...
STRIPE_PRICE_PRO_YEARLY=price_...
STRIPE_PRICE_MAX_PRO_YEARLY=price_...
```

### Testmodus

```env
STRIPE_SECRET_KEY=sk_test_...
```

Testkarten: `4242 4242 4242 4242` (Visa), `4000 0025 0000 3155` (3DS), `4000 0000 0000 9995` (Ablehnung)

---

## 7. Claude API {#claude-api}

### Modelle

| Funktion | Modell | Begründung |
|----------|--------|-----------|
| KI-Bewertung | `claude-opus-4-6` | Höchste Qualität für Bewertungen |
| KI-Assistent | `claude-sonnet-4-6` | Gutes Preis-Leistungs-Verhältnis |
| OCR | `claude-opus-4-6` | Beste Bildverarbeitung |

### Kostenschätzung

| Aktion | Ø Tokens | Ø Kosten |
|--------|---------|---------|
| Bewertung (2-seitig) | ~3.000 | ~0,05 € |
| OCR (A4-Scan) | ~1.500 | ~0,02 € |
| Assistent-Nachricht | ~800 | <0,01 € |

### Rate Limits

- 1.000 Anfragen/Minute (Tier 2)
- Retry-Logik: 3 Versuche mit 5s/15s/60s Delay
- Timeout: 120 Sekunden

---

## 8. Wartung & Monitoring {#wartung}

### Health-Check Endpunkt

```
GET /api/health
→ { "status": "ok", "db": "ok", "timestamp": "..." }
```

### Tägliche Wartungsaufgaben (automatisch)

| Cron | Endpunkt | Beschreibung |
|------|---------|-------------|
| `0 2 * * *` | `/api/cron/cleanup-uploads` | Abgelaufene Dateien löschen |

### Logs

**Entwicklung:** Farbige Console-Ausgabe
**Produktion:** JSON-Format → an ELK/Grafana weiterleiten

```bash
# Docker-Logs
docker logs teachai_web -f --tail=100

# PostgreSQL-Logs
docker exec teachai_postgres tail -f /var/log/postgresql/postgresql.log
```

### Monitoring (empfohlen)

- **Uptime Kuma** – Service-Monitoring
- **Grafana + Prometheus** – Metriken
- **Sentry** – Error-Tracking (Next.js SDK)
- **Datadog** oder **New Relic** – APM

---

## 9. Backup & Recovery {#backup}

### Automatisches Backup

```bash
# Manuelles Backup ausführen
docker compose -f infrastructure/docker/docker-compose.production.yml --profile backup run backup

# Cron (täglich 03:00 Uhr)
0 3 * * * docker compose ... run backup
```

### Backup-Inhalte

- **PostgreSQL** – vollständiger Dump (komprimiert, verschlüsselt)
- **S3-Upload** – in konfiguriertem Bucket mit 30-Tage-Retention
- **Supabase Storage** – wird von Supabase selbst gesichert

### Recovery

```bash
# Aus Backup wiederherstellen
gunzip -c backup.sql.gz | psql -h localhost -U teachai -d teachai

# Oder via Docker
docker exec -i teachai_postgres psql -U teachai teachai < backup.sql
```

---

## 10. Updates & Migrationen {#updates}

### Update-Prozess

```bash
# 1. Backup erstellen
docker compose --profile backup run backup

# 2. Code aktualisieren
git pull origin main

# 3. Dependencies installieren
npm ci

# 4. Prisma-Migrationen anwenden
npm run db:migrate

# 5. Build
npm run build

# 6. Neustart
docker compose up -d --build web
```

### Zero-Downtime-Deployment (Vercel)

Vercel führt automatisch Rolling Deployments durch. Datenbankmigrationen:

```bash
# Vor dem Deploy
npx prisma migrate deploy
```

---

## 11. Sicherheit {#sicherheit}

### Implementierte Maßnahmen

| Bereich | Maßnahme |
|---------|---------|
| Auth | JWT HttpOnly Cookies, bcrypt-12, Account-Lockout |
| 2FA | TOTP (RFC 6238), Backup-Codes |
| API | Rate Limiting (Nginx + In-Memory), Input-Validierung (Zod) |
| Dateien | Magic-Byte-Check, MIME-Validierung, Script-Erkennung |
| DB | Prepared Statements (Prisma), kein SQL-Injection-Risiko |
| Headers | HSTS, CSP, X-Frame-Options, CORS |
| Logs | Alle Auth-Events, Admin-Aktionen, Zahlungen |
| CORS | Nur eigene Domain erlaubt |

### Sicherheits-Checkliste (Produktion)

- [ ] Alle Env-Variablen gesetzt
- [ ] HTTPS-Zertifikat aktiv
- [ ] Stripe-Webhook-Secret konfiguriert
- [ ] PostgreSQL-Passwort gesetzt
- [ ] Redis-Passwort gesetzt
- [ ] Rate-Limiting aktiv
- [ ] Backups konfiguriert
- [ ] Monitoring aktiv
- [ ] Admin-Passwort geändert
- [ ] E-Mail-Verifikation aktiv

---

## 12. DSGVO-Compliance {#dsgvo}

### Rechtsgrundlagen

- **Vertragserfüllung (Art. 6 Abs. 1 b)** – Account, Bewertungen
- **Berechtigte Interessen (Art. 6 Abs. 1 f)** – Sicherheits-Logs
- **Einwilligung (Art. 6 Abs. 1 a)** – Newsletter

### Betroffenenrechte

| Recht | Implementierung |
|-------|----------------|
| Auskunft (Art. 15) | `/api/auth/deactivate` – Daten-Export |
| Löschung (Art. 17) | Konto löschen → kaskadiert alles |
| Portabilität (Art. 20) | JSON-Export im Datenschutz-Bereich |
| Widerspruch (Art. 21) | Newsletter-Abmeldung |

### Datenlöschung

- **Free-Plan:** Uploads nach 24h automatisch gelöscht
- **Kontoschließung:** Alle Daten sofort gelöscht (CASCADE)
- **System-Logs:** 90 Tage Retention
- **Login-History:** 90 Tage Retention

### Auftragsverarbeitungsvertrag (AVV)

Relevante Auftragsverarbeiter:
- Anthropic (KI-Verarbeitung) → DPA vorhanden
- Supabase (Storage, EU-Frankfurt) → DPA vorhanden
- Stripe (Zahlungen) → DPA vorhanden

---

## Kontakt & Support

- **E-Mail:** admin@teachai.de
- **GitHub:** github.com/yourorg/teachai
- **Status:** status.teachai.de

*Letzte Aktualisierung: 2024*
