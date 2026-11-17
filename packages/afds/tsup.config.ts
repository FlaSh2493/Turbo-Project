import { defineConfig, type Options } from 'tsup'
import { readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

function collectEntries(dir: string, base: string): Record<string, string> {
  const entries: Record<string, string> = {}
  for (const item of readdirSync(dir)) {
    const full = join(dir, item)
    if (statSync(full).isDirectory()) {
      if (item === '__test__' || item === 'node_modules') continue
      Object.assign(entries, collectEntries(full, base))
    } else if (
      /\.(ts|tsx)$/.test(item) &&
      !/\.(stories|test)\.(ts|tsx)$/.test(item) &&
      item !== 'index.with-compositions.ts'
    ) {
      const key = relative(base, full).replace(/\.(ts|tsx)$/, '')
      entries[key] = full
    }
  }
  return entries
}

const entry: Record<string, string> = {
  ...collectEntries('src', 'src'),
}

const commonConfig: Options = {
  entry,
  dts: false,
  sourcemap: false,
  clean: true,
  external: ['react', 'react-dom', '@base-ui/react', 'lucide-react'],
  bundle: false,
}

const EMIT_CJS = false

const esmConfig: Options = {
  ...commonConfig,
  format: ['esm'],
  outExtension: () => ({ js: '.js' }),
}
const cjsConfig: Options = {
  ...commonConfig,
  format: ['cjs'],
  outExtension: () => ({ js: '.cjs' }),
}

export default defineConfig(EMIT_CJS ? [esmConfig, cjsConfig] : [esmConfig])
