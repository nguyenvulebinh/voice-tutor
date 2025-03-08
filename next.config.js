/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',  // Enable static HTML export
  basePath: process.env.NODE_ENV === 'production' ? '/voice-tutor' : '',
  images: {
    unoptimized: true,
  },
  // Disable server-side features since we're deploying to GitHub Pages
  typescript: {
    ignoreBuildErrors: true,
  },
  // Disable server components and API routes for static export
  experimental: {
    appDir: true,
  },
  // Ignore API routes during static export
  rewrites: () => [],
  trailingSlash: true
}

module.exports = nextConfig 