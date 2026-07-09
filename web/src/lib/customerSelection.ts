import {
  CUSTOMER_INFO_FORM_QUESTIONS_QUERY,
  CUSTOMER_INFO_QUESTION_SET_QUERY,
  CUSTOMER_SEGMENT_CONTENT_QUERY,
} from '@/lib/queries'
import {sanityClient} from '@/lib/sanity'

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

export async function getCustomerSelectionData() {
  try {
    const [segments, questionSet, formQuestions] = await Promise.all([
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
    ])

    const questionSetQuestions = questionSet?.questions?.filter(Boolean) || []

    return {
      segments: segments || [],
      formQuestions: sortQuestions(
        questionSetQuestions.length > 0 ? questionSetQuestions : formQuestions || [],
      ),
    }
  } catch {
    return {
      segments: [],
      formQuestions: [],
    }
  }
}
