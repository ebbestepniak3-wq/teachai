/** @type {import("next").NextConfig} */
const nextConfig = {
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  images: { remotePatterns: [{ protocol: "https", hostname: "*.supabase.co" }] },
  experimental: {
    serverComponentsExternalPackages: ["@prisma/client", "prisma"]
  },
  swcMinify: false,
  productionBrowserSourceMaps: false
}
module.exports = nextConfig
