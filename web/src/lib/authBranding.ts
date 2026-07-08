import {
  LOGIN_RIGHT_PATTERN_QUERY,
  LOGIN_SCREEN_QUERY,
  SITE_SETTINGS_QUERY,
} from '@/lib/queries'
import {sanityClient, urlForImage} from '@/lib/sanity'

export type SanityImage = {
  asset?: {_ref?: string; _id?: string; url?: string} | null
  assetUrl?: string | null
  mimeType?: string | null
  extension?: string | null
  originalFilename?: string | null
  crop?: unknown
  hotspot?: unknown
} | null

export type LoginScreenDocument = {
  title?: string | null
  screenKey?: string | null
  headline?: string | null
  subline?: string | null
  heroImage?: SanityImage
  heroMedia?: {
    title?: string | null
    altText?: string | null
    mediaType?: string | null
    image?: SanityImage
  } | null
  primaryCta?: {
    label?: string | null
    target?: string | null
  } | null
} | null

export type SiteSettingsDocument = {
  title?: string | null
  companyName?: string | null
  logo?: SanityImage
  logoDark?: SanityImage
  contact?: {
    address?: string | null
  } | null
  legalLinks?: {
    label?: string | null
    url?: string | null
  }[] | null
} | null

type LoginPatternDocument = {
  title?: string | null
  altText?: string | null
  image?: SanityImage
} | null

type AuthPageContent = {
  screen: LoginScreenDocument
  siteSettings: SiteSettingsDocument
  rightPattern: LoginPatternDocument
}

const authBrandingClient = sanityClient.withConfig({useCdn: false})
const freshFetchOptions = {cache: 'no-store' as const}

export function buildImageUrl(image: SanityImage | undefined, width: number, height?: number, quality = 85) {
  if (!image?.asset) {
    return undefined
  }

  try {
    let builder = urlForImage(image).width(width).fit('max').auto('format').quality(quality)

    if (height) {
      builder = builder.height(height).fit('crop')
    }

    return builder.url()
  } catch {
    return undefined
  }
}

export function buildLogoUrl(image: SanityImage | undefined) {
  if (!image?.asset) {
    return undefined
  }

  const directAssetUrl = image.assetUrl || image.asset.url
  const isSvg =
    image.mimeType === 'image/svg+xml' ||
    image.extension === 'svg' ||
    image.originalFilename?.toLowerCase().endsWith('.svg') ||
    directAssetUrl?.toLowerCase().endsWith('.svg') ||
    image.asset._ref?.endsWith('-svg')

  if (isSvg && directAssetUrl) {
    return directAssetUrl
  }

  try {
    return urlForImage(image).width(400).fit('max').quality(100).url()
  } catch {
    return undefined
  }
}

export async function getAuthPageContent(): Promise<AuthPageContent> {
  try {
    const [screen, siteSettings, rightPattern] = await Promise.all([
      authBrandingClient.fetch<LoginScreenDocument>(LOGIN_SCREEN_QUERY, {}, freshFetchOptions),
      authBrandingClient.fetch<SiteSettingsDocument>(SITE_SETTINGS_QUERY, {}, freshFetchOptions),
      authBrandingClient.fetch<LoginPatternDocument>(LOGIN_RIGHT_PATTERN_QUERY, {}, freshFetchOptions),
    ])

    return {screen, siteSettings, rightPattern}
  } catch {
    return {
      screen: null,
      siteSettings: null,
      rightPattern: null,
    }
  }
}

export function resolveAuthBrandingProps({screen, siteSettings, rightPattern}: AuthPageContent) {
  const rightPatternImage = screen?.heroMedia?.image || rightPattern?.image
  const rightPatternAlt =
    screen?.heroMedia?.altText ||
    screen?.heroMedia?.title ||
    rightPattern?.altText ||
    rightPattern?.title ||
    ''
  const logoImage = siteSettings?.logo || siteSettings?.logoDark

  return {
    logoUrl: buildLogoUrl(logoImage),
    logoAlt: siteSettings?.companyName || siteSettings?.title || 'Conversio Energie',
    rightPatternUrl: buildImageUrl(rightPatternImage, 1200),
    rightPatternAlt,
    footerAddress: siteSettings?.contact?.address,
    legalLinks: siteSettings?.legalLinks,
  }
}
