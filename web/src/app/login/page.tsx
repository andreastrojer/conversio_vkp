import {LoginScreen} from '@/components/auth/LoginScreen'
import {
  LOGIN_RIGHT_PATTERN_QUERY,
  LOGIN_SCREEN_QUERY,
  SITE_SETTINGS_QUERY,
} from '@/lib/queries'
import {sanityClient, urlForImage} from '@/lib/sanity'

type SanityImage = {
  asset?: {_ref?: string; _id?: string; url?: string} | null
  crop?: unknown
  hotspot?: unknown
} | null

type LoginSection = {
  _key?: string
  title?: string | null
  eyebrow?: string | null
  text?: string | null
  layout?: string | null
  visibleFor?: string | null
  sortOrder?: number | null
} | null

type LoginScreenDocument = {
  title?: string | null
  screenKey?: string | null
  headline?: string | null
  subline?: string | null
  heroImage?: SanityImage
  primaryCta?: {
    label?: string | null
    target?: string | null
  } | null
  sections?: LoginSection[] | null
} | null

type SiteSettingsDocument = {
  title?: string | null
  companyName?: string | null
  logo?: SanityImage
} | null

type LoginPatternDocument = {
  title?: string | null
  altText?: string | null
  image?: SanityImage
} | null

export const metadata = {
  title: 'Anmelden | Conversio Energie',
}

export const dynamic = 'force-dynamic'

function buildImageUrl(image: SanityImage | undefined, width: number, height?: number) {
  if (!image?.asset) {
    return undefined
  }

  try {
    let builder = urlForImage(image).width(width).auto('format').quality(85)

    if (height) {
      builder = builder.height(height).fit('crop')
    }

    return builder.url()
  } catch {
    return undefined
  }
}

async function getLoginContent() {
  try {
    const [screen, siteSettings, rightPattern] = await Promise.all([
      sanityClient.fetch<LoginScreenDocument>(LOGIN_SCREEN_QUERY),
      sanityClient.fetch<SiteSettingsDocument>(SITE_SETTINGS_QUERY),
      sanityClient.fetch<LoginPatternDocument>(LOGIN_RIGHT_PATTERN_QUERY),
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

export default async function LoginPage() {
  const {screen, siteSettings, rightPattern} = await getLoginContent()

  return (
    <LoginScreen
      headline={screen?.headline}
      subline={screen?.subline}
      ctaLabel={screen?.primaryCta?.label}
      sections={screen?.sections}
      heroImageUrl={buildImageUrl(screen?.heroImage, 1400, 1000)}
      logoUrl={buildImageUrl(siteSettings?.logo, 260)}
      logoAlt={siteSettings?.companyName || siteSettings?.title || 'Conversio Energie'}
      rightPatternUrl={buildImageUrl(rightPattern?.image, 900)}
      rightPatternAlt={rightPattern?.altText || rightPattern?.title || ''}
    />
  )
}
