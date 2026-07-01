// app/api/admin/feature-flags/route.ts
import { NextRequest } from 'next/server'
import { getServerUser } from '@/lib/auth'
import { apiError, apiSuccess, apiForbidden, apiUnauthorized } from '@/lib/api-response'
import { getAllFlags, setFlag } from '@/lib/feature-flags'
import { audit } from '@/lib/audit/logger'
import { logger } from '@/lib/logger'

export async function GET(request: NextRequest) {
  const jwtUser = await getServerUser()
  if (!jwtUser) return apiUnauthorized()
  if (jwtUser.role !== 'ADMIN') return apiForbidden()

  return apiSuccess({ flags: getAllFlags() })
}

export async function PATCH(request: NextRequest) {
  const jwtUser = await getServerUser()
  if (!jwtUser) return apiUnauthorized()
  if (jwtUser.role !== 'ADMIN') return apiForbidden()

  try {
    const { key, enabled, rolloutPercent } = await request.json()
    if (!key) return apiError('Flag-Key erforderlich', 400)

    const updated = setFlag(key, {
      ...(enabled !== undefined ? { enabled } : {}),
      ...(rolloutPercent !== undefined ? { rolloutPercent } : {}),
    })

    await audit.adminAction(jwtUser.sub, `feature_flag_toggle:${key}:${enabled}`)
    logger.info('Feature flag updated', { key, enabled, by: jwtUser.sub })

    return apiSuccess(updated)
  } catch (error: any) {
    return apiError(error.message || 'Fehler beim Aktualisieren', 500)
  }
}
