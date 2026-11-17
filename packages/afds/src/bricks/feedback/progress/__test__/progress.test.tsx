import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Progress } from '../progress'

describe('Progress', () => {
  describe('렌더링', () => {
    it('progressbar 역할 요소를 렌더링한다', () => {
      render(<Progress />)
      expect(screen.getByRole('progressbar')).toBeInTheDocument()
    })

    it('기본값(value=0, max=100)으로 렌더링된다', () => {
      render(<Progress />)
      expect(screen.getByRole('progressbar')).toBeInTheDocument()
    })

    it('value와 max prop이 렌더링된다', () => {
      render(<Progress value={50} max={100} />)
      const progressbar = screen.getByRole('progressbar')
      expect(progressbar).toBeInTheDocument()
      expect(progressbar).toHaveAttribute('aria-valuenow', '50')
      expect(progressbar).toHaveAttribute('aria-valuemax', '100')
    })

    it('Track과 Indicator를 함께 렌더링한다', () => {
      render(
        <Progress value={60}>
          <Progress.Track>
            <Progress.Indicator />
          </Progress.Track>
        </Progress>,
      )
      expect(screen.getByRole('progressbar')).toBeInTheDocument()
      expect(document.querySelector('[data-slot="progress-track"]')).toBeInTheDocument()
      expect(document.querySelector('[data-slot="progress-indicator"]')).toBeInTheDocument()
    })
  })

  describe('Props 변형', () => {
    it('Progress.Value를 사용하면 퍼센트 텍스트가 표시된다', () => {
      render(
        <Progress value={50} max={100}>
          <Progress.Track>
            <Progress.Indicator />
            <Progress.Value />
          </Progress.Track>
        </Progress>,
      )
      expect(screen.getAllByText('50%').length).toBeGreaterThan(0)
    })

    it('value=75, max=100일 때 75%가 표시된다', () => {
      render(
        <Progress value={75} max={100}>
          <Progress.Value />
        </Progress>,
      )
      expect(screen.getAllByText('75%').length).toBeGreaterThan(0)
    })

    it('Progress.Value 없으면 퍼센트 텍스트가 없다', () => {
      render(
        <Progress value={50} max={100}>
          <Progress.Track>
            <Progress.Indicator />
          </Progress.Track>
        </Progress>,
      )
      expect(screen.queryByText('50%')).not.toBeInTheDocument()
    })

    it('className이 Root에 적용된다', () => {
      render(<Progress className="test-class" />)
      expect(screen.getByRole('progressbar')).toHaveClass('test-class')
    })

    it('value가 max를 초과해도 100%로 클램핑된다', () => {
      render(
        <Progress value={150} max={100}>
          <Progress.Value />
        </Progress>,
      )
      expect(screen.getAllByText('100%').length).toBeGreaterThan(0)
    })

    it('value가 음수여도 0%로 클램핑된다', () => {
      render(
        <Progress value={-10} max={100}>
          <Progress.Value />
        </Progress>,
      )
      expect(screen.getAllByText('0%').length).toBeGreaterThan(0)
    })
  })

  describe('data-slot', () => {
    it('Track에 data-slot="progress-track"이 존재한다', () => {
      render(
        <Progress value={50}>
          <Progress.Track />
        </Progress>,
      )
      expect(document.querySelector('[data-slot="progress-track"]')).toBeInTheDocument()
    })

    it('Indicator에 data-slot="progress-indicator"이 존재한다', () => {
      render(
        <Progress value={50}>
          <Progress.Track>
            <Progress.Indicator />
          </Progress.Track>
        </Progress>,
      )
      expect(document.querySelector('[data-slot="progress-indicator"]')).toBeInTheDocument()
    })

    it('Value에 data-slot="progress-value"이 존재한다', () => {
      render(
        <Progress value={50}>
          <Progress.Value />
        </Progress>,
      )
      expect(document.querySelector('[data-slot="progress-value"]')).toBeInTheDocument()
    })

    it('Label에 data-slot="progress-label"이 존재한다', () => {
      render(
        <Progress value={50}>
          <Progress.Label>진행률</Progress.Label>
        </Progress>,
      )
      expect(document.querySelector('[data-slot="progress-label"]')).toBeInTheDocument()
    })
  })

  describe('접근성', () => {
    it('role="progressbar"가 존재한다', () => {
      render(<Progress value={40} max={100} />)
      expect(screen.getByRole('progressbar')).toBeInTheDocument()
    })

    it('aria-valuenow 속성이 설정된다', () => {
      render(<Progress value={40} max={100} />)
      expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '40')
    })

    it('aria-valuemax 속성이 설정된다', () => {
      render(<Progress value={40} max={200} />)
      expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuemax', '200')
    })

    it('aria-valuemin 속성이 설정된다', () => {
      render(<Progress value={40} max={100} />)
      expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuemin', '0')
    })
  })
})
