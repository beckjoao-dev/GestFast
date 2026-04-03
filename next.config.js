/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Ignorar lint no build (opcional)
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Manter verificação de TypeScript (recomendado)
  typescript: {
    ignoreBuildErrors: false,
  },
}

module.exports = nextConfig