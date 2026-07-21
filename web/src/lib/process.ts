import {getAboutPageData, type ChapterNavigationItem} from '@/lib/about'
import {buildImageUrl, buildLogoUrl, type SanityImage} from '@/lib/authBranding'
import type {CustomerGroup} from '@/lib/customerSelection'
import {PROCESS_SCREEN_QUERY} from '@/lib/queries'
import {sanityClient} from '@/lib/sanity'

type ProcessMedia = {
  title?: string | null
  altText?: string | null
  mediaType?: string | null
  externalUrl?: string | null
  fileUrl?: string | null
  image?: SanityImage
} | null

export type ProcessSection = {
  _key?: string | null
  title?: string | null
  eyebrow?: string | null
  text?: string | null
  visibleFor?: string | null
  layout?: string | null
  sortOrder?: number | null
  image?: SanityImage
  media?: ProcessMedia
  cta?: {
    label?: string | null
    target?: string | null
    style?: string | null
    image?: SanityImage
  } | null
  imageUrl?: string
  mediaImageUrl?: string
}

type ProcessScreenDocument = {
  title?: string | null
  screenKey?: string | null
  screenType?: string | null
  purpose?: string | null
  targetAudience?: string | null
  headline?: string | null
  subline?: string | null
  isActive?: boolean | null
  heroImage?: SanityImage
  heroImage2?: SanityImage
  heroMedia?: ProcessMedia
  primaryCta?: {
    label?: string | null
    target?: string | null
  } | null
  sections?: ProcessSection[] | null
} | null

export type ProcessPageData = {
  headline?: string | null
  subline?: string | null
  sections: ProcessSection[]
  activeRingImageUrl?: string
  inactiveRingImageUrl?: string
  ringImageAlt: string
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

const processClient = sanityClient.withConfig({useCdn: false})
const freshFetchOptions = {cache: 'no-store' as const}

function sortSections(a: ProcessSection, b: ProcessSection) {
  const aOrder = typeof a.sortOrder === 'number' ? a.sortOrder : Number.POSITIVE_INFINITY
  const bOrder = typeof b.sortOrder === 'number' ? b.sortOrder : Number.POSITIVE_INFINITY

  return aOrder - bOrder
}

export async function getProcessPageData(customerType: CustomerGroup): Promise<ProcessPageData> {
  const sharedContentPromise = getAboutPageData(customerType)
  const screenKey = customerType === 'b2c' ? 'process' : 'process2'

  try {
    const [screen, sharedContent] = await Promise.all([
      processClient.fetch<ProcessScreenDocument>(
        PROCESS_SCREEN_QUERY,
        {screenKey},
        freshFetchOptions,
      ),
      sharedContentPromise,
    ])

    const sections = (screen?.sections || [])
      .sort(sortSections)
      .map((section) => ({
        ...section,
        imageUrl: buildImageUrl(section.image, 1600, undefined, 100),
        mediaImageUrl: buildImageUrl(section.media?.image, 1600, undefined, 100),
      }))

    return {
      headline: screen?.headline,
      subline: screen?.subline,
      sections,
      activeRingImageUrl:
        buildLogoUrl(screen?.heroImage) ||
        buildImageUrl(screen?.heroMedia?.image, 1600, undefined, 100),
      inactiveRingImageUrl:
        buildLogoUrl(screen?.heroImage2) ||
        buildImageUrl(screen?.heroMedia?.image, 1600, undefined, 100),
      ringImageAlt: screen?.heroMedia?.altText || screen?.heroMedia?.title || 'Prozessring',
      primaryCta: screen?.primaryCta,
      navigationItems: sharedContent.navigationItems,
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
      ringImageAlt: 'Prozessring',
      navigationItems: sharedContent.navigationItems,
      logoUrl: sharedContent.logoUrl,
      inverseLogoUrl: sharedContent.inverseLogoUrl,
      logoAlt: sharedContent.logoAlt,
      patternUrl: sharedContent.patternUrl,
      patternAlt: sharedContent.patternAlt,
      navigationArrowUrl: sharedContent.navigationArrowUrl,
    }
  }
}
