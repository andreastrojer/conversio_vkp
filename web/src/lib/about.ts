import {
  ABOUT_SCREEN_QUERY,
  LOGIN_SCREEN_QUERY,
  LOGIN_RIGHT_PATTERN_QUERY,
  NAVIGATION_STEPS_QUERY,
  SITE_SETTINGS_QUERY,
} from '@/lib/queries'
import {
  buildImageUrl,
  buildLogoUrl,
  type LoginScreenDocument,
  type SanityImage,
  type SiteSettingsDocument,
} from '@/lib/authBranding'
import type {CustomerGroup} from '@/lib/customerSelection'
import {sanityClient} from '@/lib/sanity'

export type AboutSection = {
  _key?: string | null
  title?: string | null
  eyebrow?: string | null
  text?: string | null
  visibleFor?: string | null
  layout?: string | null
  sortOrder?: number | null
}

export type AboutScreenDocument = {
  title?: string | null
  screenKey?: string | null
  headline?: string | null
  subline?: string | null
  targetAudience?: string | null
  isActive?: boolean | null
  sections?: AboutSection[] | null
} | null

type NavigationStepDocument = {
  _id?: string | null
  title?: string | null
  stepKey?: string | null
  order?: number | null
  chapter?: string | null
  visibleFor?: string | null
  requiresCustomerType?: boolean | null
  showNextButton?: boolean | null
  showBackButton?: boolean | null
  screen?: {
    title?: string | null
    screenKey?: string | null
    primaryCta?: {
      label?: string | null
      target?: string | null
    } | null
  } | null
}

type PatternDocument = {
  title?: string | null
  altText?: string | null
  image?: SanityImage
} | null

export type ChapterNavigationItem = {
  key: 'about' | 'offer' | 'needs' | 'next-step'
  title: string
  number: number
  ctaLabel: string
  href?: string
}

export type AboutPageData = {
  screen: AboutScreenDocument
  navigationItems: ChapterNavigationItem[]
  logoUrl?: string
  inverseLogoUrl?: string
  logoAlt: string
  patternUrl?: string
  patternAlt: string
}

const aboutClient = sanityClient.withConfig({useCdn: false})
const freshFetchOptions = {cache: 'no-store' as const}
const fallbackHeadline = 'WER WIR SIND'

const fallbackNavigation: Omit<ChapterNavigationItem, 'href'>[] = [
  {key: 'about', title: 'WER WIR SIND', number: 1, ctaLabel: 'ZUM KAPITEL'},
  {key: 'offer', title: 'WAS WIR BIETEN', number: 2, ctaLabel: 'ZUM KAPITEL'},
  {key: 'needs', title: 'WAS PASST ZU IHNEN', number: 3, ctaLabel: 'ZUM KAPITEL'},
  {key: 'next-step', title: 'NÄCHSTER SCHRITT', number: 4, ctaLabel: 'ZUM KAPITEL'},
]

function matchesAudience(step: NavigationStepDocument, customerType: CustomerGroup) {
  return !step.visibleFor || step.visibleFor === 'both' || step.visibleFor === customerType
}

function resolveNavigationItems(
  steps: NavigationStepDocument[] | null | undefined,
  customerType: CustomerGroup,
) {
  const visibleSteps = (steps || []).filter((step) => matchesAudience(step, customerType))

  return fallbackNavigation.map((fallback) => {
    const matchingStep = visibleSteps.find(
      (step) => step.stepKey === fallback.key || step.screen?.screenKey === fallback.key,
    )

    return {
      ...fallback,
      title: (matchingStep?.title || matchingStep?.screen?.title || fallback.title).toLocaleUpperCase(
        'de-AT',
      ),
      ctaLabel:
        matchingStep?.screen?.primaryCta?.label?.toLocaleUpperCase('de-AT') || fallback.ctaLabel,
      href: fallback.key === 'about' ? `/about?type=${customerType}` : undefined,
    }
  })
}

export async function getAboutPageData(customerType: CustomerGroup): Promise<AboutPageData> {
  try {
    const [screen, navigationSteps, siteSettings, pattern, loginScreen] = await Promise.all([
      aboutClient.fetch<AboutScreenDocument>(ABOUT_SCREEN_QUERY, {}, freshFetchOptions),
      aboutClient.fetch<NavigationStepDocument[]>(NAVIGATION_STEPS_QUERY, {}, freshFetchOptions),
      aboutClient.fetch<SiteSettingsDocument>(SITE_SETTINGS_QUERY, {}, freshFetchOptions),
      aboutClient.fetch<PatternDocument>(LOGIN_RIGHT_PATTERN_QUERY, {}, freshFetchOptions),
      aboutClient.fetch<LoginScreenDocument>(LOGIN_SCREEN_QUERY, {}, freshFetchOptions),
    ])

    const normalLogoUrl = buildLogoUrl(siteSettings?.logo) || buildLogoUrl(siteSettings?.logoDark)
    const inverseLogoUrl = buildLogoUrl(siteSettings?.logoDark) || normalLogoUrl
    const patternImage = pattern?.image || loginScreen?.heroMedia?.image

    return {
      screen: screen
        ? {
            ...screen,
            headline: screen.headline?.trim() || fallbackHeadline,
            sections: (screen.sections || [])
              .filter(
                (section) =>
                  !section.visibleFor ||
                  section.visibleFor === 'both' ||
                  section.visibleFor === customerType,
              )
              .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)),
          }
        : {headline: fallbackHeadline, screenKey: 'about'},
      navigationItems: resolveNavigationItems(navigationSteps, customerType),
      logoUrl: normalLogoUrl,
      inverseLogoUrl,
      logoAlt: siteSettings?.companyName || siteSettings?.title || 'Conversio Energie',
      patternUrl: buildImageUrl(patternImage, 1200),
      patternAlt:
        pattern?.altText ||
        pattern?.title ||
        loginScreen?.heroMedia?.altText ||
        loginScreen?.heroMedia?.title ||
        '',
    }
  } catch {
    return {
      screen: {headline: fallbackHeadline, screenKey: 'about'},
      navigationItems: resolveNavigationItems([], customerType),
      logoAlt: 'Conversio Energie',
      patternAlt: '',
    }
  }
}
