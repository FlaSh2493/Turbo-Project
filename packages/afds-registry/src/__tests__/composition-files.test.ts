import { describe, it, expect } from 'vitest'
import {
  isDistributableFile,
  isImportScannableFile,
  isSkippedDir,
  isSpecDoc,
} from '../lib/composition-files'

describe('배포 대상 판정 (isDistributableFile)', () => {
  it('코드 파일은 배포한다', () => {
    expect(isDistributableFile('table.tsx')).toBe(true)
    expect(isDistributableFile('table.context.ts')).toBe(true)
  })

  it('스펙 문서를 배포한다 — 에이전트가 컴포지션을 이해하는 정본이다', () => {
    expect(isDistributableFile('table.spec.md')).toBe(true)
    expect(isDistributableFile('base-check-box-group.spec.md')).toBe(true)
  })

  it('스토리북·테스트는 배포하지 않는다 (소비처에 불필요)', () => {
    expect(isDistributableFile('table.stories.tsx')).toBe(false)
    expect(isDistributableFile('table.test.ts')).toBe(false)
  })

  it('스펙 외 마크다운은 배포하지 않는다', () => {
    expect(isDistributableFile('README.md')).toBe(false)
    expect(isDistributableFile('NOTES.md')).toBe(false)
  })

  it('그 외 파일 형식은 배포하지 않는다', () => {
    expect(isDistributableFile('screenshot.png')).toBe(false)
    expect(isDistributableFile('data.json')).toBe(false)
  })
})

describe('import 스캔 대상 판정 (isImportScannableFile)', () => {
  it('코드 파일만 스캔한다', () => {
    expect(isImportScannableFile('table.tsx')).toBe(true)
    expect(isImportScannableFile('table.ts')).toBe(true)
  })

  it('스펙 문서는 스캔하지 않는다 — 코드펜스의 예시 import 가 유령 의존성이 된다', () => {
    expect(isImportScannableFile('table.spec.md')).toBe(false)
  })

  it('스토리북·테스트는 스캔하지 않는다 — 테스트 전용 의존성이 섞인다', () => {
    expect(isImportScannableFile('table.stories.tsx')).toBe(false)
    expect(isImportScannableFile('table.test.ts')).toBe(false)
  })
})

describe('배포와 스캔 판정은 같지 않다', () => {
  it('spec.md 는 배포되지만 스캔되지 않는다', () => {
    expect(isDistributableFile('table.spec.md')).toBe(true)
    expect(isImportScannableFile('table.spec.md')).toBe(false)
  })
})

describe('isSpecDoc / isSkippedDir', () => {
  it('스펙 문서를 식별한다', () => {
    expect(isSpecDoc('table.spec.md')).toBe(true)
    expect(isSpecDoc('table.md')).toBe(false)
  })

  it('테스트 디렉터리 두 표기 모두 제외한다', () => {
    expect(isSkippedDir('__test__')).toBe(true)
    expect(isSkippedDir('__tests__')).toBe(true)
    expect(isSkippedDir('node_modules')).toBe(true)
    expect(isSkippedDir('hooks')).toBe(false)
  })
})
