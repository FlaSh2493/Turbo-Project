import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
  PopoverRoot,
  PopoverTrigger,
  PopoverContent,
  PopoverAnchor,
  PopoverClose,
} from '../popover'

describe('Popover', () => {
  describe('렌더링', () => {
    it('트리거 버튼을 렌더링한다', () => {
      render(
        <PopoverRoot>
          <PopoverTrigger>팝오버 열기</PopoverTrigger>
          <PopoverContent>팝오버 내용</PopoverContent>
        </PopoverRoot>,
      )

      expect(screen.getByRole('button', { name: '팝오버 열기' })).toBeInTheDocument()
    })

    it('초기에는 콘텐츠가 숨겨져 있다', () => {
      render(
        <PopoverRoot>
          <PopoverTrigger>팝오버 열기</PopoverTrigger>
          <PopoverContent>팝오버 내용</PopoverContent>
        </PopoverRoot>,
      )

      expect(screen.queryByText('팝오버 내용')).not.toBeInTheDocument()
    })

    it('Anchor 컴포넌트를 렌더링한다', () => {
      render(
        <PopoverRoot>
          <PopoverAnchor data-testid="popover-anchor-el">앵커</PopoverAnchor>
          <PopoverTrigger>팝오버 열기</PopoverTrigger>
          <PopoverContent>팝오버 내용</PopoverContent>
        </PopoverRoot>,
      )

      expect(screen.getByTestId('popover-anchor-el')).toBeInTheDocument()
    })
  })

  describe('상호작용', () => {
    it('트리거 클릭 시 콘텐츠가 표시된다', async () => {
      const user = userEvent.setup()
      render(
        <PopoverRoot>
          <PopoverTrigger>팝오버 열기</PopoverTrigger>
          <PopoverContent>팝오버 내용</PopoverContent>
        </PopoverRoot>,
      )

      await user.click(screen.getByRole('button', { name: '팝오버 열기' }))

      await waitFor(() => {
        expect(screen.getByText('팝오버 내용')).toBeInTheDocument()
      })
    })

    it('닫기 버튼 클릭 시 콘텐츠가 숨겨진다', async () => {
      const user = userEvent.setup()
      render(
        <PopoverRoot>
          <PopoverTrigger>팝오버 열기</PopoverTrigger>
          <PopoverContent>
            팝오버 내용
            <PopoverClose>닫기</PopoverClose>
          </PopoverContent>
        </PopoverRoot>,
      )

      await user.click(screen.getByRole('button', { name: '팝오버 열기' }))

      await waitFor(() => {
        expect(screen.getByText('팝오버 내용')).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: '닫기' }))

      await waitFor(() => {
        expect(screen.queryByText('팝오버 내용')).not.toBeInTheDocument()
      })
    })

    it('onOpenChange 콜백이 열릴 때 호출된다', async () => {
      const user = userEvent.setup()
      const onOpenChange = vi.fn()
      render(
        <PopoverRoot onOpenChange={onOpenChange}>
          <PopoverTrigger>팝오버 열기</PopoverTrigger>
          <PopoverContent>팝오버 내용</PopoverContent>
        </PopoverRoot>,
      )

      await user.click(screen.getByRole('button', { name: '팝오버 열기' }))

      expect(onOpenChange).toHaveBeenCalledWith(true, expect.anything())
    })
  })

  describe('Props 변형', () => {
    it('controlled open=true일 때 콘텐츠가 표시된다', () => {
      render(
        <PopoverRoot open={true}>
          <PopoverTrigger>팝오버 열기</PopoverTrigger>
          <PopoverContent>팝오버 내용</PopoverContent>
        </PopoverRoot>,
      )

      expect(screen.getByText('팝오버 내용')).toBeInTheDocument()
    })

    it('트리거에 data-slot="popover-trigger" 속성이 있다', () => {
      render(
        <PopoverRoot>
          <PopoverTrigger>팝오버 열기</PopoverTrigger>
          <PopoverContent>팝오버 내용</PopoverContent>
        </PopoverRoot>,
      )

      expect(screen.getByRole('button', { name: '팝오버 열기' })).toHaveAttribute(
        'data-slot',
        'popover-trigger',
      )
    })

    it('Anchor에 data-slot="popover-anchor" 속성이 있다', () => {
      render(
        <PopoverRoot>
          <PopoverAnchor data-testid="anchor">앵커</PopoverAnchor>
          <PopoverTrigger>팝오버 열기</PopoverTrigger>
          <PopoverContent>팝오버 내용</PopoverContent>
        </PopoverRoot>,
      )

      expect(screen.getByTestId('anchor')).toHaveAttribute('data-slot', 'popover-anchor')
    })

    it('콘텐츠에 data-slot="popover-content" 속성이 있다', async () => {
      const user = userEvent.setup()
      render(
        <PopoverRoot>
          <PopoverTrigger>팝오버 열기</PopoverTrigger>
          <PopoverContent>팝오버 내용</PopoverContent>
        </PopoverRoot>,
      )

      await user.click(screen.getByRole('button', { name: '팝오버 열기' }))

      await waitFor(() => {
        const content = screen.getByText('팝오버 내용').closest('[data-slot="popover-content"]')
        expect(content).toBeInTheDocument()
      })
    })

    it('닫기 버튼에 data-slot="popover-close" 속성이 있다', async () => {
      const user = userEvent.setup()
      render(
        <PopoverRoot>
          <PopoverTrigger>팝오버 열기</PopoverTrigger>
          <PopoverContent>
            내용
            <PopoverClose data-testid="close-btn">닫기</PopoverClose>
          </PopoverContent>
        </PopoverRoot>,
      )

      await user.click(screen.getByRole('button', { name: '팝오버 열기' }))

      await waitFor(() => {
        expect(screen.getByTestId('close-btn')).toHaveAttribute('data-slot', 'popover-close')
      })
    })
  })

  describe('접근성', () => {
    it('트리거가 button 요소다', () => {
      render(
        <PopoverRoot>
          <PopoverTrigger>팝오버 열기</PopoverTrigger>
          <PopoverContent>팝오버 내용</PopoverContent>
        </PopoverRoot>,
      )

      expect(screen.getByRole('button', { name: '팝오버 열기' })).toBeInTheDocument()
    })

    it('트리거가 button role을 가진다', () => {
      render(
        <PopoverRoot>
          <PopoverTrigger>팝오버 열기</PopoverTrigger>
          <PopoverContent>팝오버 내용</PopoverContent>
        </PopoverRoot>,
      )

      const trigger = screen.getByRole('button', { name: '팝오버 열기' })
      expect(trigger.tagName).toBe('BUTTON')
    })

    it('열린 상태에서 콘텐츠 영역이 존재한다', async () => {
      const user = userEvent.setup()
      render(
        <PopoverRoot>
          <PopoverTrigger>팝오버 열기</PopoverTrigger>
          <PopoverContent>팝오버 내용</PopoverContent>
        </PopoverRoot>,
      )

      await user.click(screen.getByRole('button', { name: '팝오버 열기' }))

      await waitFor(() => {
        expect(screen.getByText('팝오버 내용')).toBeVisible()
      })
    })
  })
})
