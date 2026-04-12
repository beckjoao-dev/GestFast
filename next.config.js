/** @type {import('next').NextConfig} */
const nextConfig = {
  // Exclui bcryptjs e jsonwebtoken do bundle do cliente — ficam só no servidor
  serverExternalPackages: ['bcryptjs', 'jsonwebtoken'],

  eslint: {
    ignoreDuringBuilds: true,
  },

  typescript: {
    ignoreBuildErrors: true,
  },
}

module.exports = nextConfig
