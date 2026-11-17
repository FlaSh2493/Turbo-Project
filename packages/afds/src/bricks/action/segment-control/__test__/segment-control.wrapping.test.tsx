import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SegmentControl } from '../segment-control'

describe('SegmentControl 래핑 계약', () => {
  it('소비자가 Item 에 onClick 을 넘겨도 선택이 동작한다', async () => {
    const user = userEvent.setup()
    const track = vi.fn()
    const onValueChange = vi.fn()
    render(
      <SegmentControl.Root defaultValue="a" onValueChange={onValueChange}>
        <SegmentControl.Item value="a">A</SegmentControl.Item>
        <SegmentControl.Item value="b" onClick={track}>
          B
        </SegmentControl.Item>
      </SegmentControl.Root>,
    )

    await user.click(screen.getByText('B'))

    expect(track).toHaveBeenCalledTimes(1)
    expect(onValueChange).toHaveBeenCalledWith('b')
  })
})
