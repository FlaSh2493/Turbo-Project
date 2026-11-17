import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Tab } from '../tab'

describe('Tab', () => {
  describe('렌더링', () => {
    it('tablist를 렌더링한다', () => {
      render(
        <Tab.Root defaultValue="tab1">
          <Tab.List>
            <Tab.Tab value="tab1">탭 1</Tab.Tab>
            <Tab.Tab value="tab2">탭 2</Tab.Tab>
          </Tab.List>
          <Tab.Panel value="tab1">콘텐츠 1</Tab.Panel>
          <Tab.Panel value="tab2">콘텐츠 2</Tab.Panel>
        </Tab.Root>,
      )

      expect(screen.getByRole('tablist')).toBeInTheDocument()
    })

    it('탭 버튼들을 렌더링한다', () => {
      render(
        <Tab.Root defaultValue="tab1">
          <Tab.List>
            <Tab.Tab value="tab1">탭 1</Tab.Tab>
            <Tab.Tab value="tab2">탭 2</Tab.Tab>
          </Tab.List>
          <Tab.Panel value="tab1">콘텐츠 1</Tab.Panel>
          <Tab.Panel value="tab2">콘텐츠 2</Tab.Panel>
        </Tab.Root>,
      )

      expect(screen.getByRole('tab', { name: '탭 1' })).toBeInTheDocument()
      expect(screen.getByRole('tab', { name: '탭 2' })).toBeInTheDocument()
    })

    it('활성 탭의 콘텐츠를 표시한다', () => {
      render(
        <Tab.Root defaultValue="tab1">
          <Tab.List>
            <Tab.Tab value="tab1">탭 1</Tab.Tab>
            <Tab.Tab value="tab2">탭 2</Tab.Tab>
          </Tab.List>
          <Tab.Panel value="tab1">콘텐츠 1</Tab.Panel>
          <Tab.Panel value="tab2">콘텐츠 2</Tab.Panel>
        </Tab.Root>,
      )

      expect(screen.getByText('콘텐츠 1')).toBeVisible()
    })
  })

  describe('상호작용', () => {
    it('탭 클릭 시 해당 콘텐츠로 전환한다', async () => {
      const user = userEvent.setup()
      render(
        <Tab.Root defaultValue="tab1">
          <Tab.List>
            <Tab.Tab value="tab1">탭 1</Tab.Tab>
            <Tab.Tab value="tab2">탭 2</Tab.Tab>
          </Tab.List>
          <Tab.Panel value="tab1">콘텐츠 1</Tab.Panel>
          <Tab.Panel value="tab2">콘텐츠 2</Tab.Panel>
        </Tab.Root>,
      )

      await user.click(screen.getByRole('tab', { name: '탭 2' }))

      expect(screen.getByText('콘텐츠 2')).toBeVisible()
    })

    it('탭 클릭 시 onValueChange가 호출된다', async () => {
      const user = userEvent.setup()
      const onValueChange = vi.fn()
      render(
        <Tab.Root defaultValue="tab1" onValueChange={onValueChange}>
          <Tab.List>
            <Tab.Tab value="tab1">탭 1</Tab.Tab>
            <Tab.Tab value="tab2">탭 2</Tab.Tab>
          </Tab.List>
          <Tab.Panel value="tab1">콘텐츠 1</Tab.Panel>
          <Tab.Panel value="tab2">콘텐츠 2</Tab.Panel>
        </Tab.Root>,
      )

      await user.click(screen.getByRole('tab', { name: '탭 2' }))

      expect(onValueChange).toHaveBeenCalledWith('tab2', expect.anything())
    })
  })

  describe('Props 변형', () => {
    it('defaultValue로 초기 활성 탭을 설정한다', () => {
      render(
        <Tab.Root defaultValue="tab2">
          <Tab.List>
            <Tab.Tab value="tab1">탭 1</Tab.Tab>
            <Tab.Tab value="tab2">탭 2</Tab.Tab>
          </Tab.List>
          <Tab.Panel value="tab1">콘텐츠 1</Tab.Panel>
          <Tab.Panel value="tab2">콘텐츠 2</Tab.Panel>
        </Tab.Root>,
      )

      expect(screen.getByRole('tab', { name: '탭 2' })).toHaveAttribute('aria-selected', 'true')
    })

    it('controlled value로 활성 탭을 제어한다', () => {
      render(
        <Tab.Root value="tab2">
          <Tab.List>
            <Tab.Tab value="tab1">탭 1</Tab.Tab>
            <Tab.Tab value="tab2">탭 2</Tab.Tab>
          </Tab.List>
          <Tab.Panel value="tab1">콘텐츠 1</Tab.Panel>
          <Tab.Panel value="tab2">콘텐츠 2</Tab.Panel>
        </Tab.Root>,
      )

      expect(screen.getByRole('tab', { name: '탭 2' })).toHaveAttribute('aria-selected', 'true')
      expect(screen.getByRole('tab', { name: '탭 1' })).toHaveAttribute('aria-selected', 'false')
    })

    it('data-slot 속성이 올바르게 부여된다', () => {
      render(
        <Tab.Root defaultValue="tab1">
          <Tab.List>
            <Tab.Tab value="tab1">탭 1</Tab.Tab>
          </Tab.List>
          <Tab.Panel value="tab1">콘텐츠 1</Tab.Panel>
        </Tab.Root>,
      )

      expect(screen.getByRole('tablist').closest('[data-slot="tab-root"]')).toBeInTheDocument()
      expect(screen.getByRole('tablist')).toHaveAttribute('data-slot', 'tab-list')
      expect(screen.getByRole('tab', { name: '탭 1' })).toHaveAttribute('data-slot', 'tab-trigger')
    })
  })

  describe('접근성', () => {
    it('tablist role을 가진다', () => {
      render(
        <Tab.Root defaultValue="tab1">
          <Tab.List>
            <Tab.Tab value="tab1">탭 1</Tab.Tab>
          </Tab.List>
          <Tab.Panel value="tab1">콘텐츠 1</Tab.Panel>
        </Tab.Root>,
      )

      expect(screen.getByRole('tablist')).toBeInTheDocument()
    })

    it('각 트리거가 tab role을 가진다', () => {
      render(
        <Tab.Root defaultValue="tab1">
          <Tab.List>
            <Tab.Tab value="tab1">탭 1</Tab.Tab>
            <Tab.Tab value="tab2">탭 2</Tab.Tab>
          </Tab.List>
          <Tab.Panel value="tab1">콘텐츠 1</Tab.Panel>
          <Tab.Panel value="tab2">콘텐츠 2</Tab.Panel>
        </Tab.Root>,
      )

      const tabs = screen.getAllByRole('tab')
      expect(tabs).toHaveLength(2)
    })

    it('콘텐츠 패널이 tabpanel role을 가진다', () => {
      render(
        <Tab.Root defaultValue="tab1">
          <Tab.List>
            <Tab.Tab value="tab1">탭 1</Tab.Tab>
          </Tab.List>
          <Tab.Panel value="tab1">콘텐츠 1</Tab.Panel>
        </Tab.Root>,
      )

      expect(screen.getByRole('tabpanel')).toBeInTheDocument()
    })

    it('활성 탭에 aria-selected="true"가 설정된다', () => {
      render(
        <Tab.Root defaultValue="tab1">
          <Tab.List>
            <Tab.Tab value="tab1">탭 1</Tab.Tab>
            <Tab.Tab value="tab2">탭 2</Tab.Tab>
          </Tab.List>
          <Tab.Panel value="tab1">콘텐츠 1</Tab.Panel>
          <Tab.Panel value="tab2">콘텐츠 2</Tab.Panel>
        </Tab.Root>,
      )

      expect(screen.getByRole('tab', { name: '탭 1' })).toHaveAttribute('aria-selected', 'true')
      expect(screen.getByRole('tab', { name: '탭 2' })).toHaveAttribute('aria-selected', 'false')
    })
  })
})
