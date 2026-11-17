# 신규 컴포넌트 생성 가이드

AFDS에 새 컴포넌트를 추가할 때 따르는 표준 절차입니다.

---

## 설계 결정 사항

### 인라인 SVG 아이콘

각 컴포넌트의 아이콘(ChevronDown, Check, X 등)은 **의도적으로 인라인 SVG로 관리**합니다. 별도 아이콘 라이브러리나 공유 icons 파일을 만들지 않습니다.

**이유:**

- 외부 아이콘 라이브러리 의존성 없이 번들 크기를 최소화
- 각 컴포넌트가 필요한 아이콘을 자체적으로 소유 → 독립성 유지
- 아이콘 세부 조정(strokeWidth, viewBox 등)이 컴포넌트마다 다를 수 있음

공유 아이콘 시스템이 필요하다면 별도 패키지(`@turbo-project/icons`)로 분리하는 것이 올바른 방향입니다.

---

## 파일 구조 (5파일 패턴)

```
src/bricks/<category>/<name>/
├── <name>.tsx          # 컴포넌트 구현 (필수)
├── <name>.style.ts       # CVA variant 정의 (필수)
├── <name>.spec.md      # 컴포넌트 스펙 문서 (필수 — manifest 생성에 사용)
├── <name>.stories.tsx  # Storybook stories (권장)
└── __test__/
    └── <name>.test.tsx # 테스트 (권장)
```

---

## Step 1: CVA variant 정의

`src/bricks/<category>/<name>/<name>.style.ts`:

```ts
import { cva } from 'class-variance-authority'

export const ratingVariants = cva(
  // base classes — 항상 적용
  'inline-flex items-center gap-0.5',
  {
    variants: {
      variant: {
        default: '',
        compact: 'gap-0',
      },
      size: {
        sm: 'text-sm',
        md: 'text-base',
        lg: 'text-lg',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  },
)
```

> **Tailwind 클래스 가이드**
>
> - 색상: `bg-surface`, `text-fg`, `border-line`, `bg-brand` (semantic tokens 우선)
> - 간격: `p-4`, `gap-2`, `px-3` (Tailwind spacing)
> - 상태: `hover:bg-surface-subtle`, `focus-visible:ring-2 focus-visible:ring-brand`

---

## Step 2: 컴포넌트 구현

`src/bricks/<category>/<name>/<name>.tsx`:

```tsx
import { forwardRef } from 'react'
import { type VariantProps } from 'class-variance-authority'
import { ratingVariants } from './rating.css'
import { cn } from '../../lib/utils'

export interface RatingProps
  extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof ratingVariants> {
  /** 별점 값 (0-5) */
  value?: number
  /** 읽기 전용 여부 */
  readOnly?: boolean
}

/**
 * 별점 표시 컴포넌트
 *
 * @example
 * // 기본 사용
 * <Rating value={3.5} />
 *
 * @example
 * // 읽기 전용 소형
 * <Rating value={4} size="sm" readOnly />
 */
export const Rating = forwardRef<HTMLDivElement, RatingProps>(
  ({ className, variant, size, value = 0, readOnly = false, ...props }, ref) => (
    <div
      ref={ref}
      data-slot="rating"
      data-component="Rating"
      data-variant={variant}
      role={readOnly ? 'img' : 'group'}
      aria-label={`${value}점 / 5점`}
      className={cn(ratingVariants({ variant, size }), className)}
      {...props}
    >
      {/* 구현 내용 */}
    </div>
  ),
)
Rating.displayName = 'Rating'
```

### 필수 패턴 체크리스트

- [ ] `forwardRef` 사용
- [ ] `data-slot`, `data-component`, `data-variant` 속성 추가
- [ ] `className` prop 지원 (`cn()` 유틸 사용)
- [ ] 적절한 ARIA 속성 추가
- [ ] JSDoc `@example` 블록 최소 1개 (→ `llms.txt`에 자동 포함)
- [ ] `displayName` 설정

---

## Step 3: 스펙 문서 작성

`src/bricks/<category>/<name>/<name>.spec.md`:

```markdown
# Rating Spec

사용자 평점을 시각적으로 표시하는 별점 컴포넌트.

## Variants

| variant   | 용도           |
| --------- | -------------- |
| `default` | 기본 별점 표시 |
| `compact` | 간격 최소화    |

## Sizes

`sm`(16px) · `md`(20px) · `lg`(24px)

## ARIA Attributes

- `aria-label` — 스크린리더를 위한 레이블 (자동 생성)
- `role="img"` — readOnly 시

## Rules

1. readOnly가 아닌 경우 키보드 조작 지원 (arrow keys)
2. value는 0~5 범위
3. 소수점 허용 시 0.5 단위로 표현
```

> `spec.md`는 빌드 시 `dist/manifest.json`과 `dist/llms.txt`에 자동으로 포함됩니다.

---

## Step 4: Storybook stories 작성

`src/bricks/<category>/<name>/<name>.stories.tsx`:

```tsx
import type { Meta, StoryObj } from '@storybook/react'
import { Rating } from './rating'

const meta: Meta<typeof Rating> = {
  title: 'AFDS / Bricks / Display / Rating',
  component: Rating,
  tags: ['autodocs'],
  layout: 'centered',
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'compact'],
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
    value: {
      control: { type: 'range', min: 0, max: 5, step: 0.5 },
    },
    readOnly: {
      control: 'boolean',
    },
  },
}

export default meta
type Story = StoryObj<typeof Rating>

export const Default: Story = {
  args: {
    value: 3.5,
    size: 'md',
  },
}

export const ReadOnly: Story = {
  args: {
    value: 4,
    readOnly: true,
  },
}
```

---

## Step 5: 테스트 작성

`src/bricks/<category>/<name>/__test__/<name>.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import { Rating } from '../rating'

describe('Rating', () => {
  it('기본 렌더링', () => {
    render(<Rating value={3} aria-label="3점" />)
    expect(screen.getByRole('group')).toBeInTheDocument()
  })

  it('data-component 속성이 설정된다', () => {
    render(<Rating value={3} />)
    expect(screen.getByRole('group')).toHaveAttribute('data-component', 'Rating')
  })

  it('readOnly일 때 role="img"가 설정된다', () => {
    render(<Rating value={3} readOnly />)
    expect(screen.getByRole('img')).toBeInTheDocument()
  })

  it('className을 통해 추가 클래스를 적용할 수 있다', () => {
    render(<Rating value={3} className="custom-class" />)
    expect(screen.getByRole('group')).toHaveClass('custom-class')
  })
})
```

---

## Step 6: index.ts에 export 추가

`src/bricks/index.ts` (또는 해당 barrel 파일):

```ts
export * from './rating/rating'
```

---

## Step 7: manifest 재생성

컴포넌트 추가 후 빌드를 실행하면 `dist/manifest.json`과 `dist/llms.txt`가 자동으로 업데이트됩니다:

```bash
pnpm build
# 또는 manifest만 재생성
pnpm tsx scripts/generate-manifest.ts
```

---

## 빠른 참고

| 항목                    | 위치                                       |
| ----------------------- | ------------------------------------------ |
| 기존 컴포넌트 예시      | `src/bricks/action/button/`                |
| CVA 패턴 예시           | `src/bricks/action/button/button.style.ts` |
| Primitive 기반 컴포넌트 | `src/bricks/form/input/input.tsx`          |
| Compound 컴포넌트       | `src/bricks/form/select/select.tsx`        |
| prop 네이밍 규칙        | `docs/prop-naming-conventions.md`          |
| 조합 패턴               | `docs/composition-patterns.md`             |
| token 사용법            | `tokens/README.md`                         |
