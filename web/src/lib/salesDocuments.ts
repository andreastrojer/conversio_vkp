import type {CustomerGroup} from '@/lib/customerSelection'
import {
  buildImageUrl,
  buildLogoUrl,
  type SanityImage,
} from '@/lib/authBranding'
import {
  NEXT_STEP_EMAIL_TEMPLATE_QUERY,
  NEXT_STEP_SCENARIO_DOCUMENT_CATEGORIES_QUERY,
} from '@/lib/queries'
import {sanityClient} from '@/lib/sanity'

export type AllowedSalesDocument = {
  id: string
  title: string
  description?: string
  targetGroup?: string
  version?: string
  pdfUrl: string
  pdfMimeType?: string
  pdfOriginalFilename?: string
}

export type ScenarioDocumentCategory = {
  key: string
  title: string
  documents: AllowedSalesDocument[]
}

export type ScenarioDocumentSelection = {
  scenario: {
    id: string
    title: string
    slug?: string
    targetGroup?: string
    scenarioType?: string
  }
  categories: ScenarioDocumentCategory[]
}

export type SalesEmailTemplate = {
  subject?: string
  body?: string
  signatureIntro?: string
  signatureJobTitle?: string
  signaturePhone?: string
  signatureLogoUrl?: string
  signatureLogoAlt?: string
  signatureBannerUrl?: string
  signatureBannerAlt?: string
  signatureHint?: string
  includeSignature?: boolean
}

export type SalesEmailTemplates = {
  customer?: SalesEmailTemplate
  internal?: SalesEmailTemplate
}

type RawSalesDocument = {
  _id?: string | null
  title?: string | null
  description?: string | null
  targetGroup?: string | null
  status?: string | null
  isActive?: boolean | null
  version?: string | null
  scenarioIds?: string[] | null
  pdfUrl?: string | null
  pdfMimeType?: string | null
  pdfOriginalFilename?: string | null
}

type RawDocumentCategory = {
  _id?: string | null
  title?: string | null
  navigationLabel?: string | null
  slug?: string | null
  categoryType?: string | null
  targetGroup?: string | null
  isActive?: boolean | null
  documents?: RawSalesDocument[] | null
  referencedDocuments?: RawSalesDocument[] | null
}

type RawScenarioDocuments = {
  _id?: string | null
  title?: string | null
  slug?: string | null
  targetGroup?: string | null
  scenarioType?: string | null
  recommendedCategories?: RawDocumentCategory[] | null
} | null

type RawEmailTemplate = {
  subject?: string | null
  body?: string | null
  signatureIntro?: string | null
  signatureJobTitle?: string | null
  signaturePhone?: string | null
  signatureLogoMedia?: RawSignatureMedia
  signatureBannerMedia?: RawSignatureMedia
  signatureHint?: string | null
  includeSignature?: boolean | null
} | null

type RawSignatureMedia = {
  title?: string | null
  altText?: string | null
  image?: SanityImage
} | null

type RawEmailTemplateQueryResult = {
  screenTemplate?: RawEmailTemplate
  defaultTemplate?: RawEmailTemplate
  internalScreenTemplate?: RawEmailTemplate
  internalDefaultTemplate?: RawEmailTemplate
}

const salesDocumentsClient = sanityClient.withConfig({useCdn: false})
const freshFetchOptions = {cache: 'no-store' as const}

function normalizeText(value: string | null | undefined) {
  return value?.trim() || ''
}

function matchesAudience(value: string | null | undefined, customerType: CustomerGroup) {
  return !value || value === 'both' || value === customerType
}

function normalizeCategoryKey(category: RawDocumentCategory, index: number) {
  return normalizeText(category.slug) || normalizeText(category._id) || `category-${index}`
}

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

function isExcludedNextStepCategory(
  category: RawDocumentCategory,
  customerType: CustomerGroup,
) {
  if (customerType !== 'b2b') {
    return false
  }

  const categoryIdentity = compactCmsKey(
    [
      category.categoryType,
      category.slug,
      category.navigationLabel,
      category.title,
    ].map((value) => normalizeText(value)).join(' '),
  )

  return categoryIdentity.includes('energiegemeinschaft')
}

function normalizeDocument(
  document: RawSalesDocument | null,
  customerType: CustomerGroup,
  scenarioId: string,
): AllowedSalesDocument | undefined {
  const id = normalizeText(document?._id)
  const title = normalizeText(document?.title)
  const pdfUrl = normalizeText(document?.pdfUrl)

  if (
    !id ||
    !title ||
    !pdfUrl ||
    document?.isActive === false ||
    document?.status !== 'active' ||
    !matchesAudience(document?.targetGroup, customerType) ||
    (Boolean(document?.scenarioIds?.length) && !document?.scenarioIds?.includes(scenarioId))
  ) {
    return undefined
  }

  return {
    id,
    title,
    description: normalizeText(document.description) || undefined,
    targetGroup: normalizeText(document.targetGroup) || undefined,
    version: normalizeText(document.version) || undefined,
    pdfUrl,
    pdfMimeType: normalizeText(document.pdfMimeType) || undefined,
    pdfOriginalFilename: normalizeText(document.pdfOriginalFilename) || undefined,
  }
}

function normalizeScenarioDocuments(
  rawScenario: RawScenarioDocuments,
  customerType: CustomerGroup,
  scenarioId: string,
): ScenarioDocumentSelection | undefined {
  const id = normalizeText(rawScenario?._id)
  const title = normalizeText(rawScenario?.title)

  if (!id || !title || !matchesAudience(rawScenario?.targetGroup, customerType)) {
    return undefined
  }

  const categories = (rawScenario?.recommendedCategories || []).flatMap((category, index) => {
    const categoryTitle = normalizeText(category?.navigationLabel) || normalizeText(category?.title)

    if (
      !category ||
      !categoryTitle ||
      category.isActive === false ||
      isExcludedNextStepCategory(category, customerType) ||
      !matchesAudience(category.targetGroup, customerType)
    ) {
      return []
    }

    const rawDocuments = [
      ...(category.documents || []),
      ...(category.referencedDocuments || []),
    ]
    const documents = rawDocuments
      .map((document) => normalizeDocument(document, customerType, scenarioId))
      .filter((document): document is AllowedSalesDocument => Boolean(document))
      .filter(
        (document, documentIndex, list) =>
          list.findIndex((item) => item.id === document.id) === documentIndex,
      )

    return [{
      key: normalizeCategoryKey(category, index),
      title: categoryTitle,
      documents,
    }]
  })

  return {
    scenario: {
      id,
      title,
      slug: normalizeText(rawScenario?.slug) || undefined,
      targetGroup: normalizeText(rawScenario?.targetGroup) || undefined,
      scenarioType: normalizeText(rawScenario?.scenarioType) || undefined,
    },
    categories,
  }
}

function normalizeEmailTemplate(template: RawEmailTemplate | undefined): SalesEmailTemplate | undefined {
  const subject = normalizeText(template?.subject)
  const signatureLogoUrl =
    buildLogoUrl(template?.signatureLogoMedia?.image) ||
    buildImageUrl(template?.signatureLogoMedia?.image, 420, undefined, 100)
  const signatureBannerUrl =
    buildImageUrl(template?.signatureBannerMedia?.image, 900, undefined, 90) ||
    buildLogoUrl(template?.signatureBannerMedia?.image)

  if (!subject && !normalizeText(template?.body)) {
    return undefined
  }

  return {
    subject: subject || undefined,
    body: normalizeText(template?.body) || undefined,
    signatureIntro: normalizeText(template?.signatureIntro) || undefined,
    signatureJobTitle: normalizeText(template?.signatureJobTitle) || undefined,
    signaturePhone: normalizeText(template?.signaturePhone) || undefined,
    signatureLogoUrl,
    signatureLogoAlt:
      normalizeText(template?.signatureLogoMedia?.altText) ||
      normalizeText(template?.signatureLogoMedia?.title) ||
      undefined,
    signatureBannerUrl,
    signatureBannerAlt:
      normalizeText(template?.signatureBannerMedia?.altText) ||
      normalizeText(template?.signatureBannerMedia?.title) ||
      undefined,
    signatureHint: normalizeText(template?.signatureHint) || undefined,
    includeSignature: template?.includeSignature !== false,
  }
}

export async function fetchScenarioDocumentSelection({
  customerType,
  scenarioId,
}: {
  customerType: CustomerGroup
  scenarioId: string
}) {
  const rawScenario = await salesDocumentsClient.fetch<RawScenarioDocuments>(
    NEXT_STEP_SCENARIO_DOCUMENT_CATEGORIES_QUERY,
    {customerType, scenarioId},
    freshFetchOptions,
  )

  return normalizeScenarioDocuments(rawScenario, customerType, scenarioId)
}

export async function fetchSalesEmailTemplates(customerType: CustomerGroup): Promise<SalesEmailTemplates> {
  const result = await salesDocumentsClient.fetch<RawEmailTemplateQueryResult>(
    NEXT_STEP_EMAIL_TEMPLATE_QUERY,
    {customerType},
    freshFetchOptions,
  )

  return {
    customer:
      normalizeEmailTemplate(result.screenTemplate) ||
      normalizeEmailTemplate(result.defaultTemplate),
    internal:
      normalizeEmailTemplate(result.internalScreenTemplate) ||
      normalizeEmailTemplate(result.internalDefaultTemplate),
  }
}

export async function fetchSalesEmailTemplate(customerType: CustomerGroup) {
  const templates = await fetchSalesEmailTemplates(customerType)

  return templates.customer
}

export function flattenAllowedDocuments(selection: ScenarioDocumentSelection) {
  return selection.categories
    .flatMap((category) => category.documents)
    .filter(
      (document, index, documents) =>
        documents.findIndex((item) => item.id === document.id) === index,
    )
}
