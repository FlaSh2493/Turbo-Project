import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { PageLayout, type PageLayoutContentsWidth } from '..'

const renderLayout = (width?: PageLayoutContentsWidth) =>
  render(
    <PageLayout>
      <PageLayout.Header>
        <PageLayout.Header.Title>제목</PageLayout.Header.Title>
      </PageLayout.Header>
      <PageLayout.Contents cols={12} width={width}>
        <PageLayout.Contents.Section colSpan={12}>내용</PageLayout.Contents.Section>
      </PageLayout.Contents>
    </PageLayout>,
  )

const contentsOf = (container: HTMLElement) =>
  container.querySelector('[data-slot="page-layout-contents"]') as HTMLElement

describe('PageLayout 콘텐츠 폭', () => {
  it('루트 최소 폭은 964px(241)이고 예전 1320px 이 아니다', () => {
    const { container } = renderLayout()
    const root = container.querySelector('[data-slot="page-layout"]') as HTMLElement
    expect(root.className).toContain('min-w-241')
    expect(root.className).not.toContain('1320')
  })

  it('width 미지정은 fluid 와 같고 최대폭·중앙 정렬 클래스가 없다', () => {
    const unset = contentsOf(renderLayout().container)
    const fluid = contentsOf(renderLayout('fluid').container)
    expect(unset.className).toBe(fluid.className)
    expect(unset.className).not.toMatch(/max-w-|mx-auto|(^|\s)w-/)
  })

  it('bounded 는 최대 1340px(345 − 패딩 포함) 가운데 정렬', () => {
    const { className } = contentsOf(renderLayout('bounded').container)
    expect(className).toContain('max-w-345')
    expect(className).toContain('mx-auto')
    expect(className).toContain('w-full')
  })

  it('narrow 는 660px(175 − 패딩 포함) 고정 가운데 정렬', () => {
    const { className } = contentsOf(renderLayout('narrow').container)
    expect(className).toContain('w-175')
    expect(className).toContain('mx-auto')
    expect(className).not.toContain('max-w-')
  })

  it('헤더는 폭 유형과 무관하게 폭을 제한하지 않는다', () => {
    for (const width of ['fluid', 'bounded', 'narrow'] as const) {
      const header = renderLayout(width).container.querySelector(
        '[data-slot="page-layout-header"]',
      ) as HTMLElement
      expect(header.className).not.toMatch(/max-w-|mx-auto/)
    }
  })

  it('알 수 없는 width 값은 fluid 로 폴백한다', () => {
    const { container } = renderLayout('wide' as PageLayoutContentsWidth)
    expect(contentsOf(container).className).not.toMatch(/max-w-|mx-auto/)
  })
})
