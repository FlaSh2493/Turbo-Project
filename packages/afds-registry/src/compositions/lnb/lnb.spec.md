---
domain: common
category: navigation
---

# Lnb

> 접고 펼치는 LNB(60px ↔ 220px)와 오른쪽 콘텐츠 영역을 조립하는 Compound 레이아웃.

## Rules

1. 비즈니스 로직(권한·선택 판정·워크스페이스 상태·배지 의미)은 들어 있지 않다 — 화면 조각만 제공하고, 무엇을 어떻게 보일지는 조립하는 쪽이 정한다
2. 메뉴는 한 번만 조립한다 — 각 조각이 펼침/접힘을 보고 모양을 바꾼다 (`Section` 은 펼침=아코디언, 접힘=오른쪽 드롭다운)
3. `Lnb.Section` 은 `Lnb.ScrollArea` 안에, `Lnb.SubItem` 은 `Lnb.SubGroup` 안에 둔다
4. 배지는 `Lnb.Badge`(AFDS `SquareBadge` + 원본 LNB 모양) 안에 `Lnb.Badge.Content` 로 글자를 조립한다. 원본에 없는 배지는 `SquareBadge` 를 직접 쓴다
5. 링크는 `render` 로 넘긴다 (`render={<Link to="/" />}`). 새 탭 열기·트래킹·권한·선택 판정은 소비처가 정한다
6. LNB 없이 콘텐츠만 그릴 때(예: MAKER 역할)는 `Lnb.Nav` 를 렌더하지 않는다
7. 원격 앱을 `Lnb.Content` 에 마운트하면 AFDS 스코프 밖에 둘지 소비처가 정한다. 스코프 밖 콘텐츠를 담는 드롭다운은 `container` 로 포털 위치를 바꾼다

## Examples

```tsx
<Lnb.Root>
  <Lnb.Nav>
    <Lnb.TopMenu>
      <Lnb.Dropdown icon={PanelLeftIcon} label="Menu">
        <MyMenu />
      </Lnb.Dropdown>
    </Lnb.TopMenu>

    <Lnb.MainMenu theme="gradient">
      <Lnb.Header media={<img src={logo} alt="" />} label="Acme" render={<Link to="/workspaces" />} />
      <Lnb.ScrollArea>
        <Lnb.Item icon={HouseIcon} label="Home" selected render={<Link to="/" />} />
        <Lnb.Section value="data-center" icon={DatabaseIcon} label="Data Center">
          <Lnb.SubGroup>
            <Lnb.SubItem render={<Link to="/data-center" />}>Report</Lnb.SubItem>
            <Lnb.SubItem
              badge={
                <Lnb.Badge variant="gradient">
                  <Lnb.Badge.Content>New</Lnb.Badge.Content>
                </Lnb.Badge>
              }
              render={<Link to="/upload" />}
            >
              Upload
            </Lnb.SubItem>
          </Lnb.SubGroup>
        </Lnb.Section>
      </Lnb.ScrollArea>
      <Lnb.Footer>
        <Lnb.Item
          icon={BookOpenIcon}
          label="Guide"
          render={<a href="https://help.example.com" target="_blank" rel="noreferrer" />}
        />
      </Lnb.Footer>
    </Lnb.MainMenu>
  </Lnb.Nav>

  <Lnb.Content>
    <Outlet />
  </Lnb.Content>
</Lnb.Root>
```
