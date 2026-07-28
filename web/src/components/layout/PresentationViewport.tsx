'use client'

import type {CSSProperties, ReactNode} from 'react'
import {useLayoutEffect, useState} from 'react'

const REFERENCE_HEIGHT = 940
const MIN_REFERENCE_WIDTH = 1440
const SURFACE_OVERSCAN = 4

type ViewportGeometry = {
  bleedY: number
  height: number
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
      const viewportWidth = window.visualViewport?.width ?? window.innerWidth
      const viewportHeight = window.visualViewport?.height ?? window.innerHeight
      const scale = Math.min(
        viewportWidth / MIN_REFERENCE_WIDTH,
        viewportHeight / REFERENCE_HEIGHT,
      )
      const width =
        Math.ceil(Math.max(MIN_REFERENCE_WIDTH, viewportWidth / scale)) + SURFACE_OVERSCAN
      const height = Math.ceil(Math.max(REFERENCE_HEIGHT, viewportHeight / scale))
      const bleedY = Math.max(0, (height - REFERENCE_HEIGHT) / 2)

      setGeometry({bleedY, height, scale, width})
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
        className="absolute left-1/2 top-1/2 overflow-visible"
        style={
          {
            '--presentation-bleed-y': `${geometry?.bleedY ?? 0}px`,
            '--presentation-header-lift-y': `${Math.min(geometry?.bleedY ?? 0, 24)}px`,
            containerType: 'size',
            height: `${geometry?.height ?? REFERENCE_HEIGHT}px`,
            opacity: geometry === null ? 0 : 1,
            transform: `translate(-50%, -50%) scale(${geometry?.scale ?? 1})`,
            transformOrigin: 'center',
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            width: `${geometry?.width ?? MIN_REFERENCE_WIDTH}px`,
          } as CSSProperties
        }
      >
        <div
          className="absolute inset-x-0 bottom-0 overflow-visible"
          style={{top: `${geometry?.bleedY ?? 0}px`}}
        >
          {children}
        </div>
      </div>
    </div>
  )
}
