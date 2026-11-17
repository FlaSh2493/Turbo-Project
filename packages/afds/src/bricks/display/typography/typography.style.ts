import { cva } from 'class-variance-authority'
import type { CustomText, SemanticColor } from '../../../schemas/tokens.schema'

/**
 * Typography 전용 텍스트 색상 — SemanticColor 중 `text-*` 카테고리만 노출.
 * bg/icon/border/divider/interaction 등 텍스트에 부적합한 시맨틱 토큰과
 * PrimitiveColor raw palette(`afds-brand-*`/`afds-gray-*` 등) 직접 노출을 막는다.
 */
const TEXT_COLORS = [
  'text-primary',
  'text-secondary',
  'text-disabled',
  'text-brand',
  'text-brand-subtle',
  'text-inverse',
  'text-error',
  'text-ai',
  'text-lnb-default',
  'text-lnb-disabled',
] as const satisfies readonly Extract<SemanticColor, `text-${string}`>[]

export type TextColor = (typeof TEXT_COLORS)[number]

/** Typography variant = tokens.ts CustomText (재export, 외부 호환) */
export type TypographyVariant = CustomText

/** Typography color = SemanticColor 중 `text-*` 카테고리만 (재export, 외부 호환) */
export type TypographyColor = TextColor

/**
 * prop 값 그대로 → Tailwind 클래스: `text-afds-${token}`.
 * tokens.ts와 tokens.semantic.css의 `@theme` CSS 변수가 모두 kebab-case로 통일되어
 * 별도 변환이 필요 없다.
 *
 * `text-ai`는 override: SemanticColor의 `text-ai`는 단순 lightpurple 단색이지만,
 * AI 표시 의도상 그라데이션 효과(`tokens.effects.css`의 `@utility text-gradient-ai`)가
 * 필요하므로 별도 매핑한다.
 */
const COLOR_CLASS_MAP: Record<TextColor, string> = {
  ...(Object.fromEntries(TEXT_COLORS.map(t => [t, `text-afds-${t}`] as const)) as Record<
    TextColor,
    string
  >),
  'text-ai': 'text-gradient-ai',
}

export const typographyVariants = cva('', {
  variants: {
    variant: {
      heading0: 'heading0',
      heading1: 'heading1',
      heading2: 'heading2',
      title1: 'title1',
      title2: 'title2',
      title3: 'title3',
      title4: 'title4',
      body1: 'body1',
      body2: 'body2',
      body3: 'body3',
      caption1: 'caption1',
      caption2: 'caption2',
    },
    color: COLOR_CLASS_MAP,
  },
  defaultVariants: {
    variant: 'body1',
  },
})
