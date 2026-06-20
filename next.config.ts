import type { NextConfig } from "next";

const isProduction = process.env.NODE_ENV === 'production';

const nextConfig: NextConfig = {
  serverExternalPackages: ['@prisma/client'],
  typescript: {
    ignoreBuildErrors: true,
  },

  images: {
    formats: ['image/avif', 'image/webp'],
    unoptimized: false,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },

  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: isProduction
              ? 'public, max-age=3600, stale-while-revalidate=86400'
              : 'no-store, no-cache, must-revalidate, proxy-revalidate',
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
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains',
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              [
                "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
                'https://js.culqi.com',
                'https://3ds.culqi.com',
                'https://js.stripe.com',
                'https://hooks.stripe.com',
                'https://sdk.mercadopago.com',
                'https://*.mercadopago.com',
                'https://http2.mlstatic.com',
                'https://*.mlstatic.com',
                'https://www.mercadolibre.com',
                'https://*.mercadolibre.com',
              ].join(' '),
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https: blob:",
              "font-src 'self' data:",
              [
                'connect-src',
                "'self'",
                'https://*.supabase.co',
                'wss://*.supabase.co',
                'https://js.culqi.com',
                'https://3ds.culqi.com',
                'https://api.stripe.com',
                'https://merchant-ui-api.stripe.com',
                'https://api.mercadopago.com',
                'https://*.mercadopago.com',
                'https://sdk.mercadopago.com',
                'https://http2.mlstatic.com',
                'https://*.mlstatic.com',
                'https://www.mercadolibre.com',
                'https://*.mercadolibre.com',
              ].join(' '),
              [
                'frame-src',
                "'self'",
                'https://js.culqi.com',
                'https://checkout.culqi.com',
                'https://3ds.culqi.com',
                'https://checkoutview.culqi.com',
                'https://js.stripe.com',
                'https://hooks.stripe.com',
                'https://sdk.mercadopago.com',
                'https://*.mercadopago.com',
                'https://http2.mlstatic.com',
                'https://*.mlstatic.com',
                'https://www.mercadopago.com',
                'https://www.mercadolibre.com',
                'https://*.mercadolibre.com',
              ].join(' '),
            ].join('; '),
          },
        ],
      },
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, must-revalidate',
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
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
      {
        source: '/api/fichas-tecnicas/archivo',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'Content-Security-Policy',
            value: "frame-ancestors 'self'",
          },
        ],
      },
      {
        source: '/api/admin/ordenes-compra/:id/documento/preview',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'Content-Security-Policy',
            value: "frame-ancestors 'self'",
          },
        ],
      },
    ];
  },

  async redirects() {
    return [
      {
        source: '/login',
        destination: '/auth/login',
        permanent: false,
      },
      {
        source: '/login',
        destination: '/auth/login',
        permanent: false,
      },
    ];
  },
};

export default nextConfig;