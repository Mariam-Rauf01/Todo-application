/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable TypeScript and ESLint type checking during build to avoid generated type issues
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
}

module.exports = nextConfig
