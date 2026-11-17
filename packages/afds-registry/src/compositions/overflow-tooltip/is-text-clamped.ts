// 순수 함수로 분리한 이유: jsdom 은 scroll/client 크기를 항상 0 으로 돌려줘서 실제 DOM 으로는
// 잘림 분기를 테스트할 수 없다.
export interface ClampMeasurable {
  scrollHeight: number
  clientHeight: number
}

export interface TruncateMeasurable {
  scrollWidth: number
  clientWidth: number
}

/** 여러 줄 클램프 — 넘치는 방향이 세로다. */
export function isTextClamped(element: ClampMeasurable): boolean {
  return element.scrollHeight > element.clientHeight
}

/** 한 줄 말줄임 — 넘치는 방향이 가로다. */
export function isTextTruncated(element: TruncateMeasurable): boolean {
  return element.scrollWidth > element.clientWidth
}
