'use client'

import type {ChapterNavigationItem} from '@/lib/about'
import {brandLogoImageClassName} from '@/lib/brandingLayout'
import type {CustomerGroup} from '@/lib/customerSelection'
import {ArrowUpRight} from 'lucide-react'
import Link from 'next/link'
import {
  type PointerEvent as ReactPointerEvent,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'

const navigationPanelWidthPx = 510
const tabletNavigationPanelWidthPx = 550
const tabletViewportQuery = '(min-width: 768px) and (max-width: 1366px)'

type ChapterNavigationProps = {
  customerType: CustomerGroup
  items: ChapterNavigationItem[]
  currentKey: ChapterNavigationItem['key']
  logoUrl?: string
  logoAlt: string
  navigationArrowUrl?: string
}

export function ChapterNavigation({
  customerType,
  items,
  currentKey,
  logoUrl,
  logoAlt,
  navigationArrowUrl,
}: ChapterNavigationProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isTabletViewport, setIsTabletViewport] = useState(false)
  const [dragTranslateX, setDragTranslateX] = useState<number | null>(null)
  const navigationRef = useRef<HTMLElement>(null)
  const dragStartXRef = useRef<number | null>(null)
  const dragStartTranslateXRef = useRef(-(navigationPanelWidthPx + 2))
  const suppressNextClickRef = useRef(false)
  const activePanelWidthPx = isTabletViewport
    ? tabletNavigationPanelWidthPx
    : navigationPanelWidthPx
  const closedNavigationOffsetPx = -(activePanelWidthPx + 2)
  const dragOpenThresholdPx = activePanelWidthPx * 0.42

  useLayoutEffect(() => {
    const mediaQuery = window.matchMedia(tabletViewportQuery)

    function updateViewportMode() {
      setIsTabletViewport(mediaQuery.matches)
    }

    updateViewportMode()
    mediaQuery.addEventListener('change', updateViewportMode)

    return () => mediaQuery.removeEventListener('change', updateViewportMode)
  }, [])

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
    dragStartTranslateXRef.current = isOpen ? 0 : closedNavigationOffsetPx
    setDragTranslateX(dragStartTranslateXRef.current)
    suppressNextClickRef.current = false
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  function handleTriggerPointerMove(event: ReactPointerEvent<HTMLButtonElement>) {
    const startX = dragStartXRef.current

    if (startX === null) {
      return
    }

    const deltaX = event.clientX - startX
    const nextTranslateX = Math.min(
      0,
      Math.max(closedNavigationOffsetPx, dragStartTranslateXRef.current + deltaX),
    )

    setDragTranslateX(nextTranslateX)

    if (Math.abs(deltaX) > 6) {
      suppressNextClickRef.current = true
    }

  }

  function handleTriggerPointerUp(event: ReactPointerEvent<HTMLButtonElement>) {
    const startX = dragStartXRef.current

    if (startX !== null) {
      const deltaX = event.clientX - startX
      const nextTranslateX = Math.min(
        0,
        Math.max(closedNavigationOffsetPx, dragStartTranslateXRef.current + deltaX),
      )
      const openAmount = nextTranslateX - closedNavigationOffsetPx

      if (Math.abs(deltaX) > 6) {
        suppressNextClickRef.current = true
        setIsOpen(openAmount >= dragOpenThresholdPx)
      }
    }

    dragStartXRef.current = null
    setDragTranslateX(null)
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

  const panelTransform =
    dragTranslateX === null
      ? isOpen
        ? 'translateX(0)'
        : 'translateX(calc(-100% - 2px))'
      : `translateX(${dragTranslateX}px)`
  const panelWidth =
    'w-[510px] [@media(min-width:768px)_and_(max-width:1366px)]:w-[550px]'
  const panelSpacing =
    'rounded-r-[18px] pb-[24px] pl-[60px] pr-[54px] pt-[43px]'
  const panelOverflow = 'overflow-hidden'
  const navigationSpacing =
    'mt-[31px] flex h-[774px] origin-top-left scale-[0.9] flex-col [width:111.111111%] [@media(min-width:768px)_and_(max-width:1366px)]:mt-[13px] [@media(min-width:768px)_and_(max-width:1366px)]:h-[840px] [@media(min-width:768px)_and_(max-width:1366px)]:scale-100 [@media(min-width:768px)_and_(max-width:1366px)]:[width:100%]'
  const itemSpacing = 'flex min-h-0 flex-1 flex-col justify-center py-0'
  const itemGap =
    'gap-[24px] [@media(min-width:768px)_and_(max-width:1366px)]:gap-[44px]'
  const numberSize = 'h-[42px] w-[42px]'
  const numberTextSize =
    'text-[16px] max-[1600px]:text-[18px] [@media(max-height:920px)]:text-[18px]'
  const titleTextSize =
    'text-[22px] max-[1600px]:text-[25px] [@media(max-height:920px)]:text-[25px] [@media(min-width:768px)_and_(max-width:1366px)]:text-[29px]'
  const ctaOffset =
    'ml-[66px] mt-[14px] [@media(min-width:768px)_and_(max-width:1366px)]:ml-[86px]'
  const ctaSize =
    'h-[34px] w-[190px] max-[1600px]:h-[38px] max-[1600px]:w-[204px] [@media(max-height:920px)]:h-[38px] [@media(max-height:920px)]:w-[204px] [@media(min-width:768px)_and_(max-width:1366px)]:h-[31px] [@media(min-width:768px)_and_(max-width:1366px)]:w-[178px]'
  const ctaIconClassName = 'h-[17px] w-[17px] shrink-0 object-contain'
  const isPrivate = customerType === 'b2c'
  const panelTheme = isPrivate ? 'bg-[#2a2e33] text-white' : 'bg-white text-[#2a2e33]'
  const dividerColor = isPrivate ? 'border-white/80' : 'border-[#2a2e33]'
  const inactiveButtonTheme = isPrivate
    ? 'bg-white text-[#2a2e33]'
    : 'bg-[#2a2e33] text-white'

  return (
    <aside
      ref={navigationRef}
      className={`fixed left-0 z-50 ${panelWidth} transition-transform ease-out ${
        dragTranslateX === null ? 'duration-300' : 'duration-0'
      }`}
      aria-label="Kapitel-Navigation"
      style={{
        bottom: 0,
        top: 0,
        transform: panelTransform,
      }}
    >
      <div
        id="chapter-navigation-panel"
        className={`absolute inset-0 ${panelOverflow} ${panelSpacing} ${panelTheme} shadow-none`}
      >
        <div className="h-[81px] pt-[9px]">
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
            const buttonTheme = isActive ? 'bg-[#efb804] text-[#2a2e33]' : inactiveButtonTheme
            const arrowNeedsInvert = Boolean(navigationArrowUrl && !isActive && !isPrivate)

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
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="/Vector%20(1).svg"
                      alt=""
                      className={`pointer-events-none absolute inset-0 h-full w-full object-contain ${
                        isActive ? '' : isPrivate ? 'brightness-0 invert' : 'brightness-0 opacity-80'
                      }`}
                      aria-hidden="true"
                    />
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
                      className={`inline-flex ${ctaSize} items-center justify-between rounded-full px-[18px] font-sans text-[14px] font-semibold uppercase tracking-[0.035em] transition-transform hover:-translate-y-px focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#efb804] max-[1600px]:text-[16px] [@media(max-height:920px)]:text-[16px] ${buttonTheme}`}
                      aria-current={isActive ? 'page' : undefined}
                    >
                      <span>{item.ctaLabel}</span>
                      {navigationArrowUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={navigationArrowUrl}
                          alt=""
                          className={`${ctaIconClassName} ${arrowNeedsInvert ? 'invert' : ''}`}
                          aria-hidden="true"
                        />
                      ) : (
                        <ArrowUpRight className="h-[17px] w-[17px] shrink-0" strokeWidth={2.3} aria-hidden="true" />
                      )}
                    </Link>
                  ) : (
                    <button
                      type="button"
                      disabled
                      className={`inline-flex ${ctaSize} cursor-not-allowed items-center justify-between rounded-full px-[18px] font-sans text-[14px] font-semibold uppercase tracking-[0.035em] opacity-100 max-[1600px]:text-[16px] [@media(max-height:920px)]:text-[16px] ${buttonTheme}`}
                      title="Dieses Kapitel wird später ergänzt"
                    >
                      <span>{item.ctaLabel}</span>
                      {navigationArrowUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={navigationArrowUrl}
                          alt=""
                          className={`${ctaIconClassName} ${arrowNeedsInvert ? 'invert' : ''}`}
                          aria-hidden="true"
                        />
                      ) : (
                        <ArrowUpRight className="h-[17px] w-[17px] shrink-0" strokeWidth={2.3} aria-hidden="true" />
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
          setDragTranslateX(null)
        }}
        onPointerDown={handleTriggerPointerDown}
        onPointerMove={handleTriggerPointerMove}
        onPointerUp={handleTriggerPointerUp}
      >
        <span
          className={`grid h-[58px] w-[7px] place-items-center rounded-full shadow-[0_8px_20px_rgba(0,0,0,0.14)] ${
            isOpen && isPrivate ? 'bg-white' : 'bg-[#2f3439]'
          }`}
          aria-hidden="true"
        />
      </button>
    </aside>
  )
}
