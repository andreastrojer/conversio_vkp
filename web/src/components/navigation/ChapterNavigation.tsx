'use client'

import type {ChapterNavigationItem} from '@/lib/about'
import type {CustomerGroup} from '@/lib/customerSelection'
import {ArrowUpRight, Hexagon} from 'lucide-react'
import Link from 'next/link'
import {useEffect, useRef, useState} from 'react'

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
  const navigationRef = useRef<HTMLElement>(null)
  const isBusiness = customerType === 'b2b'

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

  const panelWidth = isBusiness ? 'w-[min(510px,calc(100vw-24px))]' : 'w-[min(390px,calc(100vw-24px))]'
  const panelSpacing = isBusiness
    ? 'rounded-r-[30px] px-[56px] pb-10 pt-[46px]'
    : 'rounded-r-[28px] px-[40px] pb-8 pt-[40px]'
  const logoWidth = isBusiness ? 'w-[204px]' : 'w-[190px]'
  const navigationSpacing = isBusiness ? 'mt-[66px]' : 'mt-[52px]'
  const itemSpacing = isBusiness ? 'py-[28px]' : 'py-[22px]'
  const itemGap = isBusiness ? 'gap-[30px]' : 'gap-[22px]'
  const numberSize = isBusiness ? 'h-[52px] w-[52px]' : 'h-[46px] w-[46px]'
  const numberTextSize = isBusiness ? 'text-[18px]' : 'text-[17px]'
  const titleTextSize = isBusiness ? 'text-[25px]' : 'text-[23px]'
  const ctaOffset = isBusiness ? 'ml-[86px] mt-[16px]' : 'ml-[68px] mt-[12px]'
  const ctaSize = isBusiness ? 'h-[34px] w-[190px]' : 'h-[32px] w-[158px]'
  const panelTheme = isBusiness
    ? 'bg-white text-[#3d4248] shadow-[18px_0_52px_rgba(0,0,0,0.18)]'
    : 'bg-[#3d4248] text-white shadow-[18px_0_52px_rgba(0,0,0,0.18)]'
  const dividerColor = isBusiness ? 'border-[#3d4248]' : 'border-white'
  const inactiveButtonTheme = isBusiness
    ? 'bg-[#3d4248] text-white'
    : 'bg-white text-[#3d4248]'

  return (
    <aside
      ref={navigationRef}
      className={`fixed inset-y-0 left-0 z-50 ${panelWidth} transition-transform duration-300 ease-out ${
        isOpen ? '[transform:translateX(0)]' : '[transform:translateX(-100%)]'
      }`}
      aria-label="Kapitel-Navigation"
    >
      <div
        id="chapter-navigation-panel"
        className={`absolute inset-0 overflow-y-auto ${panelSpacing} ${panelTheme}`}
      >
        <div className="h-[72px]">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt={logoAlt} className={`h-auto ${logoWidth} object-contain`} />
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
            const arrowNeedsInvert = Boolean(navigationArrowUrl && isBusiness && !isActive)

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
        className="absolute right-[-25px] top-1/2 grid h-32 w-10 -translate-y-1/2 place-items-center focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#efb804]"
        aria-controls="chapter-navigation-panel"
        aria-expanded={isOpen}
        aria-label={isOpen ? 'Kapitel-Navigation schließen' : 'Kapitel-Navigation öffnen'}
        onClick={() => setIsOpen((currentValue) => !currentValue)}
      >
        <span
          className={`grid h-[82px] w-[18px] place-items-center rounded-full shadow-[0_10px_28px_rgba(0,0,0,0.16)] ${
            isBusiness
              ? isOpen
                ? 'bg-[#3d4248]'
                : 'border border-[#e3e5e7] bg-white'
              : 'bg-white'
          }`}
          aria-hidden="true"
        >
          <span
            className={`h-[42px] w-[4px] rounded-full ${
              isBusiness && !isOpen ? 'bg-[#3d4248]' : 'bg-white'
            }`}
          />
        </span>
      </button>
    </aside>
  )
}
