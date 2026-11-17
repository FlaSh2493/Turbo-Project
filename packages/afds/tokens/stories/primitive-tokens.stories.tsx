import type { Meta, StoryObj } from '@storybook/react'
import primitiveJson from '../json/primitive.tokens.json'
import {
  tokenPathToCssVar,
  useCopy,
  ColorCard,
  SectionBlock,
  TokenRow,
  SpacingBarPreview,
  SubLabel,
} from './design-tokens.shared'

const meta: Meta = {
  title: 'Foundation / Primitive Tokens',
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'AFDS Primitive 디자인 토큰 목록. 원시 디자인 값으로, 컴포넌트에서 직접 사용하지 말고 Semantic 토큰을 통해 참조하세요.',
      },
    },
  },
}
export default meta

// ─── Color Groups ─────────────────────────────────────────────────────────────
// Display order and titles — keys are extracted dynamically from JSON and sorted.
const COLOR_GROUP_ORDER = [
  { title: 'Brand', path: 'brand' },
  { title: 'Gray', path: 'gray' },
  { title: 'Extra UI', path: 'extra.ui' },
  { title: 'Extra Graph', path: 'extra.graph' },
  { title: 'Alpha White', path: 'alpha.white' },
  { title: 'Alpha Black', path: 'alpha.black' },
  { title: 'Alpha Brand', path: 'alpha.brand' },
]

function sortColorKeys(keys: string[]): string[] {
  const allNumeric = keys.every(k => /^\d+$/.test(k))
  if (allNumeric) return [...keys].sort((a, b) => parseInt(a) - parseInt(b))
  return keys
}

function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((acc, key) => acc?.[key], obj)
}

function camelToKebab(str: string): string {
  return str.replace(/([A-Z])/g, '-$1').toLowerCase()
}

function PrimitiveColorSection() {
  const [copied, onCopy] = useCopy()
  const colorData = (primitiveJson as any).color as Record<string, any>

  return (
    <SectionBlock
      icon="🎨"
      title="Color"
      description="원시 컬러 팔레트 — Semantic 토큰이 이 값들을 참조합니다. 컴포넌트에서 직접 사용하지 마세요."
    >
      {COLOR_GROUP_ORDER.map(group => {
        const paletteObj = getNestedValue(colorData, group.path)
        if (!paletteObj) return null
        const keys = sortColorKeys(Object.keys(paletteObj))
        return (
          <div key={group.title} style={{ marginBottom: 24 }}>
            <div
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: 'var(--afds-color-text-secondary)',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                marginBottom: 10,
              }}
            >
              {group.title}
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
                gap: 10,
              }}
            >
              {keys.map((key: string) => {
                const token = paletteObj[key]
                if (!token) return null
                const cssVarSuffix = `color.${group.path}.${key}`.replace(/\./g, '-')
                const cssVar = `--afds-${cssVarSuffix}`
                return (
                  <ColorCard
                    key={key}
                    cssVar={cssVar}
                    label={`${group.path}-${key}`}
                    description={''}
                    copied={copied}
                    onCopy={onCopy}
                  />
                )
              })}
            </div>
          </div>
        )
      })}
    </SectionBlock>
  )
}

// ─── Spacing Section ──────────────────────────────────────────────────────────
function PrimitiveSpacingSection() {
  const [copied, onCopy] = useCopy()
  const spacingData = (primitiveJson as any).spacing as Record<
    string,
    { value?: string; $value?: string; $description?: string; description?: string }
  >

  const tokens = Object.keys(spacingData)
    .map(key => {
      const raw = spacingData[key].value ?? spacingData[key].$value
      const numParsed = typeof raw === 'number' ? raw : parseInt(String(raw))
      const pixelValue = !isNaN(numParsed) ? numParsed : undefined
      return {
        key,
        cssVar: tokenPathToCssVar(`spacing.${key.replace(/_/g, '-')}`),
        desc: pixelValue !== undefined ? `${pixelValue}px` : String(raw ?? ''),
        pixelValue,
      }
    })
    .sort((a, b) => (a.pixelValue ?? 0) - (b.pixelValue ?? 0))

  return (
    <SectionBlock icon="📐" title="Spacing" description="원시 간격 스케일. 단위: px.">
      {tokens.map(({ key, cssVar, desc, pixelValue }) => (
        <TokenRow
          key={key}
          name={key}
          cssVar={cssVar}
          desc={desc}
          copied={copied}
          onCopy={onCopy}
          preview={<SpacingBarPreview cssVar={cssVar} pixelValue={pixelValue} />}
        />
      ))}
    </SectionBlock>
  )
}

// ─── Radius Section ───────────────────────────────────────────────────────────
function PrimitiveRadiusSection() {
  const [copied, onCopy] = useCopy()
  const radiusData = (primitiveJson as any).radius as Record<
    string,
    { value?: string; $value?: string; $description?: string; description?: string }
  >
  const RADIUS_ORDER = ['SM', 'MD', 'LG', 'Pill']
  const tokens = Object.keys(radiusData)
    .map(key => {
      const raw = radiusData[key].value ?? radiusData[key].$value
      const numParsed = typeof raw === 'number' ? raw : parseInt(String(raw))
      const numVal = !isNaN(numParsed) ? numParsed : undefined
      return {
        key,
        cssVar: tokenPathToCssVar(`radius.${key.toLowerCase()}`),
        desc: numVal !== undefined ? `${numVal}px` : String(raw ?? ''),
        pixelValue: numVal,
      }
    })
    .sort((a, b) => {
      const ai = RADIUS_ORDER.indexOf(a.key)
      const bi = RADIUS_ORDER.indexOf(b.key)
      if (ai !== -1 && bi !== -1) return ai - bi
      return (a.pixelValue ?? 0) - (b.pixelValue ?? 0)
    })

  return (
    <SectionBlock icon="⬜" title="Radius" description="원시 Border Radius 스케일.">
      {tokens.map(({ key, cssVar, desc, pixelValue }) => (
        <TokenRow
          key={key}
          name={key}
          cssVar={cssVar}
          desc={desc}
          copied={copied}
          onCopy={onCopy}
          preview={
            <div
              style={{
                width: 56,
                height: 56,
                background: 'var(--afds-color-bg-selected)',
                borderRadius: pixelValue !== undefined ? `${pixelValue}px` : `var(${cssVar})`,
                flexShrink: 0,
              }}
            />
          }
        />
      ))}
    </SectionBlock>
  )
}

// ─── Typography Section ────────────────────────────────────────────────────────
function PrimitiveTypographySection() {
  const [copied, onCopy] = useCopy()
  const typData = (primitiveJson as any).typography as {
    fontFamily: Record<
      string,
      { value?: string; $value?: string; $description?: string; description?: string }
    >
    fontSize: Record<
      string,
      { value?: string; $value?: string; $description?: string; description?: string }
    >
    fontWeight: Record<
      string,
      { value?: string; $value?: string; $description?: string; description?: string }
    >
    lineHeight: Record<
      string,
      { value?: string; $value?: string; $description?: string; description?: string }
    >
  }

  // figma-token-bridge converts camelCase keys to kebab-case in CSS vars
  // e.g. typography.fontFamily.base → --afds-typography-font-family-base
  const families = Object.keys(typData.fontFamily).map(key => {
    const raw = typData.fontFamily[key].value ?? typData.fontFamily[key].$value ?? ''
    return {
      key,
      cssVar: `--afds-typography-font-family-${camelToKebab(key)}`,
      desc: String(raw),
    }
  })

  const sizes = Object.keys(typData.fontSize)
    .map(key => {
      const raw = typData.fontSize[key].value ?? typData.fontSize[key].$value
      const numParsed = parseInt(String(raw))
      const pixelValue = !isNaN(numParsed) ? numParsed : undefined
      return {
        key,
        cssVar: `--afds-typography-font-size-${key.replace(/_/g, '-')}`,
        desc: pixelValue !== undefined ? `${pixelValue}px` : String(raw ?? ''),
        pixelValue,
      }
    })
    .sort((a, b) => (a.pixelValue ?? 0) - (b.pixelValue ?? 0))

  const weights = Object.keys(typData.fontWeight)
    .map(key => {
      const raw = typData.fontWeight[key].value ?? typData.fontWeight[key].$value
      const numParsed = parseInt(String(raw))
      const numVal = !isNaN(numParsed) ? numParsed : undefined
      return {
        key,
        cssVar: `--afds-typography-font-weight-${key.toLowerCase()}`,
        desc: String(raw ?? ''),
        numVal,
      }
    })
    .sort((a, b) => (a.numVal ?? 0) - (b.numVal ?? 0))

  const lineHeights = Object.keys(typData.lineHeight)
    .map(key => {
      const raw = typData.lineHeight[key].value ?? typData.lineHeight[key].$value
      const numParsed = parseInt(String(raw))
      const pixelValue = !isNaN(numParsed) ? numParsed : undefined
      return {
        key,
        cssVar: `--afds-typography-line-height-${key.replace(/_/g, '-')}`,
        desc: pixelValue !== undefined ? `${pixelValue}px` : String(raw ?? ''),
        pixelValue,
      }
    })
    .sort((a, b) => (a.pixelValue ?? 0) - (b.pixelValue ?? 0))

  return (
    <SectionBlock
      icon="🔤"
      title="Typography"
      description="원시 타이포그래피 토큰 — 패밀리, 크기, 굵기, 줄 높이."
    >
      <SubLabel>Font Family</SubLabel>
      {families.map(({ key, cssVar, desc }) => (
        <TokenRow
          key={key}
          name={key}
          cssVar={cssVar}
          desc={desc}
          copied={copied}
          onCopy={onCopy}
          preview={
            <span
              style={{
                fontFamily: `var(${cssVar})`,
                color: 'var(--afds-color-text-primary)',
                fontSize: 14,
              }}
            >
              {key} (가나다ABC)
            </span>
          }
        />
      ))}

      <SubLabel>Font Size</SubLabel>
      {sizes.map(({ key, cssVar, desc, pixelValue }) => (
        <TokenRow
          key={key}
          name={key}
          cssVar={cssVar}
          desc={desc}
          copied={copied}
          onCopy={onCopy}
          preview={
            <span
              style={{
                fontSize: pixelValue !== undefined ? `${pixelValue}px` : `var(${cssVar})`,
                color: 'var(--afds-color-text-primary)',
                fontWeight: 500,
              }}
            >
              {key}px
            </span>
          }
        />
      ))}

      <SubLabel>Font Weight</SubLabel>
      {weights.map(({ key, cssVar, desc, numVal }) => (
        <TokenRow
          key={key}
          name={key}
          cssVar={cssVar}
          desc={desc}
          copied={copied}
          onCopy={onCopy}
          preview={
            <span
              style={{
                fontWeight: numVal ?? (key as any),
                fontSize: 16,
                color: 'var(--afds-color-text-primary)',
              }}
            >
              {key} — Weight Test
            </span>
          }
        />
      ))}

      <SubLabel>Line Height</SubLabel>
      {lineHeights.map(({ key, cssVar, desc, pixelValue }) => (
        <TokenRow
          key={key}
          name={key}
          cssVar={cssVar}
          desc={desc}
          copied={copied}
          onCopy={onCopy}
          preview={
            <div
              style={{
                lineHeight: pixelValue !== undefined ? `${pixelValue}px` : `var(${cssVar})`,
                fontSize: 13,
                color: 'var(--afds-color-text-primary)',
                background: 'var(--afds-color-bg-surface-sunken)',
                padding: '4px 10px',
                borderRadius: 6,
                border: '1px solid var(--afds-color-border-default)',
              }}
            >
              {key}
              <br />두 번째 줄
            </div>
          }
        />
      ))}
    </SectionBlock>
  )
}

// ─── Page Header ──────────────────────────────────────────────────────────────
function PageHeader() {
  return (
    <div
      style={{
        marginBottom: 40,
        paddingBottom: 24,
        borderBottom: '2px solid var(--afds-color-border-default)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 8 }}>
        <h1
          style={{
            fontSize: 32,
            fontWeight: 800,
            margin: 0,
            color: 'var(--afds-color-text-primary)',
            letterSpacing: '-0.02em',
          }}
        >
          Primitive Tokens
        </h1>
        <span
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: 'var(--afds-color-text-secondary)',
            background: 'var(--afds-color-bg-surface-sunken)',
            padding: '2px 10px',
            borderRadius: 9999,
            border: '1px solid var(--afds-color-border-default)',
          }}
        >
          AFDS
        </span>
      </div>
      <p
        style={{
          fontSize: 15,
          color: 'var(--afds-color-text-secondary)',
          margin: 0,
          lineHeight: 1.6,
          maxWidth: 640,
        }}
      >
        AFDS 원시 디자인 값 전체 목록.{' '}
        <strong style={{ color: 'var(--afds-color-text-primary)' }}>
          컴포넌트에서 직접 사용하지 마세요.
        </strong>{' '}
        Semantic 토큰이 이 값을 참조합니다. 카드를 클릭하면 CSS 변수명이 복사됩니다.
      </p>
    </div>
  )
}

// ─── Page ──────────────────────────────────────────────────────────────────────
function PrimitiveTokensPage() {
  return (
    <div
      style={{
        maxWidth: 1000,
        color: 'var(--afds-color-text-primary)',
        background: 'var(--afds-color-bg-surface)',
        padding: '8px 0 40px',
      }}
    >
      <PageHeader />
      <PrimitiveColorSection />
      <PrimitiveSpacingSection />
      <PrimitiveRadiusSection />
      <PrimitiveTypographySection />
    </div>
  )
}

export const AllPrimitiveTokens: StoryObj = {
  name: 'Primitive 토큰 목록',
  render: () => <PrimitiveTokensPage />,
  parameters: {
    docs: {
      description: {
        story:
          'Primitive 토큰 전체 목록. 원시 디자인 값으로, Semantic 토큰이 이 값들을 참조합니다. 컴포넌트에서는 Semantic 토큰을 사용하세요.',
      },
    },
  },
}
