import ts from 'typescript'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

/**
 * **의도된 사본이다.** `packages/afds/src/lib/__test__/story-determinism.analyzer.ts` 와
 * 로직이 같다 — afds 의 테스트 헬퍼라 공개 export 가 아니고 패키지 경계를 넘어 import 할
 * 수 없다. 컴포지션이 afds-registry 로 이전되며 날짜 계열 스토리 4개도 함께 왔다 — Storybook 은
 * 이 패키지의 스토리도 읽으므로 같은 결정성 검사가 필요하다. 판정 로직을 고치면
 * **양쪽을 함께** 고쳐야 한다.
 */
export interface StoryDeterminismViolation {
  file: string
  line: number
  expression: string
}

export interface StoryScanResult {
  violations: StoryDeterminismViolation[]
  /** 실제로 파싱한 `*.stories.tsx` 수. 0 이면 검사가 통째로 무력화된 것이다. */
  filesScanned: number
  /** 실제로 파싱한 파일 경로(루트 기준 상대). 어떤 파일이 빠졌는지 이름으로 확인하기 위한 것. */
  scannedFiles: string[]
}

/**
 * 실행할 때마다 값이 달라지는 호출. 렌더 중에 쓰이면 스냅샷이 매번 달라진다.
 *
 * **이 판정은 이름 기반 allowlist 다** — 아래 전역들을 *그 이름 그대로* 호출할 때만 잡는다.
 * 따라서 이름을 갈아끼우면 뚫린다. 실측으로 확인한 우회 경로:
 *   `const D = Date; new D()` · `const { now } = Date; now()` · `Foo[expr]()`
 * 이름을 지우는 우회를 잡으려면 타입체커(`ts.TypeChecker`)로 심볼을 따라가야 하는데,
 * 그러려면 프로그램 전체를 로드해야 해서 이 가드의 비용 특성이 달라진다.
 * **이 한계를 감춘 채 "전부 잡는다" 고 말하지 않는다** — 픽스처로 고정해 두고(아래 테스트),
 * 문서에 적는다. 스토리 파일에서 `Date` 를 별칭으로 감추는 것은 이 저장소에 전례가 없다.
 */
const NON_DETERMINISTIC_MEMBERS: ReadonlyArray<readonly [string, string]> = [
  ['Date', 'now'],
  ['Math', 'random'],
  ['performance', 'now'],
  ['crypto', 'randomUUID'],
]

/** `Date.now` 든 `Date['now']` 든 같은 호출이다 — 표기법 차이로 갈라지지 않게 둘 다 본다. */
const memberName = (expr: ts.Expression): readonly [string, string] | null => {
  if (ts.isPropertyAccessExpression(expr)) {
    return [expr.expression.getText(), expr.name.text]
  }
  if (ts.isElementAccessExpression(expr) && ts.isStringLiteralLike(expr.argumentExpression)) {
    return [expr.expression.getText(), expr.argumentExpression.text]
  }
  return null
}

/**
 * 이 파일이 `name` 을 **지역으로 선언하거나 import** 하는가.
 *
 * `Date(…)` 를 이름만 보고 잡으면 `import { Date } from './date-util'` 이나
 * `const Date = …` 로 가려진 것까지 잡는다(실측 오탐). 그래서 파일이 그 이름을 직접 만들면 비켜준다.
 *
 * **이 검사는 스코프를 보지 않는다 — 그래서 방향이 fail-open 이다.** 파일 어느 구석에서든
 * `Date` 를 선언하면 그 파일의 진짜 전역 `Date()` 호출까지 함께 면제된다. 이 가드의 다른
 * 판정들과 방향이 반대라는 뜻이므로 감추지 않고 적어 둔다. 그럼에도 이쪽을 택한 이유는
 * `Date()`(new 없는 호출) 자체가 드물고, 그 이름을 가리는 스토리가 저장소에 0건이며,
 * 오탐이 나면 정상 코드가 막혀 사람이 가드를 꺼버리기 때문이다.
 */
function isLocallyShadowed(name: string, sf: ts.SourceFile): boolean {
  let shadowed = false
  const scan = (n: ts.Node): void => {
    if (shadowed) return
    if (
      (ts.isVariableDeclaration(n) || ts.isFunctionDeclaration(n) || ts.isClassDeclaration(n)) &&
      n.name &&
      ts.isIdentifier(n.name) &&
      n.name.text === name
    ) {
      shadowed = true
      return
    }
    // **타입 전용 import 는 값 바인딩을 만들지 않는다** — 그 파일의 `Date()` 는 여전히 전역이다.
    // `isTypeOnly` 를 보지 않으면 `import type { Date }` 가 진짜 전역 호출을 조용히 삼킨다.
    // 이건 스코프 문제가 아니라 **바인딩이 아예 없는 것을 바인딩으로 센 것**이라 방향이 다르다:
    // 아래 fail-open 설명이 감싸는 범위 밖의, 그냥 결함이다.
    if (ts.isImportSpecifier(n) && n.name.text === name && !n.isTypeOnly) {
      const clause = n.parent.parent // NamedImports → ImportClause
      if (!(ts.isImportClause(clause) && clause.isTypeOnly)) {
        shadowed = true
        return
      }
    }
    if (ts.isImportClause(n) && !n.isTypeOnly && n.name && n.name.text === name) {
      shadowed = true
      return
    }
    ts.forEachChild(n, scan)
  }
  scan(sf)
  return shadowed
}

const isNonDeterministic = (node: ts.Node, sf: ts.SourceFile): string | null => {
  if (ts.isNewExpression(node)) {
    // `new Date()` 만 문제다. `new Date(2026, 0, 15)` 처럼 인자가 있으면 결정적이다.
    // 단 `new Date(...xs)` 는 인자 수를 정적으로 알 수 없으므로 결정적이라고 단정하지 않는다.
    if (node.expression.getText() !== 'Date') return null
    const args = node.arguments
    if (!args || args.length === 0) return 'new Date()'
    if (args.some(a => ts.isSpreadElement(a))) return 'new Date(...spread)'
  }
  if (ts.isCallExpression(node)) {
    // `Date()` 는 `new` 없이도 **현재 시각 문자열**을 돌려준다. 인자를 줘도 무시되므로
    // 인자 수와 무관하게 비결정적이다 (`new Date(2026, 0, 15)` 와 다르다).
    if (
      ts.isIdentifier(node.expression) &&
      node.expression.text === 'Date' &&
      !isLocallyShadowed('Date', sf)
    ) {
      return 'Date()'
    }
    const member = memberName(node.expression)
    if (!member) return null
    const hit = NON_DETERMINISTIC_MEMBERS.find(([o, m]) => o === member[0] && m === member[1])
    if (hit) return `${hit[0]}.${hit[1]}()`
  }
  return null
}

/**
 * 함수 경계로 볼 노드.
 *
 * 화살표·함수식·함수선언만 세면 **축약 메서드**(`{ onClick() {} }`)와 클래스 메서드가
 * 경계로 인식되지 않아 정상 핸들러가 오탐이 된다(실측). 방향은 fail-closed 라 안전하지만,
 * "형태를 열거하지 않는 한 규칙" 이라는 이 가드의 설명과 어긋난다 — 시끄러운 가드는 꺼진다.
 */
function isFunctionLike(n: ts.Node): boolean {
  return (
    ts.isArrowFunction(n) ||
    ts.isFunctionExpression(n) ||
    ts.isFunctionDeclaration(n) ||
    ts.isMethodDeclaration(n) ||
    ts.isGetAccessor(n) ||
    ts.isSetAccessor(n)
  )
}

/** 이 식별자가 이름을 *선언*하는 자리인가 (참조가 아니라). */
function isDeclarationSite(id: ts.Identifier): boolean {
  const p = id.parent
  if (!p) return false
  if (
    (ts.isVariableDeclaration(p) ||
      ts.isFunctionDeclaration(p) ||
      ts.isParameter(p) ||
      ts.isBindingElement(p) ||
      ts.isPropertyAssignment(p)) &&
    p.name === id
  ) {
    return true
  }
  // `{ stamp }` 의 `stamp` 는 **선언이자 참조**다. 선언으로만 세면 렌더 경로 참조가
  // 계수에서 사라져 면제가 잘못 부여된다(실측 반례). 그래서 여기서 제외하지 않는다.
  // (구조분해 `const { stamp } = o` 는 `BindingElement` 로 위에서 이미 걸러진다.)
  // `o.onClick` 의 `onClick` 은 멤버 이름이지 바인딩 참조가 아니다.
  if (ts.isPropertyAccessExpression(p) && p.name === id) return true
  if (ts.isJsxAttribute(p) && p.name === id) return true
  return false
}

/**
 * 이 식별자가 `on[A-Z]` JSX 속성 값 안에서 **함수로 전달되는가** (렌더 중 호출이 아니라).
 *
 * 속성 안에 있다는 것만으로 지연 실행이라고 볼 수 없다 — `onClick={stamp()}` 는 값을 만들려고
 * **렌더 중에** 호출한다(실측 반례). `onClick={stamp}` 와 `onClick={() => stamp()}` 만 지연이다.
 * 그래서 "호출되는가" 와 "그 호출이 함수 경계 안인가" 를 함께 본다.
 */
function passedAsHandler(id: ts.Identifier): boolean {
  // 렌더 시점 호출인지: 이 식별자가 호출의 대상이고, 그 호출과 속성 사이에 함수 경계가 없다.
  const call = id.parent
  if (call && ts.isCallExpression(call) && call.expression === id) {
    let cur: ts.Node | undefined = call
    let crossedFunction = false
    while (cur) {
      if (isFunctionLike(cur)) crossedFunction = true
      if (ts.isJsxAttribute(cur)) {
        // 함수 경계를 넘지 않고 속성에 도달했다면 렌더 중 호출이다 — 지연이 아니다.
        if (!crossedFunction) return false
        break
      }
      cur = cur.parent
    }
  }

  let cur: ts.Node | undefined = id
  while (cur) {
    if (ts.isJsxAttribute(cur)) return /^on[A-Z]/.test(cur.name.getText())
    cur = cur.parent
  }
  return false
}

/**
 * 이 이름의 참조가 **전부** `on[A-Z]` 속성 안에만 있는가.
 *
 * "핸들러에 쓰이는가" 가 아니라 **"핸들러에만 쓰이는가"** 를 묻는다. 한쪽만 물으면
 * 렌더와 핸들러에서 같이 쓰는 함수가 통째로 면제된다:
 *
 * ```tsx
 * const stamp = () => Date.now()
 * return <div data-stamp={String(stamp())} onClick={stamp} />   // 렌더 중에도 실행된다
 * ```
 *
 * 이것이 같은 계열의 **네 번째** 누락이었다(앞선 셋: IIFE · useState · useMemo).
 * 전부 "지연 실행처럼 보이지만 렌더 중에 실행된다" 는 한 가지 오류였다.
 * 그래서 예외를 더 붙이지 않고 질문 자체를 양방향으로 바꾼다 — 렌더 경로 참조가 하나라도
 * 있으면 면제하지 않는다(fail-closed).
 */
function referencedOnlyByHandlerProps(name: string, sf: ts.SourceFile): boolean {
  let handlerRefs = 0
  let otherRefs = 0
  const scan = (n: ts.Node): void => {
    if (ts.isIdentifier(n) && n.text === name && !isDeclarationSite(n)) {
      if (passedAsHandler(n)) handlerRefs++
      else otherRefs++
    }
    ts.forEachChild(n, scan)
  }
  scan(sf)
  return handlerRefs > 0 && otherRefs === 0
}

/**
 * 이 함수가 **이벤트 핸들러로만 바인딩**되는가 — 즉 렌더 중에는 실행되지 않는가.
 *
 * 형태를 열거하지 않는다. 함수가 묶이는 **이름**을 찾고(변수·함수 선언·객체 속성),
 * 그 이름의 참조가 **전부** `on[A-Z]` 속성 안에만 있는지 본다. 그래서 아래가 한 규칙이다:
 *   `onClick={() => …}` · `const h = () => …; onClick={h}`
 *   `function h() {}; onClick={h}` · `const h = useCallback(() => …, []); onClick={h}`
 *   `const o = { onClick: () => … }; onClick={o.onClick}`
 * 그리고 렌더에서도 부르는 함수는 면제되지 않는다.
 *
 * **한계(실측)**: 이름 매칭은 **스코프를 보지 않는다.** 같은 이름이 파일 안 다른 스코프에도
 * 있으면 그쪽 참조가 이쪽 판정에 섞인다. 다만 섞이는 방향은 이제 "렌더 참조가 하나 더 늘어난다"
 * 쪽이라 fail-closed 를 깨지 않는다(더 많이 잡는 쪽으로 틀린다).
 * 스코프를 제대로 보려면 심볼 해석이 필요하고, 그것은 이 가드의 비용 특성을 바꾼다.
 */
function isEventHandlerBound(fn: ts.Node, sf: ts.SourceFile): boolean {
  // 1) `onClick={() => …}` — JSX 속성에 직접 바인딩. 이름이 없으니 다른 데서 부를 수 없다.
  const parent = fn.parent
  if (parent && ts.isJsxExpression(parent) && parent.parent && ts.isJsxAttribute(parent.parent)) {
    return /^on[A-Z]/.test(parent.parent.name.getText())
  }

  // 2) 함수 선언 자체가 이름을 갖는 경우 — `function handleSubmit() {}`
  //
  // 여기에 `MethodDeclaration` 도 넣어 뒀었는데 **절대 성립하지 않는 죽은 코드였다**
  // (계측 결과 저장소 69개 스캔 + 픽스처 전량에서 0회). 축약 메서드의 이름 식별자는
  // `isDeclarationSite` 에 걸리지 않아 늘 자기 자신이 렌더 참조 1건으로 세어지고,
  // 그래서 `referencedOnlyByHandlerProps` 가 true 가 될 수 없다.
  // `{ onClick() {} }` + `onClick={h.onClick}` 픽스처는 (3) 의 바깥 변수 `h` 로 통과한다.
  // 주석이 존재하지 않는 메커니즘을 설명하고 있었으므로 코드와 함께 걷어냈다.
  if (ts.isFunctionDeclaration(fn) && fn.name && ts.isIdentifier(fn.name)) {
    if (referencedOnlyByHandlerProps(fn.name.text, sf)) return true
  }

  // 3) 위로 올라가며 이 함수가 묶이는 이름을 모은다.
  //    `useCallback(() => …, [])` 처럼 한 겹 감싸도 바깥의 변수 이름에 도달한다.
  const names: string[] = []
  let cur: ts.Node | undefined = fn.parent
  while (cur) {
    if (ts.isVariableDeclaration(cur) && ts.isIdentifier(cur.name)) names.push(cur.name.text)
    else if (ts.isPropertyAssignment(cur) && ts.isIdentifier(cur.name)) names.push(cur.name.text)
    // 다른 함수 경계를 넘으면 더 이상 "이 함수의 이름" 이 아니다.
    else if (isFunctionLike(cur)) break
    cur = cur.parent
  }

  // 이름 중 **하나라도** "핸들러에서만 참조된다" 가 성립하면 면제한다.
  //
  // `every` 가 아니라 `some` 인 이유: `const o = { onClick: fn }` 에서 속성 이름 `onClick` 은
  // 참조가 0건이라 절대 성립하지 못한다. `every` 로 두면 정상적인 객체 속성 핸들러가 통째로
  // 오탐이 된다. 그러면서도 구멍이 되지 않는다 — `referencedOnlyByHandlerProps` 는 참조가
  // 0건이면 false 를 주므로 **면제를 부여하지 못할 뿐** 이고, 렌더 경로 참조가 하나라도 섞인
  // 이름은 여전히 false 다. 즉 이 완화는 "덜 잡는" 방향으로 열리지 않는다.
  return names.some(n => referencedOnlyByHandlerProps(n, sf))
}

/**
 * 이 노드가 **렌더 경로에서 실행되는가**를 fail-closed 로 판정한다.
 *
 * 함수 중첩 깊이로 판정하지 않는다. 깊이는 "언제 실행되는가" 의 대리 지표일 뿐이라
 * 실행되는 것을 콜백으로 오분류한다 — 실제로 세 번 샜다:
 * IIFE `(() => Date.now())()` · `useState(() => new Date())` · `useMemo(() => new Date(), [])`
 * 는 전부 렌더 중에 실행되는데 "콜백" 으로 채점됐다. 예외를 하나씩 열거하면 네 번째가 또 나온다.
 *
 * 그래서 질문을 뒤집는다: **이벤트 핸들러로 바인딩된 함수 안이 아니면 전부 렌더 경로로 본다.**
 * 판정할 수 없으면 위반으로 올린다 — 오탐은 시끄럽지만 누락은 조용히 거짓 양성을 되돌린다.
 */
function runsOnRenderPath(node: ts.Node, sf: ts.SourceFile): boolean {
  let cur: ts.Node | undefined = node.parent
  while (cur) {
    if (isFunctionLike(cur)) {
      // 감싸는 함수 중 하나라도 이벤트 핸들러면, 그 안은 전부 지연 실행이다.
      if (isEventHandlerBound(cur, sf)) return false
    }
    cur = cur.parent
  }
  return true
}

function collectStoryFiles(dir: string, acc: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) collectStoryFiles(full, acc)
    // Storybook 이 읽는 확장자 전부를 본다 — `.tsx` 만 보면 다른 확장자로 옮기는 순간
    // 조용히 검사 밖으로 나간다(현재는 전부 `.tsx` 라 동작 변화 없음).
    else if (/\.stories\.(tsx|ts|jsx|js|mjs)$/.test(entry)) acc.push(full)
  }
  return acc
}

/**
 * 스토리가 **렌더 중에** 비결정적 값을 만드는지 찾는다.
 *
 * Chromatic 스냅샷은 렌더 결과만 찍으므로, 이벤트 핸들러 안의 `new Date()` 는 무해하다
 * (예: "이번 달" 버튼이 클릭될 때 현재 달을 계산하는 것은 그 데모의 의미 자체다).
 * 그래서 "파일에 등장하는가" 가 아니라 **"렌더 경로에서 평가되는가"** 로 판정한다 —
 * 판정 규칙은 `runsOnRenderPath` 를 보라. 함수 중첩 깊이로 세지 않는다(그 방식은 세 번 샜다).
 */
export function findStoryDeterminismViolations(storiesRoot: string): StoryScanResult {
  const violations: StoryDeterminismViolation[] = []
  const files = collectStoryFiles(storiesRoot)

  for (const file of files) {
    const source = readFileSync(file, 'utf8')
    const sf = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
    const rel = file.slice(storiesRoot.length + 1)

    const visit = (node: ts.Node): void => {
      const expression = isNonDeterministic(node, sf)
      if (expression && runsOnRenderPath(node, sf)) {
        violations.push({
          file: rel,
          line: sf.getLineAndCharacterOfPosition(node.getStart()).line + 1,
          expression,
        })
      }
      ts.forEachChild(node, visit)
    }
    visit(sf)
  }

  return {
    violations,
    filesScanned: files.length,
    scannedFiles: files.map(f => f.slice(storiesRoot.length + 1)),
  }
}
