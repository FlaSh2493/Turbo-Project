import { describe, it, expect, vi } from 'vitest'
import { useState, type ReactNode } from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Select } from '../select'

const mockOptions = [
  { value: 'option1', label: '옵션 1' },
  { value: 'option2', label: '옵션 2' },
  { value: 'option3', label: '옵션 3' },
]

describe('Select', () => {
  describe('렌더링', () => {
    it('트리거를 올바르게 렌더링한다', () => {
      render(
        <Select options={mockOptions} value="">
          <Select.Trigger placeholder="선택하세요" />
          <Select.Content>
            <Select.List>
              {mockOptions.map(o => (
                <Select.Item key={o.value} value={o.value}>
                  {o.label}
                </Select.Item>
              ))}
            </Select.List>
          </Select.Content>
        </Select>,
      )
      expect(screen.getByText('선택하세요')).toBeInTheDocument()
    })

    it('data-slot 속성을 가진다', () => {
      render(
        <Select options={mockOptions} value="">
          <Select.Trigger placeholder="선택하세요" />
          <Select.Content>
            <Select.List>
              {mockOptions.map(o => (
                <Select.Item key={o.value} value={o.value}>
                  {o.label}
                </Select.Item>
              ))}
            </Select.List>
          </Select.Content>
        </Select>,
      )
      expect(
        screen.getByText('선택하세요').closest('[data-slot="select-value"]'),
      ).toBeInTheDocument()
    })
  })

  describe('단일 선택', () => {
    it('옵션을 클릭하면 선택된다', async () => {
      const handleValueChange = vi.fn()
      const user = userEvent.setup()

      render(
        <Select options={mockOptions} value="" onValueChange={handleValueChange}>
          <Select.Trigger placeholder="선택하세요" />
          <Select.Content>
            <Select.List>
              {mockOptions.map(o => (
                <Select.Item key={o.value} value={o.value}>
                  {o.label}
                </Select.Item>
              ))}
            </Select.List>
          </Select.Content>
        </Select>,
      )

      await user.click(screen.getByText('선택하세요'))

      await waitFor(() => {
        expect(screen.getByText('옵션 1')).toBeInTheDocument()
      })

      await user.click(screen.getByText('옵션 1'))

      expect(handleValueChange).toHaveBeenCalledWith('option1')
    })

    it('controlled value가 올바르게 표시된다', () => {
      render(
        <Select options={mockOptions} value="option2">
          <Select.Trigger placeholder="선택하세요" />
          <Select.Content>
            <Select.List>
              {mockOptions.map(o => (
                <Select.Item key={o.value} value={o.value}>
                  {o.label}
                </Select.Item>
              ))}
            </Select.List>
          </Select.Content>
        </Select>,
      )

      expect(screen.getByText('옵션 2')).toBeInTheDocument()
    })
  })

  describe('긴 항목 이름', () => {
    const renderOpen = async (item: ReactNode) => {
      const user = userEvent.setup()
      render(
        <Select options={mockOptions} value="">
          <Select.Trigger placeholder="선택하세요" />
          <Select.Content>
            <Select.List>{item}</Select.List>
          </Select.Content>
        </Select>,
      )
      await user.click(screen.getByText('선택하세요'))
    }

    it('글자 children 은 한 줄 말줄임 라벨로 감싸고 title 로 전체 이름을 보여준다', async () => {
      const name = '#30 20261103-154246-campaign-즉시실행 v1'
      await renderOpen(<Select.Item value="a">{name}</Select.Item>)

      const label = await screen.findByText(name)
      expect(label).toHaveAttribute('data-slot', 'select-item-label')
      expect(label).toHaveClass('min-w-0', 'truncate')
      expect(label).toHaveAttribute('title', name)
    })

    it('여러 조각으로 된 글자 children 도 이어 붙인 이름을 title 로 쓴다', async () => {
      await renderOpen(
        <Select.Item value="a">
          #{30} {'캠페인'}
        </Select.Item>,
      )

      const label = await screen.findByText('#30 캠페인')
      expect(label).toHaveAttribute('data-slot', 'select-item-label')
      expect(label).toHaveAttribute('title', '#30 캠페인')
    })

    it('요소 children 은 감싸지 않고 그대로 둔다', async () => {
      await renderOpen(
        <Select.Item value="a">
          <span data-testid="custom">이름</span>
        </Select.Item>,
      )

      const custom = await screen.findByTestId('custom')
      expect(custom.parentElement).toHaveAttribute('data-slot', 'select-item')
      expect(document.querySelector('[data-slot="select-item-label"]')).toBeNull()
    })

    it.each(['권한이 없어 선택할 수 없습니다', ''])(
      'Item 에 준 title(%j)이 라벨의 title 보다 우선한다',
      async title => {
        await renderOpen(
          <Select.Item value="a" title={title}>
            캠페인 A
          </Select.Item>,
        )

        const label = await screen.findByText('캠페인 A')
        expect(label).not.toHaveAttribute('title')
        expect(label.closest('[data-slot="select-item"]')).toHaveAttribute('title', title)
      },
    )
  })

  describe('size', () => {
    it('size="sm"을 적용할 수 있다', () => {
      render(
        <Select options={mockOptions} value="" size="sm">
          <Select.Trigger placeholder="선택하세요" />
          <Select.Content>
            <Select.List>
              {mockOptions.map(o => (
                <Select.Item key={o.value} value={o.value}>
                  {o.label}
                </Select.Item>
              ))}
            </Select.List>
          </Select.Content>
        </Select>,
      )
      expect(screen.getByText('선택하세요')).toBeInTheDocument()
    })

    it('size="md"를 적용할 수 있다', () => {
      render(
        <Select options={mockOptions} value="" size="md">
          <Select.Trigger placeholder="선택하세요" />
          <Select.Content>
            <Select.List>
              {mockOptions.map(o => (
                <Select.Item key={o.value} value={o.value}>
                  {o.label}
                </Select.Item>
              ))}
            </Select.List>
          </Select.Content>
        </Select>,
      )
      expect(screen.getByText('선택하세요')).toBeInTheDocument()
    })
  })

  describe('상태', () => {
    it('disabled 상태를 적용할 수 있다', () => {
      render(
        <Select options={mockOptions} value="">
          <Select.Trigger placeholder="선택하세요" disabled />
          <Select.Content>
            <Select.List>
              {mockOptions.map(o => (
                <Select.Item key={o.value} value={o.value}>
                  {o.label}
                </Select.Item>
              ))}
            </Select.List>
          </Select.Content>
        </Select>,
      )

      const trigger = screen.getByText('선택하세요').closest('button')
      expect(trigger).toBeDisabled()
    })

    it('error 상태를 적용할 수 있다', () => {
      render(
        <Select options={mockOptions} value="">
          <Select.Trigger placeholder="선택하세요" error />
          <Select.Content>
            <Select.List>
              {mockOptions.map(o => (
                <Select.Item key={o.value} value={o.value}>
                  {o.label}
                </Select.Item>
              ))}
            </Select.List>
          </Select.Content>
        </Select>,
      )

      const trigger = screen.getByText('선택하세요').closest('button')
      expect(trigger).toHaveAttribute('data-error', 'true')
    })

    it('readOnly 상태를 적용할 수 있다', async () => {
      const user = userEvent.setup()

      render(
        <Select options={mockOptions} value="option1">
          <Select.Trigger placeholder="선택하세요" readOnly />
          <Select.Content>
            <Select.List>
              {mockOptions.map(o => (
                <Select.Item key={o.value} value={o.value}>
                  {o.label}
                </Select.Item>
              ))}
            </Select.List>
          </Select.Content>
        </Select>,
      )

      const trigger = screen.getByText('옵션 1').closest('button')
      expect(trigger).toHaveAttribute('data-readonly', 'true')

      await user.click(trigger!)

      expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
    })
  })

  describe('검색', () => {
    it('controlled Search + 외부 필터로 옵션을 필터링할 수 있다', async () => {
      const user = userEvent.setup()

      function Demo() {
        const [q, setQ] = useState('')
        const results = mockOptions.filter(o => o.label.includes(q))
        return (
          <Select options={results} value="">
            <Select.Trigger placeholder="선택하세요" />
            <Select.Content>
              <Select.Search value={q} onChange={setQ} />
              {results.map(o => (
                <Select.Item key={o.value} value={o.value}>
                  {o.label}
                </Select.Item>
              ))}
            </Select.Content>
          </Select>
        )
      }

      render(<Demo />)

      await user.click(screen.getByText('선택하세요'))
      await waitFor(() => expect(screen.getByRole('textbox')).toBeInTheDocument())

      await user.type(screen.getByRole('textbox'), '옵션 1')

      expect(screen.getByText('옵션 1')).toBeInTheDocument()
      expect(screen.queryByText('옵션 2')).not.toBeInTheDocument()
    })
  })

  describe('className', () => {
    it('추가 className을 적용한다', () => {
      render(
        <Select options={mockOptions} value="">
          <Select.Trigger placeholder="선택하세요" className="custom-class" />
          <Select.Content>
            <Select.List>
              {mockOptions.map(o => (
                <Select.Item key={o.value} value={o.value}>
                  {o.label}
                </Select.Item>
              ))}
            </Select.List>
          </Select.Content>
        </Select>,
      )

      const trigger = screen.getByText('선택하세요').closest('button')
      expect(trigger).toHaveClass('custom-class')
    })
  })

  describe('외부 조립 (presentational)', () => {
    it('Fallback은 옵션이 있어도 마운트되면 렌더된다 (self-gating 없음)', async () => {
      const user = userEvent.setup()
      render(
        <Select options={mockOptions} value="">
          <Select.Trigger placeholder="선택하세요" />
          <Select.Content>
            <Select.Fallback>빈 상태</Select.Fallback>
          </Select.Content>
        </Select>,
      )
      await user.click(screen.getByText('선택하세요'))
      await waitFor(() => expect(screen.getByText('빈 상태')).toBeInTheDocument())
    })

    it('Search는 controlled value/onChange로 외부 제어된다', async () => {
      const handleChange = vi.fn()
      const user = userEvent.setup()
      render(
        <Select options={mockOptions} value="">
          <Select.Trigger placeholder="선택하세요" />
          <Select.Content>
            <Select.Search value="초기검색어" onChange={handleChange} />
            <Select.List>
              {mockOptions.map(o => (
                <Select.Item key={o.value} value={o.value}>
                  {o.label}
                </Select.Item>
              ))}
            </Select.List>
          </Select.Content>
        </Select>,
      )
      await user.click(screen.getByText('선택하세요'))
      const input = await screen.findByDisplayValue('초기검색어')
      await user.type(input, 'x')
      expect(handleChange).toHaveBeenCalled()
    })
  })
})
