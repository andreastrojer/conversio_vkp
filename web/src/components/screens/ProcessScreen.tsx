'use client'

import {PresentationViewport} from '@/components/layout/PresentationViewport'
import {BottomBackLink} from '@/components/navigation/BottomBackLink'
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
  catalogDetailPointActiveUrl?: string
}

const patternClassName =
  'pointer-events-none absolute bottom-[-215px] right-[-240px] z-0 h-[850px] w-[850px] bg-contain bg-center bg-no-repeat'

const processDetailFallbacks = [
  {
    title: 'Besichtigung',
    text: 'Wir besuchen Sie am Projektstandort und besprechen gemeinsam mit Ihnen Ihr Projekt. Alle relevanten Daten werden an diesem Termin aufgenommen.',
  },
  {
    title: 'Angebot',
    text: 'Wir legen Ihnen entsprechend Ihren Bedürfnissen und Projektspezifikationen ein individuelles Angebot.',
  },
  {
    title: 'Beauftragung',
    text: 'Nach einer detaillierten Besprechung aller Positionen Ihres Angebotes freuen wir uns über Ihre schriftliche Auftragserteilung. Hiermit kann unser Team beginnen, alle relevanten Abläufe einzuplanen und die nächsten Schritte vorzubereiten.',
  },
  {
    title: 'Genehmigungen und Einreichungen',
    text: 'Mit Ihrer Vollmacht kümmert sich unser Spezialistenteam um die Genehmigungen und Einreichungen bei den zuständigen Behörden und klärt für Sie verfügbare Förderungen ab.',
  },
  {
    title: 'Lieferung und Errichtung',
    text: 'Unser Team setzt das Projekt nach Abstimmung mit Ihnen am Standort um.',
  },
  {
    title: 'Inbetriebnahme',
    text: 'Es erfolgt ein Testbetrieb, eine Einschulung in die Anlage und App-Steuerung, die Ausfertigung eines Übergabeprotokolls und die Fertigstellungsmeldung an den Netzbetreiber.',
  },
  {
    title: 'Projektabschluss',
    text: 'Zusätzlich zu Gewährleistungen und Garantie bieten wir darüber hinaus umfangreiche Wartungs- und Servicedienstleistungen in komfortablen Angebotspaketen.',
  },
]

function sectionKey(section: ProcessSection, index: number) {
  return section._key || `process-section-${index}`
}

function splitProcessDetailText(text: string) {
  return text
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.replace(/\s*\n\s*/g, ' ').trim())
    .filter(Boolean)
}

function ProcessRing({
  url,
  isActive,
  dimInactive,
}: {
  url: string
  isActive: boolean
  dimInactive: boolean
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt=""
      className={`pointer-events-none absolute left-0 top-1/2 h-auto w-[340px] -translate-y-1/2 object-contain transition-opacity duration-300 [@media(min-height:940px)]:w-[288px] [@media(min-width:768px)_and_(max-width:1366px)]:w-[320px] ${
        isActive || !dimInactive ? 'opacity-100' : 'opacity-[0.82]'
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
  catalogDetailPointActiveUrl,
}: ProcessScreenProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const safeActiveIndex = sections.length > 0 ? Math.min(activeIndex, sections.length - 1) : 0
  const activeSection = sections[safeActiveIndex]
  const isBusiness = customerType === 'b2b'
  const pageLogoUrl = isBusiness ? inverseLogoUrl || logoUrl : logoUrl || inverseLogoUrl
  const navigationLogoUrl = isBusiness ? logoUrl || inverseLogoUrl : inverseLogoUrl || logoUrl
  const ctaHref = resolveTarget(primaryCta?.target, customerType)
  const backHref = `/offer?type=${customerType}`
  const activeFallbackDetail = processDetailFallbacks[safeActiveIndex]
  const activeDetailTitle =
    activeSection?.detailTitle?.trim() ||
    activeSection?.title?.trim() ||
    activeFallbackDetail?.title ||
    ''
  const activeDetailText =
    activeSection?.detailText?.trim() ||
    activeSection?.text?.trim() ||
    activeFallbackDetail?.text ||
    ''
  const activeDetailParagraphs = splitProcessDetailText(activeDetailText)

  function selectStep(index: number) {
    setActiveIndex(index)
  }

  function selectNextStep() {
    if (safeActiveIndex < sections.length - 1) {
      setActiveIndex(safeActiveIndex + 1)
    }
  }

  return (
    <PresentationViewport backgroundClassName={isBusiness ? 'bg-[#2a2e33]' : 'bg-[#f5f5f7]'}>
      <main
        className={`relative isolate h-full w-full overflow-hidden font-sans ${
          isBusiness ? 'bg-[#2a2e33] text-white' : 'bg-[#f5f5f7] text-[#2a2e33]'
        }`}
      >
        {patternUrl ? (
          <span
            className={`${patternClassName} ${
              isBusiness
                ? 'opacity-[0.065] [filter:brightness(0)_invert(1)]'
                : 'opacity-[0.86] mix-blend-normal [filter:brightness(0)_saturate(100%)_invert(86%)_sepia(5%)_saturate(126%)_hue-rotate(178deg)_brightness(96%)_contrast(90%)]'
            }`}
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

        <p
          className={`absolute bottom-[174px] left-[82px] z-[3] origin-left -rotate-90 whitespace-nowrap text-[16px] font-medium uppercase tracking-[0.32em] max-[1600px]:text-[18px] [@media(max-height:920px)]:text-[18px] [@media(min-width:1367px)_and_(max-width:1600px)]:bottom-[150px] [@media(min-width:1601px)_and_(max-height:1100px)]:bottom-[150px] ${
            isBusiness ? 'text-white/90' : 'text-[#2a2e33]/90'
          }`}
        >
          {subline?.trim() || 'DER ABLAUF'}
        </p>

        <section
          className="absolute left-[175px] top-[296px] z-[3] h-[570px] w-[550px] [--process-label-offset:29px] [--process-step-gap:71px] [@media(min-width:768px)_and_(max-width:1366px)]:top-[281px] [@media(min-width:768px)_and_(max-width:1366px)]:h-[598px] [@media(min-width:768px)_and_(max-width:1366px)]:[--process-label-offset:32px] [@media(min-width:768px)_and_(max-width:1366px)]:[--process-step-gap:76px]"
          aria-label="Prozessschritte als Ringstapel"
        >
          {sections.map((section, index) => {
            const isActive = index === safeActiveIndex
            const currentRingUrl = isActive ? activeRingImageUrl : inactiveRingImageUrl

            return (
              <motion.button
                key={sectionKey(section, index)}
                type="button"
                className="absolute left-0 h-[80px] w-[350px] cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#efb804] [@media(min-width:768px)_and_(max-width:1366px)]:h-[84px] [@media(min-width:768px)_and_(max-width:1366px)]:w-[350px]"
                style={{top: `calc(${index} * var(--process-step-gap))`, zIndex: sections.length - index}}
                animate={{
                  x: isActive ? 75 : 30,
                  y: 0,
                }}
                transition={{duration: 0.42, ease: [0.22, 1, 0.36, 1]}}
                onClick={() => selectStep(index)}
                aria-pressed={isActive}
                aria-label={`${section.title || `Schritt ${index + 1}`} auswählen`}
              >
                {currentRingUrl ? (
                  <ProcessRing
                    url={currentRingUrl}
                    isActive={isActive}
                    dimInactive={isBusiness}
                  />
                ) : (
                  <Hexagon
                    className={`pointer-events-none absolute left-[38px] top-1/2 h-[68px] w-[300px] -translate-y-1/2 ${
                      isActive
                        ? 'text-[#efb804]'
                        : isBusiness
                          ? 'text-white/60'
                          : 'text-[#2a2e33]/60'
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
              className="absolute left-[428px] flex w-[265px] translate-y-[-18px] items-center gap-[10px] transition-[top] duration-[420ms] ease-out [@media(min-height:940px)]:left-[378px]"
              style={{
                top: `calc(${safeActiveIndex} * var(--process-step-gap) + var(--process-label-offset))`,
              }}
            >
              <span className="h-px w-[46px] shrink-0 bg-[#efb804]" aria-hidden="true" />
              <button
                type="button"
                className="inline-flex items-center whitespace-nowrap text-[16px] font-medium uppercase tracking-[0.035em] text-[#efb804] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#efb804] disabled:cursor-default max-[1600px]:text-[18px] [@media(max-height:920px)]:text-[18px]"
                onClick={selectNextStep}
                disabled={safeActiveIndex >= sections.length - 1}
                aria-label="Nächsten Prozessschritt anzeigen"
              >
                <span>{activeSection.eyebrow || `SCHRITT ${safeActiveIndex + 1}`}</span>
              </button>
            </motion.div>
          ) : null}
        </section>

        {activeSection && (activeDetailTitle || activeDetailParagraphs.length > 0) ? (
          <motion.section
            key={`process-detail-${sectionKey(activeSection, safeActiveIndex)}`}
            className="absolute right-[72px] top-[118px] z-[3] w-[494px] [@media(min-width:768px)_and_(max-width:1366px)]:right-[24px] [@media(min-width:768px)_and_(max-width:1366px)]:top-[109px]"
            initial={{opacity: 0, y: 8}}
            animate={{opacity: 1, y: 0}}
            transition={{duration: 0.22, ease: [0.22, 1, 0.36, 1]}}
            aria-live="polite"
          >
            <h2 className="mb-[18px] whitespace-nowrap text-[25px] font-bold uppercase leading-[1.06] tracking-[0.01em] text-[#efb804] [@media(min-width:768px)_and_(max-width:1366px)]:text-[23px]">
              {activeDetailTitle}
            </h2>
            <div
              className={`space-y-[10px] text-[20px] font-medium leading-[1.2] tracking-[0.004em] [@media(min-width:768px)_and_(max-width:1366px)]:text-[18px] ${
                isBusiness ? 'text-white/92' : 'text-[#2a2e33]/92'
              }`}
            >
              {activeDetailParagraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </motion.section>
        ) : null}

        <section
          className="absolute right-[72px] top-[279px] z-[3] w-[525px] [--process-list-step:76px] [--process-point-center:37px] [@media(min-width:768px)_and_(max-width:1366px)]:right-[24px] [@media(min-width:768px)_and_(max-width:1366px)]:top-[254px] [@media(min-width:768px)_and_(max-width:1366px)]:[--process-list-step:84px] [@media(min-width:768px)_and_(max-width:1366px)]:[--process-point-center:42px]"
          aria-label="Prozessschritte"
        >
          <span
            className="absolute left-[-72px] top-[var(--process-point-center)] w-[3px] bg-[#efb804]"
            style={{
              height: `calc(${Math.max(0, sections.length - 1)} * var(--process-list-step))`,
            }}
            aria-hidden="true"
          />
          <span
            className="absolute left-[-72px] h-[3px] w-[105px] -translate-y-1/2 bg-[#efb804]"
            style={{
              top: 'calc(3 * var(--process-list-step) + var(--process-point-center))',
            }}
            aria-hidden="true"
          />
          <span
            className={`absolute bottom-[var(--process-point-center)] left-[31px] top-[var(--process-point-center)] w-[3px] ${
              isBusiness ? 'bg-white/90' : 'bg-[#2a2e33]/80'
            }`}
            aria-hidden="true"
          />

          <div className="relative">
            {sections.map((section, index) => {
              const isActive = index === safeActiveIndex

              return (
                <button
                  key={sectionKey(section, index)}
                  type="button"
                  className={`group relative flex h-[var(--process-list-step)] w-full items-center text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#efb804] ${
                    isActive ? 'text-[#efb804]' : isBusiness ? 'text-white' : 'text-[#2a2e33]'
                  }`}
                  onClick={() => selectStep(index)}
                  aria-pressed={isActive}
                >
                  <span
                    className={`absolute left-[31px] top-1/2 h-[3px] w-[17px] -translate-y-1/2 transition-colors duration-300 ${
                      isActive ? 'bg-[#efb804]' : isBusiness ? 'bg-white' : 'bg-[#2a2e33]'
                    }`}
                    aria-hidden="true"
                  />
                  <span className="relative ml-[48px] grid h-[49px] w-[43px] shrink-0 place-items-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="/Vector%20(1).svg"
                      alt=""
                      className={`pointer-events-none absolute inset-0 h-full w-full object-contain ${
                        isActive ? '' : isBusiness ? 'brightness-0 invert' : 'brightness-0 opacity-80'
                      }`}
                      aria-hidden="true"
                    />
                    <span className="relative text-[16px] font-medium">{index + 1}</span>
                  </span>
                  <span className="ml-[22px] max-w-[410px] text-[22px] font-bold uppercase leading-[1.16] tracking-[0.012em] transition-colors duration-300">
                    {section.title || `Schritt ${index + 1}`}
                  </span>
                </button>
              )
            })}
          </div>
        </section>

        {primaryCta?.label ? (
          <div className="absolute bottom-[58px] left-[64px] right-[72px] z-[4] flex items-end justify-between">
            <BottomBackLink href={backHref} markerUrl={catalogDetailPointActiveUrl}>
              Was wir bieten
            </BottomBackLink>
            <div className="w-[276px]">
              <Link
                href={ctaHref}
                className="group flex items-center justify-between pb-[20px] font-sans text-[22px] font-bold uppercase leading-none tracking-[0.02em] text-[#efb804] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-6 focus-visible:outline-[#efb804]"
              >
                <span>{primaryCta.label}</span>
                <ArrowRight
                  className="h-[16px] w-[22px] transition-transform group-hover:translate-x-1"
                  strokeWidth={2.8}
                  aria-hidden="true"
                />
              </Link>
              <span className="block h-px w-full bg-[#efb804]" aria-hidden="true" />
            </div>
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
