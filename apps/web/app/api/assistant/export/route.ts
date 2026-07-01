// app/api/assistant/export/route.ts
import { NextRequest } from 'next/server'
import { getServerUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { apiError, apiUnauthorized } from '@/lib/api-response'

export async function GET(request: NextRequest) {
  const jwtUser = await getServerUser()
  if (!jwtUser) return apiUnauthorized()

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  const format = searchParams.get('format') || 'markdown'

  if (!id) return apiError('Gespräch-ID erforderlich', 400)

  const conv = await prisma.assistantConversation.findFirst({
    where: { id, userId: jwtUser.sub },
  })

  if (!conv) return apiError('Gespräch nicht gefunden', 404)

  const messages = conv.messages as Array<{ role: string; content: string }>

  if (format === 'markdown') {
    let md = `# ${conv.title}\n\n`
    md += `_Erstellt am ${new Date(conv.createdAt).toLocaleDateString('de-DE')}_\n\n---\n\n`

    for (const msg of messages) {
      if (msg.role === 'user') {
        md += `**Du:** ${msg.content}\n\n`
      } else {
        md += `**TeacherAI:** ${msg.content}\n\n---\n\n`
      }
    }

    return new Response(md, {
      headers: {
        'Content-Type': 'text/markdown',
        'Content-Disposition': `attachment; filename="${conv.title.slice(0, 40).replace(/[^a-z0-9]/gi, '-')}.md"`,
      },
    })
  }

  if (format === 'pdf') {
    const html = buildChatHtml(conv.title, messages, new Date(conv.createdAt))

    try {
      const puppeteer = (await import('puppeteer')).default
      const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] })
      const page = await browser.newPage()
      await page.setContent(html, { waitUntil: 'networkidle0' })
      const pdf = await page.pdf({ format: 'A4', margin: { top: '15mm', right: '15mm', bottom: '15mm', left: '15mm' } })
      await browser.close()

      return new Response(Buffer.from(pdf), {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="chat-${id.slice(0, 8)}.pdf"`,
        },
      })
    } catch {
      // Fallback to HTML
      return new Response(html, {
        headers: {
          'Content-Type': 'text/html',
          'Content-Disposition': `attachment; filename="chat-${id.slice(0, 8)}.html"`,
        },
      })
    }
  }

  return apiError('Format nicht unterstützt (markdown oder pdf)', 400)
}

function buildChatHtml(
  title: string,
  messages: Array<{ role: string; content: string }>,
  date: Date
): string {
  const msgHtml = messages.map((msg) => `
    <div style="margin-bottom:20px;${msg.role === 'user' ? 'text-align:right' : ''}">
      <div style="
        display:inline-block;max-width:80%;padding:12px 16px;border-radius:16px;text-align:left;
        ${msg.role === 'user'
          ? 'background:linear-gradient(135deg,#6271f6,#8198fb);color:white'
          : 'background:#f3f4f6;color:#1f2937;border:1px solid #e5e7eb'}
      ">
        <p style="font-size:11px;font-weight:600;margin-bottom:6px;opacity:0.7">
          ${msg.role === 'user' ? 'Du' : 'TeacherAI'}
        </p>
        <div style="font-size:14px;line-height:1.6;white-space:pre-wrap">${escapeHtml(msg.content)}</div>
      </div>
    </div>
  `).join('')

  return `<!DOCTYPE html><html lang="de"><head><meta charset="UTF-8"><title>${escapeHtml(title)}</title></head>
<body style="font-family:Inter,sans-serif;max-width:800px;margin:40px auto;padding:0 20px">
  <div style="background:linear-gradient(135deg,#6271f6,#8198fb);color:white;padding:24px;border-radius:16px;margin-bottom:32px">
    <h1 style="margin:0;font-size:20px">${escapeHtml(title)}</h1>
    <p style="margin:8px 0 0;opacity:0.8;font-size:13px">${date.toLocaleDateString('de-DE')}</p>
  </div>
  ${msgHtml}
  <div style="margin-top:32px;text-align:center;font-size:12px;color:#9ca3af">
    Exportiert von TeacherAI · teachai.de
  </div>
</body></html>`
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}
