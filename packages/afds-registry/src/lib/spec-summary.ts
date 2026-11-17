/**
 * `*.spec.md` 에서 한 줄 설명을 도출한다.
 *
 * **왜 도출하나.** 레지스트리에는 `name`·`dependencies`·`specFiles` 만 있었다. 그래서
 * 에이전트가 `AlertModal`·`NegativeModal`·`Modal` 을 **이름만으로 구분할 수 없었다** —
 * 사용자가 명시한 "무엇이 있는지 검색도 용이해야" 가 이름 검색까지만 가능했던 것이다.
 *
 * 그런데 그 설명은 이미 존재한다. 컴포지션 spec 은 전부 같은 구조다(실측 25/25):
 *
 *     # AlertModal
 *
 *     > 단일 확인 버튼만 가진 간단한 알림 모달.
 *
 *     ## Rules
 *
 * 손으로 다시 쓰지 않고 **소스에서 기계 도출**한다 — PR #101 이 의존성을 주석이 아니라
 * import 문에서 도출하기로 한 것과 같은 원칙이다. 손으로 쓰면 두 곳이 어긋난다.
 */

/**
 * H1 **바로 다음 문단**이 인용 블록일 때만 그것을 설명으로 채택한다.
 *
 * 예전에는 "첫 `##` 이전의 `^> ` 아무 줄" 을 채택했다. 그래서 구조를 검증하지 않고
 * **틀린 값을 통과시켰다**(실측):
 *
 *     # AlertModal
 *     <!--
 *     > hidden comment only        ← HTML 주석 안의 텍스트가 배포되는 설명이 됐다
 *     -->
 *
 *     > ⚠️ 내부 구현 경고 …        ← 경고 블록이 먼저 있으면 그것이 설명이 됐다
 *     > 실제 설명 …
 *
 * "비어 있으면 막는다" 는 지켜졌지만 **"틀린 것은 통과" 였다.** 그래서 위치를 단정한다:
 * H1 다음 공백을 건너뛴 **첫 내용**이 인용이어야 하고, H1 과 첫 `##` 사이에 인용 문단이
 * **둘 이상이면 모호하므로 고르지 않는다**(정본 spec 선택과 같은 규율).
 *
 * **한계를 밝혀 둔다.** 인용이 하나뿐인데 그 내용이 설명이 아니라 경고라면 구조로는
 * 구별할 수 없다 — 그건 파서 문제가 아니라 내용 문제다. 구조가 맞고 내용이 틀린 경우는
 * 이 검사가 잡지 못한다.
 */
export function extractSpecDescription(content: string): string | null {
  const lines = content.replace(/\r\n/g, '\n').split('\n')

  const h1 = lines.findIndex(l => /^#\s+\S/.test(l))
  if (h1 === -1) return null

  // H1 ~ 첫 `##` 구간만 본다. 그 뒤는 Rules·Examples 본문이다.
  let end = lines.length
  for (let i = h1 + 1; i < lines.length; i++) {
    if (/^##\s/.test(lines[i])) {
      end = i
      break
    }
  }

  /** 구간 안의 인용 문단들. 연속한 `>` 줄이 한 문단이다. */
  const quotes: string[] = []
  let current: string[] | null = null
  let firstContentIsQuote: boolean | null = null

  for (let i = h1 + 1; i < end; i++) {
    const line = lines[i]
    if (line.trim() === '') {
      if (current) {
        quotes.push(current.join(' '))
        current = null
      }
      continue
    }
    const m = /^>\s?(.*)$/.exec(line)
    if (m) {
      if (firstContentIsQuote === null) firstContentIsQuote = true
      current = current ? [...current, m[1].trim()] : [m[1].trim()]
      continue
    }
    // 인용이 아닌 내용 — HTML 주석·산문·코드펜스 등.
    if (firstContentIsQuote === null) firstContentIsQuote = false
    if (current) {
      quotes.push(current.join(' '))
      current = null
    }
  }
  if (current) quotes.push(current.join(' '))

  // H1 다음 첫 내용이 인용이 아니면 설명이 없는 것이다.
  if (firstContentIsQuote !== true) return null
  // 인용 문단이 둘 이상이면 어느 것이 설명인지 알 수 없다.
  if (quotes.length !== 1) return null

  const text = quotes[0].trim()
  return text === '' ? null : text
}

/**
 * 여러 spec 중 정본을 고른다.
 *
 * 컴포지션 2개가 spec 을 둘 가진다(`base-check-box`·`base-radio-group`) — 하위 컴포넌트별
 * 문서다. 둘 다 `<dirName>.spec.md` 가 존재하고 그것이 컴포지션 자체의 설명이다.
 * 규칙을 이름 일치로 두면 새 컴포지션이 늘어도 판정이 흔들리지 않는다.
 *
 * 이름이 일치하는 것이 없고 spec 이 하나면 그것을 쓴다. 여럿이면 **모호하므로 고르지 않는다**
 * — 임의로 하나를 집으면 어느 설명이 실린 것인지 아무도 모른다.
 */
export function pickCanonicalSpec(specFiles: string[], dirName: string): string | null {
  const exact = specFiles.find(f => f === `${dirName}.spec.md`)
  if (exact) return exact
  return specFiles.length === 1 ? specFiles[0] : null
}
