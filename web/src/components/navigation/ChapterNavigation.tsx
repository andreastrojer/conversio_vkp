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
}

export function ChapterNavigation({
  customerType,
  items,
  currentKey,
  logoUrl,
  logoAlt,
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
      className={`fixed inset-y-0 left-0 z-50 w-[min(390px,calc(100vw-24px))] transition-transform duration-300 ease-out ${
        isOpen ? '[transform:translateX(0)]' : '[transform:translateX(-100%)]'
      }`}
      aria-label="Kapitel-Navigation"
    >
      <div
        id="chapter-navigation-panel"
        className={`absolute inset-0 overflow-y-auto rounded-r-[28px] px-[40px] pb-8 pt-[40px] ${panelTheme}`}
      >
        <div className="h-[72px]">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt={logoAlt} className="h-auto w-[190px] object-contain" />
          ) : (
            <span className="font-sans text-[21px] font-bold uppercase tracking-[0.08em]">
              Conversio Energie
            </span>
          )}
        </div>

        <nav className="mt-[52px]" aria-label="Beratungskapitel">
          {items.map((item) => {
            const isActive = item.key === currentKey
            const titleColor = isActive ? 'text-[#efb804]' : ''
            const buttonTheme = isActive ? 'bg-[#efb804] text-[#3d4248]' : inactiveButtonTheme

            return (
              <div
                key={item.key}
                className={`border-b-2 py-[22px] first:pt-0 last:border-b-0 ${dividerColor}`}
              >
                <div className="flex items-center gap-[22px]">
                  <span
                    className={`relative grid h-[46px] w-[46px] shrink-0 place-items-center ${titleColor}`}
                    aria-hidden="true"
                  >
                    <Hexagon className="absolute inset-0 h-full w-full" strokeWidth={2.8} />
                    <span className="relative text-[17px] font-medium">{item.number}</span>
                  </span>
                  <span
                    className={`font-sans text-[23px] font-bold uppercase leading-[1.05] tracking-[0.01em] ${titleColor}`}
                  >
                    {item.title}
                  </span>
                </div>

                <div className="ml-[68px] mt-[12px]">
                  {item.href ? (
                    <Link
                      href={item.href}
                      className={`inline-flex h-[32px] w-[158px] items-center justify-between rounded-full px-[18px] font-sans text-[13px] font-semibold uppercase tracking-[0.035em] transition-transform hover:-translate-y-px focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#efb804] ${buttonTheme}`}
                      aria-current={isActive ? 'page' : undefined}
                    >
                      <span>{item.ctaLabel}</span>
                      <ArrowUpRight className="h-[16px] w-[16px]" strokeWidth={2.3} aria-hidden="true" />
                    </Link>
                  ) : (
                    <button
                      type="button"
                      disabled
                      className={`inline-flex h-[32px] w-[158px] cursor-not-allowed items-center justify-between rounded-full px-[18px] font-sans text-[13px] font-semibold uppercase tracking-[0.035em] opacity-100 ${buttonTheme}`}
                      title="Dieses Kapitel wird später ergänzt"
                    >
                      <span>{item.ctaLabel}</span>
                      <ArrowUpRight className="h-[16px] w-[16px]" strokeWidth={2.3} aria-hidden="true" />
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
        className="absolute right-[-20px] top-1/2 grid h-28 w-8 -translate-y-1/2 place-items-center focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#efb804]"
        aria-controls="chapter-navigation-panel"
        aria-expanded={isOpen}
        aria-label={isOpen ? 'Kapitel-Navigation schließen' : 'Kapitel-Navigation öffnen'}
        onClick={() => setIsOpen((currentValue) => !currentValue)}
      >
        <span
          className={`h-[60px] w-[7px] rounded-full ${
            isBusiness ? 'bg-[#3d4248]' : 'bg-white'
          }`}
          aria-hidden="true"
        />
      </button>
    </aside>
  )
}
