import ts from 'typescript'
import { displayName, type Taxonomy } from './taxonomy'

function unwrap(expr: ts.Expression): ts.Expression {
  while (
    ts.isParenthesizedExpression(expr) ||
    ts.isSatisfiesExpression(expr) ||
    ts.isAsExpression(expr)
  ) {
    expr = expr.expression
  }
  return expr
}

/**
 * default export 된 식별자(`export default meta`)의 초기값 객체 리터럴에서 **최상위** `title`
 * 문자열 리터럴만 읽는다 — `args.title` 같은 중첩 프로퍼티를 잡지 않으려고 최상위만 본다.
 */
export function readMetaTitle(source: string): string | null {
  const sf = ts.createSourceFile(
    'story.tsx',
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  )

  let defaultExportName: string | null = null
  for (const stmt of sf.statements) {
    if (ts.isExportAssignment(stmt) && !stmt.isExportEquals && ts.isIdentifier(stmt.expression)) {
      defaultExportName = stmt.expression.text
    }
  }
  if (defaultExportName === null) return null

  let initializer: ts.Expression | null = null
  for (const stmt of sf.statements) {
    if (!ts.isVariableStatement(stmt)) continue
    for (const decl of stmt.declarationList.declarations) {
      if (ts.isIdentifier(decl.name) && decl.name.text === defaultExportName && decl.initializer) {
        initializer = decl.initializer
      }
    }
  }
  if (initializer === null) return null

  const obj = unwrap(initializer)
  if (!ts.isObjectLiteralExpression(obj)) return null

  for (const prop of obj.properties) {
    if (
      ts.isPropertyAssignment(prop) &&
      ts.isIdentifier(prop.name) &&
      prop.name.text === 'title' &&
      ts.isStringLiteralLike(prop.initializer)
    ) {
      return prop.initializer.text
    }
  }
  return null
}

const PROGRAM_OPTIONS: ts.CompilerOptions = {
  target: ts.ScriptTarget.ES2022,
  module: ts.ModuleKind.ESNext,
  moduleResolution: ts.ModuleResolutionKind.Bundler,
  jsx: ts.JsxEmit.ReactJSX,
  noEmit: true,
  skipLibCheck: true,
}

/**
 * 각 index 파일의 값 export 이름 집합(키 = 넘긴 파일 경로 그대로). 문자열 파싱으로는
 * `export * from` 재수출을 못 본다(이름이 index.ts 문자열 자체에 없다) — `base-multi-select` ·
 * `floating-action-bar-count` · `popconfirm` 이 이 형태를 쓴다. 타입체커로 모듈 표면을 읽으면
 * 재수출 체인과 관계없이 정확하다. 전체를 한 program 에 모아 파싱을 한 번만 한다
 * (barrel-exports.ts 와 같은 이유 — 파일 수만큼 program 을 새로 만들면 매번 lib 타입을 다시 읽는다).
 *
 * `checker.getExportsOfModule` 은 타입 전용 export 도 함께 준다 — 걸러내지 않으면 title 이
 * 타입 이름(`AlertModalProps`)으로 끝나도 통과한다. alias 는 `getAliasedSymbol` 로 풀어
 * `SymbolFlags.Value` 가 있는 것만 남기고, 이름은 export 자신의 이름을 쓴다(aliased target 의
 * 이름이 아니다 — `export { A as Renamed }` 는 `Renamed` 로 남아야 한다).
 */
export function resolveValueExports(indexFiles: string[]): Map<string, Set<string>> {
  const program = ts.createProgram(indexFiles, PROGRAM_OPTIONS)
  const checker = program.getTypeChecker()
  const result = new Map<string, Set<string>>()
  for (const file of indexFiles) {
    const sourceFile = program.getSourceFile(file)
    const moduleSymbol = sourceFile && checker.getSymbolAtLocation(sourceFile)
    const exported = moduleSymbol ? checker.getExportsOfModule(moduleSymbol) : []
    const names = new Set<string>()
    for (const symbol of exported) {
      const resolved =
        symbol.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(symbol) : symbol
      if (resolved.flags & ts.SymbolFlags.Value) names.add(symbol.name)
    }
    result.set(file, names)
  }
  return result
}

/**
 * registry 의 `categories` 는 `[domain, category]` 두 칸 고정이다. `Compositions` 는
 * registry 데이터가 아니라 고정 접두어라서 여기 박아 넣는다 — Storybook 최상위 섹션이다
 * (`AFDS` 와 형제, 그 아래가 아니다).
 */
export function expectedTitlePrefix(categories: string[], taxonomy: Taxonomy): string | null {
  if (categories.length !== 2) return null
  const [domain, category] = categories
  if (!taxonomy.domains.includes(domain) || !taxonomy.categories.includes(category)) return null
  return `Compositions / ${displayName(domain)} / ${displayName(category)}`
}
