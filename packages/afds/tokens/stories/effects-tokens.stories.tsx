import type { Meta, StoryObj } from '@storybook/react'
import { SectionBlock, SubLabel } from './design-tokens.shared'

const meta: Meta = {
  title: 'Foundation / Effects Tokens',
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'AI 브랜드 그래디언트 효과 유틸리티. tokens/json/effects.tokens.json 으로부터 tokens.effects.css가 자동생성됩니다.',
      },
    },
  },
}
export default meta

export const Default: StoryObj = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
      <GradientAiSection />
    </div>
  ),
}

// ─── Gradient AI ──────────────────────────────────────────────────────────────

const GRADIENT_VARIANTS = [
  {
    key: 'text-gradient-ai',
    label: 'Text Gradient',
    description: '텍스트에 브랜드-퍼플 그래디언트를 적용합니다.',
    demo: (
      <span
        className="text-gradient-ai"
        style={{ whiteSpace: 'nowrap', fontSize: 32, fontWeight: 700 }}
      >
        AI Gradient Text
      </span>
    ),
  },
  {
    key: 'bg-gradient-ai',
    label: 'Background Gradient',
    description: '배경에 브랜드-퍼플 그래디언트를 적용합니다.',
    demo: (
      <div className="bg-gradient-ai" style={{ width: '100%', height: 80, borderRadius: 10 }} />
    ),
  },
  {
    key: 'border-gradient-ai',
    label: 'Border Gradient',
    description: '테두리에만 그래디언트를 적용합니다. ::before 마스크 방식.',
    demo: (
      <div
        className="border-gradient-ai"
        style={{
          width: '100%',
          height: 80,
          borderRadius: 10,
          background: 'var(--afds-color-bg-surface)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 14,
          color: 'var(--afds-color-text-secondary)',
        }}
      >
        border-gradient-ai
      </div>
    ),
  },
] as const

function GradientAiSection() {
  return (
    <SectionBlock
      icon="✨"
      title="Gradient AI"
      description="브랜드(#556AF9) → 퍼플(#7179EA) 96도 그래디언트. AI 관련 UI에 사용합니다."
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {GRADIENT_VARIANTS.map(({ key, label, description, demo }) => (
          <GradientCard key={key} utilClass={key} label={label} description={description}>
            {demo}
          </GradientCard>
        ))}
      </div>
    </SectionBlock>
  )
}

function GradientCard({
  utilClass,
  label,
  description,
  children,
}: {
  utilClass: string
  label: string
  description: string
  children: React.ReactNode
}) {
  return (
    <div>
      <SubLabel>{label}</SubLabel>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 24,
          alignItems: 'center',
        }}
      >
        <div
          style={{
            padding: 24,
            borderRadius: 10,
            border: '1px solid var(--afds-color-border-default)',
            background: 'var(--afds-color-bg-surface)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 100,
          }}
        >
          {children}
        </div>
        <div>
          <code
            style={{
              display: 'inline-block',
              fontSize: 12,
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, monospace',
              color: 'var(--afds-color-text-brand-subtle)',
              background: 'var(--afds-color-bg-surface-sunken)',
              padding: '2px 8px',
              borderRadius: 4,
              marginBottom: 8,
            }}
          >
            .{utilClass}
          </code>
          <p
            style={{
              fontSize: 13,
              color: 'var(--afds-color-text-secondary)',
              margin: 0,
              lineHeight: 1.6,
            }}
          >
            {description}
          </p>
        </div>
      </div>
    </div>
  )
}
