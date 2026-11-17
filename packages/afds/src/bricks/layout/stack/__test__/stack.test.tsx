import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { VStack, HStack } from '../stack'

describe('VStack', () => {
  describe('렌더링', () => {
    it('data-slot="vstack" 속성을 가진다', () => {
      render(<VStack>content</VStack>)
      const el = screen.getByText('content').closest('[data-slot="vstack"]')
      expect(el).toBeInTheDocument()
    })

    it('children을 렌더링한다', () => {
      render(<VStack>vstack content</VStack>)
      expect(screen.getByText('vstack content')).toBeInTheDocument()
    })

    it('column 방향 flex 클래스를 가진다', () => {
      render(<VStack>content</VStack>)
      const el = screen.getByText('content').closest('[data-slot="vstack"]')
      expect(el).toHaveClass('flex', 'flex-col')
    })
  })

  describe('Props 변형', () => {
    it('className이 적용된다', () => {
      render(<VStack className="custom-vstack">content</VStack>)
      const el = screen.getByText('content').closest('[data-slot="vstack"]')
      expect(el).toHaveClass('custom-vstack')
    })

    it('w-full 클래스를 기본으로 가진다', () => {
      render(<VStack>content</VStack>)
      const el = screen.getByText('content').closest('[data-slot="vstack"]')
      expect(el).toHaveClass('w-full')
    })
  })
})

describe('HStack', () => {
  describe('렌더링', () => {
    it('data-slot="hstack" 속성을 가진다', () => {
      render(<HStack>content</HStack>)
      const el = screen.getByText('content').closest('[data-slot="hstack"]')
      expect(el).toBeInTheDocument()
    })

    it('children을 렌더링한다', () => {
      render(<HStack>hstack content</HStack>)
      expect(screen.getByText('hstack content')).toBeInTheDocument()
    })

    it('row 방향 flex 클래스를 가진다', () => {
      render(<HStack>content</HStack>)
      const el = screen.getByText('content').closest('[data-slot="hstack"]')
      expect(el).toHaveClass('flex', 'flex-row')
    })
  })

  describe('Props 변형', () => {
    it('className이 적용된다', () => {
      render(<HStack className="custom-hstack">content</HStack>)
      const el = screen.getByText('content').closest('[data-slot="hstack"]')
      expect(el).toHaveClass('custom-hstack')
    })
  })
})
