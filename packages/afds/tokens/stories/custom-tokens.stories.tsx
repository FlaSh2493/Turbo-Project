import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import customJson from '../json/custom.tokens.json'
import { SectionBlock, SubLabel, TokenRow, AnimPreview, useCopy } from './design-tokens.shared'

const meta: Meta = {
  title: 'Foundation / Custom Tokens',
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Shadow, Duration, Typography utility 토큰. tokens.custom.css에 정의된 커스텀 토큰들입니다.',
      },
    },
  },
}
export default meta

export const Default: StoryObj = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
      <ShadowSection />
      <DurationSection />
      <TypographyUtilitySection />
    </div>
  ),
}

// ─── Shadow ───────────────────────────────────────────────────────────────────

function ShadowPreview({ cssVar }: { cssVar: string }) {
  return (
    <div
      style={{
        width: 80,
        height: 48,
        background: 'var(--afds-color-bg-surface)',
        borderRadius: 8,
        boxShadow: `var(${cssVar})`,
        border: '1px solid var(--afds-color-border-default)',
      }}
    />
  )
}

function ShadowSection() {
  const [copied, onCopy] = useCopy()
  const shadows = (customJson as any).shadow as Record<string, { value: any; type: string }>

  return (
    <SectionBlock
      icon="🌑"
      title="Shadow"
      description="컴포넌트 깊이감 표현에 사용하는 그림자 토큰."
    >
      {Object.entries(shadows).map(([key]) => {
        const cssVar = `--afds-shadow-${key}`
        return (
          <TokenRow
            key={key}
            cssVar={cssVar}
            name={`shadow-${key}`}
            desc=""
            preview={<ShadowPreview cssVar={cssVar} />}
            copied={copied}
            onCopy={onCopy}
          />
        )
      })}
    </SectionBlock>
  )
}

// ─── Duration ────────────────────────────────────────────────────────────────

function DurationSection() {
  const [copied, onCopy] = useCopy()
  const durations = (customJson as any).duration as Record<string, { value: string; type: string }>

  return (
    <SectionBlock
      icon="⏱️"
      title="Duration"
      description="애니메이션 지속 시간 토큰. 슬라이더에 마우스를 올리면 속도를 체감할 수 있습니다."
    >
      {Object.entries(durations).map(([key, token]) => {
        const cssVar = `--afds-duration-${key}`
        return (
          <TokenRow
            key={key}
            cssVar={cssVar}
            name={`${key}ms`}
            desc={token.value}
            preview={<AnimPreview cssVar={cssVar} />}
            copied={copied}
            onCopy={onCopy}
          />
        )
      })}
    </SectionBlock>
  )
}

// ─── Typography Utilities ─────────────────────────────────────────────────────

const TYPO_GROUPS = [
  { label: 'Heading', keys: ['heading0', 'heading1', 'heading2'] },
  { label: 'Title', keys: ['title1', 'title2', 'title3', 'title4'] },
  { label: 'Body', keys: ['body1', 'body2', 'body3'] },
  { label: 'Caption', keys: ['caption1', 'caption2'] },
] as const

function TypographyUtilitySection() {
  return (
    <SectionBlock
      icon="✍️"
      title="Typography Utilities"
      description="@utility로 정의된 타이포그래피 클래스. 컴포넌트에서 className으로 직접 사용합니다."
    >
      {TYPO_GROUPS.map(({ label, keys }) => (
        <div key={label}>
          <SubLabel>{label}</SubLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {keys.map(key => (
              <TypoRow key={key} utilClass={key} />
            ))}
          </div>
        </div>
      ))}
    </SectionBlock>
  )
}

function TypoRow({ utilClass }: { utilClass: string }) {
  const [hover, setHover] = useState(false)
  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: 'flex',
        alignItems: 'baseline',
        gap: 16,
        padding: '10px 12px',
        borderRadius: 8,
        borderBottom: '1px solid var(--afds-color-bg-surface-sunken)',
        background: hover ? 'var(--afds-color-bg-canvas)' : 'transparent',
        transition: 'background 0.2s',
      }}
    >
      <code
        style={{
          fontSize: 11,
          color: 'var(--afds-color-text-secondary)',
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, monospace',
          minWidth: 90,
          flexShrink: 0,
        }}
      >
        .{utilClass}
      </code>
      <span className={utilClass} style={{ color: 'var(--afds-color-text-primary)' }}>
        가나다 ABC 123
      </span>
    </div>
  )
}
