/**
 * DTCG (Design Tokens Community Group) 기본 구조 정의
 * 알맹이(값)가 무엇이든 '봉투'의 형식($value)만 맞으면 토큰으로 간주합니다.
 */

/** 단일 디자인 토큰의 최소 구조 */
export interface DtcgToken {
  $value?: any
  value?: any
  $type?: string
  $description?: string
  [key: string]: any // 그 외 커스텀 필드($extensions 등) 허용
}

/** 토큰 그룹 (중첩 가능) */
export type DtcgGroup = {
  [key: string]: DtcgToken | DtcgGroup | any
}

/** DTCG 파일 최상위 타입 */
export type DtcgFile = DtcgGroup

/** 헬퍼 함수: 토큰 객체인지 확인 (최소한의 디버깅용) */
export function isDtcgToken(value: any): value is DtcgToken {
  return value !== null && typeof value === 'object' && ('$value' in value || 'value' in value)
}

/** alias({path}) 패턴 */
export const ALIAS_PATTERN = /^\{[^}]+\}$/

/** alias 참조 경로 추출 ({color.gray.50} -> color.gray.50) */
export function extractAliasPath(alias: string): string {
  return alias.slice(1, -1)
}

/** 값이 alias({path}) 형식인지 확인 */
export function isAlias(value: any): value is string {
  return typeof value === 'string' && ALIAS_PATTERN.test(value)
}

/** 토큰 트리를 평탄화하여 [경로, 토큰] 배열로 반환 */
export function flattenTokens(group: DtcgGroup, prefix: string[] = []): Array<[string, DtcgToken]> {
  const result: Array<[string, DtcgToken]> = []
  for (const [key, value] of Object.entries(group)) {
    if (key.startsWith('$')) continue
    const path = [...prefix, key]
    if (isDtcgToken(value)) {
      result.push([path.join('.'), value as DtcgToken])
    } else if (typeof value === 'object' && value !== null) {
      result.push(...flattenTokens(value as DtcgGroup, path))
    }
  }
  return result
}
