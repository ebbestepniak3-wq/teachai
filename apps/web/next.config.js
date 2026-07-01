/** @type {import("next").NextConfig} */
const nextConfig = {
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  transpilePackages: ["@teachai/types", "@teachai/database"],
  images: { remotePatterns: [{ protocol: "https", hostname: "*.supabase.co" }] },
  experimental: {
    serverComponentsExternalPackages: ["@prisma/client", "prisma"]
  }
}
module.exports = nextConfig
