/** @type {import('next').NextConfig} */
const nextConfig = {
  // Required for Docker standalone build
  output: process.env.BUILD_STANDALONE === 'true' ? 'standalone' : undefined,

  reactStrictMode: true,
  transpilePackages: ['@teachai/types', '@teachai/database'],

  experimental: {
    serverComponentsExternalPackages: [
      'bcryptjs', 'mammoth', 'pdf-parse', 'fflate', 'sharp', 'puppeteer',
    ],
  },

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/**',
      },
    ],
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 3600,
  },

  // Security headers on all routes
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ]
  },

  // Webpack optimization
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Exclude heavy server-only packages from client bundle
      config.externals = [...(config.externals || []), 'puppeteer', 'sharp']
    }
    return config
  },
}

module.exports = nextConfig
