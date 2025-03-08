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
  }
}

module.exports = nextConfig 