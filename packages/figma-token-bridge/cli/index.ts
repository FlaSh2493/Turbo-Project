/**
 * figma-token-bridge CLI
 * Usage: figma-token-bridge generate [--config <path>]
 */

import path from 'node:path'
import fs from 'node:fs'
import { realpath } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'
import { z } from 'zod'
import { generate, validate, extractFigmaVariables, SAFE_SELECTOR_RE } from '../src/index.js'
import { NAMESPACE_RE } from '../src/config.js'
import type { TokenBridgeConfig } from '../src/config.js'
import type { ValidationMessage } from '../src/schema/validate.js'

// ANSI colors
const c = {
  red: (s: string) => `\x1b[31m${s}\x1b[0m`,
  yellow: (s: string) => `\x1b[33m${s}\x1b[0m`,
  gray: (s: string) => `\x1b[90m${s}\x1b[0m`,
  green: (s: string) => `\x1b[32m${s}\x1b[0m`,
  bold: (s: string) => `\x1b[1m${s}\x1b[0m`,
}

function printMessage(msg: ValidationMessage, verbose: boolean) {
  if (msg.level === 'info' && !verbose) return
  const prefix =
    msg.level === 'error'
      ? c.red(`  ✗ [${msg.code}]`)
      : msg.level === 'warning'
        ? c.yellow(`  ⚠ [${msg.code}]`)
        : c.gray(`  ℹ [${msg.code}]`)
  console.log(`${prefix} ${msg.location}: ${msg.message}`)
}

/** Zod 기반 config 스키마 — CLI 진입점에서 deep validation */
const TierConfigSchema = z.object({
  source: z.string().min(1, 'source must be a non-empty string'),
  output: z.string().min(1, 'output must be a non-empty string'),
  tailwind: z.union([z.boolean(), z.literal('inline')]).optional(),
  selector: z.string().regex(SAFE_SELECTOR_RE, 'selector contains unsafe characters').optional(),
})

const TokenBridgeConfigSchema = z.object({
  namespace: z.string().regex(NAMESPACE_RE, 'namespace must match /^[a-z][a-z0-9-]{0,63}$/'),
  tiers: z.object({
    primitive: TierConfigSchema.optional(),
    semantic: TierConfigSchema.optional(),
    dark: TierConfigSchema.optional(),
    custom: TierConfigSchema.optional(),
    effects: TierConfigSchema.optional(),
  }),
  typescript: z
    .object({
      output: z.string().min(1, 'typescript.output must be a non-empty string').optional(),
      zod: z.boolean().optional(),
      valuesOutput: z
        .string()
        .min(1, 'typescript.valuesOutput must be a non-empty string')
        .optional(),
      zodOutput: z.string().min(1, 'typescript.zodOutput must be a non-empty string').optional(),
    })
    .optional(),
})

async function loadConfig(
  configPath: string,
): Promise<{ config: TokenBridgeConfig; dir: string } | null> {
  const resolved = path.resolve(process.cwd(), configPath)
  // CWD 범위 제한: config 파일은 반드시 현재 작업 디렉터리 내에 있어야 함
  // realpath로 symlink를 따라 정규화한 후 비교 (macOS /var → /private/var 오탐 방지)
  const cwd = path.resolve(process.cwd())
  const realCwd = await realpath(cwd).catch(() => cwd)
  const realResolved = await realpath(resolved).catch(() => resolved)
  if (!realResolved.startsWith(realCwd + path.sep) && realResolved !== realCwd) {
    console.error(c.red(`Config file must be within the current working directory.`))
    return null
  }
  if (!fs.existsSync(resolved)) {
    console.error(c.red(`Config file not found: ${path.relative(cwd, resolved)}`))
    return null
  }
  // 확장자 허용 목록 — .sh 등 비 JS/TS 파일 실행 방지
  const ALLOWED_CONFIG_EXTENSIONS = new Set(['.ts', '.js', '.mjs', '.cjs'])
  if (!ALLOWED_CONFIG_EXTENSIONS.has(path.extname(realResolved).toLowerCase())) {
    console.error(c.red(`Config file must have a .ts, .js, .mjs, or .cjs extension.`))
    return null
  }
  try {
    // realResolved 사용 — TOCTOU 방어 (resolved와 import 사이 symlink 교체 방지)
    const mod = await import(pathToFileURL(realResolved).href)
    const raw: unknown = mod.default ?? mod

    // Zod deep validation — shallow check 대신 스키마 기반 검증
    const parsed = TokenBridgeConfigSchema.safeParse(raw)
    if (!parsed.success) {
      const issues = parsed.error.issues
        .map(i => `  - ${i.path.join('.')}: ${i.message}`)
        .join('\n')
      console.error(c.red(`Invalid config:\n${issues}`))
      return null
    }

    return { config: parsed.data as TokenBridgeConfig, dir: path.dirname(resolved) }
  } catch (e) {
    console.error(c.red(`Failed to load config: ${e instanceof Error ? e.message : String(e)}`))
    return null
  }
}

function findDefaultConfig(): string | null {
  const candidates = ['token-bridge.config.ts', 'token-bridge.config.js', 'token-bridge.config.mjs']
  for (const candidate of candidates) {
    if (fs.existsSync(path.resolve(process.cwd(), candidate))) return candidate
  }
  return null
}

async function runGenerate(
  configArg: string | null,
  verbose: boolean,
  strict: boolean,
  quiet: boolean,
) {
  const configPath = configArg ?? findDefaultConfig()
  if (!configPath) {
    console.error(
      c.red('No config file found. Create token-bridge.config.ts or use --config <path>'),
    )
    process.exit(3)
  }

  const loaded = await loadConfig(configPath)
  if (!loaded) process.exit(3)

  const { config, dir } = loaded

  if (!quiet) console.log(c.bold('figma-token-bridge generate\n'))
  if (!quiet) console.log('Validating...')

  const result = await generate(config, dir)

  result.validation.all.forEach(msg => printMessage(msg, verbose))

  if (!result.ok) {
    console.log(c.red(`\n${result.validation.errors.length} error(s) found. Generation aborted.`))
    console.log('Fix the errors above and run again.')
    process.exit(1)
  }

  if (strict && result.validation.warnings.length > 0) {
    console.log(
      c.yellow(
        `\n${result.validation.warnings.length} warning(s) in strict mode. Generation aborted.`,
      ),
    )
    process.exit(2)
  }

  if (!quiet) {
    console.log('\nGenerating...')
    result.generated.forEach(f => console.log(c.green(`  ✓ ${f}`)))
    const warnCount = result.validation.warnings.length
    const infoCount = result.validation.infos.length
    const suffix = [
      warnCount > 0 ? `${warnCount} warning(s)` : '',
      infoCount > 0 && verbose ? `${infoCount} info(s)` : '',
      infoCount > 0 && !verbose ? `Run with --verbose to see ${infoCount} info message(s)` : '',
    ]
      .filter(Boolean)
      .join('. ')
    console.log(c.green(`\nDone.${suffix ? ' ' + suffix : ''}`))
  }
}

async function runValidate(configArg: string | null, verbose: boolean) {
  const configPath = configArg ?? findDefaultConfig()
  if (!configPath) {
    console.error(c.red('No config file found.'))
    process.exit(3)
  }

  const loaded = await loadConfig(configPath)
  if (!loaded) process.exit(3)

  const { config, dir } = loaded

  console.log(c.bold('figma-token-bridge validate\n'))
  const result = await validate(config, dir)

  result.all.forEach(msg => printMessage(msg, verbose))

  if (!result.ok) {
    console.log(c.red(`\n${result.errors.length} error(s) found.`))
    process.exit(1)
  }

  console.log(c.green('\nValidation passed.'))
}

async function runExtract(args: string[]) {
  const fileKeyIdx = args.indexOf('--file')
  const tokenIdx = args.indexOf('--token')
  const outDirIdx = args.indexOf('--out')

  const fileKey = fileKeyIdx !== -1 ? args[fileKeyIdx + 1] : process.env.FIGMA_FILE_KEY
  const token = tokenIdx !== -1 ? args[tokenIdx + 1] : process.env.FIGMA_ACCESS_TOKEN
  const outDir = outDirIdx !== -1 ? args[outDirIdx + 1] : './tokens/json'

  if (!fileKey) {
    console.error(c.red('Figma file key is required. Use --file <key> or FIGMA_FILE_KEY env.'))
    process.exit(3)
  }

  if (!token) {
    console.error(
      c.red('Figma access token is required. Use --token <token> or FIGMA_ACCESS_TOKEN env.'),
    )
    process.exit(3)
  }

  console.log(c.bold('figma-token-bridge extract\n'))
  try {
    await extractFigmaVariables({ fileKey, token, outDir })
    console.log(c.green('\nExtraction completed successfully.'))
  } catch (e) {
    console.error(c.red(`Extraction failed: ${e instanceof Error ? e.message : String(e)}`))
    process.exit(1)
  }
}

function printHelp() {
  console.log(`figma-token-bridge <command> [options]

Commands:
  generate   Generate CSS and TypeScript from DTCG JSON tokens
  validate   Validate DTCG JSON tokens without generating files
  extract    Extract variables from Figma and save as DTCG JSON

Options for generate/validate:
  --config   Path to config file (default: token-bridge.config.ts)
  --strict   Treat warnings as errors
  --verbose  Show info messages
  --quiet    Suppress success output

Options for extract:
  --file     Figma file key (or set FIGMA_FILE_KEY env)
  --token    Figma personal access token (or set FIGMA_ACCESS_TOKEN env)
  --out      Output directory for DTCG JSON files (default: ./tokens/json)

Note: Config files are executed as JavaScript/TypeScript modules.
      Only load config files from trusted sources.
`)
}

/** CLI 진입점 — 모듈 레벨 side effect 방지를 위해 main()으로 격리 */
async function main() {
  const args = process.argv.slice(2)
  const command = args[0]
  const configFlagIdx = args.indexOf('--config')
  // --config 다음 인수가 존재하고 플래그가 아닌 경우에만 config 경로로 사용
  const configArg =
    configFlagIdx !== -1 &&
    configFlagIdx + 1 < args.length &&
    !args[configFlagIdx + 1].startsWith('--')
      ? args[configFlagIdx + 1]
      : null
  const verbose = args.includes('--verbose')
  const strict = args.includes('--strict')
  const quiet = args.includes('--quiet')

  switch (command) {
    case 'generate':
      await runGenerate(configArg, verbose, strict, quiet)
      break
    case 'validate':
      await runValidate(configArg, verbose)
      break
    case 'extract':
      await runExtract(args)
      break
    default:
      if (command) {
        const safeCommand = command.replace(/[\x00-\x1f\x7f-\x9f]/g, '?').slice(0, 64)
        console.error(
          c.red(`Unknown command: '${safeCommand}'. Run without arguments to see help.`),
        )
        process.exit(3)
      }
      printHelp()
  }
}

main().catch(e => {
  console.error(e)
  process.exit(1)
})
