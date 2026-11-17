'use client'

import { useState } from 'react'
import type { ReactNode } from 'react'
import { AfdsPortalContext } from '../hooks/use-afds-portal-container'

export interface AfdsScopeProps {
  children: ReactNode
  /** `.afds` 루트에 덧붙일 추가 클래스. */
  className?: string
}

/**
 * children 을 `.afds` 루트로 감싸고, 내부에 포털 타깃(`[data-afds-portal]`)을 심어
 * 하위 오버레이(Drawer/Modal/Popover/Tooltip)가 그 영역 안으로 포털되게 한다.
 *
 * `@turbo-project/afds/styles/scoped` 와 함께 쓰면 preflight 가 이 영역 안에서만 적용되어
 * 다른 디자인시스템(Ant Design·MUI 등)과 충돌 없이 공존할 수 있다.
 */
export const AfdsScope = ({ children, className }: AfdsScopeProps) => {
  // 포털 타깃을 element state 로 보관한다. callback ref 로 부착되면 state 가 갱신되어
  // 컨텍스트 소비자(오버레이)가 리렌더 → base-ui 가 container 변경을 감지해 포털을 스코프로 옮긴다.
  const [portalNode, setPortalNode] = useState<HTMLDivElement | null>(null)

  return (
    <AfdsPortalContext.Provider value={portalNode}>
      <div className={className ? `afds ${className}` : 'afds'} data-testid="afds-scope">
        {children}
        <div ref={setPortalNode} data-afds-portal="" />
      </div>
    </AfdsPortalContext.Provider>
  )
}

AfdsScope.displayName = 'AfdsScope'
