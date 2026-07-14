'use client'

import {PresentationViewport} from '@/components/layout/PresentationViewport'
import {ChapterNavigation} from '@/components/navigation/ChapterNavigation'
import type {ChapterNavigationItem} from '@/lib/about'
import {
  brandLogoImageClassName,
  brandLogoPositionClassName,
} from '@/lib/brandingLayout'
import type {CustomerGroup} from '@/lib/customerSelection'
import type {ProcessSection} from '@/lib/process'
import {motion} from 'framer-motion'
import {ArrowRight, Hexagon} from 'lucide-react'
import Link from 'next/link'
import {useState} from 'react'

type ProcessScreenProps = {
  customerType: CustomerGroup
  subline?: string | null
  sections: ProcessSection[]
  activeRingImageUrl?: string
  inactiveRingImageUrl?: string
  primaryCta?: {
    label?: string | null
    target?: string | null
  } | null
  navigationItems: ChapterNavigationItem[]
  logoUrl?: string
  inverseLogoUrl?: string
  logoAlt: string
  patternUrl?: string
  patternAlt: string
  navigationArrowUrl?: string
}

const patternClassName =
  'pointer-events-none absolute bottom-[-215px] right-[-240px] z-0 h-[850px] w-[850px] bg-contain bg-center bg-no-repeat opacity-[0.065] [filter:brightness(0)_invert(1)]'

function sectionKey(section: ProcessSection, index: number) {
  return section._key || `process-section-${index}`
}

function ProcessRing({url, isActive}: {url: string; isActive: boolean}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt=""
      className={`pointer-events-none absolute left-0 top-1/2 h-auto w-[288px] -translate-y-1/2 object-contain transition-opacity duration-300 ${
        isActive ? 'opacity-100' : 'opacity-[0.82]'
      }`}
      aria-hidden="true"
    />
  )
}

function resolveTarget(target: string | null | undefined, customerType: CustomerGroup) {
  const normalizedTarget = target?.trim()

  if (!normalizedTarget || normalizedTarget === 'next') {
    return `/needs?type=${customerType}`
  }

  if (normalizedTarget.startsWith('/')) {
    return normalizedTarget
  }

  const screenKey = normalizedTarget.includes(':')
    ? normalizedTarget.split(':').pop() || ''
    : normalizedTarget

  return screenKey ? `/${screenKey}?type=${customerType}` : `/needs?type=${customerType}`
}

export function ProcessScreen({
  customerType,
  subline,
  sections,
  activeRingImageUrl,
  inactiveRingImageUrl,
  primaryCta,
  navigationItems,
  logoUrl,
  inverseLogoUrl,
  logoAlt,
  patternUrl,
  patternAlt,
  navigationArrowUrl,
}: ProcessScreenProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const safeActiveIndex = sections.length > 0 ? Math.min(activeIndex, sections.length - 1) : 0
  const activeSection = sections[safeActiveIndex]
  const pageLogoUrl = inverseLogoUrl || logoUrl
  const navigationLogoUrl = logoUrl || inverseLogoUrl
  const ctaHref = resolveTarget(primaryCta?.target, customerType)

  function selectStep(index: number) {
    setActiveIndex(index)
  }

  function selectNextStep() {
    if (safeActiveIndex < sections.length - 1) {
      setActiveIndex(safeActiveIndex + 1)
    }
  }

  return (
    <PresentationViewport backgroundClassName="bg-[#3d4248]">
      <main className="relative isolate h-full w-full overflow-hidden bg-[#3d4248] font-sans text-white">
        {patternUrl ? (
          <span
            className={patternClassName}
            style={{backgroundImage: `url("${patternUrl}")`}}
            title={patternAlt || undefined}
            aria-hidden="true"
          />
        ) : null}

        <div className={brandLogoPositionClassName}>
          <Link href="/" className="block w-max" aria-label="Zur Welcome-Seite">
            {pageLogoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={pageLogoUrl} alt={logoAlt} className={brandLogoImageClassName} />
            ) : (
              <span className="text-[21px] font-bold uppercase tracking-[0.08em]">
                Conversio Energie
              </span>
            )}
          </Link>
        </div>

        <p className="absolute bottom-[185px] left-[110px] z-[3] origin-left -rotate-90 whitespace-nowrap text-[14px] font-medium uppercase tracking-[0.32em] text-white/90">
          {subline?.trim() || 'DER ABLAUF'}
        </p>

        <section className="absolute left-[175px] top-[290px] z-[3] h-[475px] w-[550px]" aria-label="Prozessschritte als Ringstapel">
          {sections.map((section, index) => {
            const isActive = index === safeActiveIndex
            const currentRingUrl = isActive ? activeRingImageUrl : inactiveRingImageUrl

            return (
              <motion.button
                key={sectionKey(section, index)}
                type="button"
                className="absolute left-0 h-[80px] w-[350px] cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#efb804]"
                style={{top: `${index * 63}px`, zIndex: isActive ? 20 : sections.length - index}}
                animate={{x: isActive ? 75 : 30, y: isActive ? -9 : 0}}
                transition={{duration: 0.42, ease: [0.22, 1, 0.36, 1]}}
                onClick={() => selectStep(index)}
                aria-pressed={isActive}
                aria-label={`${section.title || `Schritt ${index + 1}`} auswählen`}
              >
                {currentRingUrl ? (
                  <ProcessRing url={currentRingUrl} isActive={isActive} />
                ) : (
                  <Hexagon
                    className={`pointer-events-none absolute left-[38px] top-1/2 h-[68px] w-[300px] -translate-y-1/2 ${
                      isActive ? 'text-[#efb804]' : 'text-white/60'
                    }`}
                    strokeWidth={1.2}
                    aria-hidden="true"
                  />
                )}
              </motion.button>
            )
          })}

          {activeSection ? (
            <motion.div
              className="absolute left-[355px] flex w-[265px] items-center gap-[10px]"
              animate={{top: safeActiveIndex * 63 - 7}}
              transition={{duration: 0.42, ease: [0.22, 1, 0.36, 1]}}
            >
              <span className="h-px w-[46px] shrink-0 bg-[#efb804]" aria-hidden="true" />
              <button
                type="button"
                className="inline-flex items-center whitespace-nowrap text-[14px] font-medium uppercase tracking-[0.035em] text-[#efb804] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#efb804] disabled:cursor-default"
                onClick={selectNextStep}
                disabled={safeActiveIndex >= sections.length - 1}
                aria-label="Nächsten Prozessschritt anzeigen"
              >
                <span>{activeSection.eyebrow || `SCHRITT ${safeActiveIndex + 1}`}</span>
              </button>
            </motion.div>
          ) : null}
        </section>

        <section className="absolute right-[72px] top-[235px] z-[3] w-[525px]" aria-label="Prozessschritte">
          <span className="absolute left-[-72px] top-[31px] h-[460px] w-[2px] bg-[#efb804]" aria-hidden="true" />
          <span className="absolute left-[-72px] top-[239px] h-[2px] w-[105px] bg-[#efb804]" aria-hidden="true" />
          <span className="absolute bottom-[38px] left-[31px] top-[38px] w-[2px] bg-white/90" aria-hidden="true" />

          <div className="relative">
            {sections.map((section, index) => {
              const isActive = index === safeActiveIndex

              return (
                <button
                  key={sectionKey(section, index)}
                  type="button"
                  className={`group relative flex h-[76px] w-full items-center text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#efb804] ${
                    isActive ? 'text-[#efb804]' : 'text-white'
                  }`}
                  onClick={() => selectStep(index)}
                  aria-pressed={isActive}
                >
                  <span
                    className={`absolute left-[31px] top-1/2 h-[2px] w-[17px] -translate-y-1/2 transition-colors duration-300 ${
                      isActive ? 'bg-[#efb804]' : 'bg-white'
                    }`}
                    aria-hidden="true"
                  />
                  <span className="relative ml-[48px] grid h-[48px] w-[48px] shrink-0 place-items-center">
                    <Hexagon className="absolute inset-0 h-full w-full" strokeWidth={2.8} aria-hidden="true" />
                    <span className="relative text-[16px] font-medium">{index + 1}</span>
                  </span>
                  <span className="ml-[22px] max-w-[410px] text-[19px] font-bold uppercase leading-[1.12] tracking-[0.012em] transition-colors duration-300">
                    {section.title || `Schritt ${index + 1}`}
                  </span>
                </button>
              )
            })}
          </div>
        </section>

        {primaryCta?.label ? (
          <div className="absolute bottom-[58px] right-[72px] z-[4] w-[276px]">
            <Link
              href={ctaHref}
              className="group flex items-center justify-between pb-[10px] text-[18px] font-bold uppercase leading-none tracking-[0.02em] text-[#efb804] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-6 focus-visible:outline-[#efb804]"
            >
              <span>{primaryCta.label}</span>
              <ArrowRight
                className="h-[14px] w-[20px] transition-transform group-hover:translate-x-1"
                strokeWidth={2.2}
                aria-hidden="true"
              />
            </Link>
            <span className="block h-px w-full bg-[#efb804]" aria-hidden="true" />
          </div>
        ) : null}

        <ChapterNavigation
          customerType={customerType}
          items={navigationItems}
          currentKey="offer"
          logoUrl={navigationLogoUrl}
          logoAlt={logoAlt}
          navigationArrowUrl={navigationArrowUrl}
        />
      </main>
    </PresentationViewport>
  )
}
