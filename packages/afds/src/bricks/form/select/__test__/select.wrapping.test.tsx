import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Select } from '../select'

const options = [
  { value: 'option1', label: '옵션 1' },
  { value: 'option2', label: '옵션 2' },
]

const renderSelect = (itemProps: React.ComponentProps<typeof Select.Item> | object = {}) => {
  const onValueChange = vi.fn()
  render(
    <Select options={options} value="" onValueChange={onValueChange}>
      <Select.Trigger placeholder="선택하세요" />
      <Select.Content>
        <Select.List>
          {options.map(o => (
            <Select.Item key={o.value} value={o.value} {...itemProps}>
              {o.label}
            </Select.Item>
          ))}
        </Select.List>
      </Select.Content>
    </Select>,
  )
  return { onValueChange }
}

describe('Select 래핑 계약', () => {
  describe('Select.Item — 소비자 onClick 이 내부 선택 동작을 지우면 안 된다', () => {
    it('소비자가 onClick 을 넘겨도 선택이 동작한다', async () => {
      const user = userEvent.setup()
      const track = vi.fn()
      const { onValueChange } = renderSelect({ onClick: track })

      await user.click(screen.getByText('선택하세요'))
      await user.click(await screen.findByText('옵션 1'))

      expect(track).toHaveBeenCalledTimes(1)
      expect(onValueChange).toHaveBeenCalledWith('option1')
    })

    it('소비자가 preventDefault 를 호출하면 선택을 생략한다 (명시적 escape hatch)', async () => {
      const user = userEvent.setup()
      const { onValueChange } = renderSelect({
        onClick: (e: React.MouseEvent) => e.preventDefault(),
      })

      await user.click(screen.getByText('선택하세요'))
      await user.click(await screen.findByText('옵션 1'))

      expect(onValueChange).not.toHaveBeenCalled()
    })
  })

  describe('Select.Trigger — 소비자 onPointerDown 이 readOnly 방어를 지우면 안 된다', () => {
    it('readOnly 트리거는 소비자 onPointerDown 이 있어도 열리지 않는다', async () => {
      const user = userEvent.setup()
      const track = vi.fn()
      render(
        <Select options={options} value="option1">
          <Select.Trigger readOnly onPointerDown={track} />
          <Select.Content>
            <Select.List>
              {options.map(o => (
                <Select.Item key={o.value} value={o.value}>
                  {o.label}
                </Select.Item>
              ))}
            </Select.List>
          </Select.Content>
        </Select>,
      )

      await user.click(screen.getByRole('button'))

      expect(track).toHaveBeenCalled()
      // 부정 단언을 waitFor 안에 두면 메뉴가 열리기 전 첫 tick 에 공허하게 통과한다.
      // findBy 의 타임아웃 거부로 "끝까지 열리지 않았음" 을 확정한다.
      await expect(screen.findByText('옵션 2', {}, { timeout: 300 })).rejects.toThrow()
    })

    it('readOnly 가 아니면 소비자 onPointerDown 이 있어도 정상적으로 열린다', async () => {
      const user = userEvent.setup()
      const track = vi.fn()
      render(
        <Select options={options} value="option1">
          <Select.Trigger onPointerDown={track} />
          <Select.Content>
            <Select.List>
              {options.map(o => (
                <Select.Item key={o.value} value={o.value}>
                  {o.label}
                </Select.Item>
              ))}
            </Select.List>
          </Select.Content>
        </Select>,
      )

      await user.click(screen.getByRole('button'))

      expect(track).toHaveBeenCalled()
      expect(await screen.findByText('옵션 2')).toBeInTheDocument()
    })
  })
})
