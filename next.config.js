/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',  // Enable static exports
  basePath: '/voice-tutor',
  images: {
    unoptimized: true, // Required for static export
  },
  // Since we're deploying to GitHub Pages, we need to specify the base path
  // This should match your repository name, e.g., '/voice-tutor'
  // basePath: '/voice-tutor', // Uncomment and modify this when deploying to GitHub Pages
}

module.exports = nextConfig 