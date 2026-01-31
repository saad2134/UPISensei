/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */

  // Disable source maps in development
  productionBrowserSourceMaps: false,

  serverExternalPackages: ['pdf-parse', 'pdf2pic', 'tesseract.js'],

  devIndicators: false,
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
