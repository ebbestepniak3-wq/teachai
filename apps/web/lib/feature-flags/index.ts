// lib/feature-flags/index.ts – feature flag management

export interface FeatureFlag {
  key: string
  label: string
  description: string
  enabled: boolean
  plans: string[] // which plans get this feature (empty = all)
  rolloutPercent: number // 0-100
  createdAt: string
  updatedAt: string
}

// Default feature flags
export const DEFAULT_FLAGS: Omit<FeatureFlag, 'createdAt' | 'updatedAt'>[] = [
  {
    key: 'ai_assistant',
    label: 'KI-Assistent',
    description: 'KI-Chat-Assistent für Lehrkräfte',
    enabled: true,
    plans: ['PRO', 'MAX_PRO'],
    rolloutPercent: 100,
  },
  {
    key: 'batch_grading',
    label: 'Stapelverarbeitung',
    description: 'Mehrere Arbeiten gleichzeitig bewerten',
    enabled: false,
    plans: ['MAX_PRO'],
    rolloutPercent: 0,
  },
  {
    key: 'advanced_analytics',
    label: 'Erweiterte Statistiken',
    description: 'Detaillierte Klassen- und Schülerstatistiken',
    enabled: false,
    plans: ['PRO', 'MAX_PRO'],
    rolloutPercent: 0,
  },
  {
    key: 'api_access',
    label: 'API-Zugang',
    description: 'REST-API-Schlüssel für eigene Integrationen',
    enabled: false,
    plans: ['MAX_PRO'],
    rolloutPercent: 0,
  },
  {
    key: 'maintenance_mode',
    label: 'Wartungsmodus',
    description: 'Plattform für alle Nutzer sperren',
    enabled: false,
    plans: [],
    rolloutPercent: 0,
  },
  {
    key: 'new_onboarding',
    label: 'Neues Onboarding',
    description: 'Überarbeiteter Onboarding-Flow',
    enabled: false,
    plans: [],
    rolloutPercent: 50,
  },
]

// In-memory store (use DB/Redis in production)
const flagStore = new Map<string, FeatureFlag>(
  DEFAULT_FLAGS.map((f) => [
    f.key,
    { ...f, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  ])
)

export function getAllFlags(): FeatureFlag[] {
  return Array.from(flagStore.values())
}

export function getFlag(key: string): FeatureFlag | null {
  return flagStore.get(key) || null
}

export function setFlag(key: string, updates: Partial<FeatureFlag>): FeatureFlag {
  const existing = flagStore.get(key)
  if (!existing) throw new Error(`Feature flag '${key}' not found`)

  const updated: FeatureFlag = {
    ...existing,
    ...updates,
    key,
    updatedAt: new Date().toISOString(),
  }
  flagStore.set(key, updated)
  return updated
}

export function isFeatureEnabled(key: string, userId?: string, userPlan?: string): boolean {
  const flag = flagStore.get(key)
  if (!flag || !flag.enabled) return false

  // Check plan restriction
  if (flag.plans.length > 0 && userPlan && !flag.plans.includes(userPlan)) {
    return false
  }

  // Rollout check (deterministic based on userId)
  if (flag.rolloutPercent < 100 && userId) {
    const hash = userId.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0)
    return (hash % 100) < flag.rolloutPercent
  }

  return flag.rolloutPercent > 0
}

export function isMaintenanceMode(): boolean {
  return isFeatureEnabled('maintenance_mode')
}
