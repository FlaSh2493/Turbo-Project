import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Drawer } from '../drawer'

describe('Drawer', () => {
  describe('렌더링', () => {
    it('open=true일 때 자식 콘텐츠를 렌더링한다', async () => {
      const onOpenChange = vi.fn()
      render(
        <Drawer.Root open={true} onOpenChange={onOpenChange}>
          <Drawer.Overlay />
          <Drawer.Viewport>
            <Drawer.Panel>
              <Drawer.Header>헤더 제목</Drawer.Header>
              <Drawer.Content>서랍 콘텐츠</Drawer.Content>
            </Drawer.Panel>
          </Drawer.Viewport>
        </Drawer.Root>,
      )

      await waitFor(() => {
        expect(screen.getByText('서랍 콘텐츠')).toBeInTheDocument()
      })
    })

    it('open=false일 때 콘텐츠가 보이지 않는다', () => {
      const onOpenChange = vi.fn()
      render(
        <Drawer.Root open={false} onOpenChange={onOpenChange}>
          <Drawer.Overlay />
          <Drawer.Viewport>
            <Drawer.Panel>
              <Drawer.Content>숨겨진 콘텐츠</Drawer.Content>
            </Drawer.Panel>
          </Drawer.Viewport>
        </Drawer.Root>,
      )

      expect(screen.queryByText('숨겨진 콘텐츠')).not.toBeInTheDocument()
    })

    it('Title 컴포넌트를 렌더링한다', async () => {
      const onOpenChange = vi.fn()
      render(
        <Drawer.Root open={true} onOpenChange={onOpenChange}>
          <Drawer.Overlay />
          <Drawer.Viewport>
            <Drawer.Panel>
              <Drawer.Header>
                <Drawer.Title>서랍 제목</Drawer.Title>
              </Drawer.Header>
              <Drawer.Content>콘텐츠</Drawer.Content>
            </Drawer.Panel>
          </Drawer.Viewport>
        </Drawer.Root>,
      )

      await waitFor(() => {
        expect(screen.getByText('서랍 제목')).toBeInTheDocument()
      })
    })

    it('Footer 컴포넌트를 렌더링한다', async () => {
      const onOpenChange = vi.fn()
      render(
        <Drawer.Root open={true} onOpenChange={onOpenChange}>
          <Drawer.Overlay />
          <Drawer.Viewport>
            <Drawer.Panel>
              <Drawer.Content>콘텐츠</Drawer.Content>
              <Drawer.Footer>푸터 콘텐츠</Drawer.Footer>
            </Drawer.Panel>
          </Drawer.Viewport>
        </Drawer.Root>,
      )

      await waitFor(() => {
        expect(screen.getByText('푸터 콘텐츠')).toBeInTheDocument()
      })
    })
  })

  describe('상호작용', () => {
    it('Drawer.Close 버튼 클릭 시 onOpenChange(false)가 호출된다 (중복)', async () => {
      const user = userEvent.setup()
      const onOpenChange = vi.fn()
      render(
        <Drawer.Root open={true} onOpenChange={onOpenChange}>
          <Drawer.Overlay />
          <Drawer.Viewport>
            <Drawer.Panel>
              <Drawer.Header>헤더</Drawer.Header>
              <Drawer.Content>콘텐츠</Drawer.Content>
              <Drawer.Footer>
                <Drawer.Close aria-label="닫기">닫기</Drawer.Close>
              </Drawer.Footer>
            </Drawer.Panel>
          </Drawer.Viewport>
        </Drawer.Root>,
      )

      await waitFor(() => {
        expect(screen.getByLabelText('닫기')).toBeInTheDocument()
      })

      await user.click(screen.getByLabelText('닫기'))

      expect(onOpenChange).toHaveBeenCalledWith(false, expect.anything())
    })

    it('Drawer.Close 버튼 클릭 시 onOpenChange(false)가 호출된다', async () => {
      const user = userEvent.setup()
      const onOpenChange = vi.fn()
      render(
        <Drawer.Root open={true} onOpenChange={onOpenChange}>
          <Drawer.Overlay />
          <Drawer.Viewport>
            <Drawer.Panel>
              <Drawer.Content>콘텐츠</Drawer.Content>
              <Drawer.Footer>
                <Drawer.Close>닫기 버튼</Drawer.Close>
              </Drawer.Footer>
            </Drawer.Panel>
          </Drawer.Viewport>
        </Drawer.Root>,
      )

      await waitFor(() => {
        expect(screen.getByText('닫기 버튼')).toBeInTheDocument()
      })

      await user.click(screen.getByText('닫기 버튼'))

      expect(onOpenChange).toHaveBeenCalledWith(false, expect.anything())
    })
  })

  describe('Props 변형', () => {
    it('direction prop을 허용한다', async () => {
      const onOpenChange = vi.fn()
      render(
        <Drawer.Root open={true} onOpenChange={onOpenChange} direction="right">
          <Drawer.Overlay />
          <Drawer.Viewport>
            <Drawer.Panel>
              <Drawer.Content>오른쪽 서랍</Drawer.Content>
            </Drawer.Panel>
          </Drawer.Viewport>
        </Drawer.Root>,
      )

      await waitFor(() => {
        expect(screen.getByText('오른쪽 서랍')).toBeInTheDocument()
      })
    })

    it('Overlay에 data-slot="drawer-overlay" 속성이 있다', async () => {
      const onOpenChange = vi.fn()
      render(
        <Drawer.Root open={true} onOpenChange={onOpenChange}>
          <Drawer.Overlay data-testid="drawer-overlay-el" />
          <Drawer.Viewport>
            <Drawer.Panel>
              <Drawer.Content>콘텐츠</Drawer.Content>
            </Drawer.Panel>
          </Drawer.Viewport>
        </Drawer.Root>,
      )

      await waitFor(() => {
        expect(screen.getByTestId('drawer-overlay-el')).toHaveAttribute(
          'data-slot',
          'drawer-overlay',
        )
      })
    })

    it('Panel에 data-slot="drawer-panel" 속성이 있다', async () => {
      const onOpenChange = vi.fn()
      render(
        <Drawer.Root open={true} onOpenChange={onOpenChange}>
          <Drawer.Overlay />
          <Drawer.Viewport>
            <Drawer.Panel data-testid="drawer-panel-el">
              <Drawer.Content>콘텐츠</Drawer.Content>
            </Drawer.Panel>
          </Drawer.Viewport>
        </Drawer.Root>,
      )

      await waitFor(() => {
        expect(screen.getByTestId('drawer-panel-el')).toHaveAttribute('data-slot', 'drawer-panel')
      })
    })

    it('Header에 data-slot="drawer-header" 속성이 있다', async () => {
      const onOpenChange = vi.fn()
      render(
        <Drawer.Root open={true} onOpenChange={onOpenChange}>
          <Drawer.Overlay />
          <Drawer.Viewport>
            <Drawer.Panel>
              <Drawer.Header data-testid="drawer-header-el">헤더</Drawer.Header>
              <Drawer.Content>콘텐츠</Drawer.Content>
            </Drawer.Panel>
          </Drawer.Viewport>
        </Drawer.Root>,
      )

      await waitFor(() => {
        expect(screen.getByTestId('drawer-header-el')).toHaveAttribute('data-slot', 'drawer-header')
      })
    })

    it('Content에 data-slot="drawer-content" 속성이 있다', async () => {
      const onOpenChange = vi.fn()
      render(
        <Drawer.Root open={true} onOpenChange={onOpenChange}>
          <Drawer.Overlay />
          <Drawer.Viewport>
            <Drawer.Panel>
              <Drawer.Content data-testid="drawer-content-el">콘텐츠</Drawer.Content>
            </Drawer.Panel>
          </Drawer.Viewport>
        </Drawer.Root>,
      )

      await waitFor(() => {
        expect(screen.getByTestId('drawer-content-el')).toHaveAttribute(
          'data-slot',
          'drawer-content',
        )
      })
    })
  })

  describe('접근성', () => {
    it('Panel이 dialog 역할을 가진다', async () => {
      const onOpenChange = vi.fn()
      render(
        <Drawer.Root open={true} onOpenChange={onOpenChange}>
          <Drawer.Overlay />
          <Drawer.Viewport>
            <Drawer.Panel>
              <Drawer.Content>콘텐츠</Drawer.Content>
            </Drawer.Panel>
          </Drawer.Viewport>
        </Drawer.Root>,
      )

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
      })
    })

    it('Drawer.Close가 aria-label을 가진다', async () => {
      const onOpenChange = vi.fn()
      render(
        <Drawer.Root open={true} onOpenChange={onOpenChange}>
          <Drawer.Overlay />
          <Drawer.Viewport>
            <Drawer.Panel>
              <Drawer.Header>헤더 내용</Drawer.Header>
              <Drawer.Content>콘텐츠</Drawer.Content>
              <Drawer.Footer>
                <Drawer.Close aria-label="닫기">닫기</Drawer.Close>
              </Drawer.Footer>
            </Drawer.Panel>
          </Drawer.Viewport>
        </Drawer.Root>,
      )

      await waitFor(() => {
        expect(screen.getByLabelText('닫기')).toBeInTheDocument()
      })
    })

    it('Drawer.Close가 button 요소다', async () => {
      const onOpenChange = vi.fn()
      render(
        <Drawer.Root open={true} onOpenChange={onOpenChange}>
          <Drawer.Overlay />
          <Drawer.Viewport>
            <Drawer.Panel>
              <Drawer.Header>헤더</Drawer.Header>
              <Drawer.Content>콘텐츠</Drawer.Content>
              <Drawer.Footer>
                <Drawer.Close aria-label="닫기">닫기</Drawer.Close>
              </Drawer.Footer>
            </Drawer.Panel>
          </Drawer.Viewport>
        </Drawer.Root>,
      )

      await waitFor(() => {
        const closeButton = screen.getByLabelText('닫기')
        expect(closeButton.tagName).toBe('BUTTON')
      })
    })
  })
})
