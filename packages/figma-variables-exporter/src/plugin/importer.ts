export interface FlatToken {
  path: string // e.g. "color/primary/500"
  value: unknown
  type: string
  description?: string
}

export interface ImportOptions {
  collectionName: string
  modeName: string
  conflictMode: 'skip' | 'overwrite'
  saveVersion: boolean
  versionTag: string
}

export interface ImportResult {
  added: number
  updated: number
  skipped: number
}

export interface DtcgValidationResult {
  valid: boolean
  tokenCount: number
  error?: string
}

// DTCG 포맷 검증 (UI에서도 사용)
export function validateDtcg(json: unknown): DtcgValidationResult {
  if (typeof json !== 'object' || json === null || Array.isArray(json)) {
    return { valid: false, tokenCount: 0, error: 'JSON 최상위가 object여야 합니다.' }
  }
  const count = countTokens(json as Record<string, unknown>)
  if (count === 0) {
    return { valid: false, tokenCount: 0, error: '$value/$type를 가진 토큰을 찾을 수 없습니다.' }
  }
  return { valid: true, tokenCount: count }
}

function countTokens(obj: Record<string, unknown>): number {
  if ('$value' in obj && '$type' in obj) return 1
  let count = 0
  for (const key of Object.keys(obj)) {
    if (key.startsWith('$')) continue
    const val = obj[key]
    if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
      count += countTokens(val as Record<string, unknown>)
    }
  }
  return count
}

// 복합 타입 여부 확인 ($value가 plain object이고 alias가 아닌 경우)
function isCompositeValue(value: unknown): boolean {
  return (
    value !== null &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    (value as Record<string, unknown>)['type'] !== 'VARIABLE_ALIAS'
  )
}

// 복합 타입 하위 속성의 타입 추론
function inferSubType(key: string, value: unknown): string {
  if (typeof value === 'number') return 'number'
  if (typeof value === 'boolean') return 'boolean'
  const colorKeys = ['color', 'fill', 'stroke']
  if (colorKeys.includes(key.toLowerCase())) return 'color'
  const floatKeys = [
    'fontsize',
    'fontweight',
    'lineheight',
    'offsetx',
    'offsety',
    'blur',
    'spread',
    'opacity',
  ]
  if (floatKeys.includes(key.toLowerCase())) return 'number'
  return 'string'
}

// DTCG JSON → FlatToken[] 평탄화
export function flattenTokens(json: Record<string, unknown>, prefix = ''): FlatToken[] {
  const tokens: FlatToken[] = []

  if ('$value' in json && '$type' in json) {
    const value = json['$value']
    const type = json['$type'] as string
    const description = json['$description'] as string | undefined

    // 복합 타입($value가 object)이면 하위 속성별로 분리
    if (isCompositeValue(value)) {
      const composite = value as Record<string, unknown>
      for (const subKey of Object.keys(composite)) {
        const subValue = composite[subKey]
        const subPath = prefix ? `${prefix}/${subKey}` : subKey
        tokens.push({
          path: subPath,
          value: subValue,
          type: inferSubType(subKey, subValue),
          description: description ? `${description} (${subKey})` : undefined,
        })
      }
    } else {
      tokens.push({ path: prefix, value, type, description })
    }
    return tokens
  }

  for (const key of Object.keys(json)) {
    if (key.startsWith('$')) continue
    const val = json[key]
    if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
      const childPath = prefix ? `${prefix}/${key}` : key
      tokens.push(...flattenTokens(val as Record<string, unknown>, childPath))
    }
  }

  return tokens
}

function resolveValueType(type: string): VariableResolvedDataType {
  switch (type.toLowerCase()) {
    case 'color':
      return 'COLOR'
    case 'number':
    case 'dimension':
    case 'float':
      return 'FLOAT'
    case 'boolean':
      return 'BOOLEAN'
    default:
      return 'STRING'
  }
}

function parseColorValue(value: unknown): RGBA | null {
  if (typeof value !== 'string') return null

  // hex 형식: #rrggbb / #rrggbbaa
  const hex = value.replace('#', '')
  if (hex.length === 6) {
    return {
      r: parseInt(hex.slice(0, 2), 16) / 255,
      g: parseInt(hex.slice(2, 4), 16) / 255,
      b: parseInt(hex.slice(4, 6), 16) / 255,
      a: 1,
    }
  }
  if (hex.length === 8) {
    return {
      r: parseInt(hex.slice(0, 2), 16) / 255,
      g: parseInt(hex.slice(2, 4), 16) / 255,
      b: parseInt(hex.slice(4, 6), 16) / 255,
      a: parseInt(hex.slice(6, 8), 16) / 255,
    }
  }

  // rgba(r, g, b, a) 형식
  const rgbaMatch = value.match(
    /^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+))?\s*\)$/,
  )
  if (rgbaMatch) {
    return {
      r: parseFloat(rgbaMatch[1]) / 255,
      g: parseFloat(rgbaMatch[2]) / 255,
      b: parseFloat(rgbaMatch[3]) / 255,
      a: rgbaMatch[4] !== undefined ? parseFloat(rgbaMatch[4]) : 1,
    }
  }

  return null
}

function isAlias(value: unknown): boolean {
  // DTCG 형식: "{color.primary.500}"
  if (typeof value === 'string' && /^\{.+\}$/.test(value)) return true
  // Figma 내부 형식: { type: "VARIABLE_ALIAS", id: "VariableID:..." }
  if (
    value !== null &&
    typeof value === 'object' &&
    (value as Record<string, unknown>)['type'] === 'VARIABLE_ALIAS'
  )
    return true
  return false
}

function dtcgPathToVarName(ref: string): string {
  // "{color.primary.500}" → "color/primary/500"
  return ref.slice(1, -1).replace(/\./g, '/')
}

function toFigmaValue(value: unknown, resolvedType: VariableResolvedDataType): VariableValue {
  if (resolvedType === 'COLOR') {
    const color = parseColorValue(value)
    if (color) return color
  }
  if (resolvedType === 'FLOAT') {
    const n = typeof value === 'number' ? value : parseFloat(String(value))
    if (!isNaN(n)) return n
  }
  if (resolvedType === 'BOOLEAN') return Boolean(value)
  return String(value ?? '')
}

export async function applyToFigma(
  tokens: FlatToken[],
  options: ImportOptions,
): Promise<ImportResult> {
  const { collectionName, modeName, conflictMode, saveVersion, versionTag } = options

  // 버전 저장 (import 전 스냅샷)
  if (saveVersion) {
    await figma.saveVersionHistoryAsync(
      `Before import: ${versionTag}`,
      `Saved before importing tokens into "${collectionName}" collection`,
    )
  }

  // 컬렉션 조회 또는 생성
  const allCollections = await figma.variables.getLocalVariableCollectionsAsync()
  let collection = allCollections.find(c => c.name === collectionName) ?? null
  if (!collection) {
    collection = figma.variables.createVariableCollection(collectionName)
  }

  // 모드 조회 또는 생성
  let mode = collection.modes.find(m => m.name === modeName) ?? null
  if (!mode) {
    if (collection.modes.length === 1 && collection.modes[0].name === 'Mode 1') {
      collection.renameMode(collection.modes[0].modeId, modeName)
      mode = { modeId: collection.modes[0].modeId, name: modeName }
    } else {
      const newModeId = collection.addMode(modeName)
      mode = { modeId: newModeId, name: modeName }
    }
  }

  const modeId = mode.modeId

  // 전체 변수 맵 구축 (name → Variable) — alias 해석에 타 컬렉션 변수도 포함
  const allVariables = await figma.variables.getLocalVariablesAsync()
  const varByName = new Map<string, Variable>()
  for (const v of allVariables) {
    varByName.set(v.name, v)
  }

  let added = 0
  let updated = 0
  let skipped = 0

  // alias가 아닌 토큰 먼저 처리 → 그 다음 alias 처리 (참조 대상 보장)
  const aliasTokens: FlatToken[] = []
  const directTokens = tokens.filter(t => {
    if (isAlias(t.value)) {
      aliasTokens.push(t)
      return false
    }
    return true
  })

  const applyToken = (
    token: FlatToken,
    figmaValue: VariableValue,
    typeOverride?: VariableResolvedDataType,
  ) => {
    const varName = token.path
    const existing = varByName.get(varName)

    if (existing) {
      if (conflictMode === 'skip') {
        skipped++
        return
      }
      existing.setValueForMode(modeId, figmaValue)
      if (token.description !== undefined) existing.description = token.description
      updated++
    } else {
      const resolvedType = typeOverride ?? resolveValueType(token.type)
      const variable = figma.variables.createVariable(varName, collection!, resolvedType)
      variable.setValueForMode(modeId, figmaValue)
      if (token.description) variable.description = token.description
      varByName.set(varName, variable)
      added++
    }
  }

  // 1단계: 직접값 토큰 (기존 변수가 있으면 그 타입 기준으로 변환)
  for (const token of directTokens) {
    const existing = varByName.get(token.path)
    const resolvedType = existing ? existing.resolvedType : resolveValueType(token.type)
    applyToken(token, toFigmaValue(token.value, resolvedType))
  }

  // 2단계: alias 토큰 → VariableAlias로 변환
  // varById 맵 구축 (Figma 내부 포맷 대응)
  const varById = new Map<string, Variable>()
  for (const v of varByName.values()) varById.set(v.id, v)

  for (const token of aliasTokens) {
    let refVar: Variable | undefined

    if (typeof token.value === 'string') {
      // DTCG 형식: "{color.primary.500}"
      refVar = varByName.get(dtcgPathToVarName(token.value))
    } else if (
      token.value !== null &&
      typeof token.value === 'object' &&
      (token.value as Record<string, unknown>)['type'] === 'VARIABLE_ALIAS'
    ) {
      // Figma 내부 형식: { type: "VARIABLE_ALIAS", id: "VariableID:..." }
      const id = (token.value as Record<string, unknown>)['id'] as string
      refVar = varById.get(id)
    }

    if (!refVar) {
      skipped++
      continue
    }
    applyToken(token, { type: 'VARIABLE_ALIAS', id: refVar.id }, refVar.resolvedType)
  }

  return { added, updated, skipped }
}
