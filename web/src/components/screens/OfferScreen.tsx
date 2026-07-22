'use client'

import {ChapterNavigation} from '@/components/navigation/ChapterNavigation'
import {PresentationViewport} from '@/components/layout/PresentationViewport'
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

type OfferTextBlock =
  | {type: 'paragraph'; text: string}
  | {type: 'list'; items: string[]}

const patternClassName =
  'pointer-events-none absolute bottom-[-215px] right-[-240px] z-0 h-[850px] w-[850px] bg-contain bg-center bg-no-repeat'

function sectionKey(section: OfferSection, index: number) {
  return section._key || `offer-section-${index}`
}

function parseOfferText(text: string): OfferTextBlock[] {
  const blocks: OfferTextBlock[] = []
  let paragraphLines: string[] = []
  let listItems: string[] = []

  function flushParagraph() {
    if (paragraphLines.length > 0) {
      blocks.push({type: 'paragraph', text: paragraphLines.join(' ')})
      paragraphLines = []
    }
  }

  function flushList() {
    if (listItems.length > 0) {
      blocks.push({type: 'list', items: listItems})
      listItems = []
    }
  }

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim()

    if (!line) {
      flushParagraph()
      flushList()
      continue
    }

    const bullet = line.match(/^(?:[•●▪◦‣⁃]|-|\*)\s+(.+)$/)

    if (bullet) {
      flushParagraph()
      listItems.push(bullet[1])
      continue
    }

    if (listItems.length > 0) {
      listItems[listItems.length - 1] = `${listItems[listItems.length - 1]} ${line}`
    } else {
      paragraphLines.push(line)
    }
  }

  flushParagraph()
  flushList()

  return blocks
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
    return `/process?type=${customerType}`
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
  const isBusiness = customerType === 'b2b'
  const pageLogoUrl = isBusiness ? inverseLogoUrl || logoUrl : logoUrl || inverseLogoUrl
  const navigationLogoUrl = isBusiness
    ? logoUrl || inverseLogoUrl
    : inverseLogoUrl || logoUrl
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
    <PresentationViewport backgroundClassName={isBusiness ? 'bg-[#3d4248]' : 'bg-white'}>
    <main
      className={`relative isolate h-full w-full overflow-hidden font-sans ${
        isBusiness ? 'bg-[#3d4248] text-white' : 'bg-white text-[#3d4248]'
      }`}
    >
      {patternUrl ? (
        <span
          className={`${patternClassName} ${
            isBusiness
              ? 'opacity-[0.065] [filter:brightness(0)_invert(1)]'
              : 'opacity-[0.08] [filter:brightness(0)_saturate(100%)_invert(25%)_sepia(7%)_saturate(442%)_hue-rotate(169deg)_brightness(91%)_contrast(83%)]'
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

      <section className="absolute inset-x-0 bottom-0 top-[150px] z-[2]">
        <div className="absolute bottom-[18px] left-0 h-[740px] w-[1050px] [@media(min-width:768px)_and_(max-width:1366px)]:h-[650px] [@media(min-width:768px)_and_(max-width:1366px)]:w-[920px]">
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
                <div
                  className={`h-[72%] w-[88%] border ${
                    isBusiness
                      ? 'border-white/5 bg-white/[0.015]'
                      : 'border-[#3d4248]/5 bg-[#3d4248]/[0.015]'
                  }`}
                  aria-hidden="true"
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="absolute right-[72px] top-[55px] z-[3] w-[440px]">
          {sections.length > 0 ? (
            <div role="presentation">
              {sections.map((section, index) => {
                const key = sectionKey(section, index)
                const isActive = index === safeActiveIndex
                const contentId = `${key}-content`

                return (
                  <div
                    key={key}
                    className={
                      isActive
                        ? 'pb-[26px]'
                        : `border-b-2 ${isBusiness ? 'border-white/90' : 'border-[#3d4248]/80'}`
                    }
                  >
                    <button
                      type="button"
                      className={`flex w-full items-center justify-between gap-6 py-[20px] text-left font-sans text-[22px] font-bold uppercase leading-none transition-colors duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#efb804] max-[1600px]:text-[24px] [@media(max-height:920px)]:text-[24px] ${
                        isActive
                          ? 'text-[#efb804]'
                          : isBusiness
                            ? 'text-white'
                            : 'text-[#3d4248]'
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

                    {isActive ? (
                      <motion.div
                        id={contentId}
                        initial={{opacity: 0, y: -6}}
                        animate={{opacity: 1, y: 0}}
                        transition={{duration: 0.22, ease: [0.22, 1, 0.36, 1]}}
                      >
                        <div className="pb-[18px] pt-[24px]">
                          {section.eyebrow && section.eyebrow !== section.title ? (
                              <p className="mb-2 text-[13px] font-semibold uppercase tracking-[0.08em] text-[#efb804] max-[1600px]:text-[15px] [@media(max-height:920px)]:text-[15px]">
                                {section.eyebrow}
                              </p>
                          ) : null}
                          {section.text ? (
                              <div
                                className={`max-w-[420px] space-y-[22px] text-[18px] font-normal leading-[1.42] tracking-[0.025em] max-[1600px]:text-[20px] [@media(max-height:920px)]:text-[20px] ${
                                  isBusiness ? 'text-white/95' : 'text-[#3d4248]/95'
                                }`}
                              >
                                {parseOfferText(section.text).map((block, blockIndex) =>
                                  block.type === 'paragraph' ? (
                                    <p key={`paragraph-${blockIndex}`}>{block.text}</p>
                                  ) : (
                                    <ul
                                      key={`list-${blockIndex}`}
                                      className="space-y-[1px] pl-[12px]"
                                      role="list"
                                    >
                                      {block.items.map((item, itemIndex) => (
                                        <li
                                          key={`${item}-${itemIndex}`}
                                          className="grid grid-cols-[8px_minmax(0,1fr)] items-start gap-[10px]"
                                        >
                                          <span className="pt-[1px] text-[15px] leading-[1.42]" aria-hidden="true">
                                            •
                                          </span>
                                          <span>{item}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  ),
                                )}
                              </div>
                          ) : null}
                        </div>
                      </motion.div>
                    ) : null}
                  </div>
                )
              })}
            </div>
          ) : (
            <div
              className={`min-h-[340px] border-y ${
                isBusiness ? 'border-white/20' : 'border-[#3d4248]/20'
              }`}
              aria-label="Keine Angebote vorhanden"
            />
          )}
        </div>
      </section>

      {primaryCta?.label ? (
        <div className="absolute bottom-[58px] right-[72px] z-[4] w-[208px]">
          {ctaHref ? (
            <Link
              href={ctaHref}
              className="group flex items-center justify-between pb-[10px] font-sans text-[18px] font-bold uppercase leading-none tracking-[0.02em] text-[#efb804] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-6 focus-visible:outline-[#efb804] max-[1600px]:text-[20px] [@media(max-height:920px)]:text-[20px]"
            >
              <span>{primaryCta.label}</span>
              <ArrowRight className="h-[14px] w-[20px] transition-transform group-hover:translate-x-1" strokeWidth={2.2} aria-hidden="true" />
            </Link>
          ) : (
            <div className="flex items-center justify-between pb-[10px] font-sans text-[18px] font-bold uppercase leading-none tracking-[0.02em] text-[#efb804] max-[1600px]:text-[20px] [@media(max-height:920px)]:text-[20px]">
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
    </PresentationViewport>
  )
}
