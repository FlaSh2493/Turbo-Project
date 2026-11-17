import { describe, it, expect, vi } from 'vitest'
import type { ReactNode } from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MultiSelect } from '../multi-select'

const mockOptions = [
  { value: 'option1', label: '옵션 1' },
  { value: 'option2', label: '옵션 2' },
  { value: 'option3', label: '옵션 3' },
]

const renderList = () => (
  <MultiSelect.List>
    {mockOptions.map(o => (
      <MultiSelect.Item key={o.value} value={o.value}>
        {o.label}
      </MultiSelect.Item>
    ))}
  </MultiSelect.List>
)

describe('MultiSelect', () => {
  describe('렌더링', () => {
    it('트리거를 올바르게 렌더링한다', () => {
      render(
        <MultiSelect options={mockOptions} value={[]}>
          <MultiSelect.Trigger placeholder="선택하세요" />
          <MultiSelect.Content>{renderList()}</MultiSelect.Content>
        </MultiSelect>,
      )
      expect(screen.getByText('선택하세요')).toBeInTheDocument()
    })

    it('value가 1개면 라벨이 그대로 표시된다', () => {
      render(
        <MultiSelect options={mockOptions} value={['option1']}>
          <MultiSelect.Trigger placeholder="선택하세요" />
          <MultiSelect.Content>{renderList()}</MultiSelect.Content>
        </MultiSelect>,
      )
      expect(screen.getByText('옵션 1')).toBeInTheDocument()
    })

    it('value가 2개 이상이면 "라벨 +N more" 형태로 표시된다', () => {
      render(
        <MultiSelect options={mockOptions} value={['option1', 'option2']}>
          <MultiSelect.Trigger placeholder="선택하세요" />
          <MultiSelect.Content>{renderList()}</MultiSelect.Content>
        </MultiSelect>,
      )
      expect(screen.getByText(/옵션 1 \+1 more/)).toBeInTheDocument()
    })
  })

  describe('선택 동작', () => {
    it('아이템 토글마다 onValueChange가 즉시 호출된다', async () => {
      const handleValueChange = vi.fn()
      const user = userEvent.setup()

      render(
        <MultiSelect options={mockOptions} value={[]} onValueChange={handleValueChange}>
          <MultiSelect.Trigger placeholder="선택하세요" />
          <MultiSelect.Content>{renderList()}</MultiSelect.Content>
        </MultiSelect>,
      )

      await user.click(screen.getByText('선택하세요'))

      await waitFor(() => {
        expect(screen.getByText('옵션 1')).toBeInTheDocument()
      })

      await user.click(screen.getByText('옵션 1'))
      expect(handleValueChange).toHaveBeenLastCalledWith(['option1'])
      expect(handleValueChange).toHaveBeenCalledTimes(1)
    })

    it('uncontrolled 모드에서 토글이 누적된다', async () => {
      const handleValueChange = vi.fn()
      const user = userEvent.setup()

      render(
        <MultiSelect options={mockOptions} defaultValue={[]} onValueChange={handleValueChange}>
          <MultiSelect.Trigger placeholder="선택하세요" />
          <MultiSelect.Content>{renderList()}</MultiSelect.Content>
        </MultiSelect>,
      )

      await user.click(screen.getByText('선택하세요'))
      await waitFor(() => expect(screen.getByText('옵션 1')).toBeInTheDocument())

      await user.click(screen.getByText('옵션 1'))
      await user.click(screen.getByText('옵션 2'))

      expect(handleValueChange).toHaveBeenNthCalledWith(1, ['option1'])
      expect(handleValueChange).toHaveBeenNthCalledWith(2, ['option1', 'option2'])
    })

    it('Footer는 layout-only — children을 그대로 렌더한다', async () => {
      const user = userEvent.setup()

      render(
        <MultiSelect options={mockOptions} value={[]}>
          <MultiSelect.Trigger placeholder="선택하세요" />
          <MultiSelect.Content>
            {renderList()}
            <MultiSelect.Footer>
              <button type="button">커스텀 버튼</button>
            </MultiSelect.Footer>
          </MultiSelect.Content>
        </MultiSelect>,
      )

      await user.click(screen.getByText('선택하세요'))
      await waitFor(() => expect(screen.getByText('커스텀 버튼')).toBeInTheDocument())

      const footer = screen.getByText('커스텀 버튼').closest('[data-slot="select-footer"]')
      expect(footer).not.toBeNull()
    })
  })

  describe('긴 항목 이름', () => {
    const renderOpen = async (item: ReactNode) => {
      const user = userEvent.setup()
      render(
        <MultiSelect options={mockOptions} value={[]}>
          <MultiSelect.Trigger placeholder="선택하세요" />
          <MultiSelect.Content>
            <MultiSelect.List>{item}</MultiSelect.List>
          </MultiSelect.Content>
        </MultiSelect>,
      )
      await user.click(screen.getByText('선택하세요'))
    }

    it('글자 children 은 한 줄 말줄임 라벨로 감싸고 title 로 전체 이름을 보여준다', async () => {
      const name = '#30 20261103-154246-campaign-즉시실행 v1'
      await renderOpen(<MultiSelect.Item value="a">{name}</MultiSelect.Item>)

      const label = await screen.findByText(name)
      expect(label).toHaveAttribute('data-slot', 'select-item-label')
      expect(label).toHaveClass('min-w-0', 'truncate')
      expect(label).toHaveAttribute('title', name)
    })

    it('요소 children 은 감싸지 않고 그대로 둔다', async () => {
      await renderOpen(
        <MultiSelect.Item value="a">
          <span data-testid="custom">이름</span>
        </MultiSelect.Item>,
      )

      const custom = await screen.findByTestId('custom')
      expect(custom.parentElement).toHaveAttribute('data-slot', 'select-item')
      expect(document.querySelector('[data-slot="select-item-label"]')).toBeNull()
    })

    it.each(['권한이 없어 선택할 수 없습니다', ''])(
      'Item 에 준 title(%j)이 라벨의 title 보다 우선한다',
      async title => {
        await renderOpen(
          <MultiSelect.Item value="a" title={title}>
            캠페인 A
          </MultiSelect.Item>,
        )

        const label = await screen.findByText('캠페인 A')
        expect(label).not.toHaveAttribute('title')
        expect(label.closest('[data-slot="select-item"]')).toHaveAttribute('title', title)
      },
    )
  })

  describe('상태', () => {
    it('disabled 상태를 적용할 수 있다', () => {
      render(
        <MultiSelect options={mockOptions} value={[]}>
          <MultiSelect.Trigger placeholder="선택하세요" disabled />
          <MultiSelect.Content>{renderList()}</MultiSelect.Content>
        </MultiSelect>,
      )

      const trigger = screen.getByText('선택하세요').closest('button')
      expect(trigger).toBeDisabled()
    })

    it('error 상태를 적용할 수 있다', () => {
      render(
        <MultiSelect options={mockOptions} value={[]}>
          <MultiSelect.Trigger placeholder="선택하세요" error />
          <MultiSelect.Content>{renderList()}</MultiSelect.Content>
        </MultiSelect>,
      )

      const trigger = screen.getByText('선택하세요').closest('button')
      expect(trigger).toHaveAttribute('data-error', 'true')
    })
  })

  describe('외부 조립 (presentational)', () => {
    it('Fallback은 옵션이 있어도 마운트되면 렌더된다 (self-gating 없음)', async () => {
      const user = userEvent.setup()
      render(
        <MultiSelect options={mockOptions} value={[]}>
          <MultiSelect.Trigger placeholder="선택하세요" />
          <MultiSelect.Content>
            <MultiSelect.Fallback>빈 상태</MultiSelect.Fallback>
          </MultiSelect.Content>
        </MultiSelect>,
      )
      await user.click(screen.getByText('선택하세요'))
      await waitFor(() => expect(screen.getByText('빈 상태')).toBeInTheDocument())
    })

    it('Search는 controlled value/onChange로 외부 제어된다', async () => {
      const handleChange = vi.fn()
      const user = userEvent.setup()
      render(
        <MultiSelect options={mockOptions} value={[]}>
          <MultiSelect.Trigger placeholder="선택하세요" />
          <MultiSelect.Content>
            <MultiSelect.Search value="초기검색어" onChange={handleChange} />
            {renderList()}
          </MultiSelect.Content>
        </MultiSelect>,
      )
      await user.click(screen.getByText('선택하세요'))
      const input = await screen.findByDisplayValue('초기검색어')
      await user.type(input, 'x')
      expect(handleChange).toHaveBeenCalled()
    })
  })
})
