import {getAboutPageData, type ChapterNavigationItem} from '@/lib/about'
import {buildImageUrl, buildLogoUrl, type SanityImage} from '@/lib/authBranding'
import type {CustomerGroup} from '@/lib/customerSelection'
import {OFFER_SCREEN_QUERY} from '@/lib/queries'
import {sanityClient} from '@/lib/sanity'

type OfferMedia = {
  title?: string | null
  altText?: string | null
  mediaType?: string | null
  externalUrl?: string | null
  fileUrl?: string | null
  image?: SanityImage
} | null

export type OfferSection = {
  _key?: string | null
  title?: string | null
  eyebrow?: string | null
  text?: string | null
  visibleFor?: string | null
  layout?: string | null
  sortOrder?: number | null
  image?: SanityImage
  media?: OfferMedia
  cta?: {
    label?: string | null
    target?: string | null
    style?: string | null
    image?: SanityImage
  } | null
  imageUrl?: string
  mediaImageUrl?: string
  mediaUrl?: string
  mediaType?: string | null
  mediaAlt?: string
}

type OfferScreenDocument = {
  title?: string | null
  screenKey?: string | null
  screenType?: string | null
  purpose?: string | null
  targetAudience?: string | null
  headline?: string | null
  subline?: string | null
  isActive?: boolean | null
  heroImage?: SanityImage
  heroMedia?: OfferMedia
  primaryCta?: {
    label?: string | null
    target?: string | null
  } | null
  sections?: OfferSection[] | null
} | null

export type OfferPageData = {
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

const offerClient = sanityClient.withConfig({useCdn: false})
const freshFetchOptions = {cache: 'no-store' as const}

function isVisibleFor(section: OfferSection, customerType: CustomerGroup) {
  return !section.visibleFor || section.visibleFor === 'both' || section.visibleFor === customerType
}

function sortSections(a: OfferSection, b: OfferSection) {
  const aOrder = typeof a.sortOrder === 'number' ? a.sortOrder : Number.POSITIVE_INFINITY
  const bOrder = typeof b.sortOrder === 'number' ? b.sortOrder : Number.POSITIVE_INFINITY

  return aOrder - bOrder
}

function resolveMediaUrl(media: OfferMedia | undefined) {
  return media?.fileUrl || media?.externalUrl || undefined
}

export async function getOfferPageData(customerType: CustomerGroup): Promise<OfferPageData> {
  const sharedContentPromise = getAboutPageData(customerType)

  try {
    const [screen, sharedContent] = await Promise.all([
      offerClient.fetch<OfferScreenDocument>(OFFER_SCREEN_QUERY, {}, freshFetchOptions),
      sharedContentPromise,
    ])

    const sections = (screen?.sections || [])
      .filter((section) => isVisibleFor(section, customerType))
      .sort(sortSections)
      .map((section) => ({
        ...section,
        imageUrl: buildImageUrl(section.image, 2400, undefined, 100),
        mediaImageUrl: buildImageUrl(section.media?.image, 2400, undefined, 100),
        mediaUrl: resolveMediaUrl(section.media),
        mediaType: section.media?.mediaType,
        mediaAlt: section.media?.altText || section.media?.title || section.title || '',
        cta: section.cta
          ? {
              ...section.cta,
              image: section.cta.image,
              imageUrl:
                buildLogoUrl(section.cta.image) ||
                buildImageUrl(section.cta.image, 96, undefined, 100),
            }
          : null,
      }))

    return {
      headline: screen?.headline,
      subline: screen?.subline,
      sections,
      heroImageUrl: buildImageUrl(screen?.heroImage, 2400, undefined, 100),
      heroMediaImageUrl: buildImageUrl(screen?.heroMedia?.image, 2400, undefined, 100),
      heroMediaUrl: resolveMediaUrl(screen?.heroMedia),
      heroMediaType: screen?.heroMedia?.mediaType,
      heroMediaAlt: screen?.heroMedia?.altText || screen?.heroMedia?.title || '',
      primaryCta: screen?.primaryCta,
      navigationItems: sharedContent.navigationItems.map((item) => ({
        ...item,
        href:
          item.key === 'about'
            ? `/about?type=${customerType}`
            : item.key === 'offer' && customerType === 'b2c'
              ? `/offer?type=${customerType}`
              : item.href,
      })),
      logoUrl: sharedContent.logoUrl,
      inverseLogoUrl: sharedContent.inverseLogoUrl,
      logoAlt: sharedContent.logoAlt,
      patternUrl: sharedContent.patternUrl,
      patternAlt: sharedContent.patternAlt,
      navigationArrowUrl: sharedContent.navigationArrowUrl,
    }
  } catch {
    const sharedContent = await sharedContentPromise

    return {
      sections: [],
      navigationItems: sharedContent.navigationItems.map((item) => ({
        ...item,
        href:
          item.key === 'about'
            ? `/about?type=${customerType}`
            : item.key === 'offer' && customerType === 'b2c'
              ? `/offer?type=${customerType}`
              : item.href,
      })),
      logoUrl: sharedContent.logoUrl,
      inverseLogoUrl: sharedContent.inverseLogoUrl,
      logoAlt: sharedContent.logoAlt,
      patternUrl: sharedContent.patternUrl,
      patternAlt: sharedContent.patternAlt,
      navigationArrowUrl: sharedContent.navigationArrowUrl,
    }
  }
}
