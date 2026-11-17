/**
 * `verify-doc-citations.ts` 의 **경로 접미사 해소** 헬퍼.
 *
 * **왜 별 모듈인가.** 검증기 본체는 최상위에서 `process.exit` 까지 하는 스크립트라 import 하면
 * 프로세스가 죽는다 — 테스트가 붙을 수 없다. 판정 로직만 여기로 빼서
 * `__test__/path-resolve.test.ts` 가 픽스처로 고정한다. 엔트리 동작은 건드리지 않는다.
 * ([[citation-drift.ts]] · [[citation-antecedent.ts]] 와 같은 이유·같은 형태다.)
 *
 * ## 왜 `basename` 이 아니라 `접미사` 인가
 *
 * 문서는 산문에서 **약칭**으로 파일을 가리킨다 — 표 앞 칸에 전체 경로를 적고, 설명에서는
 * `base-table/index.ts` 처럼 짧게 쓴다. 그것을 해소하지 못하면 검증기가 **모노레포 파일의
 * 약칭을 소비처 경로 후보로 분류**해 「소비처에 그 파일이 있어야 한다」고 요구한다.
 * 실측(upstream #192): 그렇게 만들어진 실패가 7건이었고 **5/5 가 소비처에 없는 파일**이었다.
 *
 * **`basename` 단독 해소로는 안 된다.** 이 저장소에서 `index.ts` 는 **92개**다(서로 다른
 * basename 604개 중 중복 33개 = 5.5%). 그래서 문서가 애초에 `base-table/index.ts` 로
 * **디렉터리 한 칸을 붙여** 적었다 — 그 한 칸이 유일성을 만든다. 접미사로 봐야 그 의도가 산다.
 *
 * ## 정확히 1건일 때만 해소한다
 *
 * 여러 건에 걸리면 **해소하지 않는다.** 아무거나 고르면(`[0]`) 검증기가 **엉뚱한 파일의 줄
 * 범위·내용을 검사하고 통과**한다 — 조용한 거짓 통과이고, 이 저장소에서 계속 잡아온 형태다.
 * 모호한 것은 모호하다고 말하고 실패로 남긴다. 문서가 한 칸 더 붙이면 해소된다.
 *
 * 경계는 **경로 구분자**다. `ase-tooltip.tsx` 가 `base-tooltip.tsx` 에 걸리면 안 되므로
 * `전체 일치` 또는 `'/' + 접미사` 로만 본다.
 */

/**
 * `rel` 을 경로 접미사로 갖는 파일들. 경계는 `/` 이고, 정렬해 돌려준다(호출자가 개수로 판정).
 *
 * @param rel 문서가 인용한 경로. 약칭(`base-table/index.ts`)이거나 전체 경로일 수 있다.
 * @param files 저장소 상대 경로 목록(`git ls-files` 출력 등).
 */
export function resolveBySuffix(rel: string, files: readonly string[]): string[] {
  const needle = rel.replace(/^\.\//, '')
  if (needle === '' || needle.startsWith('/')) return []
  const suffix = `/${needle}`
  return files.filter(f => f === needle || f.endsWith(suffix)).sort()
}

/**
 * 접미사로 **유일하게** 해소되는 경로. 0건이거나 2건 이상이면 `null`.
 *
 * 호출자는 `null` 을 「해소하지 못했다」로 다루고 실패·미검증으로 넘긴다 —
 * **아무거나 고르지 않는다**(위 주석).
 */
export function uniqueBySuffix(rel: string, files: readonly string[]): string | null {
  const hits = resolveBySuffix(rel, files)
  return hits.length === 1 ? hits[0] : null
}

/**
 * 기준 ref 들에 그 파일이 있는가. `true` 있다 · `false` 없다 · `null` **읽을 수 있는 ref 가
 * 하나도 없다**(shallow clone 등 — 판정 불가와 부재를 구분한다).
 *
 * ## 왜 접두 목록만으로는 안 됐나
 *
 * ref 조회는 접두 목록(`['', 'packages/afds/', …]`)으로 **정확한 경로**를 맞춰 봤다. 그런데
 * 워크트리 탐색(`searchRoots`)에는 `.changeset` 이 **있고** 접두 목록에는 **없었다** — 두 탐색이
 * 비대칭이라 `.changeset/` 의 파일은 ref 에서 영영 보이지 않았다.
 *
 * 실측(upstream #192): `base-ui-coverage-audit.md` 가
 * 「`afds-manifest-token-recovery.md` 가 `feat/jake` 에 이미 있다」고 서술하는데 **그 주장이 참**
 * 이었다(`f80ea4e` · `feat/jake` 모두 `.changeset/afds-manifest-token-recovery.md` 로 존재).
 * 검사기가 못 봐서 실패했을 뿐이다 — 완전 모드의 마지막 실패 1건이 이것이었다.
 *
 * **목록에 `.changeset/` 을 더하는 것으로 고치지 않는다.** 이 세션에서 「목록이 조용히 낡는다」를
 * 세 번 밟았다 — `REF_PREFIXES` · `findByBasename` 의 루트 · `run-all.sh` 의 스위트 목록. 다음
 * 디렉터리가 생기면 같은 결함이 재발한다. 그래서 **접미사 해소를 폴백으로 둔다.**
 *
 * ## 접두 검사를 지우지 않는 이유
 *
 * 접미사 해소는 **정확히 1건**만 인정하므로, ref 에 같은 이름이 여러 개면 해소하지 않는다.
 * 실측: 기준 ref 에서 `index.ts` 는 **93개** · `package.json` 9 · `CHANGELOG.md` 4 다. 접두
 * 검사를 지우면 그런 인용이 **보이던 것에서 안 보이는 것으로 뒤집힌다**(3 ref × 5건 측정).
 *
 * 그래서 접두 검사는 **빠른 정확 경로 확인**으로 남기고, 접미사는 **완결성**을 준다. 접두 목록이
 * 낡아도 이제 **누락을 만들지 않는다** — 그것이 이 배치의 요점이다.
 *
 * @param rel 문서가 인용한 경로(약칭일 수 있다).
 * @param refFiles ref 별 파일 목록. 읽을 수 없는 ref 는 `null` 로 넣는다.
 * @param prefixes 정확 경로 확인에 쓰는 접두 목록.
 */
export function existsOnRefFiles(
  rel: string,
  refFiles: readonly (readonly string[] | null)[],
  prefixes: readonly string[],
): boolean | null {
  let anyRefResolvable = false
  for (const files of refFiles) {
    if (files === null) continue
    anyRefResolvable = true
    if (prefixes.some(pre => files.includes(pre + rel))) return true
    if (uniqueBySuffix(rel, files)) return true
  }
  return anyRefResolvable ? false : null
}
