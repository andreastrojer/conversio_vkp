import type {ChapterNavigationItem} from '@/lib/about'
import {
  buildImageUrl,
  buildLogoUrl,
  type SanityImage,
} from '@/lib/authBranding'
import type {CustomerGroup} from '@/lib/customerSelection'
import {NEXT_STEP_PAGE_QUERY} from '@/lib/queries'
import {
  fetchScenarioDocumentSelection,
  type ScenarioDocumentSelection,
} from '@/lib/salesDocuments'
import {sanityClient} from '@/lib/sanity'
import {
  getScenarioMatrixPageData,
  type ScenarioMatrixBundle,
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
  defaultEmailTemplate?: RawEmailTemplate
}

export type NextStepDocumentCategory = {
  key: string
  title: string
  documents: Array<{
    id: string
    title: string
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

const nextStepClient = sanityClient.withConfig({useCdn: false})
const freshFetchOptions = {cache: 'no-store' as const}

function normalizeCmsKey(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ß/g, 'ss')
    .toLowerCase()
}

function compactCmsKey(value: string) {
  return normalizeCmsKey(value).replace(/[\s_-]+/g, '')
}

function isStorageTitle(value: string) {
  const key = compactCmsKey(value)

  return (
    key.includes('batteriespeicher') ||
    key.includes('gewerbespeicher') ||
    key.includes('stromspeicher') ||
    key === 'speicher'
  )
}

function normalizeFeatureTitleForCustomer(title: string, customerType: CustomerGroup) {
  if (!isStorageTitle(title)) {
    return title
  }

  return customerType === 'b2b' ? 'Gewerbespeicher' : 'Batteriespeicher'
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

function buildFallbackDocumentCategories(
  selectedBundle: ScenarioMatrixBundle | undefined,
  customerType: CustomerGroup,
) {
  return (selectedBundle?.features || []).map((title, index) => ({
    key: `${normalizeCmsKey(title) || 'category'}-${index}`,
    title: normalizeFeatureTitleForCustomer(title, customerType),
    documents: [],
  }))
}

function normalizeDocumentCategories(
  selection: ScenarioDocumentSelection | undefined,
  selectedBundle: ScenarioMatrixBundle | undefined,
  customerType: CustomerGroup,
): NextStepDocumentCategory[] {
  const categories = (selection?.categories || []).map((category) => ({
    key: category.key,
    title: normalizeFeatureTitleForCustomer(category.title, customerType),
    documents: category.documents.map((document) => ({
      id: document.id,
      title: document.title,
      description: document.description,
    })),
  }))

  return categories.length > 0
    ? categories
    : buildFallbackDocumentCategories(selectedBundle, customerType)
}

export async function getNextStepPageData({
  customerType,
  bundleId,
}: {
  customerType: CustomerGroup
  bundleId?: string
}): Promise<NextStepPageData> {
  const [scenarioMatrix, nextStep] = await Promise.all([
    getScenarioMatrixPageData(customerType),
    nextStepClient.fetch<RawNextStepQuery>(NEXT_STEP_PAGE_QUERY, {customerType}, freshFetchOptions),
  ])
  const selectedBundle =
    scenarioMatrix.bundles.find((bundle) => bundle.id === bundleId || bundle.slug === bundleId) ||
    scenarioMatrix.bundles[0]
  const config = nextStep.screen?.documentSelectionConfig
  const emailTemplate = config?.emailTemplate || nextStep.defaultEmailTemplate
  const contactImage = findContactImage(nextStep.screen, customerType)
  let documentSelection: ScenarioDocumentSelection | undefined

  if (selectedBundle) {
    try {
      documentSelection = await fetchScenarioDocumentSelection({
        customerType,
        scenarioId: selectedBundle.id,
      })
    } catch {
      documentSelection = undefined
    }
  }

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
    bundleImageUrl: scenarioMatrix.b2cBundleImageUrl || scenarioMatrix.offerImageUrl || scenarioMatrix.heroImageUrl,
    bundleImageAlt:
      scenarioMatrix.b2cBundleImageAlt ||
      scenarioMatrix.offerImageAlt ||
      scenarioMatrix.heroImageAlt,
    documentCategories: normalizeDocumentCategories(documentSelection, selectedBundle, customerType),
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
