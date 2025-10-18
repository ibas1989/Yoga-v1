/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  trailingSlash: false,
  // Fix for Next.js 15 clientReferenceManifest issue
  serverExternalPackages: [],
  generateEtags: false,
  poweredByHeader: false,
  compress: true,
  // Ensure proper static file serving
  staticPageGenerationTimeout: 1000,
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  // Fix for Next.js 15 static file serving
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
  // Ensure proper static file handling
  webpack: (config, { dev, isServer }) => {
    // Fix for static file serving issues
    if (!dev && !isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
      };
    }
    return config;
  },
  // Add security headers (only in production)
  async headers() {
    // Only apply strict CSP in production
    if (process.env.NODE_ENV === 'production') {
      return [
        {
          source: '/(.*)',
          headers: [
            {
              key: 'Content-Security-Policy',
              value: [
                "default-src 'self'",
                "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
                "style-src 'self' 'unsafe-inline'",
                "img-src 'self' data: blob:",
                "font-src 'self' data: blob: https:",
                "connect-src 'self'",
                "frame-ancestors 'none'",
              ].join('; '),
            },
            {
              key: 'X-Frame-Options',
              value: 'DENY',
            },
            {
              key: 'X-Content-Type-Options',
              value: 'nosniff',
            },
            {
              key: 'Referrer-Policy',
              value: 'origin-when-cross-origin',
            },
          ],
        },
        // PWA specific headers
        {
          source: '/manifest.json',
          headers: [
            {
              key: 'Cache-Control',
              value: 'public, max-age=31536000, immutable',
            },
          ],
        },
        {
          source: '/sw.js',
          headers: [
            {
              key: 'Cache-Control',
              value: 'public, max-age=0, must-revalidate',
            },
            {
              key: 'Service-Worker-Allowed',
              value: '/',
            },
          ],
        },
        {
          source: '/icon-(.*)',
          headers: [
            {
              key: 'Cache-Control',
              value: 'public, max-age=31536000, immutable',
            },
          ],
        },
      ];
    }
    return [];
  },
}

module.exports = nextConfig

