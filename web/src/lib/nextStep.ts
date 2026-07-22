import type {ChapterNavigationItem} from '@/lib/about'
import {
  buildImageUrl,
  buildLogoUrl,
  type SanityImage,
} from '@/lib/authBranding'
import {
  calculateScenarioResult,
  type CalculationParameters,
  type CalculatorValues,
  type ScenarioType,
} from '@/lib/calculation/scenarioCalculator'
import type {CustomerGroup} from '@/lib/customerSelection'
import {NEXT_STEP_PAGE_QUERY} from '@/lib/queries'
import {sanityClient} from '@/lib/sanity'
import {
  getScenarioMatrixPageData,
  type ScenarioMatrixBundle,
  type ScenarioMatrixParameter,
  type ScenarioMatrixSlider,
} from '@/lib/scenarioMatrix'

type CmsMedia = {
  title?: string | null
  altText?: string | null
  image?: SanityImage
} | null

type RawSection = {
  _key?: string | null
  title?: string | null
  text?: string | null
  visibleFor?: string | null
  image?: SanityImage
  media?: CmsMedia
} | null

type RawSalesDocument = {
  _id?: string | null
  title?: string | null
  description?: string | null
  documentType?: string | null
  categoryIds?: string[] | null
  categories?: Array<{
    _id?: string | null
    title?: string | null
    navigationLabel?: string | null
    slug?: string | null
  } | null> | null
  scenarioIds?: string[] | null
  pdfUrl?: string | null
  sharePointUrl?: string | null
}

type RawEmailTemplate = {
  _id?: string | null
  title?: string | null
  subject?: string | null
  body?: string | null
  signatureHint?: string | null
} | null

type RawNextStepQuery = {
  screen?: {
    headline?: string | null
    subline?: string | null
    primaryCta?: {
      label?: string | null
      target?: string | null
    } | null
    heroImage?: SanityImage
    heroImage2?: SanityImage
    heroMedia?: CmsMedia
    documentSelectionConfig?: {
      documentsHeadline?: string | null
      emailLabel?: string | null
      sendButtonLabel?: string | null
      emptyDocumentsText?: string | null
      emailTemplate?: RawEmailTemplate
    } | null
    sections?: RawSection[] | null
  } | null
  documents?: RawSalesDocument[] | null
  defaultEmailTemplate?: RawEmailTemplate
}

export type NextStepDocumentCategory = {
  key: string
  title: string
  documents: Array<{
    id: string
    title: string
    href?: string
    description?: string
  }>
}

export type NextStepPageData = {
  customerType: CustomerGroup
  headline: string
  documentsHeadline: string
  emailLabel: string
  sendButtonLabel: string
  emptyDocumentsText?: string
  emailSubject?: string
  emailBody?: string
  selectedBundle?: ScenarioMatrixBundle
  selectedResult?: {
    autarkyPercent: number
    annualSavingsEur: number
  }
  parameters: ScenarioMatrixParameter[]
  bundleImageUrl?: string
  bundleImageAlt: string
  documentCategories: NextStepDocumentCategory[]
  contactImageUrl?: string
  contactImageAlt: string
  navigationItems: ChapterNavigationItem[]
  logoUrl?: string
  inverseLogoUrl?: string
  logoAlt: string
  patternUrl?: string
  patternAlt: string
  navigationArrowUrl?: string
}

type SliderSearchValues = Record<string, number>

const nextStepClient = sanityClient.withConfig({useCdn: false})
const freshFetchOptions = {cache: 'no-store' as const}
const validScenarioTypes = new Set<ScenarioType>(['b2c_pv', 'b2c_pv_speicher', 'b2c_komplett'])
const sliderKeyAliases: Record<keyof CalculatorValues, string[]> = {
  annualConsumption: ['annualConsumption'],
  storageSize: ['storageSize', 'speichergrösse', 'speichergroesse', 'speichergrosse'],
  chargingStations: ['chargingStations', 'ladestationen', 'ladepunkte'],
  peakLoadKw: ['peakLoadKw', 'lastspitze'],
}

function normalizeCmsKey(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ß/g, 'ss')
    .toLowerCase()
}

function findSliderValue(
  sliders: ScenarioMatrixSlider[],
  values: SliderSearchValues,
  key: keyof CalculatorValues,
) {
  const aliases = sliderKeyAliases[key].map(normalizeCmsKey)
  const slider = sliders.find((item) => aliases.includes(normalizeCmsKey(item.key)))

  return slider ? values[slider.key] : undefined
}

function buildCalculatorValues(
  sliders: ScenarioMatrixSlider[],
  values: SliderSearchValues,
): CalculatorValues | undefined {
  const annualConsumption = findSliderValue(sliders, values, 'annualConsumption')
  const storageSize = findSliderValue(sliders, values, 'storageSize')
  const chargingStations = findSliderValue(sliders, values, 'chargingStations')
  const peakLoadKw = findSliderValue(sliders, values, 'peakLoadKw')

  if (
    typeof annualConsumption !== 'number' ||
    typeof storageSize !== 'number' ||
    typeof chargingStations !== 'number'
  ) {
    return undefined
  }

  return {annualConsumption, storageSize, chargingStations, peakLoadKw}
}

function buildCalculationParameters(
  parameters: ScenarioMatrixParameter[],
): CalculationParameters | undefined {
  const requiredKeys: Array<keyof CalculationParameters> = [
    'pvSizeKwp',
    'specificYieldKwhPerKwp',
    'electricityPriceEurPerKwh',
    'feedInTariffEurPerKwh',
    'evDemandPerChargingStationKwh',
    'smartChargingShiftShare',
  ]
  const values = Object.fromEntries(
    requiredKeys.map((key) => [key, parameters.find((parameter) => parameter.key === key)?.value]),
  )

  if (requiredKeys.some((key) => typeof values[key] !== 'number' || !Number.isFinite(values[key]))) {
    return undefined
  }

  return values as CalculationParameters
}

function calculateBundleResult(
  bundle: ScenarioMatrixBundle | undefined,
  values: CalculatorValues | undefined,
  parameters: CalculationParameters | undefined,
) {
  if (!bundle?.scenarioType || !values || !parameters || !validScenarioTypes.has(bundle.scenarioType as ScenarioType)) {
    return undefined
  }

  const result = calculateScenarioResult(bundle.scenarioType as ScenarioType, values, parameters)

  return {
    autarkyPercent: result.autarkyPercent,
    annualSavingsEur: result.annualSavingsEur,
  }
}

function resolveImageUrl(image: SanityImage | undefined, width = 1800) {
  return buildImageUrl(image, width, undefined, 100) || buildLogoUrl(image)
}

function findContactImage(screen: RawNextStepQuery['screen'], customerType: CustomerGroup) {
  const section = (screen?.sections || [])
    .filter(Boolean)
    .filter(
      (item) =>
        !item?.visibleFor ||
        item.visibleFor === 'both' ||
        item.visibleFor === customerType,
    )
    .find((item) => item?.image || item?.media?.image)

  return {
    image: section?.image || section?.media?.image || screen?.heroImage2 || screen?.heroMedia?.image || screen?.heroImage,
    alt: section?.media?.altText?.trim() || section?.media?.title?.trim() || section?.title?.trim() || '',
  }
}

function normalizeDocuments(
  documents: RawSalesDocument[] | null | undefined,
  selectedBundle: ScenarioMatrixBundle | undefined,
) {
  const normalizedDocuments = (documents || []).flatMap((document) => {
    const title = document.title?.trim()

    if (!document._id || !title) {
      return []
    }

    return [{
      id: document._id,
      title,
      description: document.description?.trim() || undefined,
      href: document.pdfUrl?.trim() || document.sharePointUrl?.trim() || undefined,
      categoryIds: document.categoryIds || [],
      categories: (document.categories || []).flatMap((category) => {
        if (!category?._id) {
          return []
        }

        return [{
          id: category._id,
          title: category.title?.trim() || '',
          navigationLabel: category.navigationLabel?.trim() || '',
          slug: category.slug?.trim() || '',
        }]
      }),
      scenarioIds: document.scenarioIds || [],
    }]
  })

  const featureTitles = selectedBundle?.features.length
    ? selectedBundle.features
    : ['Photovoltaik', 'Batteriespeicher', 'Wärmepumpe', 'Ladestation', 'Energiegemeinschaft']

  return featureTitles.map((title, index) => {
    const normalizedTitle = normalizeCmsKey(title)
    const scenarioDocuments = normalizedDocuments.filter((document) =>
      selectedBundle?.id ? document.scenarioIds.includes(selectedBundle.id) : false,
    )
    const categoryDocuments = normalizedDocuments.filter((document) =>
      document.categories.some((category) => {
        const values = [category.title, category.navigationLabel, category.slug, category.id]
          .filter(Boolean)
          .map(normalizeCmsKey)

        return values.some((value) => value.includes(normalizedTitle) || normalizedTitle.includes(value))
      }) ||
      document.categoryIds.some((categoryId) => normalizeCmsKey(categoryId).includes(normalizedTitle)),
    )
    const matchingDocuments = [...scenarioDocuments, ...categoryDocuments].filter(
      (document, documentIndex, list) => list.findIndex((item) => item.id === document.id) === documentIndex,
    )

    return {
      key: `${normalizedTitle || 'category'}-${index}`,
      title,
      documents: matchingDocuments,
    }
  })
}

export function parseNextStepSliderValues(searchParams: Record<string, string | string[] | undefined>) {
  return Object.fromEntries(
    Object.entries(searchParams).flatMap(([key, rawValue]) => {
      if (!key.startsWith('slider.')) {
        return []
      }

      const value = Number(Array.isArray(rawValue) ? rawValue[0] : rawValue)

      return Number.isFinite(value) ? [[key.slice('slider.'.length), value]] : []
    }),
  )
}

export async function getNextStepPageData({
  customerType,
  bundleId,
  sliderValues,
}: {
  customerType: CustomerGroup
  bundleId?: string
  sliderValues: SliderSearchValues
}): Promise<NextStepPageData> {
  const [scenarioMatrix, nextStep] = await Promise.all([
    getScenarioMatrixPageData(customerType),
    nextStepClient.fetch<RawNextStepQuery>(NEXT_STEP_PAGE_QUERY, {customerType}, freshFetchOptions),
  ])
  const selectedBundle =
    scenarioMatrix.bundles.find((bundle) => bundle.id === bundleId || bundle.slug === bundleId) ||
    scenarioMatrix.bundles[0]
  const defaultValues = Object.fromEntries(
    scenarioMatrix.sliders.map((slider) => [slider.key, slider.defaultValue]),
  )
  const mergedSliderValues = {...defaultValues, ...sliderValues}
  const calculatorValues = buildCalculatorValues(scenarioMatrix.sliders, mergedSliderValues)
  const calculationParameters = buildCalculationParameters(scenarioMatrix.parameters)
  const selectedResult = calculateBundleResult(selectedBundle, calculatorValues, calculationParameters)
  const config = nextStep.screen?.documentSelectionConfig
  const emailTemplate = config?.emailTemplate || nextStep.defaultEmailTemplate
  const contactImage = findContactImage(nextStep.screen, customerType)

  return {
    customerType,
    headline: nextStep.screen?.headline?.trim() || 'Nächster Schritt',
    documentsHeadline: config?.documentsHeadline?.trim() || 'Produktblätter',
    emailLabel: config?.emailLabel?.trim() || 'E-Mail',
    sendButtonLabel: config?.sendButtonLabel?.trim() || nextStep.screen?.primaryCta?.label?.trim() || 'Senden',
    emptyDocumentsText: config?.emptyDocumentsText?.trim() || undefined,
    emailSubject: emailTemplate?.subject?.trim() || undefined,
    emailBody: emailTemplate?.body?.trim() || undefined,
    selectedBundle,
    selectedResult,
    parameters: scenarioMatrix.parameters,
    bundleImageUrl: scenarioMatrix.b2cBundleImageUrl || scenarioMatrix.offerImageUrl || scenarioMatrix.heroImageUrl,
    bundleImageAlt:
      scenarioMatrix.b2cBundleImageAlt ||
      scenarioMatrix.offerImageAlt ||
      scenarioMatrix.heroImageAlt,
    documentCategories: normalizeDocuments(nextStep.documents, selectedBundle),
    contactImageUrl: resolveImageUrl(contactImage.image, 1600),
    contactImageAlt: contactImage.alt,
    navigationItems: scenarioMatrix.navigationItems,
    logoUrl: scenarioMatrix.logoUrl,
    inverseLogoUrl: scenarioMatrix.inverseLogoUrl,
    logoAlt: scenarioMatrix.logoAlt,
    patternUrl: scenarioMatrix.patternUrl,
    patternAlt: scenarioMatrix.patternAlt,
    navigationArrowUrl: scenarioMatrix.navigationArrowUrl,
  }
}
