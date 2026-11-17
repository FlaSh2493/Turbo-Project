import { describe, it, expect, vi, beforeEach } from 'vitest'
import { extractFigmaVariables } from '../src/extract.js'
import fs from 'node:fs/promises'

describe('extractFigmaVariables', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Mock fs.mkdir and fs.writeFile
    vi.spyOn(fs, 'mkdir').mockResolvedValue(undefined)
    vi.spyOn(fs, 'writeFile').mockResolvedValue(undefined)
  })

  it('throws helpful error on 403 Forbidden', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 403,
      statusText: 'Forbidden',
    })

    await expect(
      extractFigmaVariables({
        fileKey: 'key',
        token: 'token',
        outDir: 'out',
      }),
    ).rejects.toThrow('Figma API Authentication failed (403/401)')
  })

  it('throws helpful error on 404 Not Found', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      statusText: 'Not Found',
    })

    await expect(
      extractFigmaVariables({
        fileKey: 'wrong-key',
        token: 'token',
        outDir: 'out',
      }),
    ).rejects.toThrow('Figma file not found (404)')
  })

  it('successfully parses figma variables and writes files', async () => {
    const mockData = {
      meta: {
        variableCollections: {
          col1: {
            name: 'Primitives',
            modes: [{ name: 'Default', modeId: 'm1' }],
            defaultModeId: 'm1',
          },
        },
        variables: {
          v1: {
            id: 'v1',
            name: 'color/white',
            variableCollectionId: 'col1',
            resolvedType: 'COLOR',
            valuesByMode: { m1: { r: 1, g: 1, b: 1, a: 1 } },
          },
        },
      },
    }

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockData),
    })

    await extractFigmaVariables({
      fileKey: 'key',
      token: 'token',
      outDir: 'out',
    })

    expect(fs.mkdir).toHaveBeenCalled()
    expect(fs.writeFile).toHaveBeenCalledWith(
      expect.stringContaining('primitives.tokens.json'),
      expect.stringContaining('"#ffffff"'),
      'utf-8',
    )
  })
})
