import type { Metadata, Viewport } from 'next'
import './globals.css'
import { Providers } from './providers'
import { Toaster } from '@/components/ui/toaster'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#6271f6',
}

export const metadata: Metadata = {
  title: {
    default: 'TeacherAI – KI-gestützte Korrektur',
    template: '%s | TeacherAI',
  },
  description: 'KI-gestützte Bewertungsplattform für Lehrkräfte in Deutschland.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de" suppressHydrationWarning>
      <body className="min-h-dvh antialiased">
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  )
}
