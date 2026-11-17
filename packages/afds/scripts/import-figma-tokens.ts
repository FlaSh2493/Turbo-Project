/**
 * 일회성 Figma 토큰 import 스크립트
 * Usage: tsx scripts/import-figma-tokens.ts <input.json>
 *
 * Tokens Studio 내보내기 형식을 primitive/semantic 파일로 분리 저장 후 토큰을 재생성한다.
 */

import fs from 'node:fs'
import path from 'node:path'
import { execSync } from 'node:child_process'

const TIER_MAP: Record<string, string> = {
  primitive: 'tokens/json/primitive.tokens.json',
  semantic: 'tokens/json/semantic.tokens.json',
  dark: 'tokens/json/dark.tokens.json',
}

const SKIP_KEYS = new Set(['$themes', '$metadata'])

/** DTCG ($value/$type) → 프로젝트 레거시 (value/type) 변환 */
function convertNode(node: unknown): unknown {
  if (typeof node !== 'object' || node === null) return node

  const obj = node as Record<string, unknown>

  // 리프 토큰: $value 또는 value 를 가진 노드
  if ('$value' in obj || 'value' in obj) {
    const result: Record<string, unknown> = {
      value: obj['$value'] ?? obj['value'],
      type: obj['$type'] ?? obj['type'],
    }
    return result
  }

  // 중간 그룹: 재귀 변환
  const result: Record<string, unknown> = {}
  for (const [key, val] of Object.entries(obj)) {
    if (key.startsWith('$')) continue
    result[key] = convertNode(val)
  }
  return result
}

async function main() {
  const inputArg = process.argv[2]
  if (!inputArg) {
    console.error('Usage: tsx scripts/import-figma-tokens.ts <input.json>')
    process.exit(1)
  }

  const inputPath = path.resolve(process.cwd(), inputArg)
  if (!fs.existsSync(inputPath)) {
    console.error(`File not found: ${inputPath}`)
    process.exit(1)
  }

  const raw = JSON.parse(fs.readFileSync(inputPath, 'utf-8')) as Record<string, unknown>

  let written = 0
  for (const [key, value] of Object.entries(raw)) {
    if (SKIP_KEYS.has(key)) continue

    const outRelPath = TIER_MAP[key]
    if (!outRelPath) {
      console.warn(`  ⚠ 알 수 없는 tier "${key}" — 건너뜀`)
      continue
    }

    const outPath = path.resolve(process.cwd(), outRelPath)
    const converted = convertNode(value)
    fs.mkdirSync(path.dirname(outPath), { recursive: true })
    fs.writeFileSync(outPath, JSON.stringify(converted, null, 2) + '\n', 'utf-8')
    console.log(`  ✓ ${outRelPath}`)
    written++
  }

  if (written === 0) {
    console.error('저장된 파일 없음. 입력 JSON 구조를 확인하세요.')
    process.exit(1)
  }

  console.log('\n토큰 재생성 중...')
  execSync('pnpm --filter afds generate:tokens', { stdio: 'inherit' })
  console.log('\n완료.')
}

main().catch(e => {
  console.error(e)
  process.exit(1)
})
