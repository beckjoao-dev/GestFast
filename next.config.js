/** @type {import('next').NextConfig} */
const nextConfig = {
  // Necessário para bcryptjs e jsonwebtoken no servidor
  serverExternalPackages: ['bcryptjs', 'jsonwebtoken'],

  // Ignorar erros de lint durante o build do Vercel
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Não falhar no build por erros de TypeScript (proteção extra)
  typescript: {
    ignoreBuildErrors: false,
  },
}

module.exports = nextConfig
