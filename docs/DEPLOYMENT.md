# TeacherAI – Deployment-Anleitung v1.0.0

## Inhaltsverzeichnis

1. [Anforderungen](#anforderungen)
2. [Vercel (empfohlen)](#vercel)
3. [Docker (eigener Server)](#docker)
4. [Datenbank migrieren](#datenbank)
5. [Stripe konfigurieren](#stripe)
6. [Monitoring aktivieren](#monitoring)

---

## 1. Anforderungen {#anforderungen}

**Node.js:** >= 20.0.0  
**npm:** >= 10.0.0  
**PostgreSQL:** >= 16  
**Redis:** >= 7 (optional, aber empfohlen)

**Externe Services (alle Pflicht für Produktion):**
- Anthropic API Key (claude.ai)
- Supabase Projekt (EU Frankfurt)
- Stripe Account mit Produkten
- Resend Account (E-Mail)

---

## 2. Vercel (empfohlen) {#vercel}

### Schritt 1: Repository verbinden

```bash
# Vercel CLI installieren
npm i -g vercel

# Im Projektverzeichnis
cd apps/web
vercel
```

### Schritt 2: Umgebungsvariablen in Vercel Dashboard setzen

Alle Variablen aus `.env.example` im Vercel Dashboard unter:  
`Settings → Environment Variables`

**Wichtigste Variablen:**
```
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...
JWT_SECRET=<min-32-zeichen>
JWT_REFRESH_SECRET=<unterschiedlich von JWT_SECRET>
ANTHROPIC_API_KEY=sk-ant-...
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_APP_URL=https://teachai.de
RESEND_API_KEY=re_...
CRON_SECRET=<zufälliger-string>
```

### Schritt 3: Datenbank migrieren

```bash
# Vor dem ersten Deploy
DATABASE_URL=postgresql://... npx prisma migrate deploy --schema=packages/database/prisma/schema.prisma
DATABASE_URL=postgresql://... npx prisma db seed --schema=packages/database/prisma/schema.prisma
```

### Schritt 4: Stripe Webhook konfigurieren

1. Stripe Dashboard → Webhooks → Endpoint hinzufügen
2. URL: `https://teachai.de/api/stripe/webhook`
3. Events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.paid`, `invoice.payment_failed`, `customer.subscription.trial_will_end`
4. Signing Secret → in `STRIPE_WEBHOOK_SECRET` setzen

### Schritt 5: Produktiv-Deploy

```bash
vercel --prod
```

---

## 3. Docker (eigener Server) {#docker}

### Voraussetzungen
- Linux Server (Ubuntu 22.04+)
- Docker >= 24.0
- Docker Compose >= 2.0
- Min. 4 GB RAM, 2 vCPU
- SSL-Zertifikat für Domain

### Schritt 1: Repository klonen

```bash
git clone https://github.com/yourorg/teachai.git
cd teachai
```

### Schritt 2: Umgebungsvariablen

```bash
cp apps/web/.env.example apps/web/.env.production
# Datei bearbeiten und alle Werte setzen
nano apps/web/.env.production
```

### Schritt 3: SSL-Zertifikat

```bash
# Let's Encrypt (empfohlen)
sudo certbot certonly --standalone -d teachai.de -d www.teachai.de
sudo cp /etc/letsencrypt/live/teachai.de/fullchain.pem /etc/ssl/teachai.crt
sudo cp /etc/letsencrypt/live/teachai.de/privkey.pem /etc/ssl/private/teachai.key
```

### Schritt 4: Build und Start

```bash
cd infrastructure/docker

# Production Stack starten
POSTGRES_PASSWORD=<sicheres-pw> \
REDIS_PASSWORD=<sicheres-pw> \
docker compose -f docker-compose.production.yml up -d --build

# Datenbank migrieren
docker exec teachai_web sh -c "cd /app && npx prisma migrate deploy"

# Seed (nur beim ersten Start)
docker exec teachai_web sh -c "cd /app && npx prisma db seed"
```

### Schritt 5: Cron-Jobs einrichten

```bash
# Cron für tägliche Bereinigung (02:00 Uhr)
echo "0 2 * * * curl -s -H 'Authorization: Bearer <CRON_SECRET>' https://teachai.de/api/cron/cleanup-uploads" | crontab -

# Cron für tägliche DB-Backups (03:00 Uhr)
echo "0 3 * * * docker compose -f /opt/teachai/infrastructure/docker/docker-compose.production.yml --profile backup run --rm backup" | crontab -
```

---

## 4. Datenbank {#datenbank}

### Migrationsbefehle

```bash
# Neue Migration erstellen (Entwicklung)
npm run db:migrate

# Migrations anwenden (Produktion - KEIN automatisches Erstellen!)
npm run db:migrate:prod

# Schema pushen ohne Migration (nur Entwicklung!)
npm run db:push

# Prisma Studio öffnen
npm run db:studio
```

### Backup

```bash
# Manuelles Backup
pg_dump -h localhost -U teachai -d teachai --no-owner | gzip > backup_$(date +%Y%m%d).sql.gz

# Backup wiederherstellen
gunzip -c backup_20241201.sql.gz | psql -h localhost -U teachai -d teachai
```

---

## 5. Stripe konfigurieren {#stripe}

### Produkte anlegen

```bash
# 1. Produkt erstellen
stripe products create --name="TeacherAI Subscription"

# 2. Preise erstellen
# Basic Monatlich
stripe prices create --product=prod_xxx --currency=eur --unit-amount=799 --recurring[interval]=month

# Basic Jährlich (20% Rabatt)
stripe prices create --product=prod_xxx --currency=eur --unit-amount=7670 --recurring[interval]=year

# Pro Monatlich
stripe prices create --product=prod_xxx --currency=eur --unit-amount=1299 --recurring[interval]=month

# Pro Jährlich
stripe prices create --product=prod_xxx --currency=eur --unit-amount=12470 --recurring[interval]=year

# Max Pro Monatlich
stripe prices create --product=prod_xxx --currency=eur --unit-amount=1999 --recurring[interval]=month

# Max Pro Jährlich
stripe prices create --product=prod_xxx --currency=eur --unit-amount=19190 --recurring[interval]=year
```

### Environment Variablen setzen

```env
STRIPE_PRICE_BASIC=price_xxx
STRIPE_PRICE_PRO=price_xxx
STRIPE_PRICE_MAX_PRO=price_xxx
STRIPE_PRICE_BASIC_YEARLY=price_xxx
STRIPE_PRICE_PRO_YEARLY=price_xxx
STRIPE_PRICE_MAX_PRO_YEARLY=price_xxx
```

---

## 6. Monitoring {#monitoring}

### Prometheus + Grafana

```bash
cd infrastructure/monitoring
GRAFANA_PASSWORD=<sicheres-pw> docker compose -f docker-compose.monitoring.yml up -d
```

Grafana: http://localhost:3001 (admin / `GRAFANA_PASSWORD`)  
Prometheus: http://localhost:9090

### Health Check

```bash
# Sollte {"status":"ok"} zurückgeben
curl https://teachai.de/api/health
```

### Alerts testen

```bash
# Alert Manager
curl http://localhost:9093/api/v2/alerts
```
