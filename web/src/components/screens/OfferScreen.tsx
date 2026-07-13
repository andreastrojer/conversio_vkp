'use client'

import {ChapterNavigation} from '@/components/navigation/ChapterNavigation'
import type {ChapterNavigationItem} from '@/lib/about'
import {
  brandLogoImageClassName,
  brandLogoPositionClassName,
} from '@/lib/brandingLayout'
import type {CustomerGroup} from '@/lib/customerSelection'
import type {OfferSection} from '@/lib/offer'
import {AnimatePresence, motion} from 'framer-motion'
import {ArrowRight, Hexagon} from 'lucide-react'
import Link from 'next/link'
import {useMemo, useState} from 'react'

type OfferScreenProps = {
  customerType: CustomerGroup
  headline?: string | null
  subline?: string | null
  sections: OfferSection[]
  heroImageUrl?: string
  heroMediaImageUrl?: string
  heroMediaUrl?: string
  heroMediaType?: string | null
  heroMediaAlt?: string
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

type ResolvedMedia = {
  key: string
  kind: 'image' | 'video' | 'empty'
  url?: string
  alt: string
}

const patternClassName =
  'pointer-events-none fixed bottom-[-280px] right-[-250px] z-0 h-[900px] w-[900px] bg-contain bg-center bg-no-repeat opacity-[0.065] [filter:brightness(0)_invert(1)]'

function sectionKey(section: OfferSection, index: number) {
  return section._key || `offer-section-${index}`
}

function isVideoMedia(mediaType?: string | null) {
  return mediaType === 'video' || mediaType === 'droneVideo'
}

function resolveActiveMedia(
  section: OfferSection,
  index: number,
  heroImageUrl?: string,
  heroMediaImageUrl?: string,
  heroMediaUrl?: string,
  heroMediaType?: string | null,
  heroMediaAlt?: string,
): ResolvedMedia {
  const key = sectionKey(section, index)
  const sectionAlt = section.mediaAlt || section.title || ''

  if (section.imageUrl) {
    return {key: `${key}-image`, kind: 'image', url: section.imageUrl, alt: sectionAlt}
  }

  if (section.mediaImageUrl) {
    return {key: `${key}-media-image`, kind: 'image', url: section.mediaImageUrl, alt: sectionAlt}
  }

  if (section.mediaUrl && isVideoMedia(section.mediaType)) {
    return {key: `${key}-media-video`, kind: 'video', url: section.mediaUrl, alt: sectionAlt}
  }

  if (heroImageUrl) {
    return {key: `${key}-hero-image`, kind: 'image', url: heroImageUrl, alt: heroMediaAlt || ''}
  }

  if (heroMediaImageUrl) {
    return {key: `${key}-hero-media-image`, kind: 'image', url: heroMediaImageUrl, alt: heroMediaAlt || ''}
  }

  if (heroMediaUrl && isVideoMedia(heroMediaType)) {
    return {key: `${key}-hero-media-video`, kind: 'video', url: heroMediaUrl, alt: heroMediaAlt || ''}
  }

  return {key: `${key}-empty`, kind: 'empty', alt: ''}
}

function resolveTarget(target: string | null | undefined, customerType: CustomerGroup) {
  const normalizedTarget = target?.trim()

  if (!normalizedTarget || normalizedTarget === 'next') {
    return undefined
  }

  if (normalizedTarget.startsWith('/')) {
    return normalizedTarget
  }

  const screenKey = normalizedTarget.includes(':')
    ? normalizedTarget.split(':').pop() || ''
    : normalizedTarget

  return screenKey ? `/${screenKey}?type=${customerType}` : undefined
}

export function OfferScreen({
  customerType,
  sections,
  heroImageUrl,
  heroMediaImageUrl,
  heroMediaUrl,
  heroMediaType,
  heroMediaAlt,
  primaryCta,
  navigationItems,
  logoUrl,
  inverseLogoUrl,
  logoAlt,
  patternUrl,
  patternAlt,
  navigationArrowUrl,
}: OfferScreenProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const safeActiveIndex = sections.length > 0 ? Math.min(activeIndex, sections.length - 1) : 0
  const activeSection = sections[safeActiveIndex]
  const pageLogoUrl = inverseLogoUrl || logoUrl
  const navigationLogoUrl = logoUrl || inverseLogoUrl
  const activeMedia = useMemo(
    () =>
      activeSection
        ? resolveActiveMedia(
            activeSection,
            safeActiveIndex,
            heroImageUrl,
            heroMediaImageUrl,
            heroMediaUrl,
            heroMediaType,
            heroMediaAlt,
          )
        : ({key: 'empty', kind: 'empty', alt: ''} satisfies ResolvedMedia),
    [
      activeSection,
      heroImageUrl,
      heroMediaAlt,
      heroMediaImageUrl,
      heroMediaType,
      heroMediaUrl,
      safeActiveIndex,
    ],
  )
  const ctaHref = resolveTarget(primaryCta?.target, customerType)

  return (
    <main className="relative isolate min-h-screen w-screen overflow-hidden bg-[#3d4248] font-sans text-white">
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

      <section className="absolute inset-x-0 bottom-0 top-[150px] z-[2] max-[900px]:relative max-[900px]:top-auto max-[900px]:flex max-[900px]:min-h-screen max-[900px]:flex-col max-[900px]:pt-[150px]">
        <div className="absolute bottom-[18px] left-0 h-[min(63vw,690px)] w-[min(58vw,980px)] max-[900px]:relative max-[900px]:bottom-auto max-[900px]:h-[52vh] max-[900px]:w-full">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={activeMedia.key}
              initial={{opacity: 0, x: -12, scale: 0.992}}
              animate={{opacity: 1, x: 0, scale: 1}}
              exit={{opacity: 0, x: 8, scale: 0.995}}
              transition={{duration: 0.38, ease: [0.22, 1, 0.36, 1]}}
              className="absolute inset-0 flex items-end justify-start"
            >
              {activeMedia.kind === 'image' && activeMedia.url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={activeMedia.url}
                  alt={activeMedia.alt}
                  className="h-full w-full object-contain object-left-bottom"
                />
              ) : activeMedia.kind === 'video' && activeMedia.url ? (
                <video
                  src={activeMedia.url}
                  aria-label={activeMedia.alt || undefined}
                  className="h-full w-full object-contain object-left-bottom"
                  autoPlay
                  loop
                  muted
                  playsInline
                />
              ) : (
                <div className="h-[72%] w-[88%] border border-white/5 bg-white/[0.015]" aria-hidden="true" />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="absolute right-[clamp(58px,4.1vw,72px)] top-[2vh] z-[3] w-[min(34vw,440px)] max-[1180px]:w-[390px] max-[900px]:relative max-[900px]:right-auto max-[900px]:top-auto max-[900px]:mx-auto max-[900px]:mt-8 max-[900px]:w-[86vw]">
          {sections.length > 0 ? (
            <div role="presentation">
              {sections.map((section, index) => {
                const key = sectionKey(section, index)
                const isActive = index === safeActiveIndex
                const contentId = `${key}-content`

                return (
                  <div key={key} className={isActive ? 'pb-[26px]' : 'border-b-2 border-white/90'}>
                    <button
                      type="button"
                      className={`flex w-full items-center justify-between gap-6 py-[20px] text-left font-sans text-[22px] font-bold uppercase leading-none transition-colors duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#efb804] ${
                        isActive ? 'text-[#efb804]' : 'text-white'
                      }`}
                      aria-expanded={isActive}
                      aria-controls={contentId}
                      onClick={() => setActiveIndex(index)}
                    >
                      <span>{section.title || section.eyebrow || `Angebot ${index + 1}`}</span>
                      <Hexagon
                        className="h-[21px] w-[21px] shrink-0"
                        strokeWidth={2.4}
                        aria-hidden="true"
                      />
                    </button>

                    <AnimatePresence initial={false}>
                      {isActive ? (
                        <motion.div
                          id={contentId}
                          initial={{height: 0, opacity: 0, y: -8}}
                          animate={{height: 'auto', opacity: 1, y: 0}}
                          exit={{height: 0, opacity: 0, y: -8}}
                          transition={{duration: 0.4, ease: [0.22, 1, 0.36, 1]}}
                          className="overflow-hidden"
                        >
                          <div className="pb-[18px] pt-[24px]">
                            {section.eyebrow && section.eyebrow !== section.title ? (
                              <p className="mb-2 text-[13px] font-semibold uppercase tracking-[0.08em] text-[#efb804]">
                                {section.eyebrow}
                              </p>
                            ) : null}
                            {section.text ? (
                              <p className="max-w-[420px] whitespace-pre-line text-[18px] font-normal leading-[1.42] tracking-[0.025em] text-white/95">
                                {section.text}
                              </p>
                            ) : null}
                          </div>
                        </motion.div>
                      ) : null}
                    </AnimatePresence>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="min-h-[340px] border-y border-white/20" aria-label="Keine Angebote vorhanden" />
          )}
        </div>
      </section>

      {primaryCta?.label ? (
        <div className="absolute bottom-[58px] right-[clamp(58px,4.1vw,72px)] z-[4] w-[208px] max-[900px]:hidden">
          {ctaHref ? (
            <Link
              href={ctaHref}
              className="group flex items-center justify-between pb-[10px] font-sans text-[18px] font-bold uppercase leading-none tracking-[0.02em] text-[#efb804] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-6 focus-visible:outline-[#efb804]"
            >
              <span>{primaryCta.label}</span>
              <ArrowRight className="h-[14px] w-[20px] transition-transform group-hover:translate-x-1" strokeWidth={2.2} aria-hidden="true" />
            </Link>
          ) : (
            <div className="flex items-center justify-between pb-[10px] font-sans text-[18px] font-bold uppercase leading-none tracking-[0.02em] text-[#efb804]">
              <span>{primaryCta.label}</span>
              <ArrowRight className="h-[14px] w-[20px]" strokeWidth={2.2} aria-hidden="true" />
            </div>
          )}
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
  )
}
