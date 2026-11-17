import type { Meta, StoryObj } from '@storybook/react'
import { SectionBlock, SubLabel } from './design-tokens.shared'

const meta: Meta = {
  title: 'Foundation / Motion Tokens',
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Fade 진입 유틸리티 및 커스텀 키프레임 애니메이션. tokens.motion.css에 @utility/@keyframes로 정의됩니다.',
      },
    },
  },
}
export default meta

export const Default: StoryObj = {
  render: () => <KeyframesSection />,
}

// ─── Keyframes ────────────────────────────────────────────────────────────────

function KeyframesSection() {
  return (
    <SectionBlock
      icon="🔁"
      title="Keyframes"
      description="컴포넌트 내부에서 직접 사용하는 커스텀 키프레임 애니메이션."
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div>
          <SubLabel>shimmer</SubLabel>
          <KeyframeCard label="shimmer" description="스켈레톤 로딩에 사용하는 좌우 광택 효과.">
            <ShimmerDemo />
          </KeyframeCard>
        </div>
        <div>
          <SubLabel>breathing</SubLabel>
          <KeyframeCard
            label="breathing"
            description="로딩 상태를 표현하는 투명도+스케일 호흡 효과."
          >
            <BreathingDemo />
          </KeyframeCard>
        </div>
        <div>
          <SubLabel>spinner-dash</SubLabel>
          <KeyframeCard label="spinner-dash" description="SVG stroke-dasharray/offset 기반 스피너.">
            <SpinnerDashDemo />
          </KeyframeCard>
        </div>
      </div>
    </SectionBlock>
  )
}

function KeyframeCard({
  label,
  description,
  children,
}: {
  label: string
  description: string
  children: React.ReactNode
}) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '160px 1fr',
        gap: 24,
        alignItems: 'center',
        padding: '16px 12px',
        borderRadius: 8,
        border: '1px solid var(--afds-color-border-default)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'center' }}>{children}</div>
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
            marginBottom: 6,
          }}
        >
          @keyframes {label}
        </code>
        <p style={{ fontSize: 13, color: 'var(--afds-color-text-secondary)', margin: 0 }}>
          {description}
        </p>
      </div>
    </div>
  )
}

function ShimmerDemo() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%' }}>
      {[100, 80, 60].map(width => (
        <div
          key={width}
          style={{
            width: `${width}%`,
            height: 14,
            borderRadius: 4,
            background:
              'linear-gradient(90deg, var(--afds-color-bg-disabled) 25%, var(--afds-color-bg-surface) 50%, var(--afds-color-bg-disabled) 75%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 1.5s infinite linear',
          }}
        />
      ))}
    </div>
  )
}

function BreathingDemo() {
  return (
    <div
      style={{
        width: 48,
        height: 48,
        borderRadius: '50%',
        background: 'var(--afds-color-bg-selected)',
        animation: 'breathing 2s ease-in-out infinite',
      }}
    />
  )
}

function SpinnerDashDemo() {
  return (
    <svg width={40} height={40} viewBox="0 0 40 40" fill="none">
      <circle
        cx={20}
        cy={20}
        r={16}
        stroke="var(--afds-color-border-default)"
        strokeWidth={3}
        fill="none"
      />
      <circle
        cx={20}
        cy={20}
        r={16}
        stroke="var(--afds-color-bg-selected)"
        strokeWidth={3}
        fill="none"
        style={{
          animation: 'spinner-dash 1.5s ease-in-out infinite',
          transformOrigin: 'center',
          transform: 'rotate(-90deg)',
        }}
      />
    </svg>
  )
}
