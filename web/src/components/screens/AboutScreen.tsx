import { ChapterNavigation } from '@/components/navigation/ChapterNavigation'
import { PresentationViewport } from '@/components/layout/PresentationViewport'
import type { AboutSection } from '@/lib/about'
import type { ChapterNavigationItem } from '@/lib/about'
import { brandLogoImageClassName, brandLogoPositionClassName } from '@/lib/brandingLayout'
import type { CustomerGroup } from '@/lib/customerSelection'
import Link from 'next/link'

type AboutScreenProps = {
  customerType: CustomerGroup
  headline?: string | null
  activeRegion?: {
    label?: string | null
    text?: string | null
  } | null
  sections?: AboutSection[] | null
  navigationItems: ChapterNavigationItem[]
  logoUrl?: string
  inverseLogoUrl?: string
  logoAlt: string
  patternUrl?: string
  patternAlt?: string
  navigationArrowUrl?: string
  businessMapUrl?: string
  businessMapObjectPosition?: string
  businessMapAlt?: string
}

const fallbackHeadline = 'WER WIR SIND'
const patternPositionClassName =
  'pointer-events-none absolute bottom-[-215px] right-[-240px] z-0 block h-[850px] w-[850px] bg-contain bg-center bg-no-repeat'
const patternFallbackClassName = `${patternPositionClassName} opacity-[0.08] [transform:rotate(30deg)]`
function splitTextBlocks(text?: string | null) {
  return (text || '')
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean)
}

function splitTextLines(text: string) {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
}

function findTrustBlockIndex(blocks: string[]) {
  return blocks.findIndex((block) => {
    const normalizedBlock = block.trim().toLocaleLowerCase('de-AT')

    return (
      normalizedBlock.startsWith("'") ||
      normalizedBlock.startsWith('’') ||
      normalizedBlock.startsWith('‘') ||
      normalizedBlock.startsWith('"') ||
      normalizedBlock.startsWith('„') ||
      normalizedBlock.includes('ansprechpartner')
    )
  })
}

function renderHighlightedLine(line: string) {
  const separatorMatch = line.match(/^(.+?)(\s[–—-]\s)(.+)$/)

  if (separatorMatch) {
    return (
      <>
        <span className="font-bold text-[#efb804]">
          {separatorMatch[1].toLocaleUpperCase('de-AT')}
        </span>
        <span>{separatorMatch[2]}</span>
        <span>{separatorMatch[3]}</span>
      </>
    )
  }

  const plusValueMatch = line.match(/^([\d.]+\+)(\s+.+)$/)

  if (plusValueMatch) {
    return (
      <>
        <span className="font-bold text-[#efb804]">{plusValueMatch[1]}</span>
        <span>{plusValueMatch[2]}</span>
      </>
    )
  }

  const greaterThanValueMatch = line.match(/^(>\s*[\d.]+\s+\S+)(\s+.+)$/)

  if (greaterThanValueMatch) {
    return (
      <>
        <span className="font-bold text-[#efb804]">
          {greaterThanValueMatch[1].toLocaleUpperCase('de-AT')}
        </span>
        <span>{greaterThanValueMatch[2]}</span>
      </>
    )
  }

  const numericValueMatch = line.match(/^(\d+)(\s+[a-zäöü].+)$/)

  if (numericValueMatch) {
    return (
      <>
        <span className="font-bold text-[#efb804]">{numericValueMatch[1]}</span>
        <span>{numericValueMatch[2]}</span>
      </>
    )
  }

  const leadingEmphasisMatch = line.match(/^(\d+\s+\S+)(\s+.+)$/)

  if (leadingEmphasisMatch) {
    return (
      <>
        <span className="font-bold text-[#efb804]">
          {leadingEmphasisMatch[1].toLocaleUpperCase('de-AT')}
        </span>
        <span>{leadingEmphasisMatch[2]}</span>
      </>
    )
  }

  return line
}

function AboutDetailContent({
  headline,
  activeRegion,
  sections,
  businessMapUrl,
  businessMapObjectPosition,
  businessMapAlt,
  customerType,
  isBusiness,
}: {
  headline: string
  activeRegion?: {
    label?: string | null
    text?: string | null
  } | null
  sections?: AboutSection[] | null
  businessMapUrl?: string
  businessMapObjectPosition?: string
  businessMapAlt?: string
  customerType: CustomerGroup
  isBusiness: boolean
}) {
  const contentSection =
    sections?.find((section) => section.text?.trim()) ||
    sections?.find((section) => section.imageUrl || section.mediaImageUrl || section.media) ||
    sections?.[0]
  const sectionHeadline = contentSection?.title?.trim() || headline
  const textBlocks = splitTextBlocks(contentSection?.text)
  const trustBlockIndex = findTrustBlockIndex(textBlocks)
  const trustBlock = trustBlockIndex >= 0 ? textBlocks[trustBlockIndex] : undefined
  const descriptionBlocks =
    trustBlockIndex >= 0 ? textBlocks.filter((_, index) => index !== trustBlockIndex) : textBlocks
  const mapUrl = contentSection?.imageUrl || contentSection?.mediaImageUrl || businessMapUrl
  const mapObjectPosition =
    contentSection?.imageUrl
      ? contentSection.imageObjectPosition
      : contentSection?.mediaImageUrl
        ? contentSection.mediaImageObjectPosition
        : businessMapObjectPosition
  const mapAlt =
    contentSection?.mediaAltText ||
    contentSection?.mediaTitle ||
    businessMapAlt ||
    contentSection?.title ||
    ''
  const ctaLabel = contentSection?.cta?.label?.trim()
  const ctaHref = `/offer?type=${customerType}`
  const ctaImageUrl = contentSection?.cta?.imageUrl
  const activeRegionLabel = activeRegion?.label?.trim()
  const activeRegionText = activeRegion?.text?.trim()

  return (
    <section className="relative z-[2] h-full w-full overflow-hidden">
      <div className="absolute inset-0 z-[1]">
        {mapUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={mapUrl}
            alt={mapAlt}
            className="h-full w-full max-w-none object-cover object-center"
            style={mapObjectPosition ? {objectPosition: mapObjectPosition} : undefined}
          />
        ) : (
          <div
            className={`h-[min(38vw,430px)] w-full rounded-[28px] border ${
              isBusiness ? 'border-white/10' : 'border-[#2a2e33]/10'
            }`}
            aria-hidden="true"
          />
        )}
      </div>

      <div className="absolute left-[var(--about-content-left)] top-[314px] z-[2] flex w-[min(39%,600px)] flex-col items-start [--about-content-left:58.5%] [@media(min-width:1367px)_and_(max-width:1600px)]:[--about-content-left:65%] [@media(min-width:1601px)_and_(max-height:1100px)]:[--about-content-left:65%]">
        <div
          className={`inline-block max-w-full bg-[#efb804] py-[9px] shadow-[0_14px_28px_rgba(0,0,0,0.10)] ${
            isBusiness ? 'px-[24px]' : 'px-[32px]'
          }`}
        >
          <h1
            className={`whitespace-nowrap font-sans font-extrabold uppercase leading-[0.92] tracking-[0.006em] text-[#2a2e33] ${
              isBusiness ? 'text-[34px]' : 'text-[42px]'
            }`}
          >
            {sectionHeadline}
          </h1>
        </div>

        {descriptionBlocks.length > 0 ? (
          <div
            className={`w-full space-y-[2px] font-sans font-normal tracking-[0.006em] ${
              isBusiness
                ? 'mt-[78px] text-[28px] leading-[1.42] text-white'
                : 'mt-[78px] text-[28px] leading-[1.42] text-[#2a2e33]'
            }`}
          >
            {descriptionBlocks.map((block) => (
              <div key={block}>
                {splitTextLines(block).map((line) => (
                  <p key={line}>{renderHighlightedLine(line)}</p>
                ))}
              </div>
            ))}
          </div>
        ) : null}

        {trustBlock ? (
          <div
            className={`relative w-full max-w-[560px] font-sans font-semibold uppercase leading-[1.18] tracking-[0.004em] ${
              isBusiness
                ? 'mt-[76px] text-[22px] text-white'
                : 'mt-[76px] text-[22px] text-[#2a2e33]'
            }`}
          >
            <span className="absolute left-[2px] top-[2px] z-[2] flex gap-[2px]" aria-hidden="true">
              <span className="block h-[10px] w-[4px] -skew-x-[12deg] bg-[#efb804]" />
              <span className="block h-[10px] w-[4px] -skew-x-[12deg] bg-[#efb804]" />
            </span>
            <p className="relative z-[3] pl-[7px]">{trustBlock.replace(/^[’‘'"„“]+/, '').trim()}</p>
          </div>
        ) : null}
      </div>

      {activeRegionText ? (
        <div
          className={`absolute bottom-[58px] left-[72px] z-[3] max-w-[620px] font-sans tracking-[0.012em] ${
            isBusiness ? 'text-white' : 'text-[#2a2e33]'
          }`}
        >
          {activeRegionLabel ? (
            <p className="mb-[12px] text-[18px] font-medium leading-none">{activeRegionLabel}</p>
          ) : null}
          <div className="space-y-[2px] text-[18px] font-bold uppercase leading-[1.05]">
            {splitTextLines(activeRegionText).map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>
        </div>
      ) : null}

      {ctaLabel ? (
        <div className="absolute bottom-[58px] right-[72px] z-[3] w-[208px]">
          {ctaHref ? (
            <Link
              href={ctaHref}
              className="group flex items-center justify-between pb-[20px] font-sans text-[22px] font-bold uppercase leading-none tracking-[0.02em] text-[#efb804] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-6 focus-visible:outline-[#efb804]"
            >
              <span>{ctaLabel}</span>
              {ctaImageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={ctaImageUrl}
                  alt=""
                  className="h-[16px] w-[22px] object-contain transition-transform group-hover:translate-x-1"
                  aria-hidden="true"
                />
              ) : null}
            </Link>
          ) : (
            <span className="flex items-center justify-between pb-[20px] font-sans text-[22px] font-bold uppercase leading-none tracking-[0.02em] text-[#efb804]">
              <span>{ctaLabel}</span>
              {ctaImageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={ctaImageUrl} alt="" className="h-[16px] w-[22px] object-contain" aria-hidden="true" />
              ) : null}
            </span>
          )}
          <span className="block h-px w-full bg-[#efb804]" aria-hidden="true" />
        </div>
      ) : null}
    </section>
  )
}

export function AboutScreen({
  customerType,
  headline,
  activeRegion,
  sections,
  navigationItems,
  logoUrl,
  inverseLogoUrl,
  logoAlt,
  patternUrl,
  patternAlt,
  navigationArrowUrl,
  businessMapUrl,
  businessMapObjectPosition,
  businessMapAlt,
}: AboutScreenProps) {
  const isBusiness = customerType === 'b2b'
  const pageLogoUrl = isBusiness ? inverseLogoUrl || logoUrl : logoUrl || inverseLogoUrl
  const navigationLogoUrl = isBusiness
    ? logoUrl || inverseLogoUrl
    : inverseLogoUrl || logoUrl
  const resolvedHeadline = (headline?.trim() || fallbackHeadline).toLocaleUpperCase('de-AT')

  return (
    <PresentationViewport backgroundClassName={isBusiness ? 'bg-[#2a2e33]' : 'bg-[#f5f5f7]'}>
    <main
      className={`relative isolate h-full w-full overflow-hidden font-sans ${
        isBusiness ? 'bg-[#2a2e33] text-white' : 'bg-[#f5f5f7] text-[#2a2e33]'
      }`}
    >
      {patternUrl ? (
        <span
          className={`${patternPositionClassName} ${
            isBusiness
              ? 'opacity-[0.10] [filter:brightness(0)_invert(1)]'
              : 'opacity-[0.86] mix-blend-normal [filter:brightness(0)_saturate(100%)_invert(86%)_sepia(5%)_saturate(126%)_hue-rotate(178deg)_brightness(96%)_contrast(90%)]'
          }`}
          style={{ backgroundImage: `url("${patternUrl}")` }}
          title={patternAlt || undefined}
          aria-hidden="true"
        />
      ) : (
        <span
          aria-hidden="true"
          className={`${patternFallbackClassName} opacity-[0.07]`}
        >
          <span
            className={`absolute inset-[84px] border-[58px] border-solid ${
              isBusiness ? 'border-white' : 'border-[#2a2e33]'
            } [clip-path:polygon(50%_0,92%_25%,92%_75%,50%_100%,8%_75%,8%_25%)]`}
          />
          <span
            className={`absolute bottom-[18px] left-[30px] right-[30px] h-[58px] ${
              isBusiness ? 'bg-white' : 'bg-[#2a2e33]'
            } [box-shadow:-84px_-184px_0_currentColor,122px_-332px_0_currentColor,-22px_-514px_0_currentColor] [transform:skewY(-31deg)]`}
          />
        </span>
      )}

      <div className={brandLogoPositionClassName}>
        <Link href="/" className="block w-max" aria-label="Zur Welcome-Seite">
          {pageLogoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={pageLogoUrl} alt={logoAlt} className={brandLogoImageClassName} />
          ) : (
            <span className="text-[21px] font-bold uppercase tracking-[0.08em]">Conversio Energie</span>
          )}
        </Link>
      </div>

      <AboutDetailContent
        headline={resolvedHeadline}
        activeRegion={activeRegion}
        sections={sections}
        businessMapUrl={businessMapUrl}
        businessMapObjectPosition={businessMapObjectPosition}
        businessMapAlt={businessMapAlt}
        customerType={customerType}
        isBusiness={isBusiness}
      />

      <ChapterNavigation
        customerType={customerType}
        items={navigationItems}
        currentKey="about"
        logoUrl={navigationLogoUrl}
        logoAlt={logoAlt}
        navigationArrowUrl={navigationArrowUrl}
      />
    </main>
    </PresentationViewport>
  )
}
