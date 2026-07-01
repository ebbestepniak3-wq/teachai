// app/robots.ts
import { MetadataRoute } from 'next'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://teachai.de'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/pricing', '/faq', '/datenschutz', '/impressum', '/nutzungsbedingungen', '/login', '/register'],
        disallow: [
          '/api/',
          '/dashboard/',
          '/upload/',
          '/grading/',
          '/assistant/',
          '/settings/',
          '/admin/',
          '/support/',
          '/notifications/',
        ],
      },
      {
        userAgent: 'GPTBot',
        disallow: ['/'],
      },
      {
        userAgent: 'ChatGPT-User',
        disallow: ['/'],
      },
    ],
    sitemap: `${APP_URL}/sitemap.xml`,
    host: APP_URL,
  }
}
