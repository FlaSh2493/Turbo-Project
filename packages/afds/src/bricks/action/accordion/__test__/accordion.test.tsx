import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Accordion } from '../accordion'
import { Typography } from '../../../display/typography'

describe('Accordion', () => {
  describe('렌더링', () => {
    it('Root가 렌더링된다', () => {
      render(
        <Accordion.Root>
          <Accordion.Item value="item1">
            <Accordion.Trigger>
              <Typography variant="title3">아이템 1</Typography>
              <Accordion.Indicator />
            </Accordion.Trigger>
            <Accordion.Content>
              <Accordion.Body>내용 1</Accordion.Body>
            </Accordion.Content>
          </Accordion.Item>
        </Accordion.Root>,
      )

      expect(document.querySelector('[data-slot="accordion-root"]')).toBeInTheDocument()
    })

    it('트리거 버튼이 렌더링된다', () => {
      render(
        <Accordion.Root>
          <Accordion.Item value="item1">
            <Accordion.Trigger>
              <Typography variant="title3">아이템 1</Typography>
              <Accordion.Indicator />
            </Accordion.Trigger>
            <Accordion.Content>
              <Accordion.Body>내용 1</Accordion.Body>
            </Accordion.Content>
          </Accordion.Item>
          <Accordion.Item value="item2">
            <Accordion.Trigger>
              <Typography variant="title3">아이템 2</Typography>
              <Accordion.Indicator />
            </Accordion.Trigger>
            <Accordion.Content>
              <Accordion.Body>내용 2</Accordion.Body>
            </Accordion.Content>
          </Accordion.Item>
        </Accordion.Root>,
      )

      expect(screen.getByRole('button', { name: /아이템 1/ })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /아이템 2/ })).toBeInTheDocument()
    })

    it('기본적으로 Content는 DOM에 없거나 숨겨져 있다', () => {
      render(
        <Accordion.Root>
          <Accordion.Item value="item1">
            <Accordion.Trigger>
              <Typography variant="title3">아이템 1</Typography>
              <Accordion.Indicator />
            </Accordion.Trigger>
            <Accordion.Content>
              <Accordion.Body>내용 1</Accordion.Body>
            </Accordion.Content>
          </Accordion.Item>
        </Accordion.Root>,
      )

      const trigger = screen.getByRole('button', { name: /아이템 1/ })
      expect(trigger).toHaveAttribute('aria-expanded', 'false')
    })

    it('defaultValue로 지정된 아이템은 열린 상태로 렌더링된다', async () => {
      render(
        <Accordion.Root defaultValue={['item1']}>
          <Accordion.Item value="item1">
            <Accordion.Trigger>
              <Typography variant="title3">아이템 1</Typography>
              <Accordion.Indicator />
            </Accordion.Trigger>
            <Accordion.Content>
              <Accordion.Body>내용 1</Accordion.Body>
            </Accordion.Content>
          </Accordion.Item>
        </Accordion.Root>,
      )

      await waitFor(() => {
        expect(screen.getByText('내용 1')).toBeInTheDocument()
      })
    })

    it('Indicator를 사용하지 않으면 아이콘이 렌더링되지 않는다', () => {
      const { container } = render(
        <Accordion.Root>
          <Accordion.Item value="item1">
            <Accordion.Trigger>
              <Typography variant="title3">아이템 1</Typography>
            </Accordion.Trigger>
            <Accordion.Content>
              <Accordion.Body>내용 1</Accordion.Body>
            </Accordion.Content>
          </Accordion.Item>
        </Accordion.Root>,
      )

      const trigger = container.querySelector('[data-slot="accordion-trigger"]')
      expect(trigger?.querySelector('[data-slot="accordion-indicator"]')).not.toBeInTheDocument()
    })

    it('Indicator에 children을 주면 커스텀 아이콘이 렌더링된다', () => {
      const { container } = render(
        <Accordion.Root>
          <Accordion.Item value="item1">
            <Accordion.Trigger>
              <Typography variant="title3">아이템 1</Typography>
              <Accordion.Indicator>
                <span data-testid="custom-icon">★</span>
              </Accordion.Indicator>
            </Accordion.Trigger>
            <Accordion.Content>
              <Accordion.Body>내용 1</Accordion.Body>
            </Accordion.Content>
          </Accordion.Item>
        </Accordion.Root>,
      )

      expect(container.querySelector('[data-testid="custom-icon"]')).toBeInTheDocument()
      expect(
        container.querySelector('[data-slot="accordion-indicator"] svg'),
      ).not.toBeInTheDocument()
    })

    it('Indicator는 기본으로 회전 클래스를 가진다', () => {
      const { container } = render(
        <Accordion.Root>
          <Accordion.Item value="item1">
            <Accordion.Trigger>
              <Typography variant="title3">아이템 1</Typography>
              <Accordion.Indicator />
            </Accordion.Trigger>
            <Accordion.Content>
              <Accordion.Body>내용 1</Accordion.Body>
            </Accordion.Content>
          </Accordion.Item>
        </Accordion.Root>,
      )

      const indicator = container.querySelector('[data-slot="accordion-indicator"]')
      expect(indicator?.className).toMatch(/rotate-180/)
    })

    it('Indicator의 className으로 회전 동작을 override할 수 있다 (twMerge 보장)', () => {
      const { container } = render(
        <Accordion.Root>
          <Accordion.Item value="item1">
            <Accordion.Trigger>
              <Typography variant="title3">아이템 1</Typography>
              <Accordion.Indicator className="group-data-[panel-open]:rotate-0" />
            </Accordion.Trigger>
            <Accordion.Content>
              <Accordion.Body>내용 1</Accordion.Body>
            </Accordion.Content>
          </Accordion.Item>
        </Accordion.Root>,
      )

      const indicator = container.querySelector('[data-slot="accordion-indicator"]')
      expect(indicator?.className).toMatch(/rotate-0/)
    })

    it('Body를 사용하지 않고 Content에 임의 컴포넌트를 렌더링할 수 있다', async () => {
      render(
        <Accordion.Root defaultValue={['item1']}>
          <Accordion.Item value="item1">
            <Accordion.Trigger>
              <Typography variant="title3">아이템 1</Typography>
              <Accordion.Indicator />
            </Accordion.Trigger>
            <Accordion.Content>
              <div data-testid="custom-content">커스텀 내용</div>
            </Accordion.Content>
          </Accordion.Item>
        </Accordion.Root>,
      )

      await waitFor(() => {
        expect(screen.getByTestId('custom-content')).toBeInTheDocument()
      })
    })
  })

  describe('data-slot 속성', () => {
    it('모든 슬롯에 data-slot 속성이 있다', async () => {
      render(
        <Accordion.Root defaultValue={['item1']}>
          <Accordion.Item value="item1">
            <Accordion.Trigger>
              <Typography variant="title3">아이템 1</Typography>
              <Accordion.Indicator />
            </Accordion.Trigger>
            <Accordion.Content>
              <Accordion.Body>내용 1</Accordion.Body>
            </Accordion.Content>
          </Accordion.Item>
        </Accordion.Root>,
      )

      await waitFor(() => {
        expect(document.querySelector('[data-slot="accordion-root"]')).toBeInTheDocument()
        expect(document.querySelector('[data-slot="accordion-item"]')).toBeInTheDocument()
        expect(document.querySelector('[data-slot="accordion-header"]')).toBeInTheDocument()
        expect(document.querySelector('[data-slot="accordion-trigger"]')).toBeInTheDocument()
        expect(document.querySelector('[data-slot="accordion-indicator"]')).toBeInTheDocument()
        expect(document.querySelector('[data-slot="accordion-content"]')).toBeInTheDocument()
        expect(document.querySelector('[data-slot="accordion-body"]')).toBeInTheDocument()
      })
    })
  })

  describe('상호작용', () => {
    it('트리거를 클릭하면 Content가 표시된다', async () => {
      const user = userEvent.setup()
      render(
        <Accordion.Root>
          <Accordion.Item value="item1">
            <Accordion.Trigger>
              <Typography variant="title3">아이템 1</Typography>
              <Accordion.Indicator />
            </Accordion.Trigger>
            <Accordion.Content>
              <Accordion.Body>내용 1</Accordion.Body>
            </Accordion.Content>
          </Accordion.Item>
        </Accordion.Root>,
      )

      const trigger = screen.getByRole('button', { name: /아이템 1/ })
      await user.click(trigger)

      await waitFor(() => {
        expect(screen.getByText('내용 1')).toBeInTheDocument()
      })
    })

    it('트리거를 클릭하면 aria-expanded가 true가 된다', async () => {
      const user = userEvent.setup()
      render(
        <Accordion.Root>
          <Accordion.Item value="item1">
            <Accordion.Trigger>
              <Typography variant="title3">아이템 1</Typography>
              <Accordion.Indicator />
            </Accordion.Trigger>
            <Accordion.Content>
              <Accordion.Body>내용 1</Accordion.Body>
            </Accordion.Content>
          </Accordion.Item>
        </Accordion.Root>,
      )

      const trigger = screen.getByRole('button', { name: /아이템 1/ })
      expect(trigger).toHaveAttribute('aria-expanded', 'false')

      await user.click(trigger)
      expect(trigger).toHaveAttribute('aria-expanded', 'true')
    })

    it('열린 트리거를 다시 클릭하면 aria-expanded가 false가 된다', async () => {
      const user = userEvent.setup()
      render(
        <Accordion.Root>
          <Accordion.Item value="item1">
            <Accordion.Trigger>
              <Typography variant="title3">아이템 1</Typography>
              <Accordion.Indicator />
            </Accordion.Trigger>
            <Accordion.Content>
              <Accordion.Body>내용 1</Accordion.Body>
            </Accordion.Content>
          </Accordion.Item>
        </Accordion.Root>,
      )

      const trigger = screen.getByRole('button', { name: /아이템 1/ })
      await user.click(trigger)
      expect(trigger).toHaveAttribute('aria-expanded', 'true')

      await user.click(trigger)
      expect(trigger).toHaveAttribute('aria-expanded', 'false')
    })

    it('onValueChange 콜백이 호출된다', async () => {
      const handleChange = vi.fn()
      const user = userEvent.setup()
      render(
        <Accordion.Root onValueChange={handleChange}>
          <Accordion.Item value="item1">
            <Accordion.Trigger>
              <Typography variant="title3">아이템 1</Typography>
              <Accordion.Indicator />
            </Accordion.Trigger>
            <Accordion.Content>
              <Accordion.Body>내용 1</Accordion.Body>
            </Accordion.Content>
          </Accordion.Item>
        </Accordion.Root>,
      )

      const trigger = screen.getByRole('button', { name: /아이템 1/ })
      await user.click(trigger)

      expect(handleChange).toHaveBeenCalled()
    })
  })

  describe('Props 변형', () => {
    it('multiple=true이면 여러 아이템을 동시에 열 수 있다', async () => {
      const user = userEvent.setup()
      render(
        <Accordion.Root multiple>
          <Accordion.Item value="item1">
            <Accordion.Trigger>
              <Typography variant="title3">아이템 1</Typography>
              <Accordion.Indicator />
            </Accordion.Trigger>
            <Accordion.Content>
              <Accordion.Body>내용 1</Accordion.Body>
            </Accordion.Content>
          </Accordion.Item>
          <Accordion.Item value="item2">
            <Accordion.Trigger>
              <Typography variant="title3">아이템 2</Typography>
              <Accordion.Indicator />
            </Accordion.Trigger>
            <Accordion.Content>
              <Accordion.Body>내용 2</Accordion.Body>
            </Accordion.Content>
          </Accordion.Item>
        </Accordion.Root>,
      )

      const trigger1 = screen.getByRole('button', { name: /아이템 1/ })
      const trigger2 = screen.getByRole('button', { name: /아이템 2/ })

      await user.click(trigger1)
      expect(trigger1).toHaveAttribute('aria-expanded', 'true')

      await user.click(trigger2)
      expect(trigger1).toHaveAttribute('aria-expanded', 'true')
      expect(trigger2).toHaveAttribute('aria-expanded', 'true')
    })

    it('disabled 아이템은 aria-disabled를 가진다', () => {
      render(
        <Accordion.Root>
          <Accordion.Item value="item1" disabled>
            <Accordion.Trigger>
              <Typography variant="title3">아이템 1</Typography>
              <Accordion.Indicator />
            </Accordion.Trigger>
            <Accordion.Content>
              <Accordion.Body>내용 1</Accordion.Body>
            </Accordion.Content>
          </Accordion.Item>
        </Accordion.Root>,
      )

      const trigger = screen.getByRole('button', { name: /아이템 1/ })
      expect(trigger).toHaveAttribute('aria-disabled', 'true')
    })

    it('disabled 아이템 클릭 시 Content가 열리지 않는다', async () => {
      const user = userEvent.setup()
      render(
        <Accordion.Root>
          <Accordion.Item value="item1" disabled>
            <Accordion.Trigger>
              <Typography variant="title3">아이템 1</Typography>
              <Accordion.Indicator />
            </Accordion.Trigger>
            <Accordion.Content>
              <Accordion.Body>내용 1</Accordion.Body>
            </Accordion.Content>
          </Accordion.Item>
        </Accordion.Root>,
      )

      const trigger = screen.getByRole('button', { name: /아이템 1/ })
      await user.click(trigger)
      expect(trigger).toHaveAttribute('aria-expanded', 'false')
    })

    it('className이 Root에 적용된다', () => {
      render(
        <Accordion.Root className="custom-root" data-testid="root">
          <Accordion.Item value="item1">
            <Accordion.Trigger>
              <Typography variant="title3">아이템 1</Typography>
              <Accordion.Indicator />
            </Accordion.Trigger>
            <Accordion.Content>
              <Accordion.Body>내용 1</Accordion.Body>
            </Accordion.Content>
          </Accordion.Item>
        </Accordion.Root>,
      )

      expect(screen.getByTestId('root')).toHaveClass('custom-root')
    })
  })

  describe('접근성', () => {
    it('트리거는 role="button"을 가진다', () => {
      render(
        <Accordion.Root>
          <Accordion.Item value="item1">
            <Accordion.Trigger>
              <Typography variant="title3">아이템 1</Typography>
              <Accordion.Indicator />
            </Accordion.Trigger>
            <Accordion.Content>
              <Accordion.Body>내용 1</Accordion.Body>
            </Accordion.Content>
          </Accordion.Item>
        </Accordion.Root>,
      )

      expect(screen.getByRole('button', { name: /아이템 1/ })).toBeInTheDocument()
    })

    it('열리면 Content에 data-slot="accordion-content" 속성이 있다', async () => {
      const user = userEvent.setup()
      render(
        <Accordion.Root>
          <Accordion.Item value="item1">
            <Accordion.Trigger>
              <Typography variant="title3">아이템 1</Typography>
              <Accordion.Indicator />
            </Accordion.Trigger>
            <Accordion.Content>
              <Accordion.Body>내용 1</Accordion.Body>
            </Accordion.Content>
          </Accordion.Item>
        </Accordion.Root>,
      )

      await user.click(screen.getByRole('button', { name: /아이템 1/ }))

      await waitFor(() => {
        expect(document.querySelector('[data-slot="accordion-content"]')).toBeInTheDocument()
      })
    })
  })
})
