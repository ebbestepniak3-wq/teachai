// app/layout.tsx – RC1: complete root layout
import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'
import { Toaster } from '@/components/ui/toaster'

const inter = Inter({
  subsets: ['latin'], preload: false,
  display: 'swap',
  variable: '--font-inter',
  preload: true,
})

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://teachai.de'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0d0f1a' },
  ],
  colorScheme: 'dark light',
}

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: 'TeacherAI – KI-gestützte Korrektur für Lehrkräfte',
    template: '%s | TeacherAI',
  },
  description:
    'TeacherAI hilft Lehrkräften in Deutschland, Klassenarbeiten, Tests und Klausuren mit KI schneller und präziser zu bewerten. Sparen Sie Stunden Korrekturarbeit pro Woche.',
  keywords: ['Lehrkraft', 'KI-Bewertung', 'Korrektur', 'Klassenarbeit', 'KI', 'Schule', 'Deutschland', 'DSGVO', 'KI-Korrektur'],
  authors: [{ name: 'TeacherAI GmbH', url: APP_URL }],
  creator: 'TeacherAI GmbH',
  publisher: 'TeacherAI GmbH',
  robots: { index: true, follow: true, googleBot: { index: true, follow: true } },
  openGraph: {
    type: 'website',
    locale: 'de_DE',
    url: APP_URL,
    siteName: 'TeacherAI',
    title: 'TeacherAI – KI-gestützte Korrektur für Lehrkräfte',
    description: 'Sparen Sie Stunden Korrekturarbeit pro Woche mit KI-gestützter Bewertung.',
    images: [{ url: `${APP_URL}/og-image.png`, width: 1200, height: 630, alt: 'TeacherAI' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TeacherAI – KI-gestützte Korrektur für Lehrkräfte',
    description: 'Sparen Sie Stunden Korrekturarbeit pro Woche.',
    images: [`${APP_URL}/og-image.png`],
    creator: '@teachai_de',
  },
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '32x32' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180' }],
  },
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'TeacherAI' },
  formatDetection: { telephone: false },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de" suppressHydrationWarning className={inter.variable}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="dns-prefetch" href="https://api.anthropic.com" />
        <link rel="dns-prefetch" href="https://js.stripe.com" />
      </head>
      <body className="min-h-dvh font-sans antialiased">
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  )
}
