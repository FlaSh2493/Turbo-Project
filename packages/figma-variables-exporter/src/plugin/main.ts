import { transformVariables } from './transformer'
import { applyToFigma, type FlatToken, type ImportOptions } from './importer'

declare const __html__: string

// Plugin UI 표시
figma.showUI(__html__, {
  width: 320,
  height: 560,
  title: 'Figma Variables Exporter',
})

// UI 메시지 핸들러
figma.ui.onmessage = async (msg: {
  type: string
  collectionIds?: string[]
  tokens?: FlatToken[]
  collectionName?: string
  modeName?: string
  conflictMode?: 'skip' | 'overwrite'
  saveVersion?: boolean
  versionTag?: string
}) => {
  // 초기 컬렉션 목록 요청
  if (msg.type === 'INIT_REQUEST') {
    try {
      const collections = await figma.variables.getLocalVariableCollectionsAsync()
      const allVariables = await figma.variables.getLocalVariablesAsync()

      figma.ui.postMessage({
        type: 'COLLECTIONS_LOADED',
        collections: collections.map(c => ({
          id: c.id,
          name: c.name,
          modes: c.modes,
          modeCount: c.modes.length,
          variableCount: c.variableIds.length,
          variableIds: c.variableIds,
        })),
        variables: allVariables.map(v => ({
          id: v.id,
          name: v.name,
          description: v.description,
          resolvedType: v.resolvedType,
          valuesByMode: v.valuesByMode,
        })),
      })
    } catch (err) {
      figma.ui.postMessage({
        type: 'EXPORT_ERROR',
        error: err instanceof Error ? err.message : 'Failed to load collections',
      })
    }
  }

  // Export 요청
  if (msg.type === 'EXPORT_REQUEST') {
    try {
      const selectedCollectionIds = msg.collectionIds ?? []

      // 전체 조회 후 선택된 컬렉션/변수만 필터
      const allCollections = await figma.variables.getLocalVariableCollectionsAsync()
      const allVariables = await figma.variables.getLocalVariablesAsync()

      const selectedCollections = allCollections.filter(c => selectedCollectionIds.includes(c.id))

      // transformer 호출 (alias 해석을 위해 전체 변수 전달, 출력은 선택된 컬렉션으로만 필터됨)
      const files = transformVariables(
        selectedCollections.map(c => ({
          id: c.id,
          name: c.name,
          modes: c.modes,
          variableIds: c.variableIds,
        })),
        allVariables.map(v => ({
          id: v.id,
          name: v.name,
          description: v.description,
          resolvedType: v.resolvedType as 'COLOR' | 'FLOAT' | 'STRING' | 'BOOLEAN',
          valuesByMode: v.valuesByMode,
        })),
      )

      figma.ui.postMessage({ type: 'EXPORT_READY', files })
    } catch (err) {
      figma.ui.postMessage({
        type: 'EXPORT_ERROR',
        error: err instanceof Error ? err.message : 'Export failed',
      })
    }
  }

  // Import 요청
  if (msg.type === 'IMPORT_REQUEST') {
    try {
      const options: ImportOptions = {
        collectionName: msg.collectionName,
        modeName: msg.modeName,
        conflictMode: msg.conflictMode,
        saveVersion: msg.saveVersion,
        versionTag: msg.versionTag,
      }
      const result = await applyToFigma(msg.tokens as FlatToken[], options)
      figma.ui.postMessage({ type: 'IMPORT_DONE', result })
    } catch (err) {
      figma.ui.postMessage({
        type: 'IMPORT_ERROR',
        error: err instanceof Error ? err.message : 'Import failed',
      })
    }
  }

  // 플러그인 닫기
  if (msg.type === 'CLOSE') {
    figma.closePlugin()
  }
}
