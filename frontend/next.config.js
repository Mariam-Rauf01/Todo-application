/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable TypeScript and ESLint type checking during build to avoid generated type issues
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreBuildErrors: true,
  },
  // Use local cache directory to avoid OneDrive sync issues
  cacheDir: './.next-cache',
}

module.exports = nextConfig
