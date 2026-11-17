import fs from 'node:fs/promises'
import path from 'node:path'

export interface ExtractOptions {
  fileKey: string
  token: string
  outDir: string
}

function rgbaToHex(r: number, g: number, b: number, a: number): string {
  const toHex = (n: number) =>
    Math.round(n * 255)
      .toString(16)
      .padStart(2, '0')
  if (a !== 1) {
    return `#${toHex(r)}${toHex(g)}${toHex(b)}${toHex(a)}`
  }
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

function resolveFigmaValue(value: any, variables: any): any {
  if (value && typeof value === 'object' && value.type === 'VARIABLE_ALIAS') {
    const aliasedVar = variables[value.id]
    if (aliasedVar) {
      const aliasPath = aliasedVar.name.replace(/\//g, '.')
      return `{${aliasPath}}`
    }
    return `{${value.id}}`
  }

  if (
    value &&
    typeof value === 'object' &&
    value.r !== undefined &&
    value.g !== undefined &&
    value.b !== undefined
  ) {
    return rgbaToHex(value.r, value.g, value.b, value.a ?? 1)
  }

  return value
}

function convertFigmaTypeToDtcgType(type: string): string {
  switch (type) {
    case 'COLOR':
      return 'color'
    case 'FLOAT':
      return 'number'
    case 'STRING':
      return 'string'
    case 'BOOLEAN':
      return 'boolean'
    default:
      return 'string'
  }
}

function setNestedValue(obj: any, pathParts: string[], value: any) {
  let current = obj
  for (let i = 0; i < pathParts.length - 1; i++) {
    const part = pathParts[i]
    if (!current[part]) {
      current[part] = {}
    }
    current = current[part]
  }
  current[pathParts[pathParts.length - 1]] = value
}

export async function extractFigmaVariables({ fileKey, token, outDir }: ExtractOptions) {
  const url = `https://api.figma.com/v1/files/${fileKey}/variables/local`

  console.log(`[extract] Fetching variables from Figma file: ${fileKey}...`)
  const response = await fetch(url, {
    headers: {
      'X-Figma-Token': token,
    },
  })

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw new Error(
        `Figma API Authentication failed (403/401). Please check your FIGMA_ACCESS_TOKEN.`,
      )
    }
    if (response.status === 404) {
      throw new Error(`Figma file not found (404). Please check your FIGMA_FILE_KEY.`)
    }
    throw new Error(`Figma API error: ${response.status} ${response.statusText}`)
  }

  const data = (await response.json()) as any
  const meta = data.meta

  const collections = meta.variableCollections
  const variables = meta.variables

  // Collection별로 DTCG 파일 생성
  for (const [collectionId, collection] of Object.entries<any>(collections)) {
    const collectionName = collection.name.toLowerCase().replace(/\s+/g, '-')

    // mode별로 파일 생성
    for (const mode of collection.modes) {
      const modeName = mode.name.toLowerCase().replace(/\s+/g, '-')
      const dtcgJson: any = {}

      for (const [varId, figmaVar] of Object.entries<any>(variables)) {
        if (figmaVar.variableCollectionId !== collectionId) continue

        const value = figmaVar.valuesByMode[mode.modeId]
        if (value === undefined) continue

        const resolvedValue = resolveFigmaValue(value, variables)
        const type = convertFigmaTypeToDtcgType(figmaVar.resolvedType)

        const pathParts = figmaVar.name.split('/')
        const tokenObj = {
          $value: resolvedValue,
          $type: type,
        }

        setNestedValue(dtcgJson, pathParts, tokenObj)
      }

      // 결과 저장
      await fs.mkdir(outDir, { recursive: true })

      const isDefaultMode =
        collection.modes.length === 1 || collection.defaultModeId === mode.modeId
      const fileName = isDefaultMode
        ? `${collectionName}.tokens.json`
        : `${collectionName}.${modeName}.tokens.json`

      const outPath = path.resolve(outDir, fileName)
      await fs.writeFile(outPath, JSON.stringify(dtcgJson, null, 2), 'utf-8')
      console.log(`[extract] Generated ${outPath}`)
    }
  }

  console.log('[extract] Done.')
}
