// lib/pdf/generator.ts – generate professional grading report PDF

import { logger } from '@/lib/logger'

export interface PdfReportData {
  // Header
  schulName?: string
  bundesland: string
  schulform: string
  datum: string
  fach: string
  klassenstufe: string
  aufgabentyp: string

  // Student info (optional – teacher may fill)
  schuelerName?: string
  klasse?: string

  // Grading result
  gesamtpunkte: number
  maximalpunkte: number
  prozent: number
  note: string
  bestanden: boolean

  // Details
  aufgabenBewertungen: Array<{
    aufgabe: string
    aufgabenNummer: number
    erreichterPunkte: number
    maxPunkte: number
    prozent: number
    begruendung: string
    fehler: string[]
    korrekteLoesung?: string
  }>

  feedback: string
  staerken: string[]
  schwaechen: string[]
  verbesserungsvorschlaege: string[]
  zusammenfassung: string

  // Teacher
  lehrerAnmerkungen?: string
  finalisiertVon: string

  // Transparency
  beruecksichtigteHinweise?: string[]
  unsicherheiten?: string[]
  plausibilitaetshinweise?: string[]
  confidenceScore?: number
  aiModel?: string
}

export async function generateGradingPdf(data: PdfReportData): Promise<Buffer> {
  try {
    // Try to use puppeteer in production for high-quality PDFs
    return await generateWithHtml(data)
  } catch (error) {
    logger.error('PDF generation error', { error })
    throw new Error('PDF-Generierung fehlgeschlagen')
  }
}

// Generate HTML and convert to PDF
async function generateWithHtml(data: PdfReportData): Promise<Buffer> {
  const html = buildReportHtml(data)

  // In production: use puppeteer or @react-pdf/renderer
  // For now, we generate the HTML that can be printed to PDF client-side
  // Or use a serverless PDF service

  try {
    const puppeteer = (await import('puppeteer')).default
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    })
    const page = await browser.newPage()
    await page.setContent(html, { waitUntil: 'networkidle0' })
    const pdf = await page.pdf({
      format: 'A4',
      margin: { top: '20mm', right: '20mm', bottom: '20mm', left: '20mm' },
      printBackground: true,
    })
    await browser.close()
    return Buffer.from(pdf)
  } catch {
    // Puppeteer not available – return HTML as fallback
    logger.warn('Puppeteer not available, returning HTML as PDF fallback')
    return Buffer.from(html, 'utf-8')
  }
}

function buildReportHtml(data: PdfReportData): string {
  const {
    schulName, bundesland, schulform, datum, fach, klassenstufe, aufgabentyp,
    schuelerName, klasse, gesamtpunkte, maximalpunkte, prozent, note, bestanden,
    aufgabenBewertungen, feedback, staerken, schwaechen, verbesserungsvorschlaege,
    zusammenfassung, lehrerAnmerkungen, finalisiertVon, beruecksichtigteHinweise,
    unsicherheiten, confidenceScore, aiModel,
  } = data

  const noteColor = note.startsWith('1') ? '#10b981' : note.startsWith('2') ? '#3b82f6' :
    note.startsWith('3') ? '#6271f6' : note.startsWith('4') ? '#f59e0b' : '#ef4444'

  const aufgabenRows = aufgabenBewertungen.map((a) => `
    <tr>
      <td style="padding:8px;border-bottom:1px solid #e5e7eb;font-weight:600">${a.aufgabe}</td>
      <td style="padding:8px;border-bottom:1px solid #e5e7eb;text-align:center">
        ${a.erreichterPunkte}/${a.maxPunkte}
      </td>
      <td style="padding:8px;border-bottom:1px solid #e5e7eb;text-align:center">
        <span style="background:${a.prozent>=80?'#d1fae5':a.prozent>=60?'#dbeafe':a.prozent>=40?'#fef3c7':'#fee2e2'};padding:2px 8px;border-radius:9999px;font-size:12px">
          ${a.prozent}%
        </span>
      </td>
      <td style="padding:8px;border-bottom:1px solid #e5e7eb;font-size:12px;color:#6b7280">${a.begruendung}</td>
    </tr>
    ${a.fehler.length > 0 ? `
    <tr>
      <td colspan="4" style="padding:4px 8px 8px 20px;border-bottom:1px solid #f3f4f6;font-size:11px;color:#dc2626">
        ⚠ Fehler: ${a.fehler.join(' | ')}
      </td>
    </tr>` : ''}
    ${a.korrekteLoesung ? `
    <tr>
      <td colspan="4" style="padding:4px 8px 8px 20px;border-bottom:1px solid #f3f4f6;font-size:11px;color:#059669">
        ✓ Korrekt wäre: ${a.korrekteLoesung}
      </td>
    </tr>` : ''}
  `).join('')

  return `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <title>Bewertungsbericht – ${fach} ${klassenstufe}. Klasse</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', Arial, sans-serif; color: #1f2937; font-size: 14px; line-height: 1.5; }
    .header { background: linear-gradient(135deg, #6271f6 0%, #8b5cf6 100%); color: white; padding: 24px 32px; }
    .header h1 { font-size: 22px; font-weight: 700; margin-bottom: 4px; }
    .header p { opacity: 0.85; font-size: 13px; }
    .meta-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; padding: 20px 32px; background: #f9fafb; border-bottom: 1px solid #e5e7eb; }
    .meta-item label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280; }
    .meta-item p { font-weight: 600; font-size: 14px; margin-top: 2px; }
    .grade-box { display: flex; align-items: center; justify-content: center; gap: 32px; padding: 24px 32px; background: white; border-bottom: 2px solid #e5e7eb; }
    .grade-circle { width: 100px; height: 100px; border-radius: 50%; background: ${noteColor}; color: white; display: flex; flex-direction: column; align-items: center; justify-content: center; box-shadow: 0 4px 20px ${noteColor}40; }
    .grade-circle .note { font-size: 36px; font-weight: 800; line-height: 1; }
    .grade-circle .label { font-size: 11px; opacity: 0.9; }
    .grade-info { text-align: left; }
    .grade-info .points { font-size: 24px; font-weight: 700; }
    .grade-info .subtext { font-size: 13px; color: #6b7280; }
    .progress-bar { width: 200px; height: 8px; background: #e5e7eb; border-radius: 4px; overflow: hidden; margin-top: 8px; }
    .progress-fill { height: 100%; background: ${noteColor}; border-radius: 4px; width: ${prozent}%; }
    .section { padding: 20px 32px; border-bottom: 1px solid #f3f4f6; }
    .section h2 { font-size: 15px; font-weight: 700; color: #374151; margin-bottom: 12px; display: flex; align-items: center; gap: 8px; }
    table { width: 100%; border-collapse: collapse; }
    th { background: #f3f4f6; padding: 8px; text-align: left; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280; }
    .list-item { display: flex; gap: 8px; margin-bottom: 6px; font-size: 13px; }
    .list-item::before { content: attr(data-icon); flex-shrink: 0; }
    .feedback-box { background: #f9fafb; border-left: 4px solid #6271f6; padding: 16px; border-radius: 0 8px 8px 0; font-size: 13px; line-height: 1.7; }
    .teacher-box { background: #fffbeb; border: 1px solid #fcd34d; border-radius: 8px; padding: 16px; }
    .ai-notice { background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 12px 16px; font-size: 12px; color: #1e40af; }
    .footer { padding: 16px 32px; background: #f9fafb; text-align: center; font-size: 11px; color: #9ca3af; }
    .badge { display: inline-block; padding: 2px 10px; border-radius: 9999px; font-size: 11px; font-weight: 600; }
    .badge-pass { background: #d1fae5; color: #065f46; }
    .badge-fail { background: #fee2e2; color: #991b1b; }
    .uncertainty-item { font-size: 12px; color: #92400e; padding: 4px 0; }
    @media print { .page-break { page-break-before: always; } }
  </style>
</head>
<body>

<!-- Header -->
<div class="header">
  <h1>📋 Bewertungsbericht</h1>
  <p>${schulName || `${schulform} · ${bundesland}`} · ${fach} · ${klassenstufe}. Klasse · ${aufgabentyp}</p>
</div>

<!-- Meta info -->
<div class="meta-grid">
  <div class="meta-item"><label>Schüler/in</label><p>${schuelerName || 'Nicht angegeben'}</p></div>
  <div class="meta-item"><label>Klasse</label><p>${klasse || klassenstufe}</p></div>
  <div class="meta-item"><label>Datum</label><p>${datum}</p></div>
  <div class="meta-item"><label>Fach</label><p>${fach}</p></div>
  <div class="meta-item"><label>Schulform</label><p>${schulform}</p></div>
  <div class="meta-item"><label>Bundesland</label><p>${bundesland}</p></div>
</div>

<!-- Grade box -->
<div class="grade-box">
  <div class="grade-circle">
    <span class="note">${note}</span>
    <span class="label">Note</span>
  </div>
  <div class="grade-info">
    <div class="points">${gesamtpunkte} / ${maximalpunkte} Punkte</div>
    <div class="subtext">${prozent}% · <span class="badge ${bestanden ? 'badge-pass' : 'badge-fail'}">${bestanden ? '✓ Bestanden' : '✗ Nicht bestanden'}</span></div>
    <div class="progress-bar"><div class="progress-fill"></div></div>
    ${finalisiertVon === 'TEACHER'
      ? '<div style="margin-top:8px;font-size:12px;color:#059669">✓ Von Lehrkraft geprüft und bestätigt</div>'
      : '<div style="margin-top:8px;font-size:12px;color:#6b7280">🤖 KI-Vorschlag (noch nicht bestätigt)</div>'
    }
  </div>
</div>

<!-- Task breakdown -->
<div class="section">
  <h2>📊 Punkteverteilung nach Aufgaben</h2>
  <table>
    <thead>
      <tr>
        <th>Aufgabe</th>
        <th style="text-align:center">Punkte</th>
        <th style="text-align:center">Prozent</th>
        <th>Begründung</th>
      </tr>
    </thead>
    <tbody>${aufgabenRows}</tbody>
  </table>
</div>

<!-- Summary -->
<div class="section">
  <h2>📝 Zusammenfassung</h2>
  <p style="font-size:13px;color:#374151">${zusammenfassung}</p>
</div>

<!-- Feedback -->
<div class="section">
  <h2>💬 Allgemeines Feedback</h2>
  <div class="feedback-box">${feedback.replace(/\n/g, '<br>')}</div>
</div>

<!-- Strengths and weaknesses -->
<div style="display:grid;grid-template-columns:1fr 1fr;gap:0">
  <div class="section" style="border-right:1px solid #f3f4f6">
    <h2>✅ Stärken</h2>
    ${staerken.map((s) => `<div class="list-item" data-icon="✓">${s}</div>`).join('')}
  </div>
  <div class="section">
    <h2>📈 Verbesserungspotenzial</h2>
    ${schwaechen.map((s) => `<div class="list-item" data-icon="→">${s}</div>`).join('')}
  </div>
</div>

<!-- Improvement suggestions -->
${verbesserungsvorschlaege.length > 0 ? `
<div class="section">
  <h2>💡 Verbesserungsvorschläge</h2>
  ${verbesserungsvorschlaege.map((v) => `<div class="list-item" data-icon="•">${v}</div>`).join('')}
</div>` : ''}

<!-- Teacher notes -->
${lehrerAnmerkungen ? `
<div class="section">
  <h2>👩‍🏫 Anmerkungen der Lehrkraft</h2>
  <div class="teacher-box">${lehrerAnmerkungen.replace(/\n/g, '<br>')}</div>
</div>` : ''}

<!-- Transparency section -->
<div class="section">
  <h2>🔍 Transparenz & Hinweise</h2>
  
  ${beruecksichtigteHinweise && beruecksichtigteHinweise.length > 0 ? `
  <p style="font-size:12px;font-weight:600;margin-bottom:8px">Berücksichtigte Lehrerhinweise:</p>
  ${beruecksichtigteHinweise.map((h) => `<div class="list-item" data-icon="✓">${h}</div>`).join('')}
  <div style="margin-top:12px"></div>` : ''}

  <div class="ai-notice">
    <strong>KI-Transparenzhinweis:</strong> Diese Bewertung wurde mit Unterstützung von KI (${aiModel || 'Claude'}) 
    erstellt. ${confidenceScore ? `Konfidenz: ${confidenceScore}%. ` : ''}
    Die endgültige Beurteilung liegt bei der Lehrkraft. 
    ${finalisiertVon === 'TEACHER' ? 'Diese Bewertung wurde von der Lehrkraft geprüft und bestätigt.' : 'Diese Bewertung ist ein KI-Vorschlag und wurde noch nicht von der Lehrkraft bestätigt.'}
  </div>

  ${unsicherheiten && unsicherheiten.length > 0 ? `
  <div style="margin-top:12px;background:#fffbeb;border:1px solid #fcd34d;border-radius:8px;padding:12px">
    <p style="font-size:12px;font-weight:600;color:#92400e;margin-bottom:6px">⚠ Erkannte Unsicherheiten:</p>
    ${unsicherheiten.map((u) => `<div class="uncertainty-item">• ${u}</div>`).join('')}
  </div>` : ''}
</div>

<!-- Footer -->
<div class="footer">
  Erstellt mit TeacherAI · teachai.de · DSGVO-konform · ${new Date().toLocaleDateString('de-DE')}
</div>

</body>
</html>`
}
