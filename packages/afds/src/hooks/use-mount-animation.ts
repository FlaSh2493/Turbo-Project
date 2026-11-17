'use client'

import { useEffect, useState } from 'react'

export function useMountAnimation(show: boolean, duration: number) {
  const [visible, setVisible] = useState(show)

  useEffect(() => {
    if (show) {
      setVisible(true)
    } else {
      const timer = setTimeout(() => setVisible(false), duration)
      return () => clearTimeout(timer)
    }
  }, [show, duration])

  return { visible, show }
}
