import '@testing-library/jest-dom/vitest'

// Mock ResizeObserver for Base UI components
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

// Mock PointerEvent for Base UI components
class MockPointerEvent extends Event {
  button: number
  ctrlKey: boolean
  pointerType: string

  constructor(type: string, props: PointerEventInit = {}) {
    super(type, props)
    this.button = props.button ?? 0
    this.ctrlKey = props.ctrlKey ?? false
    this.pointerType = props.pointerType ?? 'mouse'
  }
}
global.PointerEvent = MockPointerEvent as unknown as typeof PointerEvent

Element.prototype.scrollIntoView = () => {}
Element.prototype.hasPointerCapture = () => false
Element.prototype.setPointerCapture = () => {}
Element.prototype.releasePointerCapture = () => {}

// Mock Web Animations API (not supported in jsdom)
Element.prototype.getAnimations = () => []
