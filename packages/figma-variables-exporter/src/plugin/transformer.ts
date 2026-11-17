export interface DtcgFile {
  filename: string
  content: Record<string, unknown>
}

interface CollectionInfo {
  id: string
  name: string
  modes: Array<{ modeId: string; name: string }>
  variableIds: string[]
}

interface VariableInfo {
  id: string
  name: string
  description?: string
  resolvedType: 'COLOR' | 'FLOAT' | 'STRING' | 'BOOLEAN'
  valuesByMode: Record<string, unknown>
}

function toKebab(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function buildFilename(collection: CollectionInfo, mode: { modeId: string; name: string }): string {
  const base = toKebab(collection.name)
  if (collection.modes.length === 1) {
    return `${base}.tokens.json`
  }
  return `${base}.${toKebab(mode.name)}.tokens.json`
}

function resolveType(resolvedType: VariableInfo['resolvedType']): string {
  switch (resolvedType) {
    case 'COLOR':
      return 'color'
    case 'FLOAT':
      return 'number'
    case 'STRING':
      return 'string'
    case 'BOOLEAN':
      return 'boolean'
  }
}

function colorToHex(color: { r: number; g: number; b: number; a: number }): string {
  const r = Math.round(color.r * 255)
    .toString(16)
    .padStart(2, '0')
  const g = Math.round(color.g * 255)
    .toString(16)
    .padStart(2, '0')
  const b = Math.round(color.b * 255)
    .toString(16)
    .padStart(2, '0')
  if (color.a === 1) {
    return `#${r}${g}${b}`
  }
  const a = Math.round(color.a * 255)
    .toString(16)
    .padStart(2, '0')
  return `#${r}${g}${b}${a}`
}

function convertValue(
  rawValue: unknown,
  resolvedType: VariableInfo['resolvedType'],
  idToPath: Map<string, string>,
): unknown {
  if (
    rawValue !== null &&
    typeof rawValue === 'object' &&
    (rawValue as Record<string, unknown>)['type'] === 'VARIABLE_ALIAS'
  ) {
    const alias = rawValue as { type: 'VARIABLE_ALIAS'; id: string }
    const path = idToPath.get(alias.id)
    return path ? `{${path}}` : rawValue
  }

  if (resolvedType === 'COLOR' && rawValue !== null && typeof rawValue === 'object') {
    const c = rawValue as { r: number; g: number; b: number; a: number }
    return colorToHex(c)
  }

  return rawValue
}

function setNestedValue(obj: Record<string, unknown>, pathParts: string[], value: unknown): void {
  let current = obj
  for (let i = 0; i < pathParts.length - 1; i++) {
    const key = pathParts[i]
    if (typeof current[key] !== 'object' || current[key] === null) {
      current[key] = {}
    }
    current = current[key] as Record<string, unknown>
  }
  current[pathParts[pathParts.length - 1]] = value
}

export function transformVariables(
  collections: CollectionInfo[],
  variables: VariableInfo[],
): DtcgFile[] {
  const idToPath = new Map<string, string>()
  for (const variable of variables) {
    const dtcgPath = variable.name.replace(/\//g, '.')
    idToPath.set(variable.id, dtcgPath)
  }

  const files: DtcgFile[] = []

  for (const collection of collections) {
    for (const mode of collection.modes) {
      const filename = buildFilename(collection, mode)
      const content: Record<string, unknown> = {}

      variables
        .filter(v => collection.variableIds.includes(v.id))
        .forEach(variable => {
          const rawValue = variable.valuesByMode[mode.modeId]
          const dtcgValue = convertValue(rawValue, variable.resolvedType, idToPath)
          const pathParts = variable.name.split('/')
          const token: Record<string, unknown> = {
            $value: dtcgValue,
            $type: resolveType(variable.resolvedType),
          }
          if (variable.description) {
            token['$description'] = variable.description
          }
          setNestedValue(content, pathParts, token)
        })

      files.push({ filename, content })
    }
  }

  return files
}
