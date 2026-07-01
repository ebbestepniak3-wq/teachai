// packages/types/index.ts – shared types & constants

export const PLAN_CONFIGS = {
  FREE: {
    name: 'Free',
    price: 0,
    bewertungenProMonat: 10,
    maxDateien: 2,
    speicherungStunden: 24,
    features: [
      '10 Bewertungen/Monat',
      '2 Dateien gleichzeitig',
      'Speicherung 24 Stunden',
      'Basis-Feedback',
      'E-Mail-Support',
    ],
  },
  BASIC: {
    name: 'Basic',
    price: 799, // Cent
    bewertungenProMonat: 20,
    maxDateien: 5,
    speicherungStunden: null, // unbegrenzt
    features: [
      '20 Bewertungen/Monat',
      '5 Dateien gleichzeitig',
      'Unbegrenzte Speicherung',
      'PDF-Export',
      'Detailliertes Feedback',
      'E-Mail-Support',
    ],
  },
  PRO: {
    name: 'Pro',
    price: 1299,
    bewertungenProMonat: 40,
    maxDateien: 10,
    speicherungStunden: null,
    features: [
      '40 Bewertungen/Monat',
      '10 Dateien gleichzeitig',
      'Unbegrenzte Speicherung',
      'PDF-Export',
      'KI-Assistent',
      'Statistiken & Analytics',
      'Prioritäts-Support',
    ],
  },
  MAX_PRO: {
    name: 'Max Pro',
    price: 1999,
    bewertungenProMonat: 80,
    maxDateien: 20,
    speicherungStunden: null,
    features: [
      '80 Bewertungen/Monat',
      '20 Dateien gleichzeitig',
      'Unbegrenzte Speicherung',
      'PDF-Export',
      'KI-Assistent',
      'Statistiken & Analytics',
      'API-Zugang',
      'Dedizierter Support',
    ],
  },
} as const

export type PlanKey = keyof typeof PLAN_CONFIGS

export interface AuthUser {
  id: string
  email: string
  name: string
  role: 'TEACHER' | 'ADMIN' | 'SUPPORT'
  avatarUrl?: string | null
  emailVerified: boolean
  plan: PlanKey
  twoFactorEnabled?: boolean
}

export interface JwtPayload {
  sub: string
  email: string
  role: string
  iat?: number
  exp?: number
}

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export type Role = 'TEACHER' | 'ADMIN' | 'SUPPORT'
export type Plan = keyof typeof PLAN_CONFIGS
export type GradingStatus = 'QUEUED' | 'PROCESSING' | 'DONE' | 'FAILED'
export type NotificationType =
  | 'GRADING_DONE'
  | 'GRADING_FAILED'
  | 'SUBSCRIPTION_RENEWED'
  | 'SUBSCRIPTION_EXPIRED'
  | 'QUOTA_WARNING'
  | 'SECURITY_ALERT'
  | 'SYSTEM'
