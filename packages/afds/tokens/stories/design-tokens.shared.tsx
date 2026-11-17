/**
 * design-tokens.shared.tsx
 * Shared hooks and components for design token Storybook stories.
 * Used by both design-tokens.stories.tsx (semantic) and primitive-tokens.stories.tsx (primitive).
 */

import { useEffect, useState } from 'react'

// ─── CSS Var naming ───────────────────────────────────────────────────────────
/**
 * 토큰 경로를 실제 CSS 변수명으로 변환
 * 규칙: --afds-{path.replace(/\./g, '-')}
 *
 * @example 'color.gray.50' -> '--afds-color-gray-50'
 * @example 'spacing.0_5'    -> '--afds-spacing-0_5' (언더바 유지)
 */
export function tokenPathToCssVar(path: string): string {
  // 모든 점(.)을 대시(-)로 변경하여 CSS 변수명 형식 준수
  return `--afds-${path.replace(/\./g, '-')}`
}

// ─── Computed color hook ───────────────────────────────────────────────────────
export function useComputedColor(cssVar: string): string {
  const [hex, setHex] = useState('')
  useEffect(() => {
    const el = document.createElement('div')
    el.style.cssText = `position:absolute;visibility:hidden;background-color:var(${cssVar})`
    document.body.appendChild(el)
    const rgb = window.getComputedStyle(el).backgroundColor
    document.body.removeChild(el)
    const m = rgb.match(/\d+/g)
    if (m && m.length >= 3) {
      setHex(
        '#' +
          m
            .slice(0, 3)
            .map(n => parseInt(n).toString(16).padStart(2, '0'))
            .join(''),
      )
    }
  }, [cssVar])
  return hex
}

// ─── Copy to clipboard hook ───────────────────────────────────────────────────
export function useCopy(): [string | null, (text: string) => void] {
  const [copied, setCopied] = useState<string | null>(null)
  const copy = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(text)
      setTimeout(() => setCopied(null), 1500)
    })
  }
  return [copied, copy]
}

// ─── Shared Components ────────────────────────────────────────────────────────

export function SectionBlock({
  icon,
  title,
  description,
  children,
}: {
  icon: string
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <section style={{ marginBottom: 48 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <span style={{ fontSize: 24 }}>{icon}</span>
        <h2
          style={{
            fontSize: 20,
            fontWeight: 700,
            margin: 0,
            color: 'var(--afds-color-text-primary)',
          }}
        >
          {title}
        </h2>
      </div>
      <p
        style={{
          fontSize: 14,
          color: 'var(--afds-color-text-secondary)',
          margin: '0 0 20px 32px',
          lineHeight: 1.5,
        }}
      >
        {description}
      </p>
      <div style={{ marginLeft: 32 }}>{children}</div>
    </section>
  )
}

export function SubLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: 12,
        fontWeight: 600,
        color: 'var(--afds-color-text-secondary)',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        marginTop: 24,
        marginBottom: 12,
        paddingBottom: 4,
        borderBottom: '1px solid var(--afds-color-border-default)',
      }}
    >
      {children}
    </div>
  )
}

export function TokenRow({
  cssVar,
  name,
  desc,
  preview,
  copied,
  onCopy,
}: {
  cssVar: string
  /** 토큰 키 이름 (예: "4", "bold", "base") — cssVar 앞에 표시 */
  name?: string
  desc: string
  preview: React.ReactNode
  copied: string | null
  onCopy: (text: string) => void
}) {
  const isCopied = copied === cssVar
  return (
    <div
      onClick={() => onCopy(cssVar)}
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: '10px 12px',
        borderRadius: 8,
        cursor: 'pointer',
        transition: 'background 0.2s',
        borderBottom: '1px solid var(--afds-color-bg-surface-sunken)',
      }}
      onMouseEnter={e => (e.currentTarget.style.background = 'var(--afds-color-bg-canvas)')}
      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
    >
      <div style={{ width: 120, display: 'flex', justifyContent: 'center', marginRight: 20 }}>
        {preview}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          {name && (
            <span
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: isCopied
                  ? 'var(--afds-color-bg-selected)'
                  : 'var(--afds-color-text-primary)',
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, monospace',
              }}
            >
              {name}
            </span>
          )}
          {name && (
            <span style={{ fontSize: 11, color: 'var(--afds-color-text-disabled)' }}>·</span>
          )}
          <code
            style={{
              fontSize: 11,
              fontWeight: 400,
              color: isCopied
                ? 'var(--afds-color-bg-selected)'
                : 'var(--afds-color-text-secondary)',
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, monospace',
            }}
          >
            {cssVar}
          </code>
          {isCopied && (
            <span style={{ fontSize: 11, color: 'var(--afds-color-bg-selected)', fontWeight: 600 }}>
              Copied!
            </span>
          )}
        </div>
        {desc && (
          <div style={{ fontSize: 12, color: 'var(--afds-color-text-secondary)', marginTop: 2 }}>
            {desc}
          </div>
        )}
      </div>
    </div>
  )
}

export function ColorCard({
  cssVar,
  label,
  description,
  reference,
  copied,
  onCopy,
}: {
  cssVar: string
  label: string
  description?: string
  /** Semantic → Primitive 참조 (예: {color.brand.500}) */
  reference?: string
  copied: string | null
  onCopy: (text: string) => void
}) {
  const isCopied = copied === cssVar
  const computedHex = useComputedColor(cssVar)
  return (
    <div
      onClick={() => onCopy(cssVar)}
      style={{
        padding: 12,
        borderRadius: 10,
        border: '1px solid var(--afds-color-border-default)',
        cursor: 'pointer',
        transition: 'transform 0.1s',
        background: 'var(--afds-color-bg-surface)',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-2px)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'none'
      }}
    >
      <div
        style={{
          height: 60,
          background: `var(${cssVar})`,
          borderRadius: 6,
          marginBottom: 10,
          border: '1px solid var(--afds-color-border-default)',
          position: 'relative',
        }}
      >
        {computedHex && (
          <span
            style={{
              position: 'absolute',
              bottom: 4,
              right: 6,
              fontSize: 10,
              fontFamily: 'monospace',
              fontWeight: 600,
              color: '#fff',
              textShadow: '0 0 3px rgba(0,0,0,0.6)',
              letterSpacing: '0.02em',
            }}
          >
            {computedHex}
          </span>
        )}
      </div>
      <div>
        <div
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: isCopied ? 'var(--afds-color-bg-selected)' : 'var(--afds-color-text-primary)',
            display: 'flex',
            justifyContent: 'space-between',
          }}
        >
          {label}
          {isCopied && <span style={{ fontSize: 10 }}>Copied!</span>}
        </div>
        <div
          style={{
            fontSize: 11,
            color: 'var(--afds-color-text-secondary)',
            fontFamily: 'monospace',
            marginTop: 2,
          }}
        >
          {cssVar}
        </div>
        {reference && (
          <div
            style={{
              fontSize: 10,
              color: 'var(--afds-color-text-brand-subtle)',
              fontFamily: 'monospace',
              marginTop: 3,
              opacity: 0.85,
            }}
          >
            → {reference}
          </div>
        )}
        {description && (
          <div style={{ fontSize: 10, color: 'var(--afds-color-text-secondary)', marginTop: 4 }}>
            {description}
          </div>
        )}
      </div>
    </div>
  )
}

export function SpacingBarPreview({ cssVar, pixelValue }: { cssVar: string; pixelValue?: number }) {
  return (
    <div
      style={{
        width: pixelValue !== undefined ? `${pixelValue}px` : `var(${cssVar})`,
        height: 12,
        background: 'var(--afds-color-bg-selected)',
        borderRadius: 2,
        minWidth: 1,
      }}
    />
  )
}

export function OpacityPreview({ cssVar }: { cssVar: string }) {
  return (
    <div
      style={{
        width: 60,
        height: 32,
        borderRadius: 4,
        overflow: 'hidden',
        // 격자 배경 패턴 (Checkerboard)
        backgroundImage: `conic-gradient(#eee 0.25turn, #fff 0.25turn 0.5turn, #eee 0.5turn 0.75turn, #fff 0.75turn)`,
        backgroundSize: '8px 8px',
        border: '1px solid var(--afds-color-border-default)',
      }}
    >
      <div
        style={{
          width: '100%',
          height: '100%',
          background: 'var(--afds-color-bg-selected)',
          opacity: `var(${cssVar})`,
        }}
      />
    </div>
  )
}

export function AnimPreview({ cssVar }: { cssVar: string }) {
  const [active, setActive] = useState(false)
  return (
    <div
      onMouseEnter={() => setActive(true)}
      onMouseLeave={() => setActive(false)}
      style={{
        width: 100,
        height: 32,
        background: 'var(--afds-color-bg-surface-sunken)',
        borderRadius: 16,
        padding: 4,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          width: 24,
          height: 24,
          background: 'var(--afds-color-bg-selected)',
          borderRadius: '50%',
          position: 'absolute',
          left: active ? 'calc(100% - 28px)' : '4px',
          transition: `all var(${cssVar})`,
        }}
      />
    </div>
  )
}
