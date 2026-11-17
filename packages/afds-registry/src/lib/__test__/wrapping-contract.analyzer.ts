import ts from 'typescript'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

/**
 * **의도된 사본이다.** `packages/afds/src/lib/__test__/wrapping-contract.analyzer.ts` 와
 * 로직이 같다 — 그 파일은 afds 의 테스트 헬퍼(`__test__/`)라 공개 export 가 아니고,
 * 패키지 경계를 넘어 import 할 수 없다. 컴포지션이 afds-registry 로 이전되며(upstream
 * codex 리뷰) 여기서도 같은 위반 검사가 필요해졌다 — 새 공유 패키지를 만들지 않고
 * 복사를 택했다. 위반 규칙(handler-clobber 등)을 고치면 **양쪽을 함께** 고쳐야 한다.
 */

/**
 * 계약이 **합성 도구로 지목하는 심볼**의 선언적 목록.
 *
 * 여기 있는 이유는 두 가지다.
 *
 * 1. 아래 위반 메시지들이 이 목록에서 심볼 이름을 **가져다 쓴다.** 문구를 다듬어도
 *    이름은 한 곳에서만 온다 — 메시지 문자열을 grep 하는 외부 가드가 조용히 깨지지 않는다.
 * 2. `afds-registry` 쪽에서 3자 대조 가드(계약 요구 심볼 ↔ AFDS `exports` ↔ transform 규칙)를
 *    붙일 수 있게 하는 **유일한 출처**다. 그쪽이 목록을 하드코딩하면 그건 검사가 아니라
 *    사본이고, 사본은 조용히 드리프트한다.
 *
 * `from` 은 **소비자가 실제로 쓰는 specifier** 다 — 현재 관례상 셋 다 루트에서 도달한다.
 * 서브패스 방향과의 통일은 검토 중이므로(`docs/wrapping-contract.md` 「합성 도구를 어디서
 * 가져오는가」) 이 값이 바뀔 수 있다. 바뀌면 아래 테스트가 먼저 실패해 드러난다 —
 * 그것이 이 목록을 사본이 아니라 강제로 만드는 지점이다.
 * `rule` 은 그 문서의 `### {n}.` 번호를 가리킨다. 한쪽만 고치면 어긋나는 것이 드러나도록 묶었다.
 */
export const CONTRACT_REQUIRED_SYMBOLS = [
  { symbol: 'composeEventHandlers', from: '@turbo-project/afds', rule: 3 },
  { symbol: 'mergeRefs', from: '@turbo-project/afds', rule: 4 },
  { symbol: 'mergeProps', from: '@turbo-project/afds', rule: 5 },
] as const

/** 심볼 이름을 목록에서 꺼낸다 — 메시지에 이름을 리터럴로 박지 않기 위한 것. */
const sym = (name: (typeof CONTRACT_REQUIRED_SYMBOLS)[number]['symbol']): string =>
  CONTRACT_REQUIRED_SYMBOLS.find(s => s.symbol === name)!.symbol

export interface Violation {
  rule: 'handler-clobber' | 'spread-inversion' | 'dynamic-slot' | 'missing-slot' | 'merge-arg-order'
  file: string
  line: number
  detail: string
}

/**
 * 스프레드 표현식이 소비자 rest 바인딩을 **참조**하는가.
 *
 * 이름 리터럴(`...props`)로 판정하면 `{...rest}` · `{...mergeProps(inner, props)}` ·
 * `{...(props as any)}` 같은 형태를 전부 놓친다. 실제로 이 저장소에서
 * `{...mergeProps(buttonProps, props)}` 로 바꾼 4곳이 통째로 검사 시야에서 사라진 적이 있다.
 * 그래서 이름이 아니라 **식별자 참조**로 판정한다.
 *
 * 이 판정은 의도적으로 과대근사다 — 소비자 props 를 펼치지 않고 값만 읽는 스프레드
 * (`{...{ id: props.id }}` · `{...computeAria(props.label)}`)도 소비자 스프레드로 본다.
 * 가드에서 오탐(시끄러운 실패)은 누락(조용한 실패)보다 낫기 때문이다.
 * 그런 스프레드가 필요하면 값을 먼저 지역 변수로 빼내 rest 식별자 참조를 없애라.
 */
const spreadReferencesConsumerProps = (p: ts.JsxAttributeLike, restName: string): boolean => {
  if (!ts.isJsxSpreadAttribute(p)) return false
  let found = false
  const walk = (n: ts.Node): void => {
    if (found) return
    if (ts.isIdentifier(n) && n.text === restName) {
      found = true
      return
    }
    ts.forEachChild(n, walk)
  }
  walk(p.expression)
  return found
}

const isHandlerName = (name: string) => /^on[A-Z]/.test(name)

/** 이 JSX 를 감싸는 함수가 구조분해로 빼낸 prop 이름들. rest 요소가 있어야 유효하다. */
function destructuredPropNames(node: ts.Node): { names: Set<string>; restName: string } | null {
  let cur: ts.Node | undefined = node
  while (cur) {
    if (ts.isArrowFunction(cur) || ts.isFunctionExpression(cur) || ts.isFunctionDeclaration(cur)) {
      for (const param of cur.parameters) {
        if (!ts.isObjectBindingPattern(param.name)) continue
        const names = new Set<string>()
        let restName: string | null = null
        for (const el of param.name.elements) {
          if (el.dotDotDotToken) restName = el.name.getText()
          else names.add((el.propertyName ?? el.name).getText().replace(/^['"]|['"]$/g, ''))
        }
        if (restName) return { names, restName }
      }
    }
    cur = cur.parent
  }
  return null
}

function collectTsxFiles(dir: string, acc: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) {
      if (entry === '__test__') continue
      collectTsxFiles(full, acc)
    } else if (entry.endsWith('.tsx') && !entry.endsWith('.stories.tsx')) {
      acc.push(full)
    }
  }
  return acc
}

/**
 * AFDS 래핑 계약 위반을 정적으로 찾는다.
 *
 * 사람 리뷰에 의존하지 않기 위한 기계 검사다. 규칙은 `docs/wrapping-contract.md` 참조.
 */
export interface ContractScanResult {
  violations: Violation[]
  /** 실제로 파싱한 .tsx 파일 수. 0 이면 검사가 통째로 무력화된 것이다. */
  filesScanned: number
  /** 실제로 파싱한 파일 경로(루트 기준 상대). 어떤 파일이 빠졌는지 이름으로 확인하기 위한 것. */
  scannedFiles: string[]
}

export function findWrappingContractViolations(rootDir: string): ContractScanResult {
  const violations: Violation[] = []
  const files = collectTsxFiles(rootDir)

  for (const file of files) {
    const source = readFileSync(file, 'utf8')
    const sf = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
    const rel = file.slice(rootDir.length + 1)
    const lineOf = (n: ts.Node) => sf.getLineAndCharacterOfPosition(n.getStart()).line + 1

    const visit = (node: ts.Node): void => {
      if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
        const props = node.attributes.properties
        const tag = node.tagName.getText()
        const destructured = destructuredPropNames(node)
        // rest 구조분해가 없으면 `(props) => ...` 형태를 가정한다.
        const restName = destructured?.restName ?? 'props'
        const spreadIdx = props.findIndex(p => spreadReferencesConsumerProps(p, restName))
        const slotAttr = props.find(
          (p): p is ts.JsxAttribute => ts.isJsxAttribute(p) && p.name.getText() === 'data-slot',
        )

        // 규칙 3: data-slot 값은 문자열 리터럴이어야 한다 (정적 DOM 계약의 전제)
        // `data-slot={'x'}` 도 정적이다 — JsxExpression 으로 감싼 문자열 리터럴을 허용한다.
        const slotInit = slotAttr?.initializer
        const slotIsStatic =
          slotInit &&
          (ts.isStringLiteral(slotInit) ||
            (ts.isJsxExpression(slotInit) &&
              slotInit.expression !== undefined &&
              ts.isStringLiteral(slotInit.expression)))
        if (slotAttr && !slotIsStatic) {
          violations.push({
            rule: 'dynamic-slot',
            file: rel,
            line: lineOf(slotAttr),
            detail: `<${tag}> data-slot 이 문자열 리터럴이 아니다: ${slotAttr.initializer?.getText() ?? '(값 없음)'}`,
          })
        }

        if (spreadIdx >= 0) {
          // 규칙 1: 내부 이벤트 핸들러가 {...props} 앞에 오면 소비자가 조용히 덮는다.
          // 구조분해로 빼낸 핸들러는 ...props 에 남지 않으므로 위반이 아니다.
          for (let i = 0; i < spreadIdx; i++) {
            const p = props[i]
            if (!ts.isJsxAttribute(p)) continue
            const name = p.name.getText()
            if (!isHandlerName(name)) continue
            if (destructured?.names.has(name)) continue
            violations.push({
              rule: 'handler-clobber',
              file: rel,
              line: lineOf(p),
              detail: `<${tag}> ${name} 이 {...props} 앞에 있어 소비자가 내부 동작을 덮을 수 있다. ${sym('composeEventHandlers')} 로 합성하고 {...props} 뒤에 둘 것`,
            })
          }

          // 규칙 5: mergeProps 는 (내부, 소비자) 순서여야 한다.
          // 뒤집으면 핸들러가 아닌 키는 내부가 소비자를 이기고(= spread-inversion 재현),
          // 핸들러는 react-aria 가 먼저 실행되며 preventDefault 단락이 반대로 걸려
          // **내부가 소비자 핸들러를 막는다**. 스프레드 순서 문제를 새 API 로 다시 쓴 것이다.
          const consumerSpread = props[spreadIdx]
          if (ts.isJsxSpreadAttribute(consumerSpread)) {
            const expr = consumerSpread.expression
            if (
              ts.isCallExpression(expr) &&
              expr.expression.getText().endsWith('mergeProps') &&
              expr.arguments.length >= 2
            ) {
              const firstArgReferencesConsumer = (() => {
                let found = false
                const walk = (n: ts.Node): void => {
                  if (found) return
                  if (ts.isIdentifier(n) && n.text === restName) found = true
                  else ts.forEachChild(n, walk)
                }
                walk(expr.arguments[0])
                return found
              })()
              if (firstArgReferencesConsumer) {
                violations.push({
                  rule: 'merge-arg-order',
                  file: rel,
                  line: lineOf(consumerSpread),
                  detail: `<${tag}> ${sym('mergeProps')} 의 첫 인자가 소비자 props 다. 순서는 ${sym('mergeProps')}(내부, 소비자) 여야 한다 — 뒤집으면 내부가 소비자를 덮고 핸들러 합성 순서도 반대가 된다`,
                })
              }
            }
          }

          // 규칙 2: {...props} 뒤의 또 다른 스프레드는 소비자 props 를 통째로 덮는다.
          for (let i = spreadIdx + 1; i < props.length; i++) {
            const p = props[i]
            if (!ts.isJsxSpreadAttribute(p)) continue
            violations.push({
              rule: 'spread-inversion',
              file: rel,
              line: lineOf(p),
              detail: `<${tag}> {...props} 뒤에 ${p.getText()} 가 와서 소비자 props 가 유실된다. ${sym('mergeProps')} 로 명시적으로 병합할 것`,
            })
          }

          // 규칙 4: host 엘리먼트에 소비자 props 를 펼치면 data-slot 이 있어야 한다
          // (매니페스트·테스트·스타일링이 붙는 지점).
          if (/^[a-z]/.test(tag) && !slotAttr) {
            violations.push({
              rule: 'missing-slot',
              file: rel,
              line: lineOf(node),
              detail: `<${tag}> 가 {...props} 를 펼치는데 data-slot 이 없다`,
            })
          }
        }
      }
      ts.forEachChild(node, visit)
    }
    visit(sf)
  }

  return {
    violations,
    filesScanned: files.length,
    scannedFiles: files.map(f => f.slice(rootDir.length + 1)),
  }
}
