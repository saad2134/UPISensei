/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */

  // Disable source maps in development
  productionBrowserSourceMaps: false,
  
  // Optional: Completely disable source maps in development
  turbopack: (config, { dev, isServer }) => {
    if (dev) {
      config.devtool = false;
    }
    return config;
  },

  experimental: {
    serverComponentsExternalPackages: ['pdf-parse', 'pdf2pic', 'tesseract.js'],
  },

  devIndicators: false,
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
