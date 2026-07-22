'use client'

import type {CSSProperties, ReactNode} from 'react'
import {useLayoutEffect, useState} from 'react'

const REFERENCE_HEIGHT = 940
const MIN_REFERENCE_WIDTH = 1440
const TABLET_MAX_WIDTH = 1366
const TABLET_MIN_WIDTH = 768

type ViewportGeometry = {
  bleedY: number
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
      const width = Math.max(MIN_REFERENCE_WIDTH, window.innerWidth / scale)
      const isTabletWidth =
        window.innerWidth >= TABLET_MIN_WIDTH && window.innerWidth <= TABLET_MAX_WIDTH
      const bleedY = isTabletWidth
        ? 0
        : Math.max(0, (window.innerHeight / scale - REFERENCE_HEIGHT) / 2)

      setGeometry({bleedY, scale, width})
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
        className="absolute left-1/2 top-1/2 h-[940px] overflow-visible"
        style={
          {
            '--presentation-bleed-y': `${geometry?.bleedY ?? 0}px`,
            containerType: 'size',
            opacity: geometry === null ? 0 : 1,
            transform: `translate(-50%, -50%) scale(${geometry?.scale ?? 1})`,
            transformOrigin: 'center',
            width: `${geometry?.width ?? MIN_REFERENCE_WIDTH}px`,
          } as CSSProperties
        }
      >
        {children}
      </div>
    </div>
  )
}
