/**
 * DTCG alias 해석기
 *
 * alias {color.gray.500} → var(--color-afds-gray-500) 런타임 참조 변환
 * 빌드타임 인라인이 아닌 CSS var() 체인 방식 사용 (다크모드 동작 보장)
 */

import { ALIAS_PATTERN, extractAliasPath } from '../schema/dtcg.schema.js'

/**
 * 순환 참조 감지
 * alias chain을 따라가며 사이클 여부 확인
 *
 * 재귀 대신 반복(iterative) 방식 사용 — 선형 alias 체인이 매우 길 때
 * 스택 오버플로우를 방지한다.
 * 사이클 감지는 visited.has(current) 체크가 담당한다.
 * aliasMap에 없는 항목에 도달하거나 alias 형식이 아니면 종료된다.
 */
export function detectCircularAlias(start: string, aliasMap: Map<string, string>): boolean {
  const visited = new Set<string>()
  let current = start

  while (true) {
    if (visited.has(current)) return true
    visited.add(current)

    const target = aliasMap.get(current)
    if (!target) return false

    if (!ALIAS_PATTERN.test(target)) return false

    current = extractAliasPath(target)
  }
}
