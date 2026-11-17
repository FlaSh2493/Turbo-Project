import type { Meta, StoryObj } from '@storybook/react'
import semanticJson from '../json/semantic.tokens.json'
import { useCopy, ColorCard, SectionBlock } from './design-tokens.shared'

const meta: Meta = {
  title: 'Foundation / Design Tokens',
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'AFDS Semantic 디자인 토큰 목록. 컴포넌트 제작 시 Primitive 토큰 대신 이 Semantic 토큰들을 사용하세요.',
      },
    },
  },
}
export default meta

type Story = StoryObj

export const Default: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
      <ColorSection />
    </div>
  ),
}

// Convert camelCase to kebab-case: lnbDefault -> lnb-default
function camelToKebab(str: string): string {
  return str.replace(/([A-Z])/g, '-$1').toLowerCase()
}

// ─── Color Section ───────────────────────────────────────────────────────────
function ColorSection() {
  const [copied, onCopy] = useCopy()
  const colorData = (semanticJson as any).color as Record<
    string,
    Record<string, { value?: string; description?: string; $description?: string }>
  >

  return (
    <SectionBlock icon="🎨" title="Color" description="의미 중심의 컬러 토큰.">
      {Object.entries(colorData).map(([group, subTokens]) => (
        <div key={group} style={{ marginBottom: 24 }}>
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
            {group}
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
              gap: 12,
            }}
          >
            {Object.entries(subTokens).map(([key, val]) => {
              const cssVar = `--afds-color-${camelToKebab(group)}-${camelToKebab(key)}`
              const desc = (val as any).description ?? (val as any).$description ?? ''
              const reference = (val as any).value ?? (val as any).$value ?? undefined
              return (
                <ColorCard
                  key={key}
                  label={`${group}-${key}`}
                  cssVar={cssVar}
                  description={desc}
                  reference={typeof reference === 'string' ? reference : undefined}
                  copied={copied}
                  onCopy={onCopy}
                />
              )
            })}
          </div>
        </div>
      ))}
    </SectionBlock>
  )
}
