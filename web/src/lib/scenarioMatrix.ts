import {SCENARIO_MATRIX_PAGE_QUERY} from '@/lib/queries'
import {
  buildImageUrl,
  buildLogoUrl,
  type SanityImage,
} from '@/lib/authBranding'
import type {ChapterNavigationItem} from '@/lib/about'
import type {CustomerGroup} from '@/lib/customerSelection'
import {sanityClient} from '@/lib/sanity'
import {
  getWhatFitsPageData,
  type ProductNavigationItem,
} from '@/lib/whatFits'

type CmsMedia = {
  title?: string | null
  altText?: string | null
  mediaType?: string | null
  externalUrl?: string | null
  fileUrl?: string | null
  image?: SanityImage
} | null

type RawSlider = {
  _key?: string | null
  label?: string | null
  key?: string | null
  min?: number | null
  max?: number | null
  step?: number | null
  defaultValue?: number | null
  unit?: string | null
}

type RawMetric = {
  _id?: string | null
  title?: string | null
  metricKey?: string | null
  targetGroup?: string | null
  metricType?: string | null
  unit?: string | null
  displayType?: string | null
  description?: string | null
  sortOrder?: number | null
  isActive?: boolean | null
}

type RawParameter = {
  _key?: string | null
  key?: string | null
  label?: string | null
  value?: number | null
  unit?: string | null
}

type RawBundleScenario = {
  _id?: string | null
  title?: string | null
  slug?: string | null
  targetGroup?: string | null
  scenarioType?: string | null
  shortDescription?: string | null
  description?: string | null
  resultText?: string | null
  nextStepText?: string | null
  sortOrder?: number | null
  isActive?: boolean | null
  includedItems?: Array<{
    _key?: string | null
    amount?: string | null
    label?: string | null
  }> | null
  recommendedCategories?: Array<{
    _id?: string | null
    title?: string | null
    slug?: string | null
    navigationLabel?: string | null
  }> | null
  comparisonValues?: Array<{
    _key?: string | null
    value?: string | null
    note?: string | null
    metric?: RawMetric | null
  }> | null
}

type RawOfferSection = {
  _key?: string | null
  title?: string | null
  eyebrow?: string | null
  visibleFor?: string | null
  sortOrder?: number | null
  image?: SanityImage
  media?: CmsMedia
}

type ScenarioMatrixDocument = {
  headline?: string | null
  subline?: string | null
  primaryCta?: {
    label?: string | null
    target?: string | null
  } | null
  heroImage?: SanityImage
  heroImage2?: SanityImage
  heroMedia?: CmsMedia
  calculatorConfig?: {
    calculatorTabLabel?: string | null
    bundleTabLabel?: string | null
    calculateButtonLabel?: string | null
    sliders?: RawSlider[] | null
    resultMetrics?: RawMetric[] | null
    calculationParameters?: RawParameter[] | null
    bundleScenarios?: RawBundleScenario[] | null
  } | null
  offerSections?: RawOfferSection[] | null
  b2cOfferSections?: RawOfferSection[] | null
} | null

export type ScenarioMatrixSlider = {
  id: string
  key: string
  label: string
  min: number
  max: number
  step: number
  defaultValue: number
  unit?: string
}

export type ScenarioMatrixMetric = {
  key: string
  title: string
  metricType?: string
  unit?: string
  displayType?: string
  description?: string
  sortOrder?: number
}

export type ScenarioMatrixParameter = {
  key: string
  label?: string
  value: number
  unit?: string
}

export type ScenarioMatrixBundle = {
  id: string
  title: string
  slug?: string
  scenarioType?: string
  shortDescription?: string
  description?: string
  resultText?: string
  nextStepText?: string
  sortOrder?: number
  features: string[]
  includedItems: Array<{
    id: string
    amount?: string
    label: string
  }>
  values: Array<{
    key: string
    title: string
    value: string
    metricType?: string
    unit?: string
    note?: string
  }>
}

export type ScenarioMatrixPageData = {
  headline?: string
  subline?: string
  calculatorTabLabel: string
  bundleTabLabel: string
  calculateButtonLabel?: string
  sliders: ScenarioMatrixSlider[]
  metrics: ScenarioMatrixMetric[]
  parameters: ScenarioMatrixParameter[]
  bundles: ScenarioMatrixBundle[]
  heroImageUrl?: string
  heroImageAlt: string
  heroImage2Url?: string
  heroImage2Alt: string
  primaryCta?: {
    label?: string | null
    target?: string | null
  } | null
  offerImageUrl?: string
  offerImageAlt: string
  b2cBundleImageUrl?: string
  b2cBundleImageAlt: string
  bottomNavigation: ProductNavigationItem[]
  navigationItems: ChapterNavigationItem[]
  logoUrl?: string
  inverseLogoUrl?: string
  logoAlt: string
  patternUrl?: string
  patternAlt: string
  navigationArrowUrl?: string
  productNavigationLeftArrowUrl?: string
  productNavigationRightArrowUrl?: string
  productNavigationCatalogIconUrl?: string
  calculateButtonArrowUrl?: string
}

const scenarioMatrixClient = sanityClient.withConfig({useCdn: false})
const freshFetchOptions = {cache: 'no-store' as const}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function normalizeSliders(sliders: RawSlider[] | null | undefined): ScenarioMatrixSlider[] {
  return (sliders || []).flatMap((slider, index) => {
    const key = slider.key?.trim()
    const label = slider.label?.trim()

    if (!key || !label) {
      return []
    }

    const min = slider.min
    const max = slider.max
    const step = slider.step
    const defaultValue = slider.defaultValue

    if (
      typeof min !== 'number' ||
      typeof max !== 'number' ||
      typeof step !== 'number' ||
      typeof defaultValue !== 'number' ||
      max <= min ||
      step <= 0
    ) {
      return []
    }

    return [{
      id: slider._key?.trim() || `${key}-${index}`,
      key,
      label,
      min,
      max,
      step,
      defaultValue: clamp(defaultValue, min, max),
      unit: slider.unit?.trim() || undefined,
    }]
  })
}

function normalizeMetrics(metrics: RawMetric[] | null | undefined, customerType: CustomerGroup) {
  const activeMetrics = (metrics || []).filter((metric) => metric.isActive !== false)
  const audienceMetrics = activeMetrics.filter(
    (metric) =>
      !metric.targetGroup || metric.targetGroup === 'both' || metric.targetGroup === customerType,
  )

  return (audienceMetrics.length > 0 ? audienceMetrics : activeMetrics)
    .sort((a, b) => (a.sortOrder ?? Number.POSITIVE_INFINITY) - (b.sortOrder ?? Number.POSITIVE_INFINITY))
    .flatMap<ScenarioMatrixMetric>((metric, index) => {
      const title = metric.title?.trim()

      if (!title) {
        return []
      }

      return [{
        key: metric.metricKey?.trim() || metric._id?.trim() || `metric-${index}`,
        title,
        metricType: metric.metricType?.trim() || undefined,
        unit: metric.unit?.trim() || undefined,
        displayType: metric.displayType?.trim() || undefined,
        description: metric.description?.trim() || undefined,
        sortOrder: metric.sortOrder ?? undefined,
      }]
    })
}

function normalizeParameters(parameters: RawParameter[] | null | undefined) {
  return (parameters || []).flatMap<ScenarioMatrixParameter>((parameter) => {
    const key = parameter.key?.trim()

    if (!key || typeof parameter.value !== 'number') {
      return []
    }

    return [{
      key,
      label: parameter.label?.trim() || undefined,
      value: parameter.value,
      unit: parameter.unit?.trim() || undefined,
    }]
  })
}

function resolveImageUrl(image: SanityImage | undefined, width = 2800) {
  return buildLogoUrl(image) || buildImageUrl(image, width, undefined, 100)
}

function resolveRasterImageUrl(image: SanityImage | undefined, width = 2800) {
  return buildImageUrl(image, width, undefined, 100) || buildLogoUrl(image)
}

function findPhotovoltaicOfferSection(sections: RawOfferSection[] | null | undefined) {
  return (sections || [])
    .filter((section) => section.image || section.media?.image)
    .sort(
      (a, b) =>
        (a.sortOrder ?? Number.POSITIVE_INFINITY) -
        (b.sortOrder ?? Number.POSITIVE_INFINITY),
    )
    .find((section) => {
      const identity = `${section.title || ''} ${section.eyebrow || ''}`
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()

      return identity.includes('photovoltaik') || /\bpv\b/.test(identity)
    })
}

function normalizeBundles(
  bundles: RawBundleScenario[] | null | undefined,
  customerType: CustomerGroup,
): ScenarioMatrixBundle[] {
  const activeBundles = (bundles || []).filter((bundle) => bundle.isActive !== false)
  const audienceBundles = activeBundles.filter(
    (bundle) =>
      !bundle.targetGroup || bundle.targetGroup === 'both' || bundle.targetGroup === customerType,
  )

  return (audienceBundles.length > 0 ? audienceBundles : activeBundles)
    .sort((a, b) => (a.sortOrder ?? Number.POSITIVE_INFINITY) - (b.sortOrder ?? Number.POSITIVE_INFINITY))
    .flatMap((bundle, index) => {
      const title = bundle.title?.trim()

      if (!title) {
        return []
      }

      const categories = (bundle.recommendedCategories || []).filter((category) => category.title?.trim())

      return [{
        id: bundle._id?.trim() || `bundle-${index}`,
        title,
        slug: bundle.slug?.trim() || undefined,
        scenarioType: bundle.scenarioType?.trim() || undefined,
        shortDescription: bundle.shortDescription?.trim() || undefined,
        description: bundle.description?.trim() || undefined,
        resultText: bundle.resultText?.trim() || undefined,
        nextStepText: bundle.nextStepText?.trim() || undefined,
        sortOrder: bundle.sortOrder ?? undefined,
        features: categories.map(
          (category) => category.navigationLabel?.trim() || category.title?.trim() || '',
        ).filter(Boolean),
        includedItems: (bundle.includedItems || []).flatMap((item, itemIndex) => {
          const label = item.label?.trim()

          if (!label) {
            return []
          }

          return [{
            id: item._key?.trim() || `${bundle._id || index}-included-${itemIndex}`,
            amount: item.amount?.trim() || undefined,
            label,
          }]
        }),
        values: (bundle.comparisonValues || []).flatMap((comparison, comparisonIndex) => {
          const metricTitle = comparison.metric?.title?.trim()
          const value = comparison.value?.trim()

          if (!metricTitle || !value || comparison.metric?.isActive === false) {
            return []
          }

          return [{
            key:
              comparison.metric?.metricKey?.trim() ||
              comparison.metric?._id?.trim() ||
              comparison._key?.trim() ||
              `value-${comparisonIndex}`,
            title: metricTitle,
            value,
            metricType: comparison.metric?.metricType?.trim() || undefined,
            unit: comparison.metric?.unit?.trim() || undefined,
            note: comparison.note?.trim() || undefined,
          }]
        }),
      }]
    })
}

export async function getScenarioMatrixPageData(
  customerType: CustomerGroup,
): Promise<ScenarioMatrixPageData> {
  const sharedContentPromise = getWhatFitsPageData(customerType)

  try {
    const [screen, shared] = await Promise.all([
      scenarioMatrixClient.fetch<ScenarioMatrixDocument>(
        SCENARIO_MATRIX_PAGE_QUERY,
        {customerType},
        freshFetchOptions,
      ),
      sharedContentPromise,
    ])
    const heroImage = screen?.heroImage || screen?.heroMedia?.image || screen?.heroImage2
    const heroImage2 = screen?.heroImage2 || screen?.heroImage || screen?.heroMedia?.image
    const offerSection = (screen?.offerSections || [])
      .filter(
        (section) =>
          !section.visibleFor ||
          section.visibleFor === 'both' ||
          section.visibleFor === customerType,
      )
      .sort(
        (a, b) =>
          (a.sortOrder ?? Number.POSITIVE_INFINITY) -
          (b.sortOrder ?? Number.POSITIVE_INFINITY),
      )
      .find((section) => {
        const identity = `${section.title || ''} ${section.eyebrow || ''}`
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .toLowerCase()

        return identity.includes('photovoltaik') || /\bpv\b/.test(identity)
      })
    const offerImage = offerSection?.image || offerSection?.media?.image
    const b2cBundleSection =
      findPhotovoltaicOfferSection(screen?.b2cOfferSections) ||
      (screen?.b2cOfferSections || []).find((section) => section.image || section.media?.image)
    const b2cBundleImage = b2cBundleSection?.image || b2cBundleSection?.media?.image

    return {
      headline: screen?.headline?.trim() || undefined,
      subline: screen?.subline?.trim() || undefined,
      calculatorTabLabel: screen?.calculatorConfig?.calculatorTabLabel?.trim() || '',
      bundleTabLabel: screen?.calculatorConfig?.bundleTabLabel?.trim() || '',
      calculateButtonLabel: screen?.calculatorConfig?.calculateButtonLabel?.trim() || undefined,
      sliders: normalizeSliders(screen?.calculatorConfig?.sliders),
      metrics: normalizeMetrics(screen?.calculatorConfig?.resultMetrics, customerType),
      parameters: normalizeParameters(screen?.calculatorConfig?.calculationParameters),
      bundles: normalizeBundles(screen?.calculatorConfig?.bundleScenarios, customerType),
      heroImageUrl: resolveImageUrl(heroImage, 3200),
      heroImageAlt: screen?.heroMedia?.altText?.trim() || screen?.heroMedia?.title?.trim() || '',
      heroImage2Url: resolveImageUrl(heroImage2, 3200),
      heroImage2Alt: screen?.heroMedia?.altText?.trim() || screen?.heroMedia?.title?.trim() || '',
      primaryCta: screen?.primaryCta || null,
      offerImageUrl: resolveRasterImageUrl(offerImage, 3200),
      offerImageAlt:
        offerSection?.media?.altText?.trim() ||
        offerSection?.media?.title?.trim() ||
        offerSection?.title?.trim() ||
        '',
      b2cBundleImageUrl: resolveRasterImageUrl(b2cBundleImage, 3200),
      b2cBundleImageAlt:
        b2cBundleSection?.media?.altText?.trim() ||
        b2cBundleSection?.media?.title?.trim() ||
        b2cBundleSection?.title?.trim() ||
        '',
      bottomNavigation: shared.bottomNavigation,
      navigationItems: shared.navigationItems,
      logoUrl: shared.logoUrl,
      inverseLogoUrl: shared.inverseLogoUrl,
      logoAlt: shared.logoAlt,
      patternUrl: shared.patternUrl,
      patternAlt: shared.patternAlt,
      navigationArrowUrl: shared.navigationArrowUrl,
      productNavigationLeftArrowUrl: shared.productNavigationLeftArrowUrl,
      productNavigationRightArrowUrl: shared.productNavigationRightArrowUrl,
      productNavigationCatalogIconUrl: shared.productNavigationCatalogIconUrl,
      calculateButtonArrowUrl: shared.calculateButtonArrowUrl,
    }
  } catch {
    const shared = await sharedContentPromise

    return {
      calculatorTabLabel: '',
      bundleTabLabel: '',
      sliders: [],
      metrics: [],
      parameters: [],
      bundles: [],
      heroImageAlt: '',
      heroImage2Alt: '',
      offerImageAlt: '',
      b2cBundleImageAlt: '',
      bottomNavigation: shared.bottomNavigation,
      navigationItems: shared.navigationItems,
      logoUrl: shared.logoUrl,
      inverseLogoUrl: shared.inverseLogoUrl,
      logoAlt: shared.logoAlt,
      patternUrl: shared.patternUrl,
      patternAlt: shared.patternAlt,
      navigationArrowUrl: shared.navigationArrowUrl,
      productNavigationLeftArrowUrl: shared.productNavigationLeftArrowUrl,
      productNavigationRightArrowUrl: shared.productNavigationRightArrowUrl,
      productNavigationCatalogIconUrl: shared.productNavigationCatalogIconUrl,
      calculateButtonArrowUrl: shared.calculateButtonArrowUrl,
    }
  }
}
