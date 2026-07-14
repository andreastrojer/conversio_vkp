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
  sections?: AboutSection[] | null
  navigationItems: ChapterNavigationItem[]
  logoUrl?: string
  inverseLogoUrl?: string
  logoAlt: string
  patternUrl?: string
  patternAlt?: string
  navigationArrowUrl?: string
  businessMapUrl?: string
  businessMapAlt?: string
}

const fallbackHeadline = 'WER WIR SIND'
const patternPositionClassName =
  'pointer-events-none absolute bottom-[-215px] right-[-240px] z-0 block h-[850px] w-[850px] bg-contain bg-center bg-no-repeat'
const patternFallbackClassName = `${patternPositionClassName} opacity-[0.08] [transform:rotate(30deg)]`
const contentPositionClassName =
  'absolute left-[60px] top-[47%] z-10 max-w-[520px] -translate-y-1/2'
const headlineClassName =
  'font-sans text-[50px] font-bold uppercase leading-[1.02] tracking-[0.024em]'

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

function resolveSectionTarget(target: string | null | undefined, customerType: CustomerGroup) {
  const trimmedTarget = target?.trim()

  if (!trimmedTarget) {
    return undefined
  }

  if (
    trimmedTarget.startsWith('/') ||
    trimmedTarget.startsWith('#') ||
    trimmedTarget.startsWith('http://') ||
    trimmedTarget.startsWith('https://')
  ) {
    return trimmedTarget
  }

  const normalizedTarget = trimmedTarget.toLocaleLowerCase('de-AT')
  const screenKey = normalizedTarget.includes(':') ? normalizedTarget.split(':').pop() || '' : normalizedTarget

  if (screenKey === 'offer' || screenKey === 'was-wir-bieten') {
    return `/offer?type=${customerType}`
  }

  return `/${screenKey}?type=${customerType}`
}

function AboutDetailContent({
  headline,
  sections,
  businessMapUrl,
  businessMapAlt,
  customerType,
}: {
  headline: string
  sections?: AboutSection[] | null
  businessMapUrl?: string
  businessMapAlt?: string
  customerType: CustomerGroup
}) {
  const contentSection =
    sections?.find((section) => section.visibleFor === customerType) ||
    sections?.find((section) => section.imageUrl || section.mediaImageUrl || section.media) ||
    sections?.[0]
  const sectionHeadline = contentSection?.title?.trim() || headline
  const textBlocks = splitTextBlocks(contentSection?.text)
  const trustBlockIndex = findTrustBlockIndex(textBlocks)
  const trustBlock = trustBlockIndex >= 0 ? textBlocks[trustBlockIndex] : undefined
  const descriptionBlocks =
    trustBlockIndex >= 0 ? textBlocks.filter((_, index) => index !== trustBlockIndex) : textBlocks
  const mapUrl = contentSection?.imageUrl || contentSection?.mediaImageUrl || businessMapUrl
  const mapAlt =
    contentSection?.mediaAltText ||
    contentSection?.mediaTitle ||
    businessMapAlt ||
    contentSection?.title ||
    ''
  const ctaLabel = contentSection?.cta?.label?.trim()
  const ctaHref =
    customerType === 'b2c'
      ? '/offer?type=b2c'
      : resolveSectionTarget(contentSection?.cta?.target, customerType)
  const ctaImageUrl = contentSection?.cta?.imageUrl

  return (
    <section className="relative z-[2] h-full w-full overflow-hidden">
      <div className="absolute left-[-90px] top-[clamp(-70px,calc(170px-12.5cqw),-10px)] z-[1] w-[78%]">
        {mapUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={mapUrl}
            alt={mapAlt}
            className="h-auto w-full max-w-none object-contain drop-shadow-[0_28px_30px_rgba(0,0,0,0.24)]"
          />
        ) : (
          <div className="h-[min(38vw,430px)] w-full rounded-[28px] border border-white/10" aria-hidden="true" />
        )}
      </div>

      <div className="absolute right-[48px] top-[244px] z-[2] flex w-[540px] flex-col items-start">
        <div className="inline-block -rotate-[1.25deg] bg-[#efb804] px-[32px] py-[9px] shadow-[0_14px_28px_rgba(0,0,0,0.10)]">
          <h1 className="font-sans text-[42px] font-extrabold uppercase leading-[0.92] tracking-[0.006em] text-[#3d4248]">
            {sectionHeadline}
          </h1>
        </div>

        {descriptionBlocks.length > 0 ? (
          <div className="mt-[82px] w-full translate-x-[8px] space-y-[2px] font-sans text-[20px] font-normal leading-[1.36] tracking-[0.006em] text-white">
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
          <div className="relative mt-[66px] w-full max-w-[500px] font-sans text-[18px] font-semibold uppercase leading-[1.18] tracking-[0.004em] text-white">
            <span className="absolute left-0 top-[2px] z-0 flex gap-[2px]" aria-hidden="true">
              <span className="block h-[10px] w-[4px] -skew-x-[12deg] bg-[#efb804]" />
              <span className="block h-[10px] w-[4px] -skew-x-[12deg] bg-[#efb804]" />
            </span>
            <p className="relative z-[1] pl-[12px]">{trustBlock.replace(/^[’‘'"„“]+/, '').trim()}</p>
          </div>
        ) : null}
      </div>

      {ctaLabel ? (
        <div className="absolute bottom-[58px] right-[72px] z-[3] w-[208px]">
          {ctaHref ? (
            <Link
              href={ctaHref}
              className="group flex items-center justify-between pb-[10px] font-sans text-[18px] font-bold uppercase leading-none tracking-[0.02em] text-[#efb804] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-6 focus-visible:outline-[#efb804]"
            >
              <span>{ctaLabel}</span>
              {ctaImageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={ctaImageUrl}
                  alt=""
                  className="h-[14px] w-[20px] object-contain transition-transform group-hover:translate-x-1"
                  aria-hidden="true"
                />
              ) : null}
            </Link>
          ) : (
            <span className="flex items-center justify-between pb-[10px] font-sans text-[18px] font-bold uppercase leading-none tracking-[0.02em] text-[#efb804]">
              <span>{ctaLabel}</span>
              {ctaImageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={ctaImageUrl} alt="" className="h-[14px] w-[20px] object-contain" aria-hidden="true" />
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
  sections,
  navigationItems,
  logoUrl,
  inverseLogoUrl,
  logoAlt,
  patternUrl,
  patternAlt,
  navigationArrowUrl,
  businessMapUrl,
  businessMapAlt,
}: AboutScreenProps) {
  const showsDetailedContent = customerType === 'b2c'
  const pageLogoUrl = inverseLogoUrl || logoUrl
  const navigationLogoUrl = logoUrl || inverseLogoUrl
  const resolvedHeadline = (headline?.trim() || fallbackHeadline).toLocaleUpperCase('de-AT')

  return (
    <PresentationViewport backgroundClassName="bg-[#3d4248]">
    <main className="relative isolate h-full w-full overflow-hidden bg-[#3d4248] font-sans text-white">
      {patternUrl ? (
        <span
          className={`${patternPositionClassName} opacity-[0.10] [filter:brightness(0)_invert(1)]`}
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
            className="absolute inset-[84px] border-[58px] border-solid border-white [clip-path:polygon(50%_0,92%_25%,92%_75%,50%_100%,8%_75%,8%_25%)]"
          />
          <span
            className="absolute bottom-[18px] left-[30px] right-[30px] h-[58px] bg-white [box-shadow:-84px_-184px_0_currentColor,122px_-332px_0_currentColor,-22px_-514px_0_currentColor] [transform:skewY(-31deg)]"
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

      {showsDetailedContent ? (
        <AboutDetailContent
          headline={resolvedHeadline}
          sections={sections}
          businessMapUrl={businessMapUrl}
          businessMapAlt={businessMapAlt}
          customerType={customerType}
        />
      ) : (
        <section className={contentPositionClassName}>
          <h1 className={`${headlineClassName} text-white`}>{resolvedHeadline}</h1>
        </section>
      )}

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
