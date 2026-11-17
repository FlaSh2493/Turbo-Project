import { useState, useEffect } from 'react'
import CollectionList from '../components/CollectionList'
import StatusMessage from '../components/StatusMessage'
import { transformVariables, type DtcgFile } from '../../plugin/transformer'

interface CollectionItem {
  id: string
  name: string
  modes: Array<{ modeId: string; name: string }>
  modeCount: number
  variableCount: number
  variableIds: string[]
}

interface VariableData {
  id: string
  name: string
  description?: string
  resolvedType: 'COLOR' | 'FLOAT' | 'STRING' | 'BOOLEAN'
  valuesByMode: Record<string, unknown>
}

export default function ExportTab() {
  const [collections, setCollections] = useState<CollectionItem[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [previews, setPreviews] = useState<Map<string, DtcgFile[]>>(new Map())
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isExporting, setIsExporting] = useState(false)

  useEffect(() => {
    parent.postMessage({ pluginMessage: { type: 'INIT_REQUEST' } }, '*')

    const handleMessage = (e: MessageEvent) => {
      const msg = e.data?.pluginMessage
      if (!msg) return

      if (msg.type === 'COLLECTIONS_LOADED') {
        const cols: CollectionItem[] = msg.collections
        const vars: VariableData[] = msg.variables ?? []

        setCollections(cols)
        setSelectedIds(new Set(cols.map(c => c.id)))

        // 컬렉션별 미리보기 생성 (transformer를 UI에서 직접 실행)
        const previewMap = new Map<string, DtcgFile[]>()
        for (const col of cols) {
          const colVars = vars.filter(v => col.variableIds.includes(v.id))
          const files = transformVariables([col], colVars)
          previewMap.set(col.id, files)
        }
        setPreviews(previewMap)
        setIsLoading(false)
      }

      if (msg.type === 'EXPORT_READY') {
        const files: { filename: string; content: unknown }[] = msg.files
        const downloadNext = (index: number) => {
          if (index >= files.length) {
            setIsExporting(false)
            setStatus({ type: 'success', message: `${files.length}개 파일 다운로드 완료` })
            return
          }
          const file = files[index]
          const blob = new Blob([JSON.stringify(file.content, null, 2)], {
            type: 'application/json',
          })
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = file.filename
          document.body.appendChild(a)
          a.click()
          document.body.removeChild(a)
          URL.revokeObjectURL(url)
          setTimeout(() => downloadNext(index + 1), 200)
        }
        downloadNext(0)
      }

      if (msg.type === 'EXPORT_ERROR') {
        setIsExporting(false)
        setStatus({ type: 'error', message: msg.error })
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [])

  const handleToggle = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const handleExport = () => {
    if (selectedIds.size === 0) return
    setIsExporting(true)
    setStatus(null)
    parent.postMessage(
      {
        pluginMessage: { type: 'EXPORT_REQUEST', collectionIds: Array.from(selectedIds) },
      },
      '*',
    )
  }

  if (isLoading) {
    return (
      <div style={{ padding: '16px', color: 'var(--figma-color-text-secondary, #888)' }}>
        Loading collections...
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* 스크롤 영역 */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        <div style={{ fontSize: '11px', color: 'var(--figma-color-text-secondary, #888)' }}>
          Collections
        </div>

        <CollectionList
          collections={collections}
          selectedIds={selectedIds}
          previews={previews}
          onToggle={handleToggle}
        />

        {status && <StatusMessage type={status.type} message={status.message} />}
      </div>

      {/* 고정 버튼 */}
      <div
        style={{
          padding: '12px',
          borderTop: '1px solid var(--figma-color-border, #e5e5e5)',
          background: 'var(--figma-color-bg, #fff)',
        }}
      >
        <button
          onClick={handleExport}
          disabled={selectedIds.size === 0 || isExporting}
          style={{
            background:
              selectedIds.size === 0 || isExporting
                ? 'var(--figma-color-bg-disabled, #e5e5e5)'
                : 'var(--figma-color-bg-brand, #18a0fb)',
            color:
              selectedIds.size === 0 || isExporting
                ? 'var(--figma-color-text-disabled, #999)'
                : '#ffffff',
            border: 'none',
            borderRadius: '6px',
            padding: '8px 16px',
            cursor: selectedIds.size === 0 || isExporting ? 'not-allowed' : 'pointer',
            fontSize: '11px',
            fontWeight: 600,
            width: '100%',
          }}
        >
          {isExporting ? 'Exporting...' : `Export Selected (${selectedIds.size})`}
        </button>
      </div>
    </div>
  )
}
