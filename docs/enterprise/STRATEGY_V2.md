# TeacherAI – Enterprise Product Strategy & Vision 2.0

**Dokument:** CTO/CEO Strategic Vision  
**Version:** 2.0-ENTERPRISE  
**Datum:** 2024  
**Vertraulich:** Intern

---

## EXECUTIVE SUMMARY

TeacherAI ist nicht nur ein Korrektur-Tool. TeacherAI ist die KI-Infrastruktur für das gesamte europäische Bildungswesen. Mit Version 2.0 transformieren wir uns von einem Single-Feature-SaaS zu einer vollständigen KI-Bildungsplattform mit spezialisierten Agenten, Schulverwaltung, Enterprise-Lizenzen und internationaler Expansion.

**Mission:** Jede Lehrkraft in Europa soll mehr Zeit für das Unterrichten und weniger Zeit für administrative Aufgaben haben.

**Vision:** Die AI-first Education Platform für 10 Millionen Lehrkräfte bis 2030.

**Marktgröße:** 
- Deutschland: ~850.000 Lehrkräfte
- DACH: ~1.200.000 Lehrkräfte  
- Europa: ~5.500.000 Lehrkräfte
- Global (Primärmärkte): ~70.000.000 Lehrkräfte
- TAM (Total Addressable Market): 8,4 Milliarden € (europäisch, konservativ)

---

## PHASE 2.0 – FEATURE ROADMAP

### Q1 2025 – Multi-Agent System

**Problem:** Lehrkräfte brauchen mehr als Korrekturhilfe. Jede Aufgabe hat eigene Komplexität.  
**Lösung:** Spezialisierte KI-Agenten mit eigenem Kontext, Toolchain und Ausgabeformat.

### Q2 2025 – Schulversion (B2B)

**Problem:** Einzellizenz-SaaS skaliert nicht auf Schulen. Schulen brauchen Admin, Fachschaften, Datenexport.  
**Lösung:** Multi-Tenant Schulversion mit Schulleiter-Dashboard, Fachkonferenz-Management, Statistiken.

### Q3 2025 – International Expansion

**Problem:** Österreich/Schweiz haben ähnliche Schulsysteme aber andere Notenschlüssel, Lehrpläne.  
**Lösung:** Länderspezifische Konfiguration, lokale Compliance, Mehrsprachigkeit.

### Q4 2025 – Mobile Apps & Offline

**Problem:** Lehrkräfte korrigieren oft ohne stabiles Internet (zu Hause, Ferien).  
**Lösung:** Native iOS/Android Apps mit Offline-OCR und Sync.

---

## KI-AGENTEN SYSTEM (Multi-Agent Architecture)

Jeder Agent ist ein spezialisiertes Claude-Interface mit eigenem System-Prompt, Toolchain, Ausgabeformat und Gedächtnis.

### 1. 📚 Korrektur-Agent (bestehend, verbessert)
**Funktion:** KI-Bewertung mit Teilpunkten, Alternative Lösungswege, Fach-spezifisch  
**Erweiterungen v2.0:**
- Klassenübergreifende Konsistenzprüfung (gleiche Klausur = gleicher Maßstab)
- Direktvergleich mit Musterlösung
- Statistische Ausreißer-Erkennung ("Schüler X ist weit unter seinem Niveau")
- Kommentarvorschläge für individuelle Rückmeldungen

### 2. 📝 Klausuren-Agent
**Funktion:** Vollständige Klausuren und Tests erstellen  
**Features:**
- Lehrplan-Import (KMK-Standards per Bundesland)
- Automatische Schwierigkeitsverteilung (20% leicht, 60% mittel, 20% schwer)
- Aufgabentypen: Multiple Choice, Freitext, Lückentext, Zeichenaufgaben
- Erwartungshorizont automatisch generieren
- Differenzierte Versionen (A-Kurs / B-Kurs, DaZ-Schüler)
- Plagiat-Resistenz: Aufgaben variieren zwischen Klassen

### 3. 📄 Arbeitsblatt-Agent
**Funktion:** Lehr- und Übungsmaterialien erstellen  
**Features:**
- DOCX/PDF-Ausgabe mit Schullogo
- Differenzierungsstufen (★ / ★★ / ★★★)
- Interaktive PDF-Version
- QR-Code mit Lösung für selbstständiges Lernen
- Creative Commons Lizenzierung automatisch wählen

### 4. 🎓 Zeugnis-Agent
**Funktion:** Zeugnisbemerkungen und Formulierungen  
**Features:**
- 200+ Formulierungsvorlagen nach Notenstufe
- Persönlichkeitsbeschreibungen (analytisch, kreativ, sozial...)
- Bundesland-spezifische Formulierungsregeln
- DSGVO-Modus: Nur positive/neutrale Formulierungen
- Batch-Export: Alle Schüler einer Klasse in einem Durchgang
- Feedback: Formulierung zu mündlicher Leistung hinzufügen

### 5. 📧 Elternbrief-Agent
**Funktion:** Professionelle Elternkommunikation  
**Features:**
- Anlässe: Notenrückgang, Lernfortschritt, Veranstaltungen, Elternabend
- Ton-Kalibrierung: sachlich / empathisch / motivierend
- Mehrsprachige Ausgabe (automatisch übersetzen)
- Datenschutz-konform: Keine Schülerdaten außerhalb des Briefs
- Briefkopf-Vorlagen mit Schullogo

### 6. 📊 Notenanalyse-Agent
**Funktion:** Statistische Klassenanalyse  
**Features:**
- Notenverteilung visualisieren (Histogramm, Boxplot)
- Durchschnitt, Median, Standardabweichung
- Trendanalyse über das Schuljahr
- Korrelationen: Anwesenheit ↔ Noten
- Leistungsgruppen automatisch identifizieren
- Export als Excel/PDF für Schulleitung
- Anonymisierter Klassenvergleich (Datenschutz)

### 7. 📅 Unterrichtsplaner-Agent
**Funktion:** Unterrichtsplanung und Jahresplanung  
**Features:**
- Stundenpläne aus Lehrplan ableiten
- Sequenzplanung (Unterrichtsreihen)
- Differenzierungsvorschläge
- Methodenpool mit 50+ Unterrichtsmethoden
- Materialverlinkung (eigene + externe Ressourcen)
- Feiertage und Schulveranstaltungen berücksichtigen
- Vertretungsplanung: Backup-Stunden vorbereiten

### 8. 🤖 Chat-Agent (KI-Assistent, bestehend, verbessert)
**Erweiterungen:**
- Langzeit-Gedächtnis: "Sie haben letztes Mal über Rechtschreibung gesprochen"
- Dokument-Upload im Chat (Schülerarbeit direkt einwerfen)
- Bildanalyse: Foto einer Tafel → Unterrichtsplanung
- Sprachassistent: Spracheingabe für Lehrkräfte unterwegs

### 9. 📈 Schulanalyse-Agent (NEU – B2B)
**Funktion:** Schulweite Analyse für Schulleitung  
**Features:**
- Fachschaftsvergleiche (anonymisiert)
- Trend-Analyse: Entwicklung über 3-5 Jahre
- Benchmark mit ähnlichen Schulen (Schulform, Größe, Bundesland)
- Handlungsempfehlungen ("Fach X zeigt Verbesserungspotenzial")
- Bericht für Schulaufsicht generieren
- Inklusions-KPI tracking

### 10. 📖 Lehrplan-Agent (NEU)
**Funktion:** Lehrplan-Compliance und -Navigation  
**Features:**
- Alle 16 Bundesland-Lehrpläne importiert und durchsuchbar
- Aufgaben automatisch Lehrplan-Kompetenzen zuordnen
- Kompetenznachweis-Tracker pro Klasse
- Warnung: "Diese Klausur deckt Lehrplan-Kapitel X nicht ab"
- KMK-Bildungsstandards eingebettet

### 11. 🏫 Klassenmanagement-Agent (NEU – B2B)
**Funktion:** Digitales Klassentagebuch  
**Features:**
- Sitzplan mit Foto-Upload
- Anwesenheitsverfolgung
- Verhaltensnotizen (datenschutzkonform)
- Elternkontakt-Protokoll
- Fehlzeitenmanagement
- Export für Schulverwaltung (ASV, Untis, Schild-NRW)

### 12. 📂 Dokumenten-Agent (NEU)
**Funktion:** Schulischer Dokumenten-Hub  
**Features:**
- Dokumentenvorlagen (Klassenarbeiten, Protokolle, Anträge)
- Automatisches Befüllen aus Datenbank
- Versionierung (wer hat was wann geändert)
- Digitale Unterschrift
- Archivierung nach Schulrecht (10 Jahre)

---

## SCHULVERSION (B2B / ENTERPRISE)

### Preismodell Schule
| Paket | Preis/Jahr | Nutzer | Features |
|-------|-----------|--------|---------|
| Schule Basic | 1.499 € | 15 Lehrkräfte | Alle Agenten, kein Admin |
| Schule Pro | 2.999 € | 40 Lehrkräfte | + Schulleiter-Dashboard |
| Schule Enterprise | 4.999 € | Unbegrenzt | + SSO, API, SLA |
| Bundesland-Lizenz | ab 99.000 € | Alle Schulen | Custom + Support |

### Schulleiter-Dashboard
- Übersicht aller Fachschaften
- Nutzungsstatistiken (welche Lehrkraft nutzt was)
- Lizenzmanagement (Nutzer hinzufügen/entfernen)
- Anonymisierte Schulstatistiken
- Compliance-Reports für Schulaufsicht
- Datenschutz-Zentrale (alle DSGVO-Anfragen zentral)

### Fachschaften-Funktionen
- Gemeinsame Klausur-Datenbank der Fachschaft
- Bewertungsraster teilen
- Notenkonferenzen digital vorbereiten
- Fachschaftssitzungen dokumentieren

### IT-Administration (SSO/LDAP)
- Microsoft Azure AD / Active Directory
- Google Workspace
- SAML 2.0
- LDAP
- Moodle LTI 1.3
- itslearning Integration
- IServ Integration
- WebUntis Stundenplan-Import

---

## INTERNATIONALE EXPANSION

### Phase 1: DACH (Q3 2025)
| Land | Besonderheiten | Anpassung |
|------|---------------|-----------|
| Österreich | 1-4 Notensystem (umgekehrt!), Matura | Notenskala-Mapping, Maturapläne |
| Schweiz | Kantonal unterschiedlich (1-6 / 1-10), 4 Sprachen | Multi-Lingual, Kantonale Lehrpläne |
| Luxemburg | Trilinguale Bildung (DE/FR/LU), 60-Punkte-System | Trilingualer Modus |

### Phase 2: Westeuropa (Q1 2026)
| Land | System | Priorität |
|------|-------|----------|
| Frankreich | 0-20 System, Baccalauréat | HOCH (groß, ähnlich strukturiert) |
| Niederlande | 1-10, zentralisiert | MITTEL |
| Belgien | Französisch + Flämisch | MITTEL |
| England/Wales | GCSE/A-Level, Percentage | HOCH (große englischsprachige Basis) |

### Phase 3: Anglophone Märkte (2026-2027)
| Markt | Potenzial | Strategie |
|-------|----------|----------|
| USA | 3,7M Lehrer, $80B EdTech-Markt | Partnership mit Schulbezirken |
| Kanada | 400k Lehrer | DACH-Modell adaptieren |
| Australien | 350k Lehrer | Ähnlich UK |
| Indien | 8M Lehrer | Low-cost Tier, indische Lehrpläne |

### Lokalisierung-Matrix
Jede neue Region benötigt:
1. **Notensystem** – konfigurierbare Notenskalen
2. **Lehrpläne** – lokale Curriculum-Daten
3. **Sprache** – UI + KI-Ausgabe
4. **Datenschutz** – GDPR (EU) / FERPA (US) / PIPEDA (CA)
5. **Zahlungsmethoden** – lokale Stripe-Methoden
6. **Lokaler Support** – Partnernetzwerk

---

## MOBILE APPS

### iOS App (React Native)
- Offline-OCR mit Core ML (lokal, ohne Cloud)
- Live-Kamera-Modus: Arbeit einscannen während Korrektur
- Apple Pencil-Unterstützung (iPad) für Annotierungen
- Face ID / Touch ID
- Siri Shortcut: "Bewertung starten"
- Widget: Offene Korrekturen, verbleibende Bewertungen
- AirDrop: Dateien direkt aus Files App

### Android App
- ML Kit OCR (offline)
- Fingerprint / Face Unlock
- Google Lens Integration
- Android Widgets
- Material Design 3
- Chromebook-Optimierung (für Schulen)

### Desktop App (Electron / Tauri)
- Lokale OCR ohne Internetverbindung
- Drag & Drop von Dateien aus Finder/Explorer
- Offline-Modus für alle gespeicherten Arbeiten
- Bulk-Import aus Ordner
- System-Tray App

### PWA (bereits vorhanden, weiter verbessert)
- Background Sync für Offline-Korrekturen
- Push Notifications (fertig gestellt)
- Share Target: Aus anderen Apps direkt zu TeacherAI

---

## KI-MODELL STRATEGIE

### Multi-Model-Support
```
┌─────────────────────────────────────────────────┐
│           TeacherAI AI Gateway                   │
│                                                  │
│  ┌─────────┐  ┌─────────┐  ┌────────────────┐  │
│  │ Claude  │  │  GPT-4  │  │ Google Gemini  │  │
│  │ (main)  │  │(fallback)│  │  (europe)      │  │
│  └─────────┘  └─────────┘  └────────────────┘  │
│                                                  │
│  ┌──────────────────────┐  ┌──────────────────┐ │
│  │  Llama 3 (on-prem)   │  │  Mistral (EU)    │ │
│  │  für Datenschutz-    │  │  DSGVO-native    │ │
│  │  sensible Schulen    │  │                  │ │
│  └──────────────────────┘  └──────────────────┘ │
└─────────────────────────────────────────────────┘
```

**Admin-Konfiguration:**
- Modell pro Use-Case wählbar (Korrektur vs. Chat vs. Planung)
- Fallback-Kette: wenn Claude überlastet → GPT-4 → Gemini
- Cost-Aware Routing: billiges Modell für einfache Tasks
- On-Premise-Option für Schulen mit strengem Datenschutz (Llama 3 lokal)

**Qualitäts-Benchmarks (intern gemessen):**
| Aufgabe | Claude Opus | GPT-4o | Gemini Pro |
|---------|------------|-------|-----------|
| Deutsch Aufsatz | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| Mathe Rechenweg | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| Naturwissenschaften | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| Handschrift OCR | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ |

---

## ENTERPRISE-FEATURES

### Single Sign-On (SSO)
- SAML 2.0 (universell)
- OIDC/OAuth 2.0
- Microsoft Azure AD / Entra ID
- Google Workspace
- Fertige Connectors: IServ, Moodle, itslearning

### API für Drittanbieter
```
TeacherAI Public API v2:

POST /v2/grading/async     → Bewertung starten
GET  /v2/grading/{id}      → Status abfragen
POST /v2/worksheet/create  → Arbeitsblatt erstellen
POST /v2/grade/calculate   → Note berechnen
GET  /v2/curricula/{state} → Lehrplan abrufen

Authentifizierung: API-Key (Bearer)
Rate Limits: 100 req/min (Enterprise)
Webhooks: grading.completed, grading.failed
SLA: 99,9% Uptime-Garantie
```

### LMS-Integrationen
| System | Integration | Priorität |
|--------|------------|----------|
| Moodle | LTI 1.3 + Plugin | ⭐⭐⭐⭐⭐ |
| itslearning | LTI 1.3 | ⭐⭐⭐⭐ |
| IServ | REST API | ⭐⭐⭐⭐ |
| WebUntis | Stundenplan-Sync | ⭐⭐⭐ |
| Microsoft Teams Edu | Teams-App | ⭐⭐⭐⭐ |
| Google Classroom | Add-on | ⭐⭐⭐⭐ |
| Canvas LMS | REST API | ⭐⭐⭐ |

---

## WACHSTUMSSTRATEGIE

### 1.000 Nutzer (aktuell → Q1 2025)
- **Kanal:** Direct SEO, Lehrkraft-Communities, Referrals
- **Conversion:** 3% Freemium → Paid
- **Support:** Founder-geführt, Helpdesk-System
- **Infrastruktur:** Vercel + Supabase (aktueller Stack)
- **Mitarbeiter:** 2-3 (Founder + 1 Tech)
- **MRR:** ~7.500 € (250 zahlende Kunden × 30 € Ø)
- **Kosten/Monat:** ~5.000 € (Claude API ~2.000 €, Infra ~1.000 €, Marketing ~2.000 €)

### 10.000 Nutzer (Q2-Q3 2025)
- **Kanal:** Content Marketing, YouTube, Instagram (Lehrer-Community), Partnership
- **Conversion:** 5% Freemium → Paid nach Produktverbesserungen
- **Support:** 2 Support-Mitarbeiter, KI-gestützter Self-Service
- **Infrastruktur:** Eigene Server + CDN, Redis Cluster, Read-Replicas
- **Mitarbeiter:** 6-8 (Dev ×3, Marketing ×2, Support ×1, Sales ×1)
- **MRR:** ~75.000 € (Ziel)
- **ARR:** ~900.000 € → Serie A Zeitpunkt

### 100.000 Nutzer (2026)
- **Kanal:** B2B-Sales (Schulen), Bundesland-Ausschreibungen, Reseller
- **Schulen:** 200 Schulen × 2.000 €/Jahr = 400.000 € zusätzlich
- **Mitarbeiter:** 20-25 (Dev ×8, Sales ×4, Marketing ×3, CS ×4, HR/Legal ×2)
- **MRR:** ~500.000 €
- **ARR:** ~6.000.000 € → Profitabel

### 1.000.000 Nutzer (2028-2029)
- **Kanal:** Internationale Expansion, Bundesland-Lizenzen, App-Stores
- **Enterprise:** 5 Bundesland-Lizenzen × 500.000 € = 2.500.000 €/Jahr
- **API-Revenue:** Drittanbieter-Integrationen
- **Mitarbeiter:** 80-100 (Engineering ×30, Sales ×20, CS ×20, G&A ×15)
- **ARR:** ~50.000.000 € → IPO-fähig

---

## FINANZPLANUNG

### Einnahmen-Projektion (in €)

| Jahr | Nutzer | MRR | ARR | Schulen | Gesamtumsatz |
|------|--------|-----|-----|---------|-------------|
| 2025 | 10.000 | 75.000 | 900.000 | 20 | 940.000 |
| 2026 | 50.000 | 300.000 | 3.600.000 | 100 | 3.800.000 |
| 2027 | 200.000 | 900.000 | 10.800.000 | 400 | 12.000.000 |
| 2028 | 500.000 | 2.000.000 | 24.000.000 | 1.000 | 27.000.000 |
| 2029 | 1.000.000 | 3.500.000 | 42.000.000 | 2.000 | 50.000.000 |

### API-Kosten (Claude) vs. Revenue

| Nutzer | Claude-Kosten/Monat | Revenue/Monat | Marge |
|--------|-------------------|--------------|-------|
| 10.000 | ~8.000 € | 75.000 € | 89% |
| 100.000 | ~60.000 € | 500.000 € | 88% |
| 1.000.000 | ~400.000 € | 3.500.000 € | 89% |

*Annahme: Ø 2 Bewertungen/Monat/Nutzer × 0,08 € Kosten = 0,16 €/Nutzer/Monat*

### Finanzierungsbedarf

**Seed Round (jetzt): 500.000 €**
- Product Development (v2.0): 200.000 €
- Marketing/Sales (12 Monate): 150.000 €
- Team (2 Entwickler, 1 Marketing): 100.000 €
- Runway: 50.000 €

**Serie A (bei 1.000.000 € ARR): 3.000.000 €**
- International Expansion: 1.000.000 €
- Enterprise Sales Team: 800.000 €
- Mobile Apps: 400.000 €
- Infrastructure Scaling: 300.000 €
- Legal/Compliance (EU): 300.000 €
- Marketing Budget: 200.000 €

**Serie B (bei 10.000.000 € ARR): 15.000.000 €**
- USA/UK Expansion: 5.000.000 €
- M&A (Konkurrenten/Tools): 5.000.000 €
- Product R&D: 3.000.000 €
- G&A: 2.000.000 €

---

## MARKETINGSTRATEGIE

### Content Marketing (SEO)
**Ziel-Keywords:**
- "Klassenarbeit korrigieren KI" (2.400/Monat DE)
- "Notenberechnung Schule" (8.100/Monat)
- "Arbeitsblatt erstellen KI" (4.400/Monat)
- "Zeugnisformulierungen" (22.000/Monat)
- "Unterrichtsplanung digital" (1.900/Monat)

**Content-Plan:**
- Wöchentliche Blog-Posts (KI in Bildung, Lehrkraft-Tipps)
- YouTube: "KI spart Lehrern X Stunden pro Woche" (viral potential)
- Instagram/TikTok: Behind-the-scenes, Lehrkraft-Testimonials
- Podcast: "Lehrkraft 2030" – mit Bildungsexperten

### Community-Aufbau
- Facebook-Gruppe: "Lehrkräfte und KI" (Ziel: 10.000 Mitglieder)
- Discord-Server für Beta-Tester
- Schulleitungs-Netzwerk (LinkedIn Gruppe)
- Partner-Blogger in Lehrercommunitys (Referendar-Blogs, Studienrat.de)

### Affiliate-System
- Provisionsstruktur: 20% für 12 Monate (recurring)
- Zielgruppen: Bildungs-Blogger, YouTube-Lehrer, LMS-Anbieter
- Mindestprovision: 5 €/Monat für jeden geworbenen Nutzer
- Schul-Empfehlung: 500 € für jede geworbene Schule (Einmalzahlung)

### Empfehlungsprogramm (Referral)
- "Empfehle TeacherAI und erhalte 1 Monat gratis"
- Beide Seiten profitieren (Dropbox-Modell)
- Viral-Loop: Lehrkräfte empfehlen an Kolleg:innen

### Partnerschaften
- **Kultusministerien:** Pilotprojekte für Bundesländer
- **Lehrerverbände:** VBE, GEW, DPhV als Multiplikatoren
- **Schulbuchverlage:** Klett, Cornelsen, Westermann (Inhalte-Integration)
- **LMS-Anbieter:** IServ, Moodle (Reseller-Agreement)
- **Universität:** Lehramtsstudierende als erste Nutzer

---

## PITCHDECK – INVESTOR SUMMARY

### Problem
Deutschlands ~850.000 Lehrkräfte verbringen durchschnittlich 8-12 Stunden pro Woche mit Korrekturen und administrativen Aufgaben. Das ist Zeit, die fehlt für Unterricht, Schülerbetreuung und persönliche Entwicklung. Deutschland hat gleichzeitig einen der schlimmsten Lehrermangel seit Jahrzehnten.

### Lösung
TeacherAI automatisiert das Zeitintensivste: die Korrektur. Mit Claude (state-of-the-art LLM) werden Klausuren in ~60 Sekunden bewertet, nachvollziehbar begründet und als PDF-Bericht exportiert. Die Lehrkraft prüft, passt an, bestätigt.

### Markt
- **SAM (Sofort adressierbar):** 850.000 deutsche Lehrkräfte × 120 €/Jahr Ø = **102 Mio. €**
- **SOM (Realistisch 5 Jahre):** 15% Marktanteil = **15 Mio. €**
- **TAM (Gesamteuropa):** 5,5 Mio. Lehrkräfte = **660 Mio. €**

### Traction (Ziele bis Pitch)
- 500 registrierte Beta-Nutzer
- 50 zahlende Kunden
- 3 Schulen als Pilotpartner
- 4,8/5 Nutzerzufriedenheit
- 2.000+ Bewertungen durchgeführt

### Wettbewerb
| Wettbewerber | Stärke | Schwäche | TeacherAI-Vorteil |
|------------|-------|---------|-------------------|
| formative.com | Etabliert (USA) | Kein Deutsch, kein OCR | DE-Markt first |
| itslearning | LMS-Integration | Keine KI-Korrektur | KI-first |
| Turnitin | Plagiat-Erkennung | Keine Bewertung | Vollständige Pipeline |
| ChatGPT | Bekannt | Kein Lehrerschema, kein PDF | Spezialisiert |
| Manuell | 0 Kosten | 10h/Woche | Zeit ist Geld |

### Unique Selling Points (USP)
1. **DSGVO-nativ** – EU-Server, AVV, keine Schülerdaten-Profilerstellung
2. **Deutschland-first** – Alle 16 Bundesländer, alle Schulformen, Notenschlüssel
3. **100% transparent** – KI macht VORSCHLAG, Lehrkraft entscheidet
4. **Handschrift** – Claude Vision erkennt echte Handschrift (kein Konkurrent kann das)
5. **Multi-Agent** – 12 spezialisierte Agenten, nicht nur Korrektur

### Team (CTO-Vision)
- CEO/CTO: Technischer Founder, 10+ Jahre EdTech
- Head of Product: Ex-Lehrer (authentischer Kundenzugang)
- Head of Sales: Enterprise-Sales-Erfahrung Bildungssektor
- Advisory Board: Kultusministerium, Schulleiter, KI-Experte

### Ask
**Seed: 500.000 € für 8-10% Equity**  
Bewertung: 5.000.000 € Pre-Money  
Verwendung: Team (40%), Marketing (30%), Produkt (20%), Infrastruktur (10%)

---

## SWOT-ANALYSE

### Stärken (S)
- Vollständige technische Plattform (9 Phasen entwickelt)
- DSGVO-konform by design
- Claude-Integration (bestes Modell für Textverständnis)
- Deutschland-spezifische Anpassungen (alle Bundesländer)
- Multi-Agent-Architektur geplant

### Schwächen (W)
- Keine Mobile App (yet)
- Kein Netzwerkeffekt (noch)
- API-Kosten steigen mit Scale
- Abhängigkeit von Anthropic API
- Kein Lehrerverbands-Partnerschaft (yet)

### Chancen (O)
- Lehrermangel schafft Akzeptanz für KI-Tools
- Digitalisierung der Schulen beschleunigt sich (DigitalPakt)
- Bundesland-Lizenzen = massive B2B-Revenue
- Internationalisierung erschließt 10x Markt
- AI Act (EU) schafft Vertrauen in EU-AI-Tools

### Risiken (T)
- Google/Microsoft baut Konkurrenztool (aber: DSGVO-Problem für US-Firmen in DE-Schulen)
- Lehrerverbände könnten KI ablehnen (Mitigation: Transparenz-First-Ansatz)
- Claude API-Preisänderungen (Mitigation: Multi-Model-Strategy)
- Datenschutz-Regulierung (Mitigation: On-Premise-Option)

---

## PRODUCT ROADMAP 2025-2027

```
2025 Q1  ████ Multi-Agent Launch (6 Agenten)
         ████ iOS Beta App
         ████ Schulversion Beta (5 Pilotschulen)

2025 Q2  ████ Android App
         ████ Österreich Launch
         ████ Moodle Integration (LTI 1.3)

2025 Q3  ████ Schweiz Launch
         ████ Desktop App (Electron/Tauri)
         ████ Multi-Model (GPT-4 + Gemini)
         ████ Série A Funding

2025 Q4  ████ Bundesland-Lizenz Pilot (1 BL)
         ████ Frankreich Beta
         ████ 12 Agenten vollständig

2026 Q1  ████ England/UK Launch
         ████ IServ Integration
         ████ On-Premise Version (Llama 3)

2026 Q2  ████ USA Beta (mit Partner)
         ████ Google Classroom Integration
         ████ 100.000 Nutzer Milestone

2027     ████ Börsenvorbereitung (IPO oder Series C)
         ████ 1 Mio. Nutzer-Ziel
```

---

## TECHNISCHE ARCHITEKTUR 2.0

```
┌──────────────────────────────────────────────────────────────────────┐
│                    TeacherAI Enterprise v2.0                          │
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │                    Web / Mobile / Desktop                        │ │
│  │  Next.js 14  │  React Native iOS/Android  │  Electron Desktop   │ │
│  └───────────────────────────┬─────────────────────────────────────┘ │
│                               │                                       │
│  ┌────────────────────────────▼────────────────────────────────────┐ │
│  │                   API Gateway (Edge Functions)                   │ │
│  │         Rate Limiting │ Auth │ Analytics │ Cost Routing          │ │
│  └────────────────────────────┬────────────────────────────────────┘ │
│                               │                                       │
│  ┌──────────┐ ┌──────────────┐│┌──────────────┐ ┌────────────────┐ │
│  │ Auth     │ │ Upload/OCR   │││  AI Gateway  │ │  Stripe/Pay    │ │
│  │ Service  │ │ Pipeline     │││  (Multi-LLM) │ │  Service       │ │
│  └──────────┘ └──────────────┘│└──────────────┘ └────────────────┘ │
│                               │                                       │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                    Agent Orchestrator                          │   │
│  │  Korrektur │ Klausur │ Arbeitsblatt │ Zeugnis │ Elternbrief  │   │
│  │  Analyse   │ Lehrplan │ Klassen-Mgmt │ Schulanalyse │ Chat   │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                               │                                       │
│  ┌────────┐ ┌──────────┐ ┌───────┐ ┌──────────────────────────┐   │
│  │PostgreSQL│ │Supabase  │ │Redis  │ │  Message Queue           │   │
│  │(Primary) │ │Storage   │ │Cache  │ │  (Upstash QStash)        │   │
│  └────────┘ └──────────┘ └───────┘ └──────────────────────────┘   │
└──────────────────────────────────────────────────────────────────────┘
```

---

## QUALITÄTS-KPIs (Version 2.0 Ziele)

| Metrik | Aktuell (v1.0) | Ziel (v2.0) |
|--------|----------------|-------------|
| Lighthouse Performance | 85+ | 98+ |
| Lighthouse Accessibility | 90+ | 98+ |
| Time to First Byte | <400ms | <200ms |
| API Response (Ø) | 200ms | 80ms |
| Uptime SLA | 99.5% | 99.9% |
| OCR-Genauigkeit Druck | 98% | 99.5% |
| OCR-Genauigkeit Handschrift | 85% | 92% |
| Nutzerzufriedenheit | 4.5/5 | 4.8/5 |
| Bewertung pro Minute | 1 | 3 (Batch) |
| Support-Antwortzeit (Pro) | 24h | 4h |

---

*TeacherAI Enterprise Edition v2.0 – Strategiedokument*  
*Vertrauich – Nur für interne Verwendung und potenzielle Investoren*  
*© 2024 TeacherAI GmbH, Hamburg*
