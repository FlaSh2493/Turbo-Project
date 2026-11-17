import * as React from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { expect, userEvent, within } from '@storybook/test'
import { DatePickerDropdown } from '.'

/**
 *
 * 트리거 버튼 클릭 시 팝오버 안에 날짜 선택기가 표시되는 컴포넌트입니다.
 *
 * ### 기본 사용법
 * ```tsx
 * import { DatePickerDropdown } from '.'
 *
 * <DatePickerDropdown value={date} onValueChange={setDate} placeholder="날짜 선택" />
 * ```
 *
 * ### 언제 사용하나요?
 * - 폼 내의 날짜 입력 필드
 * - 공간이 제한적인 레이아웃에서 날짜 선택
 * - 트리거 + 드롭다운 패턴이 필요한 날짜 선택
 *
 * ### Calendar vs DatePicker vs DatePickerDropdown
 * | 컴포넌트 | 용도 |
 * |---------|------|
 * | `Calendar` | 날짜 선택 UI만 |
 * | `DatePicker` | 카드 스타일 독립형 |
 * | `DatePickerDropdown` | 트리거 + 팝오버 (폼에 적합) |
 *
 * ### 베스트 프랙티스
 * - 선택된 날짜는 자동으로 한국어 형식으로 트리거에 표시됩니다
 * - `placeholder`로 미선택 상태의 텍스트를 지정합니다
 * - `disabled` prop으로 비활성화할 수 있습니다
 */

/** 스토리 스냅샷을 실행 날짜와 무관하게 만들기 위한 고정 기준일 (2026-01-15). 과거 달이라 영구 안정이다. */
const fixedToday = () => new Date(2026, 0, 15)

const meta = {
  title: 'Compositions / Common / Form / DatePickerDropdown',
  component: DatePickerDropdown,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
트리거 버튼 클릭 시 팝오버 안에 날짜 선택기가 표시되는 컴포넌트입니다.

**Import:**
\`\`\`tsx
import { DatePickerDropdown } from '.'
\`\`\`

### 기본 사용법
\`\`\`tsx
<DatePickerDropdown value={date} onValueChange={setDate} placeholder="날짜 선택" />
\`\`\`
        `,
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof DatePickerDropdown>

export default meta
type Story = StoryObj<typeof meta>

/** 기본 날짜 선택 드롭다운입니다. */
export const Default: Story = {
  render: function DefaultDatePickerDropdown() {
    const [date, setDate] = React.useState<Date | undefined>()
    return (
      <div className="flex flex-col gap-afds-spacing-8 items-start">
        <DatePickerDropdown value={date} onValueChange={setDate} placeholder="날짜 선택" />
        {date && (
          <span className="text-afds-12 text-afds-text-secondary">
            선택된 날짜: {date.toLocaleDateString('ko-KR')}
          </span>
        )}
      </div>
    )
  },
}

/** 기본값이 설정된 드롭다운입니다. */
export const WithDefaultValue: Story = {
  render: function DefaultValueDropdown() {
    const [date, setDate] = React.useState<Date | undefined>(fixedToday())
    return <DatePickerDropdown value={date} onValueChange={setDate} placeholder="날짜 선택" />
  },
}

/** 비활성화된 날짜 선택 드롭다운입니다. */
export const Disabled: Story = {
  args: { disabled: true, placeholder: '비활성화 상태' },
}

/** 폼에서 사용하는 예시입니다. */
export const InForm: Story = {
  render: function FormDatePicker() {
    const [startDate, setStartDate] = React.useState<Date | undefined>()
    const [endDate, setEndDate] = React.useState<Date | undefined>()
    return (
      <div className="flex flex-col gap-afds-spacing-14 w-[320px]">
        <div>
          <label className="block text-[13px] font-[500] mb-[6px]">시작일</label>
          <DatePickerDropdown
            value={startDate}
            onValueChange={setStartDate}
            placeholder="시작일 선택"
          />
        </div>
        <div>
          <label className="block text-[13px] font-[500] mb-[6px]">종료일</label>
          <DatePickerDropdown
            value={endDate}
            onValueChange={setEndDate}
            placeholder="종료일 선택"
          />
        </div>
      </div>
    )
  },
}

/**
 * `name` prop으로 네이티브 폼 제출에 참여합니다.
 * 선택값은 `YYYY-MM-DD` 형식으로 hidden input에 동기화되어 `FormData`에 포함됩니다.
 */
export const FormSubmission: Story = {
  parameters: { controls: { disable: true } },
  render: function FormDropdown() {
    const [submitted, setSubmitted] = React.useState<Record<string, FormDataEntryValue> | null>(
      null,
    )
    return (
      <form
        className="flex flex-col items-start gap-afds-spacing-12 w-[280px]"
        onSubmit={e => {
          e.preventDefault()
          setSubmitted(Object.fromEntries(new FormData(e.currentTarget)))
        }}
      >
        <DatePickerDropdown name="dueDate" placeholder="마감일 선택" />
        <button
          type="submit"
          className="px-afds-10 py-afds-4 rounded-afds-sm border border-afds-border-default text-afds-12 bg-afds-bg-surface"
        >
          제출
        </button>
        {submitted && (
          <pre className="bg-afds-bg-surface-sunken rounded-afds-sm p-afds-spacing-8 text-afds-13">
            {JSON.stringify(submitted, null, 2)}
          </pre>
        )}
      </form>
    )
  },
}

// Interaction Test Stories

export const OpenInteraction: Story = {
  render: function OpenDatePicker() {
    const [date, setDate] = React.useState<Date | undefined>()
    // play 가 팝오버를 열고 그 상태로 스냅샷이 찍히므로, 열린 캘린더의 표시 월도 고정해야 한다.
    return (
      <DatePickerDropdown
        value={date}
        onValueChange={setDate}
        defaultFocusedDate={fixedToday()}
        placeholder="날짜 선택"
      />
    )
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const trigger = canvas.getByRole('button')
    await expect(trigger).toBeInTheDocument()
    await userEvent.click(trigger)
    const calendar = document.body.querySelector('table, [role="grid"]')
    await expect(calendar).toBeInTheDocument()
  },
}
