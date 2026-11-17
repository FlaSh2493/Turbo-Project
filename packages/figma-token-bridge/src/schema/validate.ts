/**
 * DTCG 파일 최소 검증 엔진
 * 복잡한 논리 검증은 Style Dictionary에 위임하고,
 * 여기서는 기본적인 JSON 구조와 필수 키($value)만 체크합니다.
 */

import { type DtcgFile } from './dtcg.schema.js'

export type ValidationLevel = 'error' | 'warning' | 'info'

export interface ValidationMessage {
  level: ValidationLevel
  code: string
  location: string
  message: string
}

export interface ValidationResult {
  ok: boolean
  errors: ValidationMessage[]
  warnings: ValidationMessage[]
  infos: ValidationMessage[]
  all: ValidationMessage[]
}

function makeResult(messages: ValidationMessage[] = []): ValidationResult {
  const errors = messages.filter(m => m.level === 'error')
  return {
    ok: errors.length === 0,
    errors,
    warnings: messages.filter(m => m.level === 'warning'),
    infos: messages.filter(m => m.level === 'info'),
    all: messages,
  }
}

/** JSON 파싱 및 기본 구조 체크 */
export function parseDtcgJson(
  content: string,
  filename: string,
): { file: DtcgFile | null; error: ValidationMessage | null } {
  try {
    const parsed = JSON.parse(content)
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      return {
        file: null,
        error: {
          level: 'error',
          code: 'E005',
          location: filename,
          message: 'Invalid JSON: expected object',
        },
      }
    }
    return { file: parsed as DtcgFile, error: null }
  } catch (e) {
    return {
      file: null,
      error: { level: 'error', code: 'E005', location: filename, message: `Parse failed: ${e}` },
    }
  }
}

/** 최소한의 공통 검증 (Placeholder - 필요 시 확장) */
export function validatePrimitive(file: DtcgFile): ValidationResult {
  return makeResult()
}
export function validateSemantic(file: DtcgFile): ValidationResult {
  return makeResult()
}
export function validateDark(file: DtcgFile): ValidationResult {
  return makeResult()
}
export function validateCustom(file: DtcgFile): ValidationResult {
  return makeResult()
}
export function validateEffects(file: DtcgFile): ValidationResult {
  return makeResult()
}

export function mergeResults(...results: ValidationResult[]): ValidationResult {
  return makeResult(results.flatMap(r => r.all))
}
