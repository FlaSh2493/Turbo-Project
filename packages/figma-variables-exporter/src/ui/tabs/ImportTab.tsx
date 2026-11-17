import { useState, useRef, useEffect } from 'react'
import StatusMessage from '../components/StatusMessage'
import { validateDtcg, flattenTokens, type FlatToken } from '../../plugin/importer'

type ConflictMode = 'skip' | 'overwrite'
type Step = 'idle' | 'preview' | 'confirm-version' | 'importing' | 'done'

interface ParsedFile {
  filename: string
  tokenCount: number
  tokens: FlatToken[]
  groups: TokenGroup[]
}

interface TokenGroup {
  name: string
  tokens: FlatToken[]
}

interface CollectionMode {
  collectionName: string
  modes: string[]
}

function groupTokens(tokens: FlatToken[]): TokenGroup[] {
  const map = new Map<string, FlatToken[]>()
  for (const t of tokens) {
    const top = t.path.split('/')[0]
    if (!map.has(top)) map.set(top, [])
    map.get(top)!.push(t)
  }
  return Array.from(map.entries()).map(([name, tokens]) => ({ name, tokens }))
}

function TokenPreview({ groups }: { groups: TokenGroup[] }) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  const toggle = (name: string) => {
    setExpanded(prev => {
      const next = new Set(prev)
      if (next.has(name)) next.delete(name)
      else next.add(name)
      return next
    })
  }

  return (
    <div
      style={{
        border: '1px solid var(--figma-color-border, #e5e5e5)',
        borderRadius: '6px',
        overflow: 'hidden',
        maxHeight: '300px',
        overflowY: 'auto',
      }}
    >
      {groups.map(group => (
        <div key={group.name}>
          <button
            onClick={() => toggle(group.name)}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '5px 8px',
              background: 'var(--figma-color-bg-secondary, #f7f7f7)',
              border: 'none',
              borderBottom: '1px solid var(--figma-color-border, #e5e5e5)',
              cursor: 'pointer',
              textAlign: 'left',
            }}
          >
            <span style={{ fontSize: '10px', color: 'var(--figma-color-text-secondary, #888)' }}>
              {expanded.has(group.name) ? '▼' : '▶'}
            </span>
            <span style={{ fontSize: '11px', fontWeight: 600, flex: 1 }}>{group.name}</span>
            <span style={{ fontSize: '10px', color: 'var(--figma-color-text-secondary, #888)' }}>
              {group.tokens.length}개
            </span>
          </button>
          {expanded.has(group.name) && (
            <div style={{ background: 'var(--figma-color-bg, #fff)' }}>
              {group.tokens.map(t => (
                <div
                  key={t.path}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '3px 12px',
                    borderBottom: '1px solid var(--figma-color-border, #f0f0f0)',
                  }}
                >
                  <span
                    style={{
                      fontSize: '10px',
                      fontFamily: 'monospace',
                      color: 'var(--figma-color-text, #1e1e1e)',
                    }}
                  >
                    {t.path}
                  </span>
                  <span
                    style={{
                      fontSize: '10px',
                      color: 'var(--figma-color-text-secondary, #aaa)',
                      marginLeft: '8px',
                      flexShrink: 0,
                    }}
                  >
                    {t.type}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

export default function ImportTab() {
  const [step, setStep] = useState<Step>('idle')
  const [parsed, setParsed] = useState<ParsedFile | null>(null)
  const [collectionName, setCollectionName] = useState('')
  const [modeName, setModeName] = useState('Mode 1')
  const [availableModes, setAvailableModes] = useState<CollectionMode[]>([])
  const [conflictMode, setConflictMode] = useState<ConflictMode>('overwrite')
  const [versionTag, setVersionTag] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<{ added: number; updated: number; skipped: number } | null>(
    null,
  )
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    // 기존 컬렉션 + 모드 정보 요청
    parent.postMessage({ pluginMessage: { type: 'INIT_REQUEST' } }, '*')

    const handleMessage = (e: MessageEvent) => {
      const msg = e.data?.pluginMessage
      if (!msg) return

      if (msg.type === 'COLLECTIONS_LOADED') {
        const modes: CollectionMode[] = msg.collections.map(
          (c: { name: string; modes: { name: string }[] }) => ({
            collectionName: c.name,
            modes: c.modes.map((m: { name: string }) => m.name),
          }),
        )
        setAvailableModes(modes)
      }
      if (msg.type === 'IMPORT_DONE') {
        setResult(msg.result)
        setStep('done')
      }
      if (msg.type === 'IMPORT_ERROR') {
        setError(msg.error)
        setStep('preview')
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [])

  // 컬렉션명 변경 시 해당 컬렉션의 첫 번째 모드를 기본값으로
  const handleCollectionNameChange = (name: string) => {
    setCollectionName(name)
    const matched = availableModes.find(c => c.collectionName === name)
    if (matched && matched.modes.length > 0) {
      setModeName(matched.modes[0])
    }
  }

  const matchedCollection = availableModes.find(c => c.collectionName === collectionName)
  const modeOptions = matchedCollection?.modes ?? []

  const handleFile = (file: File) => {
    setError(null)
    setParsed(null)
    setStep('idle')

    if (!file.name.endsWith('.json')) {
      setError('JSON 파일만 지원합니다.')
      return
    }

    const reader = new FileReader()
    reader.onload = e => {
      try {
        const json = JSON.parse(e.target?.result as string)
        const validation = validateDtcg(json)
        if (!validation.valid) {
          setError(`DTCG 형식 오류: ${validation.error}`)
          return
        }
        const tokens = flattenTokens(json)
        const groups = groupTokens(tokens)
        const name = file.name.replace(/\.tokens\.json$|\.json$/, '')
        setParsed({ filename: file.name, tokenCount: validation.tokenCount, tokens, groups })
        handleCollectionNameChange(name)
        setVersionTag(`import-${name}-${new Date().toISOString().slice(0, 10)}`)
        setStep('preview')
      } catch {
        setError('JSON 파싱에 실패했습니다. 파일을 확인해주세요.')
      }
    }
    reader.readAsText(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
    e.target.value = ''
  }

  const sendImport = (saveVersion: boolean) => {
    if (!parsed) return
    setStep('importing')
    parent.postMessage(
      {
        pluginMessage: {
          type: 'IMPORT_REQUEST',
          tokens: parsed.tokens,
          collectionName,
          modeName,
          conflictMode,
          saveVersion,
          versionTag,
        },
      },
      '*',
    )
  }

  const reset = () => {
    setStep('idle')
    setParsed(null)
    setError(null)
    setResult(null)
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '5px 8px',
    fontSize: '11px',
    border: '1px solid var(--figma-color-border, #e5e5e5)',
    borderRadius: '4px',
    background: 'var(--figma-color-bg, #fff)',
    color: 'var(--figma-color-text, #1e1e1e)',
    boxSizing: 'border-box',
  }

  const labelStyle: React.CSSProperties = {
    fontSize: '10px',
    color: 'var(--figma-color-text-secondary, #888)',
    marginBottom: '3px',
    display: 'block',
  }

  const hintStyle: React.CSSProperties = {
    fontSize: '10px',
    color: 'var(--figma-color-text-secondary, #aaa)',
    marginTop: '3px',
    lineHeight: 1.4,
  }

  const canImport = step === 'preview' && !!collectionName.trim()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
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
        {/* 버전 확인 다이얼로그 */}
        {step === 'confirm-version' && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 100,
            }}
          >
            <div
              style={{
                background: 'var(--figma-color-bg, #fff)',
                borderRadius: '8px',
                padding: '16px',
                width: '260px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
              }}
            >
              <div style={{ fontSize: '12px', fontWeight: 600 }}>버전 히스토리 저장</div>
              <div
                style={{
                  fontSize: '11px',
                  color: 'var(--figma-color-text-secondary, #888)',
                  lineHeight: 1.5,
                }}
              >
                Import 전 현재 상태를 Figma 버전 히스토리에 저장하시겠습니까?
                <br />
                저장하면 File › Show Version History에서 롤백할 수 있습니다.
              </div>
              <div>
                <span style={labelStyle}>버전 태그</span>
                <input
                  style={inputStyle}
                  value={versionTag}
                  onChange={e => setVersionTag(e.target.value)}
                  placeholder="e.g. v1.0.0"
                />
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => sendImport(true)}
                  style={{
                    flex: 1,
                    padding: '7px',
                    fontSize: '11px',
                    fontWeight: 600,
                    background: 'var(--figma-color-bg-brand, #18a0fb)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer',
                  }}
                >
                  저장 후 Import
                </button>
                <button
                  onClick={() => sendImport(false)}
                  style={{
                    flex: 1,
                    padding: '7px',
                    fontSize: '11px',
                    fontWeight: 500,
                    background: 'var(--figma-color-bg-secondary, #f0f0f0)',
                    color: 'var(--figma-color-text, #1e1e1e)',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer',
                  }}
                >
                  그냥 Import
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 파일 드롭존 */}
        {(step === 'idle' || step === 'preview') && (
          <div
            onDrop={handleDrop}
            onDragOver={e => e.preventDefault()}
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: `2px dashed ${step === 'preview' ? 'var(--figma-color-bg-brand, #18a0fb)' : 'var(--figma-color-border, #ccc)'}`,
              borderRadius: '8px',
              padding: step === 'preview' ? '10px' : '20px',
              textAlign: 'center',
              cursor: 'pointer',
              color: 'var(--figma-color-text-secondary, #888)',
              fontSize: '11px',
              lineHeight: 1.6,
            }}
          >
            {step === 'preview' && parsed ? (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                }}
              >
                <span>📄</span>
                <span style={{ fontWeight: 600, color: 'var(--figma-color-text, #1e1e1e)' }}>
                  {parsed.filename}
                </span>
                <span style={{ color: 'var(--figma-color-text-secondary, #888)' }}>
                  — 다른 파일 선택
                </span>
              </div>
            ) : (
              <>
                <div style={{ fontSize: '20px', marginBottom: '4px' }}>📂</div>
                <div>DTCG JSON 파일을 드래그하거나 클릭해서 선택</div>
              </>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              style={{ display: 'none' }}
              onChange={handleFileInput}
            />
          </div>
        )}

        {error && <StatusMessage type="error" message={error} />}

        {/* 미리보기 & 옵션 */}
        {step === 'preview' && parsed && (
          <>
            {/* 토큰 요약 */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '6px 2px',
              }}
            >
              <span style={{ fontSize: '11px', fontWeight: 600 }}>토큰 미리보기</span>
              <span style={{ fontSize: '10px', color: 'var(--figma-color-text-secondary, #888)' }}>
                총 {parsed.tokenCount}개 · {parsed.groups.length}개 그룹
              </span>
            </div>
            <TokenPreview groups={parsed.groups} />

            {/* 옵션 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div>
                <span style={labelStyle}>대상 컬렉션명</span>
                {availableModes.length > 0 ? (
                  <select
                    style={{ ...inputStyle, appearance: 'auto' }}
                    value={collectionName}
                    onChange={e => handleCollectionNameChange(e.target.value)}
                  >
                    <option value="">-- 새 컬렉션 생성 --</option>
                    {availableModes.map(c => (
                      <option key={c.collectionName} value={c.collectionName}>
                        {c.collectionName}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    style={inputStyle}
                    value={collectionName}
                    onChange={e => handleCollectionNameChange(e.target.value)}
                    placeholder="e.g. primitive"
                  />
                )}
                {!collectionName && (
                  <span style={hintStyle}>컬렉션명을 입력하면 없을 경우 새로 생성됩니다.</span>
                )}
              </div>

              {collectionName && (
                <input
                  style={{ ...inputStyle, display: 'none' }}
                  value={collectionName}
                  onChange={e => handleCollectionNameChange(e.target.value)}
                  placeholder="새 컬렉션명 입력"
                />
              )}

              {/* 새 컬렉션명 직접 입력 (선택이 -- 새 컬렉션 생성 -- 일 때) */}
              {availableModes.length > 0 && !collectionName && (
                <div>
                  <span style={labelStyle}>새 컬렉션명 직접 입력</span>
                  <input
                    style={inputStyle}
                    value={collectionName}
                    onChange={e => handleCollectionNameChange(e.target.value)}
                    placeholder="e.g. primitive"
                  />
                </div>
              )}

              <div>
                <span style={labelStyle}>모드 (Mode)</span>
                {modeOptions.length > 0 ? (
                  <select
                    style={{ ...inputStyle, appearance: 'auto' }}
                    value={modeName}
                    onChange={e => setModeName(e.target.value)}
                  >
                    {modeOptions.map(m => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    style={inputStyle}
                    value={modeName}
                    onChange={e => setModeName(e.target.value)}
                    placeholder="Mode 1"
                  />
                )}
                <span style={hintStyle}>
                  Figma Variables 패널의 모드 이름입니다 (예: Light, Dark, Mode 1).{' '}
                  {modeOptions.length === 0 && '존재하지 않으면 자동으로 생성됩니다.'}
                </span>
              </div>

              <div>
                <span style={labelStyle}>충돌 처리</span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {(['overwrite', 'skip'] as ConflictMode[]).map(mode => (
                    <label
                      key={mode}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '11px',
                        cursor: 'pointer',
                      }}
                    >
                      <input
                        type="radio"
                        name="conflict"
                        value={mode}
                        checked={conflictMode === mode}
                        onChange={() => setConflictMode(mode)}
                      />
                      {mode === 'overwrite' ? '덮어쓰기' : '기존 유지 (skip)'}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {/* 결과 */}
        {step === 'done' && result && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <StatusMessage type="success" message="Import 완료!" />
            <div
              style={{
                background: 'var(--figma-color-bg-secondary, #f7f7f7)',
                borderRadius: '6px',
                padding: '10px 12px',
                fontSize: '11px',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
              }}
            >
              <div>✅ 추가: {result.added}개</div>
              <div>🔄 업데이트: {result.updated}개</div>
              <div>⏭ 스킵: {result.skipped}개</div>
            </div>
          </div>
        )}

        {step === 'importing' && (
          <div
            style={{
              fontSize: '11px',
              color: 'var(--figma-color-text-secondary, #888)',
              textAlign: 'center',
              padding: '12px',
            }}
          >
            Importing...
          </div>
        )}
      </div>

      {/* 하단 버튼 */}
      <div
        style={{
          padding: '12px',
          borderTop: '1px solid var(--figma-color-border, #e5e5e5)',
          background: 'var(--figma-color-bg, #fff)',
          display: 'flex',
          gap: '8px',
        }}
      >
        {step === 'done' ? (
          <button
            onClick={reset}
            style={{
              flex: 1,
              padding: '8px',
              fontSize: '11px',
              fontWeight: 600,
              background: 'var(--figma-color-bg-brand, #18a0fb)',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
            }}
          >
            새 파일 Import
          </button>
        ) : (
          <button
            onClick={() => setStep('confirm-version')}
            disabled={!canImport}
            style={{
              flex: 1,
              padding: '8px',
              fontSize: '11px',
              fontWeight: 600,
              background: canImport
                ? 'var(--figma-color-bg-brand, #18a0fb)'
                : 'var(--figma-color-bg-disabled, #e5e5e5)',
              color: canImport ? '#fff' : 'var(--figma-color-text-disabled, #999)',
              border: 'none',
              borderRadius: '6px',
              cursor: canImport ? 'pointer' : 'not-allowed',
            }}
          >
            Import
          </button>
        )}
      </div>
    </div>
  )
}
