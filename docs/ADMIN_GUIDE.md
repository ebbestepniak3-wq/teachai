# TeacherAI – Administratorhandbuch

**Version 1.0.0** | Für System-Administratoren

---

## Zugang zum Admin-Panel

**URL:** `https://teachai.de/admin`  
**Voraussetzung:** Nutzer mit Rolle `ADMIN`

**Demo-Admin (Entwicklung):**
- E-Mail: `admin@teachai.de`
- Passwort: `Admin1234!`
- ⚠️ In Produktion sofort ändern!

---

## Nutzerverwaltung

### Nutzer suchen
Admin → Nutzerverwaltung → Suchfeld

### Nutzer bearbeiten
- Name, E-Mail, Schulform anpassen
- Rolle ändern: TEACHER / ADMIN / SUPPORT
- Plan direkt setzen (ohne Stripe-Checkout)
- Konto sperren / entsperren

### API-Route
```
GET    /api/admin/users?search=email@example.com
PATCH  /api/admin/users/:id  { role, isActive, plan }
DELETE /api/admin/users/:id
```

---

## Feature Flags

Feature Flags steuern, welche Funktionen für welche Nutzer aktiv sind.

### Verwaltung
Admin → Feature Flags → Toggle aktivieren/deaktivieren

### Verfügbare Flags

| Flag | Beschreibung | Standard |
|------|-------------|---------|
| `ai_assistant` | KI-Assistent (PRO+) | ✅ Aktiv |
| `batch_grading` | Stapelverarbeitung | ❌ Inaktiv |
| `advanced_analytics` | Erweiterte Statistiken | ❌ Inaktiv |
| `api_access` | API-Schlüssel (MAX_PRO) | ❌ Inaktiv |
| `maintenance_mode` | Wartungsmodus | ❌ Inaktiv |
| `new_onboarding` | Neues Onboarding | 50% Rollout |

---

## Wartungsmodus

**Aktivieren:** Admin → Wartungsmodus → Aktivieren  
**Wirkung:** Alle Nutzer außer ADMIN sehen eine Wartungsseite  
**Admin-Zugang:** Bleibt vollständig aktiv  
**Stripe-Webhooks:** Weiterhin aktiv (/api/stripe/webhook)

---

## Analytics

Admin → Live Analytics zeigt:
- Nutzer gesamt / neu heute / neu letzte 7 Tage
- Bewertungen gesamt / heute
- MRR und ARR-Schätzung
- Aktive Abonnements
- Fehlerrate (letzte 24h)
- Server-RAM-Auslastung
- Service-Status (DB, Claude API, Stripe, Redis, Supabase)
- Häufigste Fächer (letzte 7 Tage)

---

## KI-Monitor

Admin → KI-Monitor zeigt:
- Aktive Bewertungsjobs
- Geschätzte API-Kosten
- Durchschnittlicher Token-Verbrauch
- Fehlerrate
- Alle letzten 20 Jobs mit Status und Note

---

## Gutscheincodes

**Erstellen:** Admin → Gutscheincodes → Neuer Gutschein
```json
{
  "name": "WELCOME20",
  "percentOff": 20,
  "duration": "once",
  "maxRedemptions": 100,
  "code": "WELCOME20"
}
```

**Stripe-Verwaltung:** Alle Codes können auch direkt im Stripe Dashboard verwaltet werden.

---

## System-Protokolle

Admin → Protokolle zeigt:
- Info, Warn, Error Logs
- Login-Failures (inkl. IP)
- Audit-Events (Passwort-Änderungen, Admin-Aktionen, etc.)
- Letzte 500 Einträge

**Retention:** 90 Tage (ältere Logs werden automatisch gelöscht)

---

## DSGVO-Anfragen

Admin → DSGVO-Anfragen (geplant für v1.1)

Aktuell:
1. Nutzer kann Datenexport selbst unter `/settings/privacy` anfordern
2. Löschantrag über `/api/dsgvo` (POST) → Admin erhält Benachrichtigung
3. Admin löscht Konto unter Nutzerverwaltung → DELETE

---

## Monitoring

**Health Check:** `GET /api/health`
```json
{
  "status": "ok",
  "services": {
    "database": { "status": "ok", "latencyMs": 12 },
    "ai": { "status": "configured" },
    "storage": { "status": "configured" },
    "payments": { "status": "configured" }
  }
}
```

**Prometheus Metriken:** `GET /api/metrics`
- Erfordert `Authorization: Bearer <METRICS_TOKEN>`
- Format: Prometheus Text (plain/text)

**Grafana Dashboard:** `http://server:3001`

---

## Backup und Recovery

### Automatisches Backup
```bash
# Täglich 03:00 Uhr via Cron
docker compose --profile backup run backup
```

### Manuelles Backup
```bash
pg_dump -h localhost -U teachai -d teachai --no-owner -Fc > backup_$(date +%Y%m%d_%H%M%S).dump
```

### Recovery
```bash
# Aus pg_dump
pg_restore -h localhost -U teachai -d teachai_restore backup.dump

# Aus SQL
psql -h localhost -U teachai -d teachai < backup.sql
```

---

## Wartungsplan

### Täglich (automatisch)
- 02:00 Uhr: Abgelaufene Free-Plan-Uploads löschen
- 03:00 Uhr: Datenbank-Backup

### Wöchentlich (manuell)
- Logs prüfen (Admin → Protokolle)
- KI-Kosten prüfen (Admin → KI-Monitor)
- Fehlerrate prüfen (Admin → Analytics)

### Monatlich
- Dependencies aktualisieren: `npm audit && npm update`
- Stripe-Rechnungen prüfen
- Backup-Integrität testen

### Bei Bedarf
- Datenbankmigrationen: `npx prisma migrate deploy`
- SSL-Zertifikat erneuern (Let's Encrypt: automatisch alle 90 Tage)
