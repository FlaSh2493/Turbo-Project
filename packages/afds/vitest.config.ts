import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  resolve: {
    dedupe: ['react', 'react-dom', 'react-aria', 'react-stately'],
  },
  test: {
    server: {
      deps: {
        inline: [
          'react-aria',
          'react-stately',
          '@internationalized/date',
          '@react-aria/utils',
          '@react-aria/calendar',
          '@react-stately/calendar',
        ],
      },
    },
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    include: ['src/**/*.test.{ts,tsx}', 'scripts/**/*.test.ts'],
    exclude: ['node_modules', 'dist', '.turbo'],
    coverage: {
      provider: 'istanbul',
      reporter: ['text', 'json', 'html'],
      reportsDirectory: './coverage',
    },
  },
})
