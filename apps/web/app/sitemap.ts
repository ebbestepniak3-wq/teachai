// app/sitemap.ts – automatic sitemap generation
import { MetadataRoute } from 'next'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://teachai.de'

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()

  // Static marketing pages
  const staticPages: MetadataRoute.Sitemap = [
    { url: APP_URL, lastModified: now, changeFrequency: 'weekly', priority: 1.0 },
    { url: `${APP_URL}/pricing`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${APP_URL}/faq`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${APP_URL}/kontakt`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${APP_URL}/datenschutz`, lastModified: now, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${APP_URL}/impressum`, lastModified: now, changeFrequency: 'monthly', priority: 0.3 },
    { url: `${APP_URL}/nutzungsbedingungen`, lastModified: now, changeFrequency: 'monthly', priority: 0.3 },
    { url: `${APP_URL}/login`, lastModified: now, changeFrequency: 'yearly', priority: 0.6 },
    { url: `${APP_URL}/register`, lastModified: now, changeFrequency: 'yearly', priority: 0.8 },
  ]

  return staticPages
}
