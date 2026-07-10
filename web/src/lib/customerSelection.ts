import {
  CUSTOMER_INFO_FORM_QUESTIONS_QUERY,
  CUSTOMER_INFO_QUESTION_SET_QUERY,
  CUSTOMER_SELECTION_BUSINESS_CTA_ICON_QUERY,
  CUSTOMER_SELECTION_PRIVATE_CTA_ICON_QUERY,
  CUSTOMER_SEGMENT_CONTENT_QUERY,
} from '@/lib/queries'
import {sanityClient, urlForImage} from '@/lib/sanity'

export type CustomerGroup = 'b2c' | 'b2b'

export type CustomerSegmentDocument = {
  title?: string | null
  segmentKey?: string | null
  targetGroup?: string | null
  headline?: string | null
  mainText?: string | null
  focusText?: string | null
  ctaText?: string | null
  sortOrder?: number | null
}

export type CustomerInfoQuestion = {
  title?: string | null
  questionText?: string | null
  helpText?: string | null
  targetGroup?: string | null
  answerType?: string | null
  unit?: string | null
  placeholder?: string | null
  isRequired?: boolean | null
  sortOrder?: number | null
}

type SanityImage = {
  asset?: {_ref?: string; _id?: string; url?: string} | null
  assetUrl?: string
  mimeType?: string
  extension?: string
  originalFilename?: string
  crop?: unknown
  hotspot?: unknown
} | null

type CustomerSelectionIconDocument = {
  title?: string | null
  altText?: string | null
  image?: SanityImage
} | null

type CustomerInfoQuestionSet = {
  title?: string | null
  slug?: string | null
  introText?: string | null
  questions?: CustomerInfoQuestion[] | null
} | null

const customerSelectionClient = sanityClient.withConfig({useCdn: false})
const freshFetchOptions = {cache: 'no-store' as const}

function sortQuestions(questions: CustomerInfoQuestion[]) {
  return [...questions].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
}

function buildIconUrl(image: SanityImage | undefined) {
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
    return urlForImage(image).width(96).fit('max').quality(100).url()
  } catch {
    return undefined
  }
}

export async function getCustomerSelectionData() {
  try {
    const [segments, questionSet, formQuestions, privateCtaIcon, businessCtaIcon] = await Promise.all([
      customerSelectionClient.fetch<CustomerSegmentDocument[]>(
        CUSTOMER_SEGMENT_CONTENT_QUERY,
        {},
        freshFetchOptions,
      ),
      customerSelectionClient.fetch<CustomerInfoQuestionSet>(
        CUSTOMER_INFO_QUESTION_SET_QUERY,
        {},
        freshFetchOptions,
      ),
      customerSelectionClient.fetch<CustomerInfoQuestion[]>(
        CUSTOMER_INFO_FORM_QUESTIONS_QUERY,
        {},
        freshFetchOptions,
      ),
      customerSelectionClient.fetch<CustomerSelectionIconDocument>(
        CUSTOMER_SELECTION_PRIVATE_CTA_ICON_QUERY,
        {},
        freshFetchOptions,
      ),
      customerSelectionClient.fetch<CustomerSelectionIconDocument>(
        CUSTOMER_SELECTION_BUSINESS_CTA_ICON_QUERY,
        {},
        freshFetchOptions,
      ),
    ])

    const questionSetQuestions = questionSet?.questions?.filter(Boolean) || []

    return {
      segments: segments || [],
      formQuestions: sortQuestions(
        questionSetQuestions.length > 0 ? questionSetQuestions : formQuestions || [],
      ),
      privateCtaIconUrl: buildIconUrl(privateCtaIcon?.image),
      businessCtaIconUrl: buildIconUrl(businessCtaIcon?.image),
    }
  } catch {
    return {
      segments: [],
      formQuestions: [],
      privateCtaIconUrl: undefined,
      businessCtaIconUrl: undefined,
    }
  }
}
