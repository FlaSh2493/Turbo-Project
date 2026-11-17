import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Avatar } from '../avatar'

// @base-ui/react의 Avatar.Image는 이미지 로드 성공 시에만 DOM에 렌더링된다.
// jsdom 환경에서는 이미지 로드가 일어나지 않으므로 img 엘리먼트가 나타나지 않는다.
// 대신 data-slot="avatar" 루트 엘리먼트와 fallback 동작을 테스트한다.

describe('Avatar', () => {
  describe('합성', () => {
    it('Root는 data-slot="avatar" 엘리먼트를 렌더한다', () => {
      const { container } = render(
        <Avatar.Root>
          <Avatar.Image src="https://example.com/avatar.png" alt="아바타" />
          <Avatar.Fallback>FB</Avatar.Fallback>
        </Avatar.Root>,
      )
      expect(container.querySelector('[data-slot="avatar"]')).toBeInTheDocument()
    })

    it('Image 없이 Fallback만 렌더할 수 있다', () => {
      const { container } = render(
        <Avatar.Root>
          <Avatar.Fallback>FB</Avatar.Fallback>
        </Avatar.Root>,
      )
      expect(container.querySelector('[data-slot="avatar"]')).toBeInTheDocument()
      expect(container.querySelector('[data-slot="avatar-fallback"]')).toBeInTheDocument()
    })

    it('Fallback의 children을 표시한다', () => {
      render(
        <Avatar.Root>
          <Avatar.Fallback>FB</Avatar.Fallback>
        </Avatar.Root>,
      )
      expect(screen.getByText('FB')).toBeInTheDocument()
    })
  })

  describe('Props 변형', () => {
    it('Root에 전달된 className이 적용된다', () => {
      const { container } = render(
        <Avatar.Root className="custom-class">
          <Avatar.Fallback>FB</Avatar.Fallback>
        </Avatar.Root>,
      )
      const root = container.querySelector('[data-slot="avatar"]')
      expect(root).toHaveClass('custom-class')
    })

    it('Fallback에 ReactNode를 자유롭게 전달할 수 있다', () => {
      render(
        <Avatar.Root>
          <Avatar.Fallback>
            <img src="fallback.png" alt="대체 이미지" />
          </Avatar.Fallback>
        </Avatar.Root>,
      )
      expect(screen.getByAltText('대체 이미지')).toBeInTheDocument()
    })
  })

  describe('접근성', () => {
    it('Fallback에 alt 텍스트를 가진 img를 두면 접근 가능하다', () => {
      render(
        <Avatar.Root>
          <Avatar.Fallback>
            <img src="fallback.png" alt="프로필 이미지" />
          </Avatar.Fallback>
        </Avatar.Root>,
      )
      expect(screen.getByAltText('프로필 이미지')).toBeInTheDocument()
    })
  })
})
