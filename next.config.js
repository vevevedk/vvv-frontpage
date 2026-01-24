/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // Enable TypeScript strict mode - DO NOT ignore build errors
  typescript: {
    // Only ignore during incremental development, should be false for production
    ignoreBuildErrors: process.env.NEXT_PUBLIC_IGNORE_BUILD_ERRORS === 'true',
  },

  // ESLint configuration
  eslint: {
    // Only ignore during incremental development
    ignoreDuringBuilds: process.env.NEXT_PUBLIC_IGNORE_LINT_ERRORS === 'true',
  },

  // Environment variables for client-side
  env: {
    DB_HOST: process.env.DB_HOST || 'localhost',
    DB_USER: process.env.DB_USER || 'postgres',
    DB_PASSWORD: process.env.DB_PASSWORD || 'postgres',
    DB_NAME: process.env.DB_NAME || 'marketing_analytics',
    DB_PORT: process.env.DB_PORT || '5432',
  },

  // Performance optimizations
  swcMinify: true, // Use SWC for faster minification
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },

  // Image optimization
  images: {
    domains: ['localhost', 'veveve.dk', 'www.veveve.dk', 'veveve.io', 'www.veveve.io'],
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60,
  },

  // Compression and caching headers
  async headers() {
    return [
      {
        source: '/videos/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400, s-maxage=86400, stale-while-revalidate',
          },
        ],
      },
      {
        source: '/images/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, must-revalidate',
          },
        ],
      },
      {
        source: '/api/data/prices',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, s-maxage=3600, stale-while-revalidate=7200',
          },
        ],
      },
      {
        source: '/api/content/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, s-maxage=86400, stale-while-revalidate=172800',
          },
        ],
      },
    ];
  },

  // Webpack optimizations
  webpack: (config, { dev, isServer }) => {
    // Production optimizations
    if (!dev && !isServer) {
      config.optimization = {
        ...config.optimization,
        usedExports: true,
        sideEffects: false,
      };
    }

    return config;
  },

  // Enable experimental features for better performance
  experimental: {
    optimizeCss: true,
    scrollRestoration: true,
  },

  // Output configuration
  output: process.env.BUILD_STANDALONE === 'true' ? 'standalone' : undefined,

  // Disable x-powered-by header for security
  poweredByHeader: false,
}

module.exports = nextConfig