import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Flex } from '../flex'

describe('Flex', () => {
  describe('렌더링', () => {
    it('div 요소로 렌더링된다', () => {
      render(<Flex>content</Flex>)
      const el = screen.getByText('content')
      expect(el.tagName).toBe('DIV')
    })

    it('data-slot="flex" 속성을 가진다', () => {
      render(<Flex>content</Flex>)
      expect(screen.getByText('content')).toHaveAttribute('data-slot', 'flex')
    })

    it('children을 렌더링한다', () => {
      render(<Flex>flex content</Flex>)
      expect(screen.getByText('flex content')).toBeInTheDocument()
    })

    it('기본적으로 flex 클래스를 가진다', () => {
      render(<Flex>content</Flex>)
      expect(screen.getByText('content')).toHaveClass('flex')
    })
  })

  describe('Props 변형', () => {
    it('direction="column"이면 flex-col 클래스를 가진다', () => {
      render(<Flex direction="column">content</Flex>)
      expect(screen.getByText('content')).toHaveClass('flex-col')
    })

    it('direction="row-reverse"이면 flex-row-reverse 클래스를 가진다', () => {
      render(<Flex direction="row-reverse">content</Flex>)
      expect(screen.getByText('content')).toHaveClass('flex-row-reverse')
    })

    it('justify="center"이면 justify-center 클래스를 가진다', () => {
      render(<Flex justify="center">content</Flex>)
      expect(screen.getByText('content')).toHaveClass('justify-center')
    })

    it('align="center"이면 items-center 클래스를 가진다', () => {
      render(<Flex align="center">content</Flex>)
      expect(screen.getByText('content')).toHaveClass('items-center')
    })

    it('wrap="wrap"이면 flex-wrap 클래스를 가진다', () => {
      render(<Flex wrap="wrap">content</Flex>)
      expect(screen.getByText('content')).toHaveClass('flex-wrap')
    })

    it('className이 적용된다', () => {
      render(<Flex className="custom-flex">content</Flex>)
      expect(screen.getByText('content')).toHaveClass('custom-flex')
    })
  })

  describe('접근성', () => {
    it('HTML 속성이 전달된다', () => {
      render(<Flex role="list">content</Flex>)
      expect(screen.getByRole('list')).toBeInTheDocument()
    })
  })
})
