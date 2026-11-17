/**
 * `verify-doc-citations.ts` 의 **경로 인용 분류** 헬퍼.
 *
 * **왜 별 모듈인가.** 검증기 본체는 최상위에서 `process.exit` 까지 하는 스크립트라 import 하면
 * 프로세스가 죽는다 — 테스트가 붙을 수 없다. 판정만 여기로 빼서
 * `__test__/path-citation.test.ts` 가 픽스처로 고정한다. 엔트리 동작은 건드리지 않는다.
 * ([[citation-drift.ts]] · [[citation-antecedent.ts]] · [[path-resolve.ts]] 와 같은 형태다 —
 * 이 파일에서 같은 제약을 네 번째로 우회한다.)
 *
 * ## ★ 여기서는 **분기 순서가 정확성의 근거**다
 *
 * 그래서 판정을 함수 **하나**에 담았다. 조각으로 나누면 순서를 픽스처가 잡지 못한다 —
 * 실측된 회귀가 정확히 그 형태였다.
 *
 * PR #205 가 「경로 모호」 판정을 넣을 때 그것을 **`repoScoped` 판정보다 앞**에 뒀다. 그래서
 * 소비처가 **자기 도구 설정**을 가리키는 인용이 「모호」로 실패했다 — 실측
 * (`packages/afds-registry/README.md:87` 은 소비자에게 자기 `vite.config.ts` 의 `resolve.alias` 를
 * 설정하라고 안내하는데, 우리 저장소에 무관한 `vite.config.ts` 가 2개 있다):
 *
 * ```
 * #205 전  EXIT=0 · 실패 0 · 미검증 21   ← 「소비처 경로 — 판정 불가」로 올바르게 분류됐다
 * #205 후  EXIT=1 · ★ 경로 모호: vite.config.ts … 디렉터리를 한 칸 더 붙여라
 * ```
 *
 * **「디렉터리를 한 칸 더 붙여라」는 그 경우 틀린 안내다** — 소비자에게 우리 저장소 경로를
 * 붙이라고 말하는 셈이다. PR #213 이 순서를 고쳤고, 이 모듈이 그 순서를 고정한다.
 *
 * ## 판정 순서 (위에서 아래로, 먼저 맞는 것이 이긴다)
 *
 * 1. **워크트리 탐색으로 해소** — `searchRoots`(소비처 루트가 설정되면 거기까지 포함한다)
 * 2. **basename 해소** — 디렉터리 구분자가 없는 약칭만. afds·소비처 루트를 훑는다
 * 3. **경로 접미사 해소** — 저장소 전체에서 **정확히 1건**일 때만([[path-resolve.ts]])
 * 4. **기준 ref 해소** — 워크트리에 없어도 기준 ref 에 있으면 실재로 인정한다
 * 5. **기준 ref 조회 불가** — ref 는 지정됐는데 읽을 수 없다(shallow clone). **부재가 아니다**
 * 6. **저장소 내부 주장** — 여기서만 「모호」를 낸다. 모호가 아니면 「미확인」
 * 7. **범위 밖** — 소비처 루트가 없으면 미검증, 있는데도 없으면 미확인
 *
 * 6번이 7번보다 **뒤에 오면** 저장소 내부 인용이 소비처 판정으로 새고, 6번의 모호가 7번보다
 * **앞에 오면** 위 회귀가 난다. 둘 다 픽스처로 고정한다.
 */

/** 판정에 필요한 관측값. 부수효과(fs·git)는 호출자가 미리 재서 넘긴다 — 그래서 순수하다. */
export interface PathProbe {
  /** `searchRoots` 중 하나에 실재하는가. */
  existsInSearchRoots: boolean
  /** `findByBasename` 이 찾은 수. 디렉터리 구분자가 없는 약칭에만 의미가 있다. */
  basenameHits: number
  /** 저장소 전체에서 경로 접미사로 걸린 파일들. */
  suffixHits: readonly string[]
  /** 기준 ref 조회 결과. `null` 은 **읽을 수 있는 ref 가 없다**(부재가 아니다). */
  onRef: boolean | null
  /** 기준 ref 가 설정돼 있는가. */
  hasRefs: boolean
  /** 저장소 내부를 가리키는 주장인가(`isRepoScoped`). */
  repoScoped: boolean
}

export type PathVerdict =
  /** 실재를 확인했다. `via` 는 어느 단계가 해소했는지 — 순서 회귀를 픽스처가 짚을 수 있게 남긴다. */
  | { kind: 'resolved'; via: 'search-roots' | 'basename' | 'suffix' | 'ref' }
  /** 기준 ref 를 읽을 수 없어 판정 불가. 부재로 뭉개면 shallow clone 에서 거짓 실패가 난다. */
  | { kind: 'ref-unverifiable' }
  /** **저장소 내부 주장**인데 접미사가 여러 건에 걸린다 — 붙일 디렉터리를 안내한다. */
  | { kind: 'ambiguous'; hits: readonly string[] }
  /** 저장소 내부 주장인데 없다. */
  | { kind: 'missing' }
  /**
   * 저장소 범위 밖을 가리킨다 — **판정하지 않는다**(실패가 아니다).
   *
   * 소비처 저장소를 대조하던 경로는 걷어냈다. 그 검사는 CI 에 배선된 적이 없어(#209)
   * 실질 강제가 0 이었고, 대조 대상이 없는 주장은 여기서 미검증으로 집계된다.
   */
  | { kind: 'consumer-unverified' }

/**
 * 경로 인용 하나를 분류한다. 위 주석의 순서를 그대로 따른다.
 *
 * @param p 문서가 인용한 경로(약칭일 수 있다). `basenameHits` 의 적용 여부를 가리는 데 쓴다.
 */
export function classifyPathCitation(p: string, probe: PathProbe): PathVerdict {
  if (probe.existsInSearchRoots) return { kind: 'resolved', via: 'search-roots' }
  if (!p.includes('/') && probe.basenameHits > 0) return { kind: 'resolved', via: 'basename' }
  if (probe.suffixHits.length === 1) return { kind: 'resolved', via: 'suffix' }
  if (probe.onRef === true) return { kind: 'resolved', via: 'ref' }
  if (probe.onRef === null && probe.hasRefs) return { kind: 'ref-unverifiable' }

  // 저장소 내부 주장은 소비처 유무와 무관하게 실패다. **모호는 여기서만 낸다.**
  if (probe.repoScoped) {
    if (probe.suffixHits.length > 1) return { kind: 'ambiguous', hits: probe.suffixHits }
    return { kind: 'missing' }
  }

  return { kind: 'consumer-unverified' }
}

/**
 * 문서의 백틱 인용에서 **파일 경로 후보**를 뽑는다. 파일시스템을 만지지 않는 순수 함수다.
 *
 * 인정하는 형태는 확장자로 끝나는 백틱 인용이고, `파일:줄` 의 줄 부분은 떼어 낸다.
 *
 * ## 무엇을 자리표시자로 보아 건너뛰는가
 *
 * 문서는 규약을 설명할 때 **틀**을 인용한다 — `src/bricks/<category>/<name>/<name>.spec.md`
 * 처럼. 그것을 실재 경로로 검사하면 **영구 거짓 양성**이 된다.
 *
 * 두 형태를 건너뛴다.
 *
 * 1. **글롭** — `*` 를 포함한다(`*.spec.md`). 특정 파일 인용이 아니다.
 * 2. **꺾쇠 자리표시자** — `<` 또는 `>` 를 포함한다(`<name>.schema.ts` · `<composition>/hooks/x.ts`).
 *
 * **왜 구문 규칙이 안전한가.** 꺾쇠는 파일 이름에 쓰이지 않는다 — 실측(upstream #214):
 * `git ls-files` 에서 `[<>]` 를 포함하는 추적 파일이 **저장소 0건 · 소비처 0건**이다. 즉 이
 * 규칙이 진짜 인용을 삼킬 수 없다.
 *
 * **왜 문서별 예외 목록으로 두지 않는가.** `fixtures`·`notPaths` 는 죽은 예외 검사가 있어
 * 낡지는 않지만(문서에서 사라지면 실패한다), 꺾쇠 인용은 **어느 문서에서든 예외 없이**
 * 자리표시자다. 문서마다 같은 항목을 다시 적는 것은 순수한 의식이다 — 실측: 이 규칙 이전에
 * `<Component>/index.tsx` 가 `fixtures` 에 손으로 등재돼 있었다.
 *
 * **판단하지 않는 것**: 꺾쇠가 있어도 확장자로 끝나지 않으면 애초에 경로 후보가 아니다
 * (`<a>` · `<Select.Trigger render={<button/>} />` 같은 JSX·HTML 인용 70여 건이 그렇다).
 * 그것들은 심볼·파트 축의 문제이고 이 함수의 관심사가 아니다.
 */
export function extractPathCitations(doc: string): string[] {
  const out = new Set<string>()
  for (const m of doc.matchAll(/`([^`\n]+)`/g)) {
    let t = m[1].trim()
    const lm = t.match(/^([^\s:]+):(\d+)(?:[-\u2013](\d+))?$/)
    if (lm) t = lm[1]
    if (!/\.(ts|tsx|md|mdx|css|json|js|sh|txt|ya?ml)$/.test(t)) continue
    if (/^\.[a-z.]+$/.test(t)) continue // 확장자 조각
    if (t.includes('*')) continue // 글롭 패턴 — 특정 파일 인용이 아니다
    if (/[<>]/.test(t)) continue // 꺾쇠 자리표시자 — 위 주석
    out.add(t)
  }
  return [...out]
}
