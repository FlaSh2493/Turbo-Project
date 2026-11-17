import * as React from 'react'

export function mergeRefs<T>(...refs: (React.Ref<T> | undefined | null)[]): React.RefCallback<T> {
  return node => {
    refs.forEach(ref => {
      if (!ref) return
      if (typeof ref === 'function') ref(node)
      else (ref as React.MutableRefObject<T | null>).current = node
    })
  }
}
