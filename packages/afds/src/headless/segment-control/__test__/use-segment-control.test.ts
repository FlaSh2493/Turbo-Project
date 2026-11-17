import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useSegmentControl } from '../use-segment-control'

describe('useSegmentControl', () => {
  describe('상태 관리', () => {
    it('초기 상태에서 value는 undefined이다', () => {
      const { result } = renderHook(() => useSegmentControl())
      expect(result.current.selectedValue).toBeUndefined()
    })

    it('defaultValue로 초기 값을 설정할 수 있다', () => {
      const { result } = renderHook(() => useSegmentControl({ defaultValue: 'tab1' }))
      expect(result.current.selectedValue).toBe('tab1')
    })

    it('value prop으로 제어된 상태를 사용할 수 있다', () => {
      const { result } = renderHook(() => useSegmentControl({ value: 'controlled' }))
      expect(result.current.selectedValue).toBe('controlled')
    })
  })

  describe('getItemProps', () => {
    it('비제어 모드에서 handleClick으로 값을 선택할 수 있다', () => {
      const { result } = renderHook(() => useSegmentControl())

      act(() => {
        result.current.getItemProps('tab2').handleClick()
      })

      expect(result.current.selectedValue).toBe('tab2')
    })

    it('onValueChange 콜백을 호출한다', () => {
      const onValueChange = vi.fn()
      const { result } = renderHook(() => useSegmentControl({ onValueChange }))

      act(() => {
        result.current.getItemProps('tab1').handleClick()
      })

      expect(onValueChange).toHaveBeenCalledWith('tab1')
    })

    it('제어 모드에서는 내부 상태를 변경하지 않는다', () => {
      const onValueChange = vi.fn<(value: string) => void>()
      const { result } = renderHook(() =>
        useSegmentControl<string>({ value: 'controlled', onValueChange }),
      )

      act(() => {
        result.current.getItemProps('new-value').handleClick()
      })

      expect(result.current.selectedValue).toBe('controlled')
      expect(onValueChange).toHaveBeenCalledWith('new-value')
    })

    it('isSelected를 올바르게 반환한다', () => {
      const { result } = renderHook(() => useSegmentControl<string>({ defaultValue: 'tab1' }))

      expect(result.current.getItemProps('tab1').isSelected).toBe(true)
      expect(result.current.getItemProps('tab2').isSelected).toBe(false)
    })

    it('ref로 아이템을 등록할 수 있다', () => {
      const { result } = renderHook(() => useSegmentControl({ defaultValue: 'tab1' }))
      const mockElement = document.createElement('button')

      act(() => {
        result.current.getItemProps('tab1').ref(mockElement)
      })

      expect(result.current.getItemProps).toBeDefined()
    })

    it('ref에 null을 전달하면 아이템을 제거한다', () => {
      const { result } = renderHook(() => useSegmentControl())
      const mockElement = document.createElement('button')

      act(() => {
        result.current.getItemProps('tab1').ref(mockElement)
      })

      act(() => {
        result.current.getItemProps('tab1').ref(null)
      })

      expect(result.current.getItemProps).toBeDefined()
    })
  })

  describe('indicatorStyle', () => {
    it('선택된 값이 없으면 null이다', () => {
      const { result } = renderHook(() => useSegmentControl())
      expect(result.current.indicatorStyle).toBeNull()
    })

    it('선택된 값이 있지만 해당 요소가 등록되지 않은 경우 null이다', () => {
      const { result } = renderHook(() => useSegmentControl({ defaultValue: 'tab1' }))
      expect(result.current.indicatorStyle).toBeNull()
    })

    it('선택된 값과 해당 요소가 모두 있으면 indicatorStyle을 계산한다', () => {
      const { result } = renderHook(() => useSegmentControl({ defaultValue: 'tab1' }))

      const mockItem = document.createElement('button')
      Object.defineProperty(mockItem, 'offsetLeft', { value: 20, configurable: true })
      Object.defineProperty(mockItem, 'offsetWidth', { value: 50, configurable: true })

      act(() => {
        result.current.getItemProps('tab1').ref(mockItem)
      })

      act(() => {
        result.current.recalculate()
      })

      expect(result.current.indicatorStyle).toEqual({
        left: 20,
        width: 50,
      })
    })
  })

  describe('recalculate', () => {
    it('recalculate 함수를 제공한다', () => {
      const { result } = renderHook(() => useSegmentControl())
      expect(typeof result.current.recalculate).toBe('function')
    })

    it('recalculate를 호출해도 에러가 발생하지 않는다', () => {
      const { result } = renderHook(() => useSegmentControl())

      expect(() => {
        act(() => {
          result.current.recalculate()
        })
      }).not.toThrow()
    })

    // `recalculate` 의 deps 는 `[]` 이므로 그 클로저는 첫 렌더의 값을 붙든다. 최신 선택 값은
    // ref 로 전달되는데, **그 ref 를 언제 갱신하는가**가 이 동작을 좌우한다. 렌더 중 쓰기를
    // 커밋 후 동기화로 옮길 때 여기서 어긋나면 지표가 이전 항목에 남는다.
    it('★ 값이 바뀐 뒤 recalculate 는 새 값의 요소를 쓴다', () => {
      const mk = (left: number, width: number) => {
        const el = document.createElement('button')
        Object.defineProperty(el, 'offsetLeft', { value: left, configurable: true })
        Object.defineProperty(el, 'offsetWidth', { value: width, configurable: true })
        return el
      }
      type Tab = 'tab1' | 'tab2'
      const { result, rerender } = renderHook(
        ({ value }: { value: Tab }) => useSegmentControl({ value }),
        { initialProps: { value: 'tab1' as Tab } },
      )

      act(() => {
        result.current.getItemProps('tab1').ref(mk(10, 30))
        result.current.getItemProps('tab2').ref(mk(70, 40))
      })
      act(() => result.current.recalculate())
      expect(result.current.indicatorStyle).toEqual({ left: 10, width: 30 })

      rerender({ value: 'tab2' as Tab })
      // 값 변경만으로도 layout effect 가 재계산한다.
      expect(result.current.indicatorStyle).toEqual({ left: 70, width: 40 })

      // 그리고 **외부에서 직접 부를 때도** 새 값을 봐야 한다 — 이쪽이 ref 경로다.
      act(() => result.current.recalculate())
      expect(result.current.indicatorStyle).toEqual({ left: 70, width: 40 })
    })
  })

  describe('리사이즈 이벤트', () => {
    let addEventListenerSpy: ReturnType<typeof vi.spyOn>
    let removeEventListenerSpy: ReturnType<typeof vi.spyOn>

    beforeEach(() => {
      addEventListenerSpy = vi.spyOn(window, 'addEventListener')
      removeEventListenerSpy = vi.spyOn(window, 'removeEventListener')
    })

    afterEach(() => {
      addEventListenerSpy.mockRestore()
      removeEventListenerSpy.mockRestore()
    })

    it('resize 이벤트 리스너를 등록한다', () => {
      renderHook(() => useSegmentControl())

      expect(addEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function))
    })

    it('언마운트 시 resize 이벤트 리스너를 제거한다', () => {
      const { unmount } = renderHook(() => useSegmentControl())

      unmount()

      expect(removeEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function))
    })

    it('resize 이벤트 발생 시 recalculate가 호출된다', () => {
      const { result } = renderHook(() => useSegmentControl({ defaultValue: 'tab1' }))

      const mockItem = document.createElement('button')
      Object.defineProperty(mockItem, 'offsetLeft', { value: 20, configurable: true })
      Object.defineProperty(mockItem, 'offsetWidth', { value: 50, configurable: true })

      act(() => {
        result.current.getItemProps('tab1').ref(mockItem)
      })

      act(() => {
        window.dispatchEvent(new Event('resize'))
      })

      expect(result.current.indicatorStyle).toEqual({
        left: 20,
        width: 50,
      })
    })
  })
})
