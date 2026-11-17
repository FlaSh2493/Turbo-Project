import { useState } from 'react'
import type { DtcgFile } from '../../plugin/transformer'

interface CollectionItem {
  id: string
  name: string
  modeCount: number
  variableCount: number
}

interface Props {
  collections: CollectionItem[]
  selectedIds: Set<string>
  previews: Map<string, DtcgFile[]>
  onToggle: (id: string) => void
}

export default function CollectionList({ collections, selectedIds, previews, onToggle }: Props) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())

  if (collections.length === 0) {
    return (
      <div style={{ color: 'var(--figma-color-text-secondary, #888)', fontSize: '11px' }}>
        No variable collections found in this file.
      </div>
    )
  }

  const toggleExpand = (id: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setExpandedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      {collections.map(col => {
        const isSelected = selectedIds.has(col.id)
        const isExpanded = expandedIds.has(col.id)
        const files = previews.get(col.id) ?? []

        return (
          <div
            key={col.id}
            style={{
              border: '1px solid var(--figma-color-border, #e5e5e5)',
              borderRadius: '6px',
              overflow: 'hidden',
            }}
          >
            {/* 컬렉션 헤더 행 */}
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 8px',
                cursor: 'pointer',
                background: isSelected
                  ? 'var(--figma-color-bg-selected, #dbeafe)'
                  : 'var(--figma-color-bg, #fff)',
              }}
            >
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => onToggle(col.id)}
                style={{ cursor: 'pointer', flexShrink: 0 }}
              />
              <span style={{ flex: 1, fontSize: '11px', fontWeight: 500 }}>{col.name}</span>
              <span style={{ color: 'var(--figma-color-text-secondary, #888)', fontSize: '10px' }}>
                {col.variableCount} tokens
                {col.modeCount > 1 ? `, ${col.modeCount} modes` : ''}
              </span>
              {/* 펼치기 버튼 */}
              {files.length > 0 && (
                <button
                  onClick={e => toggleExpand(col.id, e)}
                  title={isExpanded ? '미리보기 닫기' : '미리보기 열기'}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '0 2px',
                    color: 'var(--figma-color-text-secondary, #888)',
                    fontSize: '10px',
                    lineHeight: 1,
                    flexShrink: 0,
                  }}
                >
                  {isExpanded ? '▲' : '▼'}
                </button>
              )}
            </label>

            {/* 미리보기 패널 */}
            {isExpanded && files.length > 0 && (
              <div
                style={{
                  borderTop: '1px solid var(--figma-color-border, #e5e5e5)',
                  background: 'var(--figma-color-bg-secondary, #f7f7f7)',
                }}
              >
                {files.map(file => (
                  <div key={file.filename}>
                    {/* 파일명 헤더 */}
                    <div
                      style={{
                        padding: '4px 8px',
                        fontSize: '10px',
                        fontWeight: 600,
                        color: 'var(--figma-color-text-secondary, #666)',
                        borderBottom: '1px solid var(--figma-color-border, #e5e5e5)',
                        fontFamily: 'monospace',
                        background: 'var(--figma-color-bg-tertiary, #efefef)',
                      }}
                    >
                      📄 {file.filename}
                    </div>
                    {/* JSON 내용 */}
                    <pre
                      style={{
                        margin: 0,
                        padding: '8px',
                        fontSize: '9.5px',
                        fontFamily: 'monospace',
                        lineHeight: '1.5',
                        overflowY: 'auto',
                        maxHeight: '160px',
                        color: 'var(--figma-color-text, #1e1e1e)',
                        whiteSpace: 'pre',
                      }}
                    >
                      {JSON.stringify(file.content, null, 2)}
                    </pre>
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
