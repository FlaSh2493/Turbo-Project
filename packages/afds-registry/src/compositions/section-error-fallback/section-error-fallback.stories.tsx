import type { Meta, StoryObj } from '@storybook/react'
import { expect, userEvent, within, fn } from '@storybook/test'
import { SectionErrorFallback } from '.'

/**
 *
 * 섹션 단위 오류 상태를 표시하는 컴포지션입니다. React Error Boundary의 `fallback`이나
 * 데이터 페칭 실패 시 사용합니다.
 *
 *
 * ### 기본 사용법
 * ```tsx
 * // 재시도 없는 단순 오류 표시
 * <SectionErrorFallback />
 *
 * // 도메인 문구 + 재시도
 * <SectionErrorFallback
 *   title="데이터를 불러오지 못했어요"
 *   message="잠시 후 다시 시도해 주세요."
 *   retryText="다시 시도"
 *   reset={() => refetch()}
 * />
 *
 * // Error Boundary와 함께
 * <ErrorBoundary fallback={<SectionErrorFallback reset={reset} />}>
 *   <DataComponent />
 * </ErrorBoundary>
 * ```
 *
 * ### 언제 사용하나요?
 * - API 요청 실패 시 섹션 단위 오류 표시
 * - React Error Boundary의 `fallback`으로 사용
 * - 데이터 로딩 실패 상태 표시
 *
 * ### 베스트 프랙티스
 * - 페이지 전체 오류가 아닌 섹션별 오류에 사용하세요
 * - `reset`을 전달할 때만 재시도 버튼이 표시됩니다
 * - 기본 문구는 영어이며, 도메인 문구는 `title`·`message`·`retryText`로 주입합니다
 * - 기본 `py-20` 패딩이 적용되며, `className`은 머지됩니다 (덮어쓰기 아님)
 */
const meta = {
  title: 'Compositions / Common / Feedback / SectionErrorFallback',
  component: SectionErrorFallback,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
섹션 단위 오류 상태를 표시하는 컴포지션입니다. 일러스트 + 제목 + 메시지 + (선택) 재시도 버튼으로 구성됩니다.

**Import:**
\`\`\`tsx
import { SectionErrorFallback } from '.'
\`\`\`

### 기본 사용법
\`\`\`tsx
<SectionErrorFallback reset={() => refetch()} />
\`\`\`
        `,
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof SectionErrorFallback>

export default meta
type Story = StoryObj<typeof meta>

// Basic Stories

/** Controls 패널에서 title·message·retryText를 직접 조작해 보세요. */
export const Default: Story = {
  args: {
    title: '오류가 발생했어요',
    message: '잠시 후 다시 시도해 주세요.',
  },
}

/** `reset`을 전달하면 재시도 버튼이 표시됩니다. */
export const WithRetry: Story = {
  args: {
    title: '데이터를 불러오지 못했어요',
    message: '네트워크 연결을 확인하고 다시 시도해 주세요.',
    retryText: '다시 시도',
    reset: fn(),
  },
}

/** 영어 기본 문구를 그대로 사용한 케이스입니다. */
export const DefaultCopy: Story = {
  args: { reset: fn() },
}

// Interaction Stories

/** 재시도 버튼 클릭 시 `reset` 핸들러가 호출되는지 검증합니다. */
export const RetryInteraction: Story = {
  args: {
    title: '오류',
    message: '오류가 발생했어요.',
    retryText: '다시 시도',
    reset: fn(),
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    const retryButton = canvas.getByRole('button')
    await expect(retryButton).toBeInTheDocument()
    await userEvent.click(retryButton)
    await expect(args.reset).toHaveBeenCalledTimes(1)
  },
}
