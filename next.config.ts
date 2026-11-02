import type { NextConfig } from 'next'

import createMDX from '@next/mdx'
import remarkFrontmatter from 'remark-frontmatter'
import remarkMdxFrontmatter from 'remark-mdx-frontmatter'
// @ts-ignore
import bracketedSpans from 'remark-bracketed-spans'

const nextConfig: NextConfig = {
  poweredByHeader: false,
  pageExtensions: ['js', 'jsx', 'md', 'mdx', 'ts', 'tsx'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
    ],
  },
  reactStrictMode: true,
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
  async redirects() {
    return [{ source: '/inicio', destination: '/', permanent: true }]
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            // CSP laxa: las imágenes externas de las preguntas (URLs libres que pega el profe)
            // siguen cargando (`img-src *`); el resto se acota a orígenes propios + https.
            // Sin `form-action`: el signIn de next-auth es un POST que redirige al proveedor
            // (Google en prod, el IdP falso en dev) y Chrome aplica form-action a esa redirección.
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self' https: data: blob:",
              "img-src * data: blob:",
              "style-src 'self' 'unsafe-inline' https:",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https:",
              "connect-src * ws: wss:",
              "font-src 'self' data: https:",
              "frame-ancestors 'self'",
            ].join('; '),
          },
        ],
      },
    ]
  },
  webpack(config) {
    config.module.rules.push({
      test: /\.svg$/,
      use: [
        {
          loader: '@svgr/webpack',
          options: {
            ref: true,
            svgoConfig: {
              plugins: [
                {
                  name: 'preset-default',
                  params: {
                    overrides: {
                      // disable a default plugin
                      cleanupIds: false,
                      collapseGroups: false,
                    },
                  },
                },
              ],
            },
          },
        },
      ],
    })

    return config
  },
}

const withMDX = createMDX({
  options: {
    remarkPlugins: [remarkFrontmatter, bracketedSpans, [remarkMdxFrontmatter, { name: 'meta' }]],
  },
})

export default withMDX(nextConfig)
