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
  recommendedCategories?: Array<{
    _id?: string | null
    title?: string | null
    slug?: string | null
    navigationLabel?: string | null
    catalogImage?: SanityImage
  }> | null
  comparisonValues?: Array<{
    _key?: string | null
    value?: string | null
    note?: string | null
    metric?: RawMetric | null
  }> | null
}

type ScenarioMatrixDocument = {
  headline?: string | null
  subline?: string | null
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
  shortDescription?: string
  description?: string
  resultText?: string
  nextStepText?: string
  sortOrder?: number
  imageUrl?: string
  features: string[]
  values: Array<{
    key: string
    title: string
    value: string
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
}

const scenarioMatrixClient = sanityClient.withConfig({useCdn: false})
const freshFetchOptions = {cache: 'no-store' as const}

const sliderRules = {
  annualConsumption: {min: 2000, max: 6000, step: 100, defaultValue: 5900},
  storage: {min: 0, max: 12, step: 1, defaultValue: 7},
  chargingStations: {min: 0, max: 2, step: 1, defaultValue: 1},
} as const

function normalizeKey(value?: string | null) {
  return (value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]/g, '')
    .toLowerCase()
}

function ruleForSlider(key: string) {
  const normalized = normalizeKey(key)

  if (normalized.includes('annual') || normalized.includes('jahresverbrauch')) {
    return sliderRules.annualConsumption
  }

  if (normalized.includes('speicher') || normalized.includes('storage')) {
    return sliderRules.storage
  }

  if (normalized.includes('ladestation') || normalized.includes('charging')) {
    return sliderRules.chargingStations
  }

  return undefined
}

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

    const rule = ruleForSlider(key)
    const min = rule?.min ?? slider.min
    const max = rule?.max ?? slider.max
    const step = rule?.step ?? slider.step
    const defaultValue = rule?.defaultValue ?? slider.defaultValue

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
  return (metrics || [])
    .filter(
      (metric) =>
        metric.isActive !== false &&
        (!metric.targetGroup || metric.targetGroup === 'both' || metric.targetGroup === customerType),
    )
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

function normalizeBundles(
  bundles: RawBundleScenario[] | null | undefined,
  customerType: CustomerGroup,
): ScenarioMatrixBundle[] {
  return (bundles || [])
    .filter(
      (bundle) =>
        bundle.isActive !== false &&
        (!bundle.targetGroup || bundle.targetGroup === 'both' || bundle.targetGroup === customerType),
    )
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
        shortDescription: bundle.shortDescription?.trim() || undefined,
        description: bundle.description?.trim() || undefined,
        resultText: bundle.resultText?.trim() || undefined,
        nextStepText: bundle.nextStepText?.trim() || undefined,
        sortOrder: bundle.sortOrder ?? undefined,
        imageUrl: resolveImageUrl(categories[0]?.catalogImage),
        features: categories.map(
          (category) => category.navigationLabel?.trim() || category.title?.trim() || '',
        ).filter(Boolean),
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
            unit: comparison.metric?.unit?.trim() || undefined,
            note: comparison.note?.trim() || undefined,
          }]
        }),
      }]
    })
}

function resolveTabLabel(label: string | null | undefined, headline: string | null | undefined, fallback: string) {
  const trimmed = label?.trim()

  return !trimmed || normalizeKey(trimmed) === normalizeKey(headline) ? fallback : trimmed
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

    return {
      headline: screen?.headline?.trim() || undefined,
      subline: screen?.subline?.trim() || undefined,
      calculatorTabLabel: resolveTabLabel(
        screen?.calculatorConfig?.calculatorTabLabel,
        screen?.headline,
        'BEDARF',
      ),
      bundleTabLabel: resolveTabLabel(
        screen?.calculatorConfig?.bundleTabLabel,
        screen?.headline,
        'KALKULATION',
      ),
      calculateButtonLabel: screen?.calculatorConfig?.calculateButtonLabel?.trim() || undefined,
      sliders: normalizeSliders(screen?.calculatorConfig?.sliders),
      metrics: normalizeMetrics(screen?.calculatorConfig?.resultMetrics, customerType),
      parameters: normalizeParameters(screen?.calculatorConfig?.calculationParameters),
      bundles: normalizeBundles(screen?.calculatorConfig?.bundleScenarios, customerType),
      heroImageUrl: resolveImageUrl(heroImage, 3200),
      heroImageAlt: screen?.heroMedia?.altText?.trim() || screen?.heroMedia?.title?.trim() || '',
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
    }
  } catch {
    const shared = await sharedContentPromise

    return {
      calculatorTabLabel: 'BEDARF',
      bundleTabLabel: 'KALKULATION',
      sliders: [],
      metrics: [],
      parameters: [],
      bundles: [],
      heroImageAlt: '',
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
    }
  }
}
