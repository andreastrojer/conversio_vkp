'use client'

import type {ChapterNavigationItem} from '@/lib/about'
import {brandLogoImageClassName, brandLogoPanelInsetClassName} from '@/lib/brandingLayout'
import type {CustomerGroup} from '@/lib/customerSelection'
import {ArrowUpRight, Hexagon} from 'lucide-react'
import Link from 'next/link'
import {type PointerEvent as ReactPointerEvent, useEffect, useRef, useState} from 'react'

type ChapterNavigationProps = {
  customerType: CustomerGroup
  items: ChapterNavigationItem[]
  currentKey: ChapterNavigationItem['key']
  logoUrl?: string
  logoAlt: string
  navigationArrowUrl?: string
}

export function ChapterNavigation({
  items,
  currentKey,
  logoUrl,
  logoAlt,
  navigationArrowUrl,
}: ChapterNavigationProps) {
  const [isOpen, setIsOpen] = useState(false)
  const navigationRef = useRef<HTMLElement>(null)
  const dragStartXRef = useRef<number | null>(null)
  const suppressNextClickRef = useRef(false)

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    function handlePointerDown(event: PointerEvent) {
      if (isOpen && !navigationRef.current?.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('pointerdown', handlePointerDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('pointerdown', handlePointerDown)
    }
  }, [isOpen])

  function handleTriggerPointerDown(event: ReactPointerEvent<HTMLButtonElement>) {
    dragStartXRef.current = event.clientX
    suppressNextClickRef.current = false
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  function handleTriggerPointerMove(event: ReactPointerEvent<HTMLButtonElement>) {
    const startX = dragStartXRef.current

    if (startX === null) {
      return
    }

    const deltaX = event.clientX - startX

    if (!isOpen && deltaX > 44) {
      suppressNextClickRef.current = true
      setIsOpen(true)
    }

    if (isOpen && deltaX < -44) {
      suppressNextClickRef.current = true
      setIsOpen(false)
    }
  }

  function handleTriggerPointerUp(event: ReactPointerEvent<HTMLButtonElement>) {
    const startX = dragStartXRef.current

    if (startX !== null) {
      const deltaX = event.clientX - startX

      if (Math.abs(deltaX) > 28) {
        suppressNextClickRef.current = true
        setIsOpen(deltaX > 0)
      }
    }

    dragStartXRef.current = null
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
  }

  function handleTriggerClick() {
    if (suppressNextClickRef.current) {
      suppressNextClickRef.current = false
      return
    }

    setIsOpen((currentValue) => !currentValue)
  }

  const panelWidth = 'w-[510px]'
  const panelSpacing =
    `rounded-r-[18px] pb-[24px] pr-[54px] ${brandLogoPanelInsetClassName}`
  const panelOverflow = 'overflow-hidden'
  const navigationSpacing =
    'mt-[40px] flex h-[774px] origin-top-left scale-[0.9] flex-col [width:111.111111%]'
  const itemSpacing = 'flex min-h-0 flex-1 flex-col justify-center py-0'
  const itemGap = 'gap-[24px]'
  const numberSize = 'h-[42px] w-[42px]'
  const numberTextSize = 'text-[15px]'
  const titleTextSize = 'text-[24px]'
  const ctaOffset = 'ml-[66px] mt-[14px]'
  const ctaSize = 'h-[34px] w-[190px]'
  const panelTheme = 'bg-white text-[#3d4248]'
  const dividerColor = 'border-[#3d4248]'
  const inactiveButtonTheme = 'bg-[#3d4248] text-white'

  return (
    <aside
      ref={navigationRef}
      className={`fixed inset-y-0 left-0 z-50 ${panelWidth} transition-transform duration-300 ease-out ${
        isOpen ? '[transform:translateX(0)]' : '[transform:translateX(calc(-100%_-_2px))]'
      }`}
      aria-label="Kapitel-Navigation"
    >
      <div
        id="chapter-navigation-panel"
        className={`absolute inset-0 ${panelOverflow} ${panelSpacing} ${panelTheme} ${
          isOpen ? 'shadow-[18px_0_52px_rgba(0,0,0,0.18)]' : 'shadow-none'
        }`}
      >
        <div className="h-[72px]">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt={logoAlt} className={brandLogoImageClassName} />
          ) : (
            <span className="font-sans text-[21px] font-bold uppercase tracking-[0.08em]">
              Conversio Energie
            </span>
          )}
        </div>

        <nav className={navigationSpacing} aria-label="Beratungskapitel">
          {items.map((item) => {
            const isActive = item.key === currentKey
            const titleColor = isActive ? 'text-[#efb804]' : ''
            const buttonTheme = isActive ? 'bg-[#efb804] text-[#3d4248]' : inactiveButtonTheme
            const arrowNeedsInvert = Boolean(navigationArrowUrl && !isActive)

            return (
              <div
                key={item.key}
                className={`border-b-2 ${itemSpacing} first:pt-0 last:border-b-0 ${dividerColor}`}
              >
                <div className={`flex items-center ${itemGap}`}>
                  <span
                    className={`relative grid ${numberSize} shrink-0 place-items-center ${titleColor}`}
                    aria-hidden="true"
                  >
                    <Hexagon className="absolute inset-0 h-full w-full" strokeWidth={2.8} />
                    <span className={`relative ${numberTextSize} font-medium`}>{item.number}</span>
                  </span>
                  <span
                    className={`font-sans ${titleTextSize} font-bold uppercase leading-[1.05] tracking-[0.01em] ${titleColor}`}
                  >
                    {item.title}
                  </span>
                </div>

                <div className={ctaOffset}>
                  {item.href ? (
                    <Link
                      href={item.href}
                      className={`inline-flex ${ctaSize} items-center justify-between rounded-full px-[18px] font-sans text-[13px] font-semibold uppercase tracking-[0.035em] transition-transform hover:-translate-y-px focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#efb804] ${buttonTheme}`}
                      aria-current={isActive ? 'page' : undefined}
                    >
                      <span>{item.ctaLabel}</span>
                      {navigationArrowUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={navigationArrowUrl}
                          alt=""
                          className={`h-[15px] w-[15px] object-contain ${arrowNeedsInvert ? 'invert' : ''}`}
                          aria-hidden="true"
                        />
                      ) : (
                        <ArrowUpRight className="h-[16px] w-[16px]" strokeWidth={2.3} aria-hidden="true" />
                      )}
                    </Link>
                  ) : (
                    <button
                      type="button"
                      disabled
                      className={`inline-flex ${ctaSize} cursor-not-allowed items-center justify-between rounded-full px-[18px] font-sans text-[13px] font-semibold uppercase tracking-[0.035em] opacity-100 ${buttonTheme}`}
                      title="Dieses Kapitel wird später ergänzt"
                    >
                      <span>{item.ctaLabel}</span>
                      {navigationArrowUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={navigationArrowUrl}
                          alt=""
                          className={`h-[15px] w-[15px] object-contain ${arrowNeedsInvert ? 'invert' : ''}`}
                          aria-hidden="true"
                        />
                      ) : (
                        <ArrowUpRight className="h-[16px] w-[16px]" strokeWidth={2.3} aria-hidden="true" />
                      )}
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </nav>
      </div>

      <button
        type="button"
        className={`absolute top-1/2 grid -translate-y-1/2 touch-none cursor-ew-resize place-items-center ${isOpen ? 'right-[4px]' : 'right-[-30px]'} h-[110px] w-[24px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#efb804]`}
        aria-controls="chapter-navigation-panel"
        aria-expanded={isOpen}
        aria-label={isOpen ? 'Kapitel-Navigation schließen' : 'Kapitel-Navigation öffnen'}
        onClick={handleTriggerClick}
        onPointerCancel={() => {
          dragStartXRef.current = null
        }}
        onPointerDown={handleTriggerPointerDown}
        onPointerMove={handleTriggerPointerMove}
        onPointerUp={handleTriggerPointerUp}
      >
        <span
          className="grid h-[58px] w-[7px] place-items-center rounded-full bg-[#2f3439] shadow-[0_8px_20px_rgba(0,0,0,0.14)]"
          aria-hidden="true"
        />
      </button>
    </aside>
  )
}
