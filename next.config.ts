import type { NextConfig } from 'next'

import createMDX from '@next/mdx'
import remarkFrontmatter from 'remark-frontmatter'
import remarkMdxFrontmatter from 'remark-mdx-frontmatter'
// @ts-ignore
import bracketedSpans from 'remark-bracketed-spans'

const nextConfig: NextConfig = {
  pageExtensions: ['js', 'jsx', 'md', 'mdx', 'ts', 'tsx'],
  reactStrictMode: true,
  logging: {
    fetches: {
      fullUrl: true,
    },
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
