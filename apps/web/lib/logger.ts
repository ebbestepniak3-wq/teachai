type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogEntry {
  level: LogLevel
  message: string
  timestamp: string
  context?: Record<string, unknown>
}

function createLog(level: LogLevel, message: string, context?: Record<string, unknown>): LogEntry {
  return {
    level,
    message,
    timestamp: new Date().toISOString(),
    context,
  }
}

function log(level: LogLevel, message: string, context?: Record<string, unknown>) {
  const entry = createLog(level, message, context)

  if (process.env.NODE_ENV === 'production') {
    // In production, output structured JSON for log aggregation
    console[level === 'debug' ? 'log' : level](JSON.stringify(entry))
  } else {
    // In development, pretty print
    const colors = {
      debug: '\x1b[36m',
      info: '\x1b[32m',
      warn: '\x1b[33m',
      error: '\x1b[31m',
    }
    const reset = '\x1b[0m'
    const color = colors[level]
    const prefix = `${color}[${level.toUpperCase()}]${reset}`
    const time = new Date().toLocaleTimeString('de-DE')

    if (context) {
      console[level === 'debug' ? 'log' : level](`${prefix} ${time} ${message}`, context)
    } else {
      console[level === 'debug' ? 'log' : level](`${prefix} ${time} ${message}`)
    }
  }
}

export const logger = {
  debug: (message: string, context?: Record<string, unknown>) => log('debug', message, context),
  info: (message: string, context?: Record<string, unknown>) => log('info', message, context),
  warn: (message: string, context?: Record<string, unknown>) => log('warn', message, context),
  error: (message: string, context?: Record<string, unknown>) => log('error', message, context),
}
