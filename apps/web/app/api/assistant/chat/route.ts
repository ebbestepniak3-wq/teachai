// app/api/assistant/chat/route.ts – streaming Claude chat for the AI assistant
import { NextRequest } from 'next/server'
import { getServerUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { apiError, apiUnauthorized } from '@/lib/api-response'
import { logger } from '@/lib/logger'
import { PLAN_CONFIGS } from '@teachai/types'
import { z } from 'zod'

const schema = z.object({
  message: z.string().min(1).max(10000),
  conversationId: z.string().optional(),
  context: z.object({
    fach: z.string().optional(),
    klasse: z.string().optional(),
    bundesland: z.string().optional(),
  }).optional(),
})

const ASSISTANT_SYSTEM_PROMPT = `Du bist ein professioneller KI-Assistent für Lehrkräfte in Deutschland. Du unterstützt Lehrerinnen und Lehrer bei ihrer täglichen Arbeit.

DEINE KOMPETENZEN:
- Unterrichtsplanung und Stundenentwürfe erstellen
- Klassenarbeiten, Tests und Klausuren gestalten
- Arbeitsblätter und Übungsmaterialien entwickeln
- Musterlösungen formulieren
- Bewertungsraster und Notenschemata erstellen
- Elternbriefe und Mitteilungen schreiben
- Zeugnisbemerkungen und Formulierungsvorschläge
- Fachliche Fragen in allen Schulfächern beantworten
- Differenzierungsmaterial für unterschiedliche Leistungsniveaus
- Pädagogische und didaktische Beratung
- Allgemeine Wissensfragen

WICHTIGE REGELN:
1. Antworte immer auf Deutsch (außer bei expliziten Fremdsprachenaufgaben)
2. Strukturiere Antworten klar mit Überschriften und Listen wenn sinnvoll
3. Passe das Niveau an die genannte Klassenstufe an
4. Bei Klassenarbeiten: verschiedene Aufgabentypen verwenden
5. Sei präzise bei Punkteangaben und Notenberechnungen
6. Berücksichtige die deutschen Bildungsstandards und Lehrpläne
7. Weise auf Schulformunterschiede hin wenn relevant
8. Du bist kein Ersatz für pädagogische Eigenverantwortung

DATENSCHUTZ:
- Keine Schülernamen oder -daten in Antworten speichern
- Vertraulichkeit wahren`

export async function POST(request: NextRequest) {
  const jwtUser = await getServerUser()
  if (!jwtUser) return apiUnauthorized()

  try {
    const body = await request.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) return apiError('Ungültige Eingaben', 422)

    const { message, conversationId, context } = parsed.data

    // Check plan – assistant requires PRO or higher
    const user = await prisma.user.findUnique({
      where: { id: jwtUser.sub },
      include: { subscription: true },
    })

    if (!user) return apiUnauthorized()

    const plan = user.subscription?.plan || 'FREE'
    const hasAccess = ['PRO', 'MAX_PRO'].includes(plan)

    if (!hasAccess) {
      return apiError('Der KI-Assistent ist ab dem Pro-Plan verfügbar.', 403)
    }

    // Load or create conversation
    let conversation = conversationId
      ? await prisma.assistantConversation.findFirst({
          where: { id: conversationId, userId: jwtUser.sub },
        })
      : null

    const messages: Array<{ role: 'user' | 'assistant'; content: string }> =
      conversation ? (conversation.messages as any) : []

    // Add user message
    messages.push({ role: 'user', content: message })

    // Build system prompt with context
    let systemPrompt = ASSISTANT_SYSTEM_PROMPT
    if (context?.fach || context?.klasse || context?.bundesland) {
      systemPrompt += `\n\nKONTEXT DER LEHRKRAFT:\n`
      if (context.fach) systemPrompt += `- Fach: ${context.fach}\n`
      if (context.klasse) systemPrompt += `- Klasse/Stufe: ${context.klasse}\n`
      if (context.bundesland) systemPrompt += `- Bundesland: ${context.bundesland}\n`
    }

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      return apiError('KI-Service nicht konfiguriert', 503)
    }

    // Call Claude API with streaming
    const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-beta': 'messages-2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 4096,
        stream: true,
        system: systemPrompt,
        messages: messages.slice(-20), // keep last 20 messages for context
      }),
    })

    if (!claudeResponse.ok) {
      const err = await claudeResponse.text()
      logger.error('Assistant API error', { status: claudeResponse.status, err })
      return apiError('KI-Service vorübergehend nicht verfügbar', 503)
    }

    // Stream the response
    const encoder = new TextEncoder()
    let assistantMessage = ''

    const stream = new ReadableStream({
      async start(controller) {
        const reader = claudeResponse.body?.getReader()
        if (!reader) {
          controller.close()
          return
        }

        const decoder = new TextDecoder()
        let buffer = ''

        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break

            buffer += decoder.decode(value, { stream: true })
            const lines = buffer.split('\n')
            buffer = lines.pop() || ''

            for (const line of lines) {
              if (!line.startsWith('data: ')) continue
              const data = line.slice(6).trim()
              if (data === '[DONE]') continue

              try {
                const parsed = JSON.parse(data)

                if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
                  const text = parsed.delta.text
                  assistantMessage += text
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`))
                }

                if (parsed.type === 'message_stop') {
                  // Save to conversation
                  messages.push({ role: 'assistant', content: assistantMessage })

                  const title = messages[0]?.content?.slice(0, 60) || 'Gespräch'

                  if (conversation) {
                    await prisma.assistantConversation.update({
                      where: { id: conversation.id },
                      data: { messages: messages as any, updatedAt: new Date() },
                    })
                  } else {
                    conversation = await prisma.assistantConversation.create({
                      data: {
                        userId: jwtUser.sub,
                        title,
                        messages: messages as any,
                      },
                    })
                  }

                  // Log usage
                  await prisma.usageLog.create({
                    data: {
                      userId: jwtUser.sub,
                      action: 'ASSISTANT_MESSAGE',
                      metadata: {
                        conversationId: conversation.id,
                        messageLength: message.length,
                        responseLength: assistantMessage.length,
                      },
                    },
                  }).catch(() => {})

                  controller.enqueue(
                    encoder.encode(
                      `data: ${JSON.stringify({ done: true, conversationId: conversation.id })}\n\n`
                    )
                  )
                }
              } catch {}
            }
          }
        } finally {
          reader.releaseLock()
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
        'X-Accel-Buffering': 'no',
      },
    })
  } catch (error) {
    logger.error('Assistant chat error', { error })
    return apiError('Chat-Fehler', 500)
  }
}
