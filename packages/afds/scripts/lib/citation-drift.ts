/**
 * `verify-doc-citations.ts` 의 줄 드리프트 판정 헬퍼.
 *
 * **왜 별 모듈인가.** 검증기 본체는 최상위에서 `process.exit` 까지 하는 스크립트라
 * import 하면 프로세스가 죽는다 — 테스트가 붙을 수 없다. 판정 로직만 여기로 빼서
 * `__test__/citation-drift.test.ts` 가 픽스처로 고정한다. 엔트리 동작은 건드리지 않는다.
 */

/**
 * 같은 내용이 있는 줄들 중 **인용한 줄에 가장 가까운 것**의 0-based 인덱스. 없으면 -1.
 *
 * **왜 첫 등장(`indexOf`)이 아닌가.** 내용이 흔한 줄이면 엉뚱한 곳을 가리킨다 — 실측
 * (upstream #196):
 *
 * | 인용 | 내용 | 파일 내 등장 | 첫 등장 기준 | 최근접 기준 |
 * | --- | --- | --- | --- | --- |
 * | `popover.tsx:141` | `return (` | 2회 | 98줄 어긋남 | **7줄** |
 * | `multi-select.tsx:340` | `{children}` | 2회 | 233줄 | **6줄** |
 * | `toast.tsx:90` | `{...props}` | 4회 | 50줄 | **4줄** |
 *
 * **로그가 틀린 줄을 알려주므로** 그것을 따라간 사람이 다른 코드를 본다. 그리고 어긋남
 * 거리를 게이트 입력으로 쓸 수 없게 만든다(같은 커밋에서 최대 233줄 → 11줄).
 *
 * 한계: 인용한 줄 근처에 같은 내용이 여러 번 있으면 여전히 어느 것인지 가릴 수 없다.
 * 다만 거리가 작아지는 쪽이므로 **「많이 밀렸다」는 거짓 신호는 나지 않는다.**
 *
 * @param near 인용된 줄 번호(1-based). 이 값에 가장 가까운 등장을 고른다.
 * @param exact `true` 면 문자열 완전 일치, `false` 면 앞뒤 공백을 무시한 일치.
 */
export function nearestIndex(
  lines: string[],
  needle: string,
  near: number,
  exact: boolean,
): number {
  const trimmed = needle.trim()
  let best = -1
  for (let i = 0; i < lines.length; i++) {
    if (exact ? lines[i] !== needle : lines[i].trim() !== trimmed) continue
    if (best < 0 || Math.abs(i + 1 - near) < Math.abs(best + 1 - near)) best = i
  }
  return best
}

/**
 * **위에 추가되는(prepend) 파일**인가 — 줄 번호로 가리키는 것이 원리적으로 유지되지 않는다.
 *
 * 실측(upstream #196): 인용 하나(`CHANGELOG.md:194-199`)의 네 줄이 `783·5·787·788` 로
 * 흩어졌고 **한 줄은 앞으로 갔다.** 새 항목이 위에 쌓이므로 아래로 밀리다가, 어떤 줄은
 * 새로 추가된 같은 내용에 먼저 걸린다.
 *
 * **드리프트 판정에서만 제외한다** — 파일·범위·심볼 실재 검사는 그대로 받는다. 이건 문서
 * 결함이 아니라 **검사 대상 선정 오류**다.
 */
export function isPrependOnlyPath(repoRelPath: string): boolean {
  return /(^|\/)CHANGELOG\.md$/.test(repoRelPath)
}
