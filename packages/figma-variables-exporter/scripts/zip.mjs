import { createWriteStream, existsSync, mkdirSync, readdirSync, statSync, readFileSync } from 'fs'
import { join, relative } from 'path'
import { createGzip } from 'zlib'
import { pipeline } from 'stream/promises'

// Node 18+ 내장 zip 지원 여부 확인 후 fallback으로 tar.gz 사용
// Figma는 zip을 요구하므로 yazl 없이 순수 Node로 zip 생성

const ROOT = process.cwd()
const OUT_DIR = join(ROOT, 'dist')
const OUT_ZIP = join(OUT_DIR, 'figma-variables-exporter.zip')

// 포함할 파일 목록
const INCLUDE = ['manifest.json', 'dist/plugin/main.js', 'dist/ui/index.html']

// zip 생성 (fflate 없이 직접 구현 — Uint8Array 기반)
function u32le(n) {
  const b = new Uint8Array(4)
  b[0] = n & 0xff
  b[1] = (n >> 8) & 0xff
  b[2] = (n >> 16) & 0xff
  b[3] = (n >> 24) & 0xff
  return b
}

function u16le(n) {
  return new Uint8Array([n & 0xff, (n >> 8) & 0xff])
}

function crc32(buf) {
  const table = (() => {
    const t = new Uint32Array(256)
    for (let i = 0; i < 256; i++) {
      let c = i
      for (let j = 0; j < 8; j++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
      t[i] = c
    }
    return t
  })()
  let crc = 0xffffffff
  for (const byte of buf) crc = table[(crc ^ byte) & 0xff] ^ (crc >>> 8)
  return (crc ^ 0xffffffff) >>> 0
}

function concat(...arrays) {
  const total = arrays.reduce((s, a) => s + a.length, 0)
  const out = new Uint8Array(total)
  let offset = 0
  for (const a of arrays) {
    out.set(a, offset)
    offset += a.length
  }
  return out
}

function makeZip(entries) {
  // entries: [{ name: string, data: Buffer }]
  const localHeaders = []
  const centralDirs = []
  let offset = 0

  for (const { name, data } of entries) {
    const nameBytes = Buffer.from(name)
    const crc = crc32(data)
    const size = data.length

    // Local file header
    const local = concat(
      new Uint8Array([0x50, 0x4b, 0x03, 0x04]), // signature
      u16le(20), // version needed
      u16le(0), // flags
      u16le(0), // compression: store
      u16le(0),
      u16le(0), // mod time/date
      u32le(crc),
      u32le(size),
      u32le(size),
      u16le(nameBytes.length),
      u16le(0), // extra length
      nameBytes,
      data,
    )
    localHeaders.push(local)

    // Central directory entry
    const central = concat(
      new Uint8Array([0x50, 0x4b, 0x01, 0x02]), // signature
      u16le(20),
      u16le(20), // version made by / needed
      u16le(0), // flags
      u16le(0), // compression: store
      u16le(0),
      u16le(0), // mod time/date
      u32le(crc),
      u32le(size),
      u32le(size),
      u16le(nameBytes.length),
      u16le(0),
      u16le(0), // extra / comment length
      u16le(0),
      u16le(0), // disk start / int file attrs
      u32le(0), // ext file attrs
      u32le(offset), // local header offset
      nameBytes,
    )
    centralDirs.push(central)
    offset += local.length
  }

  const centralOffset = offset
  const centralData = concat(...centralDirs)

  // End of central directory
  const eocd = concat(
    new Uint8Array([0x50, 0x4b, 0x05, 0x06]),
    u16le(0),
    u16le(0), // disk number
    u16le(entries.length),
    u16le(entries.length),
    u32le(centralData.length),
    u32le(centralOffset),
    u16le(0), // comment length
  )

  return Buffer.from(concat(...localHeaders, centralData, eocd))
}

// 실행
const entries = []
for (const relPath of INCLUDE) {
  const absPath = join(ROOT, relPath)
  if (!existsSync(absPath)) {
    console.warn(`⚠ 파일 없음, 스킵: ${relPath}`)
    continue
  }
  entries.push({ name: relPath, data: readFileSync(absPath) })
}

const zipBuffer = makeZip(entries)
import { writeFileSync } from 'fs'
writeFileSync(OUT_ZIP, zipBuffer)
console.log(
  `zip created: dist/figma-variables-exporter.zip (${(zipBuffer.length / 1024).toFixed(1)} KB)`,
)
