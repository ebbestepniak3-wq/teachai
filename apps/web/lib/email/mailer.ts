// lib/email/mailer.ts – Transactional email service

import { logger } from '@/lib/logger'

export interface EmailPayload {
  to: string
  subject: string
  html: string
  text?: string
}

// Send email via SMTP (Resend / Nodemailer compatible)
export async function sendEmail(payload: EmailPayload): Promise<boolean> {
  // In development, just log emails
  if (process.env.NODE_ENV === 'development') {
    logger.info('📧 [DEV EMAIL]', {
      to: payload.to,
      subject: payload.subject,
      preview: payload.text?.slice(0, 100),
    })
    return true
  }

  try {
    // Production: use Resend API
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM || 'TeacherAI <noreply@teachai.de>',
        to: payload.to,
        subject: payload.subject,
        html: payload.html,
        text: payload.text,
      }),
    })

    if (!res.ok) {
      const error = await res.text()
      logger.error('Email send failed', { error, to: payload.to })
      return false
    }

    logger.info('Email sent', { to: payload.to, subject: payload.subject })
    return true
  } catch (error) {
    logger.error('Email service error', { error })
    return false
  }
}

// Email templates
export function emailVerificationTemplate(name: string, verifyUrl: string): EmailPayload['html'] {
  return `<!DOCTYPE html>
<html lang="de">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#0a0a0f;font-family:Inter,system-ui,sans-serif;">
  <div style="max-width:600px;margin:40px auto;background:#13131a;border:1px solid #1e1e2e;border-radius:16px;overflow:hidden;">
    <div style="background:linear-gradient(135deg,#6271f6,#8198fb);padding:32px;text-align:center;">
      <h1 style="margin:0;color:white;font-size:24px;font-weight:700;">TeacherAI</h1>
      <p style="margin:8px 0 0;color:rgba(255,255,255,0.8);font-size:14px;">KI-gestützte Korrektur für Lehrkräfte</p>
    </div>
    <div style="padding:40px;">
      <h2 style="color:#f0f0f8;font-size:20px;margin:0 0 16px;">Hallo ${name},</h2>
      <p style="color:#9999b3;font-size:15px;line-height:1.6;margin:0 0 24px;">
        Willkommen bei TeacherAI! Bitte bestätigen Sie Ihre E-Mail-Adresse, um Ihr Konto zu aktivieren.
      </p>
      <div style="text-align:center;margin:32px 0;">
        <a href="${verifyUrl}" style="display:inline-block;background:linear-gradient(135deg,#6271f6,#8198fb);color:white;text-decoration:none;padding:14px 32px;border-radius:12px;font-weight:600;font-size:15px;">
          E-Mail-Adresse bestätigen
        </a>
      </div>
      <p style="color:#666680;font-size:13px;line-height:1.5;margin:24px 0 0;">
        Dieser Link ist 24 Stunden gültig. Falls Sie diese E-Mail nicht angefordert haben, können Sie sie ignorieren.
      </p>
    </div>
    <div style="padding:24px;border-top:1px solid #1e1e2e;text-align:center;">
      <p style="color:#666680;font-size:12px;margin:0;">© ${new Date().getFullYear()} TeacherAI GmbH · <a href="https://teachai.de/datenschutz" style="color:#6271f6;">Datenschutz</a></p>
    </div>
  </div>
</body>
</html>`
}

export function passwordResetTemplate(name: string, resetUrl: string): EmailPayload['html'] {
  return `<!DOCTYPE html>
<html lang="de">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#0a0a0f;font-family:Inter,system-ui,sans-serif;">
  <div style="max-width:600px;margin:40px auto;background:#13131a;border:1px solid #1e1e2e;border-radius:16px;overflow:hidden;">
    <div style="background:linear-gradient(135deg,#6271f6,#8198fb);padding:32px;text-align:center;">
      <h1 style="margin:0;color:white;font-size:24px;font-weight:700;">TeacherAI</h1>
    </div>
    <div style="padding:40px;">
      <h2 style="color:#f0f0f8;font-size:20px;margin:0 0 16px;">Passwort zurücksetzen</h2>
      <p style="color:#9999b3;font-size:15px;line-height:1.6;margin:0 0 8px;">Hallo ${name},</p>
      <p style="color:#9999b3;font-size:15px;line-height:1.6;margin:0 0 24px;">
        Sie haben angefordert, Ihr Passwort zurückzusetzen. Klicken Sie auf den Button, um ein neues Passwort festzulegen.
      </p>
      <div style="text-align:center;margin:32px 0;">
        <a href="${resetUrl}" style="display:inline-block;background:linear-gradient(135deg,#6271f6,#8198fb);color:white;text-decoration:none;padding:14px 32px;border-radius:12px;font-weight:600;font-size:15px;">
          Neues Passwort festlegen
        </a>
      </div>
      <p style="color:#666680;font-size:13px;line-height:1.5;">Dieser Link ist 1 Stunde gültig.</p>
      <p style="color:#666680;font-size:13px;line-height:1.5;">Falls Sie kein neues Passwort angefordert haben, können Sie diese E-Mail ignorieren.</p>
    </div>
    <div style="padding:24px;border-top:1px solid #1e1e2e;text-align:center;">
      <p style="color:#666680;font-size:12px;margin:0;">© ${new Date().getFullYear()} TeacherAI GmbH</p>
    </div>
  </div>
</body>
</html>`
}

export function twoFactorBackupCodesTemplate(name: string, codes: string[]): EmailPayload['html'] {
  const codesList = codes.map(c => `<div style="font-family:monospace;background:#1e1e2e;padding:8px 16px;border-radius:8px;color:#a5bcfd;font-size:14px;margin-bottom:8px;">${c}</div>`).join('')
  return `<!DOCTYPE html>
<html lang="de">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#0a0a0f;font-family:Inter,system-ui,sans-serif;">
  <div style="max-width:600px;margin:40px auto;background:#13131a;border:1px solid #1e1e2e;border-radius:16px;overflow:hidden;">
    <div style="background:linear-gradient(135deg,#6271f6,#8198fb);padding:32px;text-align:center;">
      <h1 style="margin:0;color:white;font-size:24px;font-weight:700;">TeacherAI – 2FA Backup-Codes</h1>
    </div>
    <div style="padding:40px;">
      <p style="color:#9999b3;font-size:15px;line-height:1.6;">Hallo ${name},<br><br>Hier sind Ihre Backup-Codes für die Zwei-Faktor-Authentifizierung. Bewahren Sie diese sicher auf.</p>
      <div style="margin:24px 0;">${codesList}</div>
      <p style="color:#e74c3c;font-size:13px;">⚠️ Jeder Code kann nur einmal verwendet werden. Generieren Sie neue Codes, sobald Sie alle verbraucht haben.</p>
    </div>
  </div>
</body>
</html>`
}

export function loginAlertTemplate(name: string, ip: string, device: string, time: string): EmailPayload['html'] {
  return `<!DOCTYPE html>
<html lang="de">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#0a0a0f;font-family:Inter,system-ui,sans-serif;">
  <div style="max-width:600px;margin:40px auto;background:#13131a;border:1px solid #1e1e2e;border-radius:16px;overflow:hidden;">
    <div style="background:linear-gradient(135deg,#f59e0b,#d97706);padding:32px;text-align:center;">
      <h1 style="margin:0;color:white;font-size:24px;font-weight:700;">⚠️ Neues Login erkannt</h1>
    </div>
    <div style="padding:40px;">
      <p style="color:#9999b3;font-size:15px;">Hallo ${name},</p>
      <p style="color:#9999b3;font-size:15px;line-height:1.6;">Es gab eine neue Anmeldung bei Ihrem TeacherAI-Konto.</p>
      <div style="background:#1e1e2e;border-radius:12px;padding:20px;margin:24px 0;">
        <p style="color:#9999b3;margin:0 0 8px;"><strong style="color:#f0f0f8;">Zeitpunkt:</strong> ${time}</p>
        <p style="color:#9999b3;margin:0 0 8px;"><strong style="color:#f0f0f8;">IP-Adresse:</strong> ${ip}</p>
        <p style="color:#9999b3;margin:0;"><strong style="color:#f0f0f8;">Gerät:</strong> ${device}</p>
      </div>
      <p style="color:#9999b3;font-size:13px;">Wenn das nicht Sie waren, ändern Sie sofort Ihr Passwort.</p>
    </div>
  </div>
</body>
</html>`
}
