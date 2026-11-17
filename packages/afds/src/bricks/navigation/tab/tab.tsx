'use client'

import * as React from 'react'
import { Tabs } from '@base-ui/react/tabs'
import { tabListVariants, tabTriggerVariants } from './tab.style'
import { cn } from '../../../lib/utils'

// Root

/**
 * Tab Root - 탭 그룹의 루트 컨테이너
 */
export const TabRoot = React.forwardRef<
  React.ComponentRef<typeof Tabs.Root>,
  React.ComponentPropsWithoutRef<typeof Tabs.Root>
>(({ className, ...props }, ref) => (
  <Tabs.Root ref={ref} data-slot="tab-root" className={cn(className)} {...props} />
))
TabRoot.displayName = 'TabRoot'

// List

/**
 * Tab List - 탭 트리거 목록을 감싸는 컨테이너
 */
export const TabList = React.forwardRef<
  React.ComponentRef<typeof Tabs.List>,
  React.ComponentPropsWithoutRef<typeof Tabs.List>
>(({ className, ...props }, ref) => (
  <Tabs.List
    ref={ref}
    data-slot="tab-list"
    className={cn(tabListVariants(), className)}
    {...props}
  />
))
TabList.displayName = 'TabList'

// Tab

/**
 * Tab Tab - 개별 탭 트리거 버튼
 */
export const TabTab = React.forwardRef<
  React.ComponentRef<typeof Tabs.Tab>,
  React.ComponentPropsWithoutRef<typeof Tabs.Tab>
>(({ className, ...props }, ref) => (
  <Tabs.Tab
    ref={ref}
    data-slot="tab-trigger"
    className={cn(tabTriggerVariants(), className)}
    {...props}
    render={(htmlProps, state) => (
      <button type="button" {...htmlProps} data-disabled={state.disabled || undefined} />
    )}
  />
))
TabTab.displayName = 'TabTab'

// Panel

/**
 * Tab Panel - 탭 콘텐츠 영역
 */
export const TabPanel = React.forwardRef<
  React.ComponentRef<typeof Tabs.Panel>,
  React.ComponentPropsWithoutRef<typeof Tabs.Panel>
>(({ className, ...props }, ref) => (
  <Tabs.Panel
    ref={ref}
    data-slot="tab-panel"
    className={cn(className)}
    {...props}
    render={htmlProps => <div {...htmlProps} />}
  />
))
TabPanel.displayName = 'TabPanel'

export const Tab = {
  Root: TabRoot,
  List: TabList,
  Tab: TabTab,
  Panel: TabPanel,
}
