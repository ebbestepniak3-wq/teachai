/** @type {import("next").NextConfig} */
const nextConfig = {
  output: 'standalone',
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  images: { remotePatterns: [{ protocol: "https", hostname: "*.supabase.co" }] },
  experimental: {
    serverComponentsExternalPackages: ["@prisma/client", "prisma"]
  }
}
module.exports = nextConfig
