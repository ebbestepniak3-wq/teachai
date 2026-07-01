// components/seo/meta.tsx – complete SEO meta component

import { Metadata } from 'next'

export interface SeoConfig {
  title: string
  description: string
  path?: string
  image?: string
  noIndex?: boolean
  type?: 'website' | 'article' | 'product'
  publishedAt?: string
  author?: string
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://teachai.de'
const DEFAULT_IMAGE = `${APP_URL}/og-image.png`

export function generateSeoMetadata(config: SeoConfig): Metadata {
  const { title, description, path = '', image = DEFAULT_IMAGE, noIndex = false, type = 'website' } = config

  const fullTitle = title.includes('TeacherAI') ? title : `${title} – TeacherAI`
  const url = `${APP_URL}${path}`

  return {
    title: fullTitle,
    description,
    metadataBase: new URL(APP_URL),
    alternates: { canonical: url },
    robots: noIndex ? { index: false, follow: false } : { index: true, follow: true },
    openGraph: {
      title: fullTitle,
      description,
      url,
      siteName: 'TeacherAI',
      images: [{ url: image, width: 1200, height: 630, alt: title }],
      locale: 'de_DE',
      type,
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description,
      images: [image],
      creator: '@teachai_de',
      site: '@teachai_de',
    },
    other: {
      'og:logo': `${APP_URL}/logo.png`,
    },
  }
}

// JSON-LD structured data helpers
export function softwareApplicationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'TeacherAI',
    description: 'KI-gestützte Korrekturplattform für Lehrkräfte in Deutschland',
    url: APP_URL,
    applicationCategory: 'EducationApplication',
    operatingSystem: 'Web, iOS, Android',
    offers: [
      { '@type': 'Offer', name: 'Free', price: '0', priceCurrency: 'EUR' },
      { '@type': 'Offer', name: 'Basic', price: '7.99', priceCurrency: 'EUR', billingDuration: 'P1M' },
      { '@type': 'Offer', name: 'Pro', price: '12.99', priceCurrency: 'EUR', billingDuration: 'P1M' },
      { '@type': 'Offer', name: 'Max Pro', price: '19.99', priceCurrency: 'EUR', billingDuration: 'P1M' },
    ],
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      ratingCount: '127',
    },
    author: {
      '@type': 'Organization',
      name: 'TeacherAI GmbH',
      url: APP_URL,
    },
  }
}

export function organizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'TeacherAI GmbH',
    url: APP_URL,
    logo: `${APP_URL}/logo.png`,
    contactPoint: {
      '@type': 'ContactPoint',
      email: 'kontakt@teachai.de',
      contactType: 'customer support',
      availableLanguage: 'German',
    },
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Hamburg',
      addressCountry: 'DE',
    },
    sameAs: ['https://twitter.com/teachai_de', 'https://linkedin.com/company/teachai'],
  }
}

export function faqSchema(faqs: Array<{ question: string; answer: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: { '@type': 'Answer', text: faq.answer },
    })),
  }
}

// Component for injecting JSON-LD
export function JsonLd({ schema }: { schema: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}
