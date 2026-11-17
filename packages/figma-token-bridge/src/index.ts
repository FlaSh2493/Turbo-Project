/**
 * figma-token-bridge — Public API
 */

export { generate, validate } from './generate.js'
export { extractFigmaVariables } from './extract.js'
export { defineConfig } from './config.js'
export { SAFE_SELECTOR_RE } from './config.js'

export type { GenerateResult } from './generate.js'
export type { TokenBridgeConfig, TierConfig, TypeScriptConfig } from './config.js'
export type { ValidationResult, ValidationMessage, ValidationLevel } from './schema/validate.js'
export type { DtcgFile, DtcgToken, DtcgGroup } from './schema/dtcg.schema.js'
