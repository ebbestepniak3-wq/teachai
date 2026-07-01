// app/api/swagger/route.ts – OpenAPI specification endpoint
import { NextRequest } from 'next/server'

const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'TeacherAI API',
    description: 'REST-API für die TeacherAI KI-Bewertungsplattform. Alle Endpunkte erfordern Authentifizierung via HttpOnly Cookie, außer explizit angegeben.',
    version: '1.0.0',
    contact: { name: 'TeacherAI Support', email: 'api@teachai.de', url: 'https://teachai.de' },
    license: { name: 'Proprietär' },
  },
  servers: [
    { url: 'https://teachai.de/api', description: 'Produktion' },
    { url: 'http://localhost:3000/api', description: 'Entwicklung' },
  ],
  security: [{ cookieAuth: [] }],
  components: {
    securitySchemes: {
      cookieAuth: {
        type: 'apiKey',
        in: 'cookie',
        name: 'access_token',
        description: 'JWT Access Token (HttpOnly Cookie, 15min Gültigkeit)',
      },
    },
    schemas: {
      ApiResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          data: { type: 'object' },
          error: { type: 'string' },
        },
      },
      User: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'cuid' },
          email: { type: 'string', format: 'email' },
          name: { type: 'string' },
          role: { type: 'string', enum: ['TEACHER', 'ADMIN', 'SUPPORT'] },
          plan: { type: 'string', enum: ['FREE', 'BASIC', 'PRO', 'MAX_PRO'] },
          emailVerified: { type: 'boolean' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      Upload: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          fileName: { type: 'string' },
          fileSize: { type: 'integer' },
          fileType: { type: 'string' },
          status: { type: 'string', enum: ['PENDING', 'PROCESSING', 'READY', 'FAILED'] },
          pageCount: { type: 'integer', nullable: true },
          expiresAt: { type: 'string', format: 'date-time', nullable: true },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      GradingJob: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          uploadId: { type: 'string' },
          bundesland: { type: 'string' },
          schulform: { type: 'string' },
          klassenstufe: { type: 'string' },
          fach: { type: 'string' },
          aufgabentyp: { type: 'string' },
          status: { type: 'string', enum: ['QUEUED', 'PROCESSING', 'DONE', 'FAILED'] },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      GradingReport: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          gesamtpunkte: { type: 'number' },
          maximalpunkte: { type: 'number' },
          note: { type: 'string', example: '2+' },
          feedback: { type: 'string' },
          staerken: { type: 'array', items: { type: 'string' } },
          schwaechen: { type: 'array', items: { type: 'string' } },
          verbesserungsvorschlaege: { type: 'array', items: { type: 'string' } },
          finalisiertVon: { type: 'string', enum: ['AI', 'TEACHER'] },
        },
      },
      Error: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          error: { type: 'string', example: 'Fehlerbeschreibung' },
        },
      },
    },
    responses: {
      Unauthorized: {
        description: 'Nicht authentifiziert',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
      },
      Forbidden: {
        description: 'Keine Berechtigung',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
      },
      NotFound: {
        description: 'Nicht gefunden',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
      },
      TooManyRequests: {
        description: 'Rate limit überschritten',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
      },
    },
  },
  paths: {
    '/health': {
      get: {
        summary: 'Health Check',
        description: 'Service-Status für Load Balancer. Keine Authentifizierung erforderlich.',
        tags: ['System'],
        security: [],
        responses: {
          200: { description: 'Service ist verfügbar', content: { 'application/json': { schema: { type: 'object', properties: { status: { type: 'string' }, version: { type: 'string' } } } } } },
          503: { description: 'Service nicht verfügbar' },
        },
      },
    },
    '/auth/register': {
      post: {
        summary: 'Registrierung',
        tags: ['Auth'],
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'email', 'password', 'bundesland', 'schulform'],
                properties: {
                  name: { type: 'string', minLength: 2 },
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string', minLength: 8, description: 'Mindestens 8 Zeichen, 1 Großbuchstabe, 1 Zahl' },
                  bundesland: { type: 'string' },
                  schulform: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Registrierung erfolgreich' },
          409: { description: 'E-Mail bereits registriert' },
          422: { description: 'Validierungsfehler' },
          429: { $ref: '#/components/responses/TooManyRequests' },
        },
      },
    },
    '/auth/login': {
      post: {
        summary: 'Anmeldung',
        description: 'Setzt access_token und refresh_token als HttpOnly Cookies.',
        tags: ['Auth'],
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string' },
                  remember: { type: 'boolean', default: false },
                  twoFactorCode: { type: 'string', description: '6-stelliger TOTP-Code (bei 2FA)' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Login erfolgreich, Cookies gesetzt' },
          202: { description: '2FA erforderlich', content: { 'application/json': { schema: { type: 'object', properties: { requiresTwoFactor: { type: 'boolean' }, tempToken: { type: 'string' } } } } } },
          401: { description: 'Ungültige Anmeldedaten' },
          423: { description: 'Konto gesperrt (zu viele Fehlversuche)' },
          429: { $ref: '#/components/responses/TooManyRequests' },
        },
      },
    },
    '/auth/me': {
      get: {
        summary: 'Aktueller Nutzer',
        tags: ['Auth'],
        responses: {
          200: { description: 'Nutzerdaten', content: { 'application/json': { schema: { $ref: '#/components/schemas/User' } } } },
          401: { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },
    '/upload': {
      post: {
        summary: 'Datei hochladen',
        description: 'Multipart/form-data Upload. Löst OCR-Pipeline aus.',
        tags: ['Upload'],
        requestBody: {
          required: true,
          content: { 'multipart/form-data': { schema: { type: 'object', properties: { files: { type: 'array', items: { type: 'string', format: 'binary' } } } } } },
        },
        responses: {
          201: { description: 'Upload erfolgreich, OCR läuft' },
          400: { description: 'Ungültige Datei oder Validierungsfehler' },
          429: { description: 'Kontingent überschritten' },
        },
      },
      get: {
        summary: 'Eigene Uploads',
        tags: ['Upload'],
        parameters: [
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['PENDING', 'PROCESSING', 'READY', 'FAILED'] } },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
        ],
        responses: { 200: { description: 'Liste der Uploads' } },
      },
    },
    '/grading/prepare': {
      post: {
        summary: 'Bewertungsauftrag erstellen',
        tags: ['Grading'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['uploadId', 'bundesland', 'schulform', 'klassenstufe', 'fach', 'aufgabentyp'],
                properties: {
                  uploadId: { type: 'string' },
                  bundesland: { type: 'string' },
                  schulform: { type: 'string' },
                  klassenstufe: { type: 'string' },
                  fach: { type: 'string' },
                  aufgabentyp: { type: 'string', enum: ['KLASSENARBEIT', 'TEST', 'KLAUSUR', 'HAUSAUFGABE', 'PROJEKT', 'SONSTIGES'] },
                  bewertungsstrenge: { type: 'string', enum: ['STRENG', 'AUSGEWOGEN', 'KULANT'], default: 'AUSGEWOGEN' },
                  maxPunkte: { type: 'integer', minimum: 1, maximum: 1000 },
                  lehrerHinweise: { type: 'string', maxLength: 2000 },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Auftrag erstellt (Status: QUEUED)' },
          429: { description: 'Monatliches Kontingent erschöpft' },
        },
      },
    },
    '/grading/execute': {
      post: {
        summary: 'KI-Bewertung starten',
        tags: ['Grading'],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['jobId'], properties: { jobId: { type: 'string' } } } } } },
        responses: {
          200: { description: 'Bewertung gestartet (async)' },
          404: { description: 'Job nicht gefunden' },
        },
      },
    },
    '/grading/result': {
      get: {
        summary: 'Bewertungsergebnis',
        tags: ['Grading'],
        parameters: [
          { name: 'jobId', in: 'query', required: true, schema: { type: 'string' } },
        ],
        responses: {
          200: {
            description: 'Bewertungsergebnis',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/GradingReport' } } },
          },
        },
      },
    },
    '/assistant/chat': {
      post: {
        summary: 'KI-Assistent (Streaming)',
        description: 'Server-Sent Events (SSE) stream. Nur für PRO/MAX_PRO.',
        tags: ['Assistant'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['message'],
                properties: {
                  message: { type: 'string', maxLength: 10000 },
                  conversationId: { type: 'string', description: 'Optional: bestehende Unterhaltung fortführen' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'SSE Stream', content: { 'text/event-stream': { schema: { type: 'string' } } } },
          403: { description: 'Plan nicht ausreichend (PRO+ erforderlich)' },
        },
      },
    },
    '/stripe/checkout': {
      post: {
        summary: 'Checkout-Session erstellen',
        tags: ['Payments'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['plan'],
                properties: {
                  plan: { type: 'string', enum: ['BASIC', 'PRO', 'MAX_PRO'] },
                  interval: { type: 'string', enum: ['month', 'year'], default: 'month' },
                  couponCode: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Checkout-URL', content: { 'application/json': { schema: { type: 'object', properties: { checkoutUrl: { type: 'string', format: 'uri' } } } } } },
        },
      },
    },
    '/metrics': {
      get: {
        summary: 'Prometheus Metriken',
        description: 'Prometheus-kompatibler Metrics-Endpunkt. Erfordert METRICS_TOKEN in Authorization-Header.',
        tags: ['System'],
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Prometheus Text Format', content: { 'text/plain': { schema: { type: 'string' } } } },
        },
      },
    },
  },
  tags: [
    { name: 'Auth', description: 'Authentifizierung und Session-Verwaltung' },
    { name: 'Upload', description: 'Datei-Upload und OCR' },
    { name: 'Grading', description: 'KI-Bewertungssystem' },
    { name: 'Assistant', description: 'KI-Chat-Assistent' },
    { name: 'Payments', description: 'Stripe-Zahlungen und Abonnements' },
    { name: 'System', description: 'System-Status und Monitoring' },
  ],
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const format = searchParams.get('format') || 'json'

  if (format === 'json') {
    return Response.json(openApiSpec, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=3600',
      },
    })
  }

  // Swagger UI HTML
  const html = `<!DOCTYPE html>
<html>
<head>
  <title>TeacherAI API</title>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="stylesheet" type="text/css" href="https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.11.0/swagger-ui.css" >
</head>
<body>
<div id="swagger-ui"></div>
<script src="https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.11.0/swagger-ui-bundle.js"> </script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.11.0/swagger-ui-standalone-preset.js"> </script>
<script>
window.onload = function() {
  SwaggerUIBundle({
    url: "/api/swagger",
    dom_id: '#swagger-ui',
    presets: [SwaggerUIBundle.presets.apis, SwaggerUIStandalonePreset],
    layout: "StandaloneLayout",
    deepLinking: true,
    defaultModelsExpandDepth: 2,
    defaultModelExpandDepth: 2,
  })
}
</script>
</body>
</html>`

  return new Response(html, { headers: { 'Content-Type': 'text/html' } })
}
