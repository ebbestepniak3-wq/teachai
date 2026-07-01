import { NextResponse } from 'next/server'

export function apiSuccess<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status })
}

export function apiError(message: string, status = 400) {
  return NextResponse.json({ success: false, error: message }, { status })
}

export function apiUnauthorized(message = 'Nicht angemeldet') {
  return apiError(message, 401)
}

export function apiForbidden(message = 'Keine Berechtigung') {
  return apiError(message, 403)
}

export function apiNotFound(message = 'Nicht gefunden') {
  return apiError(message, 404)
}

export function apiServerError(message = 'Interner Serverfehler') {
  return apiError(message, 500)
}

export function apiValidationError(errors: Record<string, string[]>) {
  return NextResponse.json({ success: false, error: 'Validierungsfehler', errors }, { status: 422 })
}
