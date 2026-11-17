import {
  cloneElement,
  createContext,
  createElement,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
  type RefObject,
} from 'react'
import { createPortal } from 'react-dom'

/**
 * base-ui Popover 의 테스트용 대역 — 배치는 계산하지 않고 열림·닫힘 사유(`reason`)·포털·중첩 바깥 클릭·Esc 만 흉내 낸다.
 * 테스트가 이 의미(mousedown 바깥 클릭, 가장 안쪽 팝업만 Esc 로 닫힘, `container === null` 이면 미렌더, 정렬 prop 기록)에 묶여 있어
 * 실물 base-ui 대신 쓴다. 실제 배치는 스토리 play(실브라우저)가 검증한다
 */
type AnyProps = Record<string, unknown> & { children?: ReactNode }

const DOM_PROPS = [
  'className',
  'onClick',
  'onKeyDown',
  'onMouseDown',
  'onBlur',
  'role',
  'type',
  'id',
  'tabIndex',
  'disabled',
]

function pickDom(props: AnyProps): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const key of Object.keys(props)) {
    if (DOM_PROPS.includes(key) || key.startsWith('aria-') || key.startsWith('data-')) {
      out[key] = props[key]
    }
  }
  return out
}

// Popover — Root/Trigger/Content/Close/Anchor/Arrow. Root 가 open 상태를 들고
// Trigger 클릭이 토글, Content 는 open 일 때만 렌더(실제 base-ui 도 unmount).
// controlled(`open`+`onOpenChange`) / uncontrolled(`defaultOpen`) 둘 다 지원.
// `container` prop(포털 대상)은 목에서 의미가 없으므로 무시한다(pickDom 밖 prop).
type PopoverOpenReason = 'trigger-press' | 'outside-press' | 'escape-key'
type PopoverContextValue = {
  contentRef: RefObject<HTMLDivElement | null>
  /** 자신과 중첩된 하위 팝업의 content 를 등록한다. 하위 팝업 안의 클릭은 바깥 클릭이 아니다 */
  register: (ref: RefObject<HTMLDivElement | null>) => () => void
  open: boolean
  setOpen: (next: boolean, reason?: PopoverOpenReason, event?: Event) => void
}
const PopoverContext = createContext<PopoverContextValue | null>(null)

type PopoverRootProps = AnyProps & {
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean, details?: { reason: string; event?: Event }) => void
}

const PopoverRoot = ({ open, defaultOpen, onOpenChange, children }: PopoverRootProps) => {
  const [internal, setInternal] = useState(defaultOpen ?? false)
  const contentRef = useRef<HTMLDivElement | null>(null)
  const parent = useContext(PopoverContext)
  const nestedRefs = useRef(new Set<RefObject<HTMLDivElement | null>>())
  const register = useCallback(
    (ref: RefObject<HTMLDivElement | null>) => {
      nestedRefs.current.add(ref)
      const unregisterParent = parent?.register(ref)
      return () => {
        nestedRefs.current.delete(ref)
        unregisterParent?.()
      }
    },
    [parent],
  )
  useEffect(() => register(contentRef), [register])
  const isOpen = open ?? internal
  const setOpen = useCallback(
    (next: boolean, reason?: PopoverOpenReason, event?: Event) => {
      if (open === undefined) setInternal(next)
      onOpenChange?.(next, reason ? { reason, event } : undefined)
    },
    [onOpenChange, open],
  )

  useEffect(() => {
    if (!isOpen) return undefined

    const closeOutside = (event: MouseEvent) => {
      const target = event.target
      // 실제 base-ui 와 같다: 하위 팝업 안을 누르는 것은 부모의 바깥 클릭이 아니지만(registry),
      // 부모 팝업 안을 누르는 것은 하위 팝업의 바깥 클릭이다. 그 경우를 무시할지는 소비 컴포넌트의 정책이다
      if (
        target instanceof Node &&
        [...nestedRefs.current].some(ref => ref.current?.contains(target))
      ) {
        return
      }
      setOpen(false, 'outside-press', event)
    }

    const closeOnEscape = (event: KeyboardEvent) => {
      // 실제 base-ui 는 Esc 에 가장 안쪽(열린 하위가 없는) 팝업 하나만 닫는다
      const childOpen = [...nestedRefs.current].some(ref => ref !== contentRef && ref.current)
      if (event.key === 'Escape' && !childOpen) {
        setOpen(false, 'escape-key', event)
      }
    }

    document.addEventListener('mousedown', closeOutside)
    document.addEventListener('keydown', closeOnEscape)

    return () => {
      document.removeEventListener('mousedown', closeOutside)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [isOpen, setOpen])

  return createElement(
    PopoverContext.Provider,
    { value: { contentRef, register, open: isOpen, setOpen } },
    children,
  )
}
PopoverRoot.displayName = 'AfdsMock(Popover.Root)'

// 실제 base-ui 는 `render` prop 이 오면 그 엘리먼트를 clone 해 onClick/ref 등을 병합한다
// (render 엘리먼트의 onClick 이 먼저 실행되고, 이어서 토글). children 만 오면 <button> 기본 렌더.
type PopoverTriggerProps = AnyProps & {
  render?: ReactElement | ((props: AnyProps) => ReactElement)
}

const PopoverTrigger = ({ children, render, ...props }: PopoverTriggerProps) => {
  const context = useContext(PopoverContext)
  const toggleOpen = () => context?.setOpen(!context.open, 'trigger-press')
  // 실제 base-ui 는 render 함수에 버튼 의미(tab 정지·aria-haspopup 등)가 병합된 props 를 넘긴다
  if (typeof render === 'function') {
    return render({
      'data-slot': 'popover-trigger',
      role: 'button',
      tabIndex: 0,
      'aria-haspopup': 'dialog',
      'aria-expanded': context?.open ?? false,
      onClick: toggleOpen,
      ...pickDom(props),
    })
  }
  if (render) {
    const existingOnClick = (render.props as { onClick?: (e: unknown) => void }).onClick
    return cloneElement(render, {
      'data-slot': 'popover-trigger',
      onClick: (e: unknown) => {
        existingOnClick?.(e)
        toggleOpen()
      },
      ...pickDom(props),
    } as AnyProps)
  }
  return createElement(
    'button',
    {
      type: 'button',
      'data-slot': 'popover-trigger',
      onClick: toggleOpen,
      ...pickDom(props),
    },
    children,
  )
}
PopoverTrigger.displayName = 'AfdsMock(Popover.Trigger)'

type PopoverContentProps = AnyProps & {
  container?: unknown
  initialFocus?: boolean
  align?: string
  alignOffset?: number
  side?: string
  sideOffset?: number
}

// 실제 AFDS 는 container 가 명시 null 이면 포털 자체를 그리지 않는다(body 로 보내지 않는다)
const PopoverContent = ({
  children,
  container,
  initialFocus,
  align,
  alignOffset,
  side,
  sideOffset,
  ...props
}: PopoverContentProps) => {
  const context = useContext(PopoverContext)
  const open = !!context?.open && container !== null
  // 실제 base-ui 는 열릴 때 팝업 안 첫 포커스 가능 요소로 포커스를 옮긴다(`initialFocus={false}` 면 옮기지 않는다)
  useEffect(() => {
    if (!open || initialFocus === false) return
    context?.contentRef.current
      ?.querySelector<HTMLElement>('input, button, [tabindex]:not([tabindex="-1"])')
      ?.focus()
  }, [open, initialFocus, context])
  if (!open) return null
  const popup = createElement(
    'div',
    {
      'data-slot': 'popover-content',
      ref: context.contentRef,
      role: 'dialog',
      // 목은 배치를 계산하지 않는다. 소비 컴포넌트가 AFDS 에 정렬 props 를 넘기는지 단정할 수 있게 값만 기록한다
      'data-align': align,
      'data-align-offset': alignOffset,
      'data-side': side,
      'data-side-offset': sideOffset,
      ...pickDom(props),
    },
    children,
  )
  // WHY: 실제 AFDS 는 팝업을 포털로 그린다. 인라인으로 두면 DOM 으로는 바깥인 팝업 클릭이 React 트리로는
  // 조상까지 전파되는 문제(APT-15536 M-3)를 테스트가 재현하지 못한다
  return container instanceof HTMLElement
    ? createPortal(popup, container)
    : createPortal(popup, document.body)
}
PopoverContent.displayName = 'AfdsMock(Popover.Content)'

const PopoverAnchor = ({ children, ...props }: AnyProps) =>
  createElement('div', pickDom(props), children)
const PopoverClose = ({ children, ...props }: AnyProps) => {
  const context = useContext(PopoverContext)
  return createElement(
    'button',
    {
      type: 'button',
      'data-slot': 'popover-close',
      onClick: () => context?.setOpen(false),
      ...pickDom(props),
    },
    children,
  )
}
PopoverClose.displayName = 'AfdsMock(Popover.Close)'

export const MockPopover = {
  Root: PopoverRoot,
  Trigger: PopoverTrigger,
  Content: PopoverContent,
  Close: PopoverClose,
  Anchor: PopoverAnchor,
  Arrow: PopoverAnchor,
}
