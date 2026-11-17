import ts from 'typescript'

/**
 * 파일 하나에서 모듈 specifier 를 뽑는다.
 *
 * 정규식이 아니라 TypeScript 스캐너(`ts.preProcessFile`)를 쓴다. 주석 안의 예시 import 를
 * 유령 의존성으로 잡지 않고, `import`/`export ... from`/side-effect import/동적 `import()`/
 * `require()`/triple-slash 를 모두 한 번에 처리한다.
 *
 * **별 모듈로 분리해 둔 이유**: `typescript` 는 동적 `require` 를 쓰기 때문에 esbuild ESM
 * 번들에 들어가면 런타임에 `Error: Dynamic require of "fs" is not supported` 로 죽는다.
 * 그 제약은 철거된 자체 CLI 를 번들할 때 나온 것이고, 지금 이 모듈은 레지스트리 생성
 * (빌드 타임)과 테스트에서만 쓴다. 번들 대상이 다시 생기면 같은 제약이 돌아온다.
 */
export function extractSpecifiers(sourceText: string): string[] {
  const info = ts.preProcessFile(
    sourceText,
    /* readImportFiles */ true,
    /* detectJavaScriptImports */ true,
  )
  return info.importedFiles.map(f => f.fileName)
}

/** 한 import 문이 가져오는 이름 있는 바인딩. */
export interface ImportBindings {
  /** 모듈 specifier 원문 */
  specifier: string
  /**
   * named import 로 가져온 이름들 (`as` 앞의 원래 이름). default·namespace import 는
   * 배럴의 named export 표면과 대조할 대상이 아니므로 포함하지 않는다.
   */
  names: string[]
}

/**
 * `import { A, type B } from '...'` / `export { A } from '...'` 의 바인딩을 뽑는다.
 *
 * `extractSpecifiers` 는 specifier 만 주기 때문에 배럴 표면과 심볼을 대조할 수 없다.
 * 심볼 단위 검증이 필요한 이유는 `transform.ts` 가 깊은 경로를 **배럴로 접기** 때문이다:
 * `../../bricks/form/calendar/calendar` → `@turbo-project/afds/bricks`.
 * AFDS 의 그룹 배럴은 `export *` 가 아니라 명시적 named 재수출이라 심볼이 탈락한다.
 */
export function extractImportBindings(sourceText: string): ImportBindings[] {
  const sf = ts.createSourceFile(
    'probe.tsx',
    sourceText,
    ts.ScriptTarget.ESNext,
    /* setParentNodes */ false,
    ts.ScriptKind.TSX,
  )

  const result: ImportBindings[] = []

  for (const stmt of sf.statements) {
    let moduleSpecifier: ts.Expression | undefined
    let namedBindings: ts.NamedImportBindings | ts.NamedExportBindings | undefined

    if (ts.isImportDeclaration(stmt)) {
      moduleSpecifier = stmt.moduleSpecifier
      namedBindings = stmt.importClause?.namedBindings
    } else if (ts.isExportDeclaration(stmt)) {
      moduleSpecifier = stmt.moduleSpecifier
      namedBindings = stmt.exportClause
    } else {
      continue
    }

    if (!moduleSpecifier || !ts.isStringLiteral(moduleSpecifier)) continue

    const names: string[] = []
    if (namedBindings && (ts.isNamedImports(namedBindings) || ts.isNamedExports(namedBindings))) {
      for (const element of namedBindings.elements) {
        // `as` 가 있으면 원래 이름(propertyName)이 배럴에서 찾을 이름이다.
        names.push((element.propertyName ?? element.name).text)
      }
    }

    result.push({ specifier: moduleSpecifier.text, names })
  }

  return result
}
