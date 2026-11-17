/**
 * figma-token-bridge Config 타입 정의
 */

/** namespace 유효성 검증 정규식 — CSS/TS 코드 인젝션 방어 */
export const NAMESPACE_RE = /^[a-z][a-z0-9-]{0,63}$/

export interface TierConfig {
  /** DTCG JSON 소스 파일 경로 */
  source: string
  /** 생성될 CSS 파일 경로 */
  output: string
  /** @theme 블록 생성 여부 (Tailwind v4 클래스 생성)
   * - true: @theme {} 블록 (primitive tier)
   * - 'inline': @theme inline {} 블록 (semantic/dark tier — afds- prefix 유틸리티 자동 생성)
   */
  tailwind?: boolean | 'inline'
  /** CSS 선택자 (dark tier: '.dark', 기본: ':root') */
  selector?: string
}

export interface TypeScriptConfig {
  /** 생성될 type-only .ts 파일 경로. 생략하면 type union 출력은 비활성화된다.
   * (zodOutput만으로 타입을 z.infer로 파생할 수 있으므로 선택 사항) */
  output?: string
  /** Zod schema 생성 여부 (output 기반 in-place zod, 일반적으로 false 권장) */
  zod?: boolean
  /** 토큰 값 런타임 배열(`export const X_VALUES = [...] as const`)을 별도 파일로 emit.
   * 지정 시 해당 경로에 type union과 동일한 값 목록을 const tuple로 출력한다.
   * 예: 'src/schemas/token-enums.ts' */
  valuesOutput?: string
  /** 토큰 zod 스키마(`export const XSchema = z.enum(X_VALUES)`)를 별도 파일로 emit.
   * `valuesOutput`이 함께 지정되어야 하며, 생성된 파일은 valuesOutput에서 값 배열을 import한다.
   * 예: 'src/schemas/tokens.schema.ts' */
  zodOutput?: string
}

export interface TokenBridgeConfig {
  /** CSS 변수 namespace (예: 'afds' → --color-afds-*, --afds-color-*) */
  namespace: string

  tiers: {
    primitive?: TierConfig
    semantic?: TierConfig
    dark?: TierConfig
    /** 프로젝트 고유의 합성 토큰(shadow / duration / typography 합성 등) */
    custom?: TierConfig
    /** 복합 효과 토큰(gradient 등) — @utility 블록 전용 */
    effects?: TierConfig
  }

  typescript?: TypeScriptConfig
}

/**
 * config 정의 helper — 타입 자동완성 지원
 * @example
 * export default defineConfig({ namespace: 'afds', tiers: { ... } })
 */
export function defineConfig(config: TokenBridgeConfig): TokenBridgeConfig {
  return config
}
export const SAFE_SELECTOR_RE = /^(?!.*url\s*\()[a-zA-Z0-9 \[\]()'"\:.,#>+~*_=-]+$/
