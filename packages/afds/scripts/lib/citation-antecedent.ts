/**
 * `verify-doc-citations.ts` 의 **인용 추출** 헬퍼 — `파일:줄` 과 `:줄` 단독 인용을 뽑는다.
 *
 * **왜 별 모듈인가.** 검증기 본체는 최상위에서 `process.exit` 까지 하는 스크립트라
 * import 하면 프로세스가 죽는다 — 테스트가 붙을 수 없다. 추출·선행사 판정만 여기로 빼서
 * `__test__/citation-antecedent.test.ts` 가 픽스처로 고정한다. 엔트리 동작은 건드리지 않는다.
 * ([[citation-drift.ts]] 와 같은 이유·같은 형태다.)
 *
 * ## `:줄` 단독 인용의 선행사 — 무엇이 문제였나
 *
 * 문서는 「파일을 한 번 적고 그 아래 줄 번호만 나열」하는 표기를 쓴다:
 *
 * ```
 * `src/compositions/overflow-tooltip/overflow-tooltip.tsx`
 *
 * | 위치  | 내용                                                        |
 * | ----- | ----------------------------------------------------------- |
 * | `:7`  | … `open` · `onOpenChange` 가 남는다(`base-tooltip.tsx:27` · `:29`) |
 * | `:13` | 구조분해 … |
 * | `:28` | `<Tooltip …>` … |
 * ```
 *
 * 선행사를 **같은 블록(빈 줄로 구분) 안의 직전 파일명**으로만 잡으면, 표는 빈 줄이 없어
 * 통째로 한 블록이므로 **`:13` · `:28` 이 앞 행 산문에 등장한 `base-tooltip.tsx` 를 물려받는다.**
 * 그러면 검증기는 **문서가 하지 않은 인용**(`base-tooltip.tsx:13`)을 요구한다 —
 * 실측(upstream #192): 완전 모드 실패 10건 중 **2건이 이 방식으로 만들어진 것**이었다.
 *
 * 더 나쁜 것은 그 2건이 **거짓 통과로 뒤집힐 수 있다는 점**이다. `base-tooltip.tsx` 는 88줄이라
 * `:13` · `:28` 이 **범위 안**이고, 줄 드리프트는 게이트가 아니다. 그래서 해소 규칙만 넓히면
 * (basename·경로 접미사 해소) 이 결함은 **조용히 통과한다.** 순서가 있다 — 선행사를 먼저 고친다.
 *
 * ## 규칙
 *
 * 1. `파일:N` 은 그 자리에서 선행사를 갱신한다(기존과 같다).
 * 2. `:N` 단독은 **같은 블록의 직전 파일명**을 물려받는다(기존과 같다).
 * 3. **표 행에서는 규칙 2 를 쓰지 않는다.** 표의 행 머리 `:N` 은 「이 표의 주제 파일의 N번째
 *    줄」이라는 뜻이므로:
 *    - **그 행 안에** 앞서 나온 파일명이 있으면 그것을 쓴다(위 예의 `:29` → `base-tooltip.tsx`).
 *    - 없으면 **표의 주제**를 쓴다 — 표 바로 앞의 **주제 줄**(파일 인용만 있는 줄)에서만
 *      가져온다. 산문에 스친 파일명은 주제가 아니다.
 *    - **다른 행**의 파일명은 어떤 경우에도 쓰지 않는다.
 *
 * 첫 행과 뒷 행이 **같은 규칙**을 받는다는 점이 중요하다. 「다른 행에서 물려받은 경우만
 * 고친다」로 짜면 표의 첫 행(`:7`)은 문맥없음으로 남고 뒷 행만 주제를 쓴다 — 같은 표에서
 * 판정이 갈린다(픽스처를 쓰다 그 불일치가 드러났다).
 *
 * 3번의 범위를 「표 앞에서 아무 파일명이나 찾는다」로 넓히면 **반대 방향으로 틀린다** —
 * 산문에 스친 파일명을 주제로 오인해 없는 인용을 만들어낸다(아래 `SUBJECT_LINE` 주석의 실측).
 * 그래서 **표 바로 앞의 주제 줄**이라는 좁은 형태만 인정한다.
 */

/** 확장자 목록 — 인용으로 인정하는 파일 종류. */
const EXT = '(?:ts|tsx|md|mdx|css|json|js|sh|ya?ml)'

/**
 * `파일:N` · `파일:N-M` · **`파일:N,M`**(콤마 나열) · `:N` 단독을 모두 잡는다.
 *
 * 콤마형은 초안에서 세 검사 전부를 빠져나갔다 — `ToggleGroup.d.ts:99999,88888` 을 주입해도
 * 통과했고, 하필 A등급을 지탱하는 키보드 근거가 그 표기였다(독립 리뷰 적발).
 */
export const CITE = new RegExp(
  '`([a-zA-Z0-9_@./+-]+\\.' +
    EXT +
    ')(?::(\\d+)(?:[-–](\\d+))?((?:,\\d+)+)?)?`|`:(\\d+)(?:[-–](\\d+))?`',
  'g',
)

export interface Cite {
  file: string
  from: number
  to: number
  raw: string
  /** 이 인용이 적힌 **문서의 줄**. blame 유래를 여기서 찾는다. */
  docLine: number
}

export interface ExtractResult {
  cites: Cite[]
  /** 물려받을 파일이 없어 판정할 수 없는 `:N` 단독 인용. 조용히 넘기지 않고 드러낸다. */
  contextless: string[]
}

/** 인용 문자열을 **한 가지 형태로만** 만든다. */
function fmt(file: string, from: number, to: number): string {
  return to !== from ? `\`${file}:${from}-${to}\`` : `\`${file}:${from}\``
}

/**
 * 문서에서 줄 인용을 모두 뽑는다. 파일시스템을 만지지 않는 순수 함수다.
 *
 * @param doc 문서 전문
 */
export function extractCitations(doc: string): ExtractResult {
  const cites: Cite[] = []
  const contextless: string[] = []

  /** 문자 오프셋 → 문서 줄번호(1-based). */
  const lineOf = (() => {
    const starts: number[] = [0]
    for (let i = 0; i < doc.length; i++) if (doc[i] === '\n') starts.push(i + 1)
    return (off: number) => {
      let lo = 0,
        hi = starts.length - 1
      while (lo < hi) {
        const mid = (lo + hi + 1) >> 1
        if (starts[mid] <= off) lo = mid
        else hi = mid - 1
      }
      return lo + 1
    }
  })()

  /** 빈 줄로 구분되는 블록의 번호. */
  const blockOf = (() => {
    const bounds: number[] = []
    for (const b of doc.matchAll(/\n[ \t]*\n/g)) bounds.push(b.index! + b[0].length)
    return (off: number) => {
      let i = 0
      while (i < bounds.length && bounds[i] <= off) i++
      return i
    }
  })()

  const lines = doc.split('\n')
  /** 그 줄이 표 행인가 — `|` 로 시작하는 줄. */
  const isTableRow = (docLine: number): boolean => /^\s*\|/.test(lines[docLine - 1] ?? '')

  /**
   * **주제 줄** — 파일 인용 하나만 있고 다른 내용이 없는 줄.
   *
   * 이 형태를 요구하는 것이 규칙 3의 안전장치다. 「표 앞에서 파일명을 찾는다」로 느슨하게
   * 짜면 **산문에 스친 파일명**을 주제로 오인한다 — 실측: 검증기 자신의 동작을 서술하는 표
   * (`범위 초과 인용(:900)` · `범위 역전(:900-2)` · `6줄 파일에 :7` 같은 행)가 앞쪽 산문의
   * `segment-control.tsx` 를 주제로 잡아 **없는 줄 인용 6건을 새로 만들어냈다.** 그 행들은
   * 인용이 아니라 **테스트 입력의 서술**이다.
   */
  const SUBJECT_LINE = new RegExp('^\\s*`([a-zA-Z0-9_@./+-]+\\.' + EXT + ')`\\s*$')

  /**
   * 표의 **주제 파일**. 표 바로 앞(빈 줄만 건너뛴다)의 주제 줄에서만 가져온다. 위 규칙 3번이다.
   *
   * 이 문서의 실제 형태가 그렇다 — `주제 줄` · 빈 줄 · 표. 그 형태가 아니면 물려받지 않는다
   * (제목·산문·다른 표가 앞에 오면 문맥없음이다).
   */
  const subjectOfTable = (docLine: number): string | null => {
    let i = docLine
    while (i >= 1 && isTableRow(i)) i-- // 표 위로 올라간다
    while (i >= 1 && (lines[i - 1] ?? '').trim() === '') i-- // 빈 줄만 건너뛴다
    return SUBJECT_LINE.exec(lines[i - 1] ?? '')?.[1] ?? null
  }

  let ctxFile: string | null = null
  let ctxBlock = -1
  let ctxDocLine = -1

  for (const m of doc.matchAll(CITE)) {
    const blk = blockOf(m.index!)
    const docLine = lineOf(m.index!)

    if (m[1]) {
      ctxFile = m[1]
      ctxBlock = blk
      ctxDocLine = docLine
      if (!m[2]) continue
      const from = +m[2]
      const to = m[3] ? +m[3] : from
      cites.push({ file: m[1], from, to, raw: m[0], docLine })
      // `파일:58,61` 의 뒤쪽 줄들도 각각 검사 대상이다.
      for (const extra of (m[4] ?? '').split(',').filter(Boolean))
        cites.push({
          file: m[1],
          from: +extra,
          to: +extra,
          raw: fmt(m[1], +extra, +extra),
          docLine,
        })
      continue
    }

    const from = +m[5]
    const to = m[6] ? +m[6] : from

    // 규칙 3 — 표 행의 `:N` 은 **그 행 안**의 파일명, 없으면 **표의 주제**를 쓴다.
    // 다른 행 산문에 나온 파일명은 주제가 아니므로 절대 물려받지 않는다.
    let file: string | null
    if (isTableRow(docLine)) {
      file = ctxDocLine === docLine ? ctxFile : subjectOfTable(docLine)
    } else {
      file = ctxFile && blk === ctxBlock ? ctxFile : null
    }

    if (!file) {
      contextless.push(m[0])
      continue
    }
    // `raw` 를 직접 이어 붙이면 백틱이 끼어 ``파일`:29`` 로 깨진다(실측된 표시 결함).
    cites.push({ file, from, to, raw: fmt(file, from, to), docLine })
  }

  return { cites, contextless }
}
