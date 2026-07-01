// lib/validators.ts – Phase 3: all Zod schemas
import { z } from 'zod'

export const registerSchema = z.object({
  name: z.string().min(2, 'Name zu kurz').max(100, 'Name zu lang'),
  email: z.string().email('Ungültige E-Mail-Adresse'),
  password: z
    .string()
    .min(8, 'Mindestens 8 Zeichen')
    .regex(/[A-Z]/, 'Mindestens 1 Großbuchstabe erforderlich')
    .regex(/[0-9]/, 'Mindestens 1 Zahl erforderlich'),
  confirmPassword: z.string(),
  bundesland: z.string().min(1, 'Bitte Bundesland wählen'),
  schulform: z.string().min(1, 'Bitte Schulform wählen'),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'Passwörter stimmen nicht überein',
  path: ['confirmPassword'],
})

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  remember: z.boolean().optional(),
  twoFactorCode: z.string().optional(),
})

export const forgotPasswordSchema = z.object({
  email: z.string().email(),
})

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z
    .string()
    .min(8)
    .regex(/[A-Z]/)
    .regex(/[0-9]/),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'Passwörter stimmen nicht überein',
  path: ['confirmPassword'],
})

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z
    .string()
    .min(8, 'Mindestens 8 Zeichen')
    .regex(/[A-Z]/, 'Großbuchstabe fehlt')
    .regex(/[0-9]/, 'Zahl fehlt'),
  confirmNewPassword: z.string(),
}).refine((d) => d.newPassword === d.confirmNewPassword, {
  message: 'Passwörter stimmen nicht überein',
  path: ['confirmNewPassword'],
})

export const updateProfileSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  bundesland: z.string().optional(),
  schulform: z.string().optional(),
  schule: z.string().optional(),
  bio: z.string().max(500).optional(),
  language: z.string().optional(),
  timezone: z.string().optional(),
  faecher: z.array(z.string()).optional(),
  klassen: z.array(z.string()).optional(),
})

export const changeEmailSchema = z.object({
  newEmail: z.string().email(),
  password: z.string().min(1),
})

export const deactivateAccountSchema = z.object({
  password: z.string().min(1),
  action: z.enum(['deactivate', 'delete']),
  confirm: z.literal('BESTÄTIGEN'),
})

export const supportTicketSchema = z.object({
  subject: z.string().min(5, 'Betreff zu kurz').max(200),
  message: z.string().min(10, 'Nachricht zu kurz').max(5000),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).default('MEDIUM'),
})

export const twoFactorVerifySchema = z.object({
  code: z.string().length(6, '6-stelliger Code erforderlich').regex(/^\d+$/),
})

export const notificationSettingsSchema = z.object({
  notifyGradingDone: z.boolean().optional(),
  notifyQuotaWarning: z.boolean().optional(),
  notifyNewsletter: z.boolean().optional(),
  notifyEmail: z.boolean().optional(),
})
