import * as React from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { expect } from '@storybook/test'
import { DatePicker } from '.'
import { Button } from '@turbo-project/afds/bricks'

/** 스토리 스냅샷을 실행 날짜와 무관하게 만들기 위한 고정 기준일 (2026-01-15). 과거 달이라 영구 안정이다. */
const fixedToday = () => new Date(2026, 0, 15)

/**
 *
 * 테두리와 그림자가 적용된 독립형 날짜 선택 컴포넌트. `Calendar`를 카드 스타일로 감쌌다.
 *
 * **Import:**
 * ```tsx
 * import { DatePicker } from '.'
 * ```
 *
 * ### 기본 사용법
 * ```tsx
 * <DatePicker value={date} onValueChange={setDate} />
 * ```
 */
const meta = {
  title: 'Compositions / Common / Form / DatePicker',
  component: DatePicker,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof DatePicker>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: function DefaultDatePicker() {
    const [date, setDate] = React.useState<Date | undefined>(fixedToday())
    return <DatePicker defaultFocusedDate={fixedToday()} value={date} onValueChange={setDate} />
  },
}

/** 하단 푸터가 있는 날짜 선택기 */
export const WithFooter: Story = {
  parameters: { controls: { disable: true } },
  render: function FooterDatePicker() {
    const [date, setDate] = React.useState<Date | undefined>()
    return (
      <DatePicker
        defaultFocusedDate={fixedToday()}
        value={date}
        onValueChange={setDate}
        footer={
          <div className="flex items-center justify-between border-t border-afds-border-default pt-3">
            <span className="text-afds-text-secondary text-afds-13">
              {date ? date.toLocaleDateString('ko-KR') : '날짜를 선택하세요'}
            </span>
            <Button size="sm" disabled={!date}>
              확인
            </Button>
          </div>
        }
      />
    )
  },
}

/** `name` prop으로 네이티브 폼 제출에 참여한다. 선택값은 `YYYY-MM-DD` 형식으로 hidden input에 동기화된다. */
export const FormSubmission: Story = {
  parameters: { controls: { disable: true } },
  render: function FormDatePicker() {
    const [submitted, setSubmitted] = React.useState<Record<string, FormDataEntryValue> | null>(
      null,
    )
    return (
      <form
        className="flex flex-col items-start gap-4"
        onSubmit={e => {
          e.preventDefault()
          setSubmitted(Object.fromEntries(new FormData(e.currentTarget)))
        }}
      >
        <DatePicker defaultFocusedDate={fixedToday()} name="date" />
        <Button type="submit" size="sm">
          제출
        </Button>
        {submitted && (
          <pre className="bg-afds-bg-surface-sunken rounded-afds-sm p-afds-spacing-8 text-afds-13">
            {JSON.stringify(submitted, null, 2)}
          </pre>
        )}
      </form>
    )
  },
}

export const RenderTest: Story = {
  parameters: { controls: { disable: true } },
  render: () => <DatePicker defaultFocusedDate={fixedToday()} />,
  play: async ({ canvasElement }) => {
    const grid = canvasElement.querySelector('[role="grid"]')
    await expect(grid).toBeInTheDocument()
  },
}
