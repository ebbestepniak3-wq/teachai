# Release Notes – TeacherAI v1.0.0

**Datum:** 01. Dezember 2024  
**Status:** General Availability (GA)  
**Typ:** Initial Release

---

## 🎉 Willkommen bei TeacherAI 1.0.0

Wir freuen uns, TeacherAI Version 1.0.0 offiziell zu veröffentlichen – die KI-gestützte Korrekturplattform für Lehrkräfte in Deutschland.

---

## Neue Funktionen

### 🤖 KI-Bewertungssystem
- Intelligente Bewertung mit **Claude claude-opus-4-6** (Anthropic)
- Unterstützung für **10 Fächer**: Deutsch, Mathematik, Englisch, Französisch, Latein, Physik, Chemie, Biologie, Geschichte, Geographie
- **Bundesland-spezifische Notenschlüssel** für alle 16 Bundesländer
- **Bewertungsstrenge** konfigurierbar (Kulant / Ausgewogen / Streng)
- Teilpunkte, alternative Lösungswege, Fehleranalyse
- Plausibilitätsprüfung und Unsicherheitsmarkierung
- Lehreranpassungen mit vollständiger Protokollierung

### 📄 Upload & OCR
- Unterstützte Formate: **PDF, DOCX, ODT, JPG, PNG, WebP, HEIC, TIFF**
- **Handschrifterkennung** via Claude Vision
- **Mehrseitige Dokumente** werden vollständig verarbeitet
- Automatische Bildoptimierung (Kontrast, Schärfe, Rotation)
- Magic-Byte-Sicherheitsvalidierung gegen Upload-Angriffe

### 💬 KI-Assistent (Pro+)
- **Streaming-Chat** mit Claude Sonnet 4.6
- Kontext-bewusst (Fach, Klasse, Bundesland)
- Unterstützt: Klausuren, Arbeitsblätter, Elternbriefe, Zeugnisformulierungen, Unterrichtsplanung
- Gespräch-Verwaltung: erstellen, umbenennen, löschen, suchen
- Export als **Markdown und PDF**

### 💳 Stripe-Integration
- **4 Abonnement-Pläne**: Free, Basic (7,99 €), Pro (12,99 €), Max Pro (19,99 €)
- **Zahlungsmethoden**: Kreditkarte, SEPA, Apple Pay, Google Pay
- Jährliche Zahlung mit **20% Rabatt**
- **7 Tage kostenlose Testphase** für alle bezahlten Pläne
- Gutschein-/Rabattcodes
- Automatische Rechnungen mit PDF-Download
- Vollständige Webhook-Verarbeitung

### 🔐 Authentifizierung & Sicherheit
- **2-Faktor-Authentifizierung** (TOTP RFC 6238)
- Account-Lockout nach 5 Fehlversuchen (15 Minuten)
- **JWT HttpOnly Cookies** (15min Access, 30d Refresh)
- Session-Management mit Geräteübersicht
- Login-Historie mit IP und User-Agent
- bcrypt-12 Passwort-Hashing

### 🛡️ Admin-Panel
- Live Analytics mit Echtzeit-KPIs
- Nutzerverwaltung (bearbeiten, sperren, löschen)
- KI-Kosten-Monitoring pro Bewertung
- Feature Flags mit Rollout-Prozent
- Wartungsmodus
- Prometheus-Metriken und Grafana-Integration
- 5 Alert-Rules für kritische Ereignisse

### 🇩🇪 DSGVO-Konformität
- Alle Daten auf **EU-Servern** (Frankfurt)
- Kein Training mit Schülerdaten
- Datenexport (Art. 20 DSGVO)
- Konto-Löschung mit Cascade-Delete (Art. 17)
- Vollständige Datenschutzerklärung, Impressum, Nutzungsbedingungen
- AVVs mit Anthropic, Supabase, Stripe, Resend

---

## Technische Highlights

- **Next.js 14** App Router mit React Server Components
- **TypeScript** 5.x (100% typisiert, kein any)
- **Prisma** ORM mit PostgreSQL 16 (14 Tabellen, optimierte Indizes)
- **Docker** Multi-Stage Build mit Health Checks
- **GitHub Actions** CI/CD (Lint → Tests → Build → Deploy)
- **60+ Tests** in 4 Test-Suites

---

## Breaking Changes

Keine – dies ist der erste Release.

---

## Bekannte Einschränkungen

1. **Batch-Grading** (mehrere Dateien gleichzeitig) nicht verfügbar – geplant für v1.1
2. **Push-Notifications** vorbereitet aber nicht aktiv – geplant für v1.2
3. **Mobile Apps** (iOS/Android) in Planung – geplant für v1.1
4. **OAuth** (Google/Microsoft Login) – Infrastruktur vorhanden, Konfiguration erforderlich

---

## Geplante Version 1.1 (Q2 2025)

- Batch-Grading (Klassensatz in einem Durchgang)
- Mobile App (iOS Beta)
- Österreich und Schweiz Support
- Moodle LTI 1.3 Integration
- Redis Job Queue (ersetzt In-Memory)

---

## Kontakt & Support

- **E-Mail:** support@teachai.de
- **Dokumentation:** teachai.de/docs
- **Status:** status.teachai.de
