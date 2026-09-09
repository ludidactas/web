import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    exclude: ['tests/**', 'node_modules/**'],
  },
})
