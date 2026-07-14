'use client'

import type {ReactNode} from 'react'
import {useLayoutEffect, useState} from 'react'

const REFERENCE_HEIGHT = 940
const MIN_REFERENCE_WIDTH = 1440
const MAX_REFERENCE_WIDTH = 1920

type ViewportGeometry = {
  scale: number
  width: number
}

type PresentationViewportProps = {
  children: ReactNode
  backgroundClassName: string
}

export function PresentationViewport({
  children,
  backgroundClassName,
}: PresentationViewportProps) {
  const [geometry, setGeometry] = useState<ViewportGeometry | null>(null)

  useLayoutEffect(() => {
    function updateScale() {
      const scale = Math.min(
        window.innerWidth / MIN_REFERENCE_WIDTH,
        window.innerHeight / REFERENCE_HEIGHT,
      )
      const width = Math.min(
        MAX_REFERENCE_WIDTH,
        Math.max(MIN_REFERENCE_WIDTH, window.innerWidth / scale),
      )

      setGeometry({scale, width})
    }

    updateScale()
    window.addEventListener('resize', updateScale)
    window.visualViewport?.addEventListener('resize', updateScale)

    return () => {
      window.removeEventListener('resize', updateScale)
      window.visualViewport?.removeEventListener('resize', updateScale)
    }
  }, [])

  return (
    <div className={`fixed inset-0 overflow-hidden ${backgroundClassName}`}>
      <div
        className="absolute left-1/2 top-1/2 h-[940px] overflow-hidden"
        style={{
          containerType: 'size',
          opacity: geometry === null ? 0 : 1,
          transform: `translate(-50%, -50%) scale(${geometry?.scale ?? 1})`,
          transformOrigin: 'center',
          width: `${geometry?.width ?? MAX_REFERENCE_WIDTH}px`,
        }}
      >
        {children}
      </div>
    </div>
  )
}
