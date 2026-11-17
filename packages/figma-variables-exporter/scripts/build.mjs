import * as esbuild from 'esbuild'

const watch = process.argv.includes('--watch')

const ctx = await esbuild.context({
  entryPoints: ['src/plugin/main.ts'],
  bundle: true,
  platform: 'browser',
  target: 'es2017',
  outfile: 'dist/plugin/main.js',
  tsconfig: 'tsconfig.plugin.json',
})

if (watch) {
  await ctx.watch()
  console.log('watching...')
} else {
  await ctx.rebuild()
  ctx.dispose()
  console.log('plugin build complete')
}
