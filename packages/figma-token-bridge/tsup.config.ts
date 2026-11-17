import { defineConfig } from 'tsup'

export default defineConfig([
  // Library entry
  {
    entry: { index: 'src/index.ts' },
    format: ['esm', 'cjs'],
    outExtension: ({ format }) => ({ js: format === 'esm' ? '.mjs' : '.cjs' }),
    dts: true,
    clean: true,
    outDir: 'dist',
  },
  // CLI entry
  {
    entry: { 'cli/index': 'cli/index.ts' },
    format: ['esm'],
    outExtension: () => ({ js: '.mjs' }),
    dts: false,
    clean: false,
    outDir: 'dist',
    banner: {
      js: '#!/usr/bin/env node',
    },
  },
])
