/**
 * figma-token-bridge 메인 파이프라인
 *
 * load → validate (minimal) → build (Style Dictionary)
 */

import { readFile, writeFile as fsWriteFile, mkdir, realpath } from 'node:fs/promises'
import path from 'node:path'
import {
  validatePrimitive,
  validateSemantic,
  validateDark,
  validateCustom,
  validateEffects,
  parseDtcgJson,
  mergeResults,
  type ValidationResult,
} from './schema/validate.js'
import { runTokenBridge } from './runner.js'
import { generateTypeScript, generateTokenValues, generateTokenSchemas } from './transform/to-ts.js'
import type { TokenBridgeConfig } from './config.js'
import { NAMESPACE_RE } from './config.js'
import type { DtcgFile } from './schema/dtcg.schema.js'

export interface GenerateResult {
  ok: boolean
  validation: ValidationResult
  generated: string[]
}

/** Path traversal 방어 */
async function assertWithinBase(resolved: string, base: string, label: string): Promise<void> {
  let realBase: string
  try {
    realBase = await realpath(path.resolve(base))
  } catch {
    realBase = path.resolve(base)
  }
  const normalizedBase = realBase + path.sep

  let realResolved: string | undefined
  try {
    realResolved = await realpath(resolved)
  } catch {
    let ancestor = path.dirname(resolved)
    const suffix = [path.basename(resolved)]
    while (ancestor !== path.dirname(ancestor)) {
      try {
        realResolved = (await realpath(ancestor)) + path.sep + suffix.join(path.sep)
        break
      } catch {
        suffix.unshift(path.basename(ancestor))
        ancestor = path.dirname(ancestor)
      }
    }
  }
  if (realResolved === undefined || !realResolved.startsWith(normalizedBase)) {
    throw new Error(`Path traversal detected: '${label}' is outside project base.`)
  }
}

async function loadJson(
  filePath: string,
  configDir: string,
): Promise<{ file: DtcgFile | null; error: string | null }> {
  const resolved = path.resolve(configDir, filePath)
  try {
    await assertWithinBase(resolved, configDir, filePath)
    const content = await readFile(resolved, 'utf-8')
    const { file, error } = parseDtcgJson(content, filePath)
    if (error) return { file: null, error: error.message }
    return { file, error: null }
  } catch (e) {
    return { file: null, error: String(e) }
  }
}

async function runValidationPipeline(
  config: TokenBridgeConfig,
  configDir: string,
): Promise<{
  validation: ValidationResult
  files: {
    primitive?: DtcgFile
    semantic?: DtcgFile
    dark?: DtcgFile
    custom?: DtcgFile
    effects?: DtcgFile
  }
}> {
  const { namespace, tiers } = config
  const messages: any[] = []

  if (!NAMESPACE_RE.test(namespace)) {
    throw new Error(`Invalid namespace: ${namespace}`)
  }

  const files: any = {}
  if (tiers.primitive) {
    const { file, error } = await loadJson(tiers.primitive.source, configDir)
    if (error) throw new Error(error)
    files.primitive = file
  }
  if (tiers.semantic) {
    const { file, error } = await loadJson(tiers.semantic.source, configDir)
    if (error) throw new Error(error)
    files.semantic = file
  }
  if (tiers.dark) {
    const { file, error } = await loadJson(tiers.dark.source, configDir)
    if (error) throw new Error(error)
    files.dark = file
  }
  if (tiers.custom) {
    const { file, error } = await loadJson(tiers.custom.source, configDir)
    if (error) throw new Error(error)
    files.custom = file
  }
  if (tiers.effects) {
    const { file, error } = await loadJson(tiers.effects.source, configDir)
    if (error) throw new Error(error)
    files.effects = file
  }

  // 최소한의 구조 검증 호출
  const results = [
    validatePrimitive(files.primitive),
    validateSemantic(files.semantic),
    validateDark(files.dark),
    validateCustom(files.custom),
    validateEffects(files.effects),
  ]

  return { validation: mergeResults(...results), files }
}

export async function generate(
  config: TokenBridgeConfig,
  configDir: string = process.cwd(),
): Promise<GenerateResult> {
  try {
    const { validation, files } = await runValidationPipeline(config, configDir)
    if (!validation.ok) return { ok: false, validation, generated: [] }

    await runTokenBridge(config, configDir)
    const generated = Object.values(config.tiers).map(t => t!.output)

    if (config.typescript) {
      if (config.typescript.output) {
        const ts = generateTypeScript(files.primitive, files.semantic, files.custom, config)
        const outPath = path.resolve(configDir, config.typescript.output)
        await mkdir(path.dirname(outPath), { recursive: true })
        await fsWriteFile(outPath, ts, 'utf-8')
        generated.push(config.typescript.output)
      }

      // 별도 values 파일이 필요할 때만 emit (zod 파일이 자립형으로 동작 가능)
      let valuesImportPath: string | undefined
      if (config.typescript.valuesOutput) {
        const valuesContent = generateTokenValues(
          files.primitive,
          files.semantic,
          files.custom,
          config,
        )
        const valuesPath = path.resolve(configDir, config.typescript.valuesOutput)
        await assertWithinBase(valuesPath, configDir, config.typescript.valuesOutput)
        await mkdir(path.dirname(valuesPath), { recursive: true })
        await fsWriteFile(valuesPath, valuesContent, 'utf-8')
        generated.push(config.typescript.valuesOutput)

        if (config.typescript.zodOutput) {
          const zodPath = path.resolve(configDir, config.typescript.zodOutput)
          const relImport = path
            .relative(path.dirname(zodPath), valuesPath)
            .replace(/\\/g, '/')
            .replace(/\.tsx?$/, '')
          valuesImportPath = relImport.startsWith('.') ? relImport : './' + relImport
        }
      }

      if (config.typescript.zodOutput) {
        const zodPath = path.resolve(configDir, config.typescript.zodOutput)
        await assertWithinBase(zodPath, configDir, config.typescript.zodOutput)
        const zodContent = generateTokenSchemas(
          files.primitive,
          files.semantic,
          files.custom,
          config,
          valuesImportPath,
        )
        await mkdir(path.dirname(zodPath), { recursive: true })
        await fsWriteFile(zodPath, zodContent, 'utf-8')
        generated.push(config.typescript.zodOutput)
      }
    }

    return { ok: true, validation, generated }
  } catch (e) {
    const msg = { level: 'error' as const, code: 'E010', location: 'pipeline', message: String(e) }
    return {
      ok: false,
      validation: { ok: false, errors: [msg], warnings: [], infos: [], all: [msg] },
      generated: [],
    }
  }
}

export async function validate(config: TokenBridgeConfig, configDir: string = process.cwd()) {
  const { validation } = await runValidationPipeline(config, configDir)
  return validation
}
