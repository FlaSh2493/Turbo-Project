import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DatabaseIcon, PanelLeftIcon, HouseIcon } from 'lucide-react'
import { Lnb, type LnbRootProps } from '../lnb'

interface ShellOptions extends Partial<LnbRootProps> {
  disabled?: boolean
  onSubItemClick?: () => void
  workspaceName?: string
  showNav?: boolean
}

const renderShell = ({
  disabled,
  onSubItemClick,
  workspaceName,
  showNav = true,
  ...rootProps
}: ShellOptions = {}) =>
  render(
    <Lnb.Root {...rootProps}>
      {showNav && (
        <Lnb.Nav>
          <Lnb.TopMenu>
            <Lnb.Dropdown icon={PanelLeftIcon} label="Menu">
              <Lnb.SubGroup>
                <Lnb.SubItem render={<a href="/logout" />}>Logout</Lnb.SubItem>
              </Lnb.SubGroup>
            </Lnb.Dropdown>
          </Lnb.TopMenu>
          <Lnb.MainMenu>
            <Lnb.Header
              media={<img alt="" src="/logo.png" />}
              label={workspaceName}
              render={<a href="/workspaces" />}
            />
            <Lnb.ScrollArea>
              <Lnb.Item
                icon={HouseIcon}
                label="Home"
                selected
                disabled={disabled}
                render={<a href="/home" />}
              />
              <Lnb.Section
                value="data-center"
                icon={DatabaseIcon}
                label="Data Center"
                disabled={disabled}
              >
                <Lnb.SubGroup label="Reports">
                  <Lnb.SubItem render={<a href="/report" />} onClick={onSubItemClick}>
                    Report Rules
                  </Lnb.SubItem>
                  <Lnb.SubItem
                    badge={
                      <Lnb.Badge variant="gradient">
                        <Lnb.Badge.Content>New</Lnb.Badge.Content>
                      </Lnb.Badge>
                    }
                    render={<a href="/upload" />}
                  >
                    Data Upload
                  </Lnb.SubItem>
                </Lnb.SubGroup>
              </Lnb.Section>
              <Lnb.Section value="creative" icon={DatabaseIcon} label="Creative">
                <Lnb.SubGroup>
                  <Lnb.SubItem render={<a href="/creative" />}>Creative Search</Lnb.SubItem>
                </Lnb.SubGroup>
              </Lnb.Section>
            </Lnb.ScrollArea>
          </Lnb.MainMenu>
        </Lnb.Nav>
      )}
      <Lnb.Content>
        <p>page content</p>
      </Lnb.Content>
    </Lnb.Root>,
  )

const nav = () => document.querySelector('[data-slot="lnb-nav"]') as HTMLElement
const panelMode = () => document.querySelector('[data-slot="lnb-panel"]')?.getAttribute('data-mode')
const dropdown = () => document.querySelector('[data-slot="lnb-dropdown"]')

describe('Lnb', () => {
  describe('조립', () => {
    it('LNB 와 콘텐츠 영역을 그린다', () => {
      renderShell()
      expect(screen.getByRole('navigation')).toBeInTheDocument()
      expect(screen.getByRole('main')).toHaveTextContent('page content')
    })

    it('Nav 를 빼면 콘텐츠만 그린다', () => {
      renderShell({ showNav: false })
      expect(screen.queryByRole('navigation')).not.toBeInTheDocument()
      expect(screen.getByRole('main')).toHaveTextContent('page content')
    })

    it('Root 밖에서 쓰면 에러를 던진다', () => {
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
      expect(() => render(<Lnb.Item icon={HouseIcon} label="Home" />)).toThrow(
        'Lnb components must be used within Lnb.Root',
      )
      spy.mockRestore()
    })
  })

  describe('render', () => {
    it('render 로 넘긴 element 를 항목 루트로 쓰고 선택 시 aria-current 를 붙인다', () => {
      renderShell()
      const home = screen.getByText('Home').closest('a')
      expect(home).toHaveAttribute('href', '/home')
      expect(home).toHaveAttribute('aria-current', 'page')
    })

    it('비활성이면 링크 대신 span 으로 그린다', () => {
      renderShell({ disabled: true })
      const home = screen.getByText('Home').closest('[data-slot="lnb-item"]')
      expect(home?.tagName).toBe('SPAN')
      expect(home).toHaveAttribute('aria-disabled', 'true')
    })
  })

  describe('접기/펼치기', () => {
    it('기본은 접힘이다', () => {
      renderShell()
      expect(nav()).toHaveAttribute('data-state', 'closed')
      expect(panelMode()).toBe('minimized')
    })

    it('토글로 펼치고 onExpandedChange 를 부른다', async () => {
      const user = userEvent.setup()
      const onExpandedChange = vi.fn()
      renderShell({ onExpandedChange })

      await user.click(screen.getByRole('button', { name: 'Expand navigation' }))

      expect(nav()).toHaveAttribute('data-state', 'open')
      expect(panelMode()).toBe('expanded')
      expect(onExpandedChange).toHaveBeenCalledWith(true)
    })

    it('접을 때는 애니메이션 동안 펼친 모양을 유지하다가 접힌 모양으로 바뀐다', async () => {
      const user = userEvent.setup()
      renderShell({ defaultExpanded: true })

      await user.click(screen.getByRole('button', { name: 'Collapse navigation' }))

      expect(nav()).toHaveAttribute('data-state', 'closed')
      expect(panelMode()).toBe('expanded')
      await waitFor(() => expect(panelMode()).toBe('minimized'))
    })

    it('expanded 를 주면 제어 모드로 동작한다', async () => {
      const user = userEvent.setup()
      const onExpandedChange = vi.fn()
      renderShell({ expanded: false, onExpandedChange })

      await user.click(screen.getByRole('button', { name: 'Expand navigation' }))

      expect(onExpandedChange).toHaveBeenCalledWith(true)
      expect(nav()).toHaveAttribute('data-state', 'closed')
    })
  })

  describe('펼침 — Section 은 아코디언', () => {
    it('섹션을 열면 그룹 라벨·하위 항목·배지가 보인다', async () => {
      const user = userEvent.setup()
      renderShell({ defaultExpanded: true })

      await user.click(screen.getByRole('button', { name: /Data Center/ }))

      expect(screen.getByText('Report Rules')).toBeInTheDocument()
      expect(screen.getByText('Reports')).toBeInTheDocument()
      expect(screen.getByText('New')).toBeInTheDocument()
    })

    it('한 번에 하나의 섹션만 열린다', async () => {
      const user = userEvent.setup()
      renderShell({ defaultExpanded: true })
      const dataCenter = screen.getByRole('button', { name: /Data Center/ })
      const creative = screen.getByRole('button', { name: /Creative/ })

      await user.click(dataCenter)
      await user.click(creative)

      expect(creative).toHaveAttribute('aria-expanded', 'true')
      expect(dataCenter).toHaveAttribute('aria-expanded', 'false')
    })

    it('하위 항목 클릭 시 onClick 을 부른다', async () => {
      const user = userEvent.setup()
      const onSubItemClick = vi.fn()
      renderShell({ defaultExpanded: true, onSubItemClick })

      await user.click(screen.getByRole('button', { name: /Data Center/ }))
      await user.click(screen.getByText('Report Rules'))

      expect(onSubItemClick).toHaveBeenCalledTimes(1)
    })
  })

  describe('접힘 — Section 은 드롭다운', () => {
    it('섹션을 누르면 드롭다운이 열리고, 하위 항목을 고르면 닫힌다', async () => {
      const user = userEvent.setup()
      renderShell()

      await user.click(screen.getByRole('button', { name: /Data Center/ }))
      const item = await screen.findByText('Data Upload')
      expect(item.closest('[data-slot="lnb-dropdown"]')).toBeInTheDocument()

      await user.click(item)

      await waitFor(() => expect(dropdown()).not.toBeInTheDocument())
    })

    it('비활성 섹션은 드롭다운이 열리지 않는다', async () => {
      const user = userEvent.setup()
      renderShell({ disabled: true })

      await user.click(screen.getByRole('button', { name: /Data Center/ }))

      expect(dropdown()).not.toBeInTheDocument()
    })
  })

  describe('Dropdown', () => {
    it('상단 메뉴 드롭다운 안의 SubItem 을 고르면 닫힌다', async () => {
      const user = userEvent.setup()
      renderShell()
      await user.click(screen.getByRole('button', { name: 'Menu' }))
      await user.click(await screen.findByText('Logout'))

      await waitFor(() => expect(dropdown()).not.toBeInTheDocument())
    })
  })

  describe('Badge', () => {
    it('SquareBadge 위에 조립한 글자를 그린다', async () => {
      const user = userEvent.setup()
      renderShell({ defaultExpanded: true })

      await user.click(screen.getByRole('button', { name: /Data Center/ }))

      const badge = screen.getByText('New').closest('[data-slot="lnb-badge"]')
      expect(badge).toHaveAttribute('data-color', 'gradient-ai')
      expect(screen.getByText('New')).toHaveAttribute('data-slot', 'lnb-badge-content')
    })
  })

  describe('Header', () => {
    it('펼침에서 라벨을 보인다', () => {
      renderShell({ defaultExpanded: true, workspaceName: 'Acme' })
      expect(screen.getByText('Acme')).toBeInTheDocument()
    })

    it('접힘에서는 라벨을 숨긴다', () => {
      renderShell({ workspaceName: 'Acme' })
      expect(screen.queryByText('Acme')).not.toBeInTheDocument()
    })

    it('render 를 주면 머리 영역이 링크가 된다', () => {
      renderShell({ defaultExpanded: true, workspaceName: 'Acme' })
      expect(screen.getByText('Acme').closest('a')).toHaveAttribute('href', '/workspaces')
    })
  })
})
