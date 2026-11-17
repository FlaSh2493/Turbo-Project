import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MultiSelect } from '../multi-select'

const options = [
  { value: 'option1', label: '옵션 1' },
  { value: 'option2', label: '옵션 2' },
]

describe('MultiSelect 래핑 계약', () => {
  describe('MultiSelect.Item — 소비자 onClick 이 내부 선택 동작을 지우면 안 된다', () => {
    it('소비자가 onClick 을 넘겨도 선택이 동작한다', async () => {
      const user = userEvent.setup()
      const track = vi.fn()
      const onValueChange = vi.fn()
      render(
        <MultiSelect options={options} value={[]} onValueChange={onValueChange}>
          <MultiSelect.Trigger placeholder="선택하세요" />
          <MultiSelect.Content>
            <MultiSelect.List>
              {options.map(o => (
                <MultiSelect.Item key={o.value} value={o.value} onClick={track}>
                  {o.label}
                </MultiSelect.Item>
              ))}
            </MultiSelect.List>
          </MultiSelect.Content>
        </MultiSelect>,
      )

      await user.click(screen.getByText('선택하세요'))
      await user.click(await screen.findByText('옵션 1'))

      expect(track).toHaveBeenCalled()
      expect(onValueChange).toHaveBeenCalledWith(['option1'])
    })
  })

  describe('MultiSelect.Trigger — 소비자 onPointerDown 이 readOnly 방어를 지우면 안 된다', () => {
    it('readOnly 트리거는 소비자 onPointerDown 이 있어도 열리지 않는다', async () => {
      const user = userEvent.setup()
      const track = vi.fn()
      render(
        <MultiSelect options={options} value={['option1']}>
          <MultiSelect.Trigger readOnly onPointerDown={track} />
          <MultiSelect.Content>
            <MultiSelect.List>
              {options.map(o => (
                <MultiSelect.Item key={o.value} value={o.value}>
                  {o.label}
                </MultiSelect.Item>
              ))}
            </MultiSelect.List>
          </MultiSelect.Content>
        </MultiSelect>,
      )

      await user.click(screen.getByRole('button'))

      expect(track).toHaveBeenCalled()
      await expect(screen.findByText('옵션 2', {}, { timeout: 300 })).rejects.toThrow()
    })
  })
})
