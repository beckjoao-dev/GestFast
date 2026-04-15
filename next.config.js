/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // Next.js 14: a chave correta é dentro de experimental
  experimental: {
    serverComponentsExternalPackages: ['bcryptjs', 'jsonwebtoken', '@prisma/client', 'prisma'],
  },
}

module.exports = nextConfig
