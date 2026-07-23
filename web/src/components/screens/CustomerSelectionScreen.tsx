'use client'

import type {
  CustomerGroup,
  CustomerInfoQuestion,
  CustomerSegmentDocument,
} from '@/lib/customerSelection'
import type { ConsultationCustomer } from '@/lib/consultation'
import {
  saveCustomerDraft,
  saveCustomerSelection,
  useConsultationStore,
} from '@/lib/consultationStore'
import type { LoginScreenDocument } from '@/lib/authBranding'
import { ArrowUpRight } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'

type ScreenSection = NonNullable<NonNullable<LoginScreenDocument>['sections']>[number]

type CustomerSelectionScreenProps = {
  screen?: LoginScreenDocument
  segments?: CustomerSegmentDocument[]
  formQuestions?: CustomerInfoQuestion[]
  privateCtaIconUrl?: string
  businessCtaIconUrl?: string
  rightPatternUrl?: string
}

type CustomerCard = {
  customerType: CustomerGroup
  title: string
  text: string
  ctaLabel: string
  ctaTarget: string
  ctaIconUrl?: string | null
  patternUrl?: string | null
}

type CustomerInfoFieldError = {
  message: string
}

type CustomerInfoValidationResult = {
  success: boolean
  errors: Record<string, CustomerInfoFieldError>
}

const cardBaseClass =
  'relative isolate flex min-h-full cursor-pointer overflow-hidden rounded-[22px] p-[30px] transition-[outline-color,transform] duration-150 hover:[transform:translateY(-2px)] focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-[5px] focus-visible:outline-[rgba(61,66,72,0.34)]'
const cardActiveClass =
  'is-active outline outline-[3px] outline-offset-[5px] outline-[rgba(61,66,72,0.26)] [transform:translateY(-4px)]'
const cardContentClass =
  'relative z-[1] flex max-w-[350px] flex-col justify-end self-end'
const cardTitleClass =
  'text-[38px] font-bold leading-none tracking-[0.02em] max-[1600px]:text-[42px] [@media(max-height:920px)]:text-[42px]'
const cardTextClass =
  'mt-[22px] max-w-[340px] text-[16px] font-normal leading-[1.42] tracking-[0.012em] max-[1600px]:text-[18px] [@media(max-height:920px)]:text-[18px]'
const cardButtonBaseClass =
  'mt-7 inline-flex h-[31px] w-[186px] items-center justify-between gap-[14px] overflow-hidden rounded-full px-[19px] pl-[23px] text-[14px] font-semibold uppercase leading-none tracking-[0.045em] transition-[background-color,color,transform] duration-150 hover:-translate-y-px max-[1600px]:h-[38px] max-[1600px]:w-[210px] max-[1600px]:text-[16px] [@media(max-height:920px)]:h-[38px] [@media(max-height:920px)]:w-[210px] [@media(max-height:920px)]:text-[16px]'
const cardButtonIconClass =
  'block !h-[17px] !max-h-[17px] !min-h-[17px] !w-[17px] !max-w-[17px] !min-w-[17px] shrink-0 object-contain object-center'
const selectionLayoutClassName =
  'absolute bottom-[66px] left-[56px] right-[190px] top-[174px] z-10 grid grid-cols-[minmax(0,1fr)_320px] items-stretch justify-start gap-x-[56px] font-sans [transform:translateX(134px)]'
const selectionCardsClassName =
  'grid h-full min-h-0 w-max grid-cols-[clamp(400px,28cqw,520px)_clamp(400px,28cqw,520px)] gap-[18px] [transform:translateX(-136px)]'
const cardPatternBaseClassName =
  'pointer-events-none absolute -right-[118px] -top-[70px] z-0 block h-[390px] w-[390px] bg-contain bg-center bg-no-repeat'
const privateCardPatternClassName =
  'opacity-[0.92] [filter:brightness(0)_saturate(100%)_invert(21%)_sepia(7%)_saturate(703%)_hue-rotate(169deg)_brightness(92%)_contrast(88%)]'
const businessCardPatternClassName =
  'opacity-[0.62] [filter:brightness(0)_saturate(100%)_invert(76%)_sepia(79%)_saturate(1396%)_hue-rotate(359deg)_brightness(99%)_contrast(91%)]'
const customerInfoTranslateClassName =
  '[transform:translateX(-134px)]'
const customerInfoFullWidthClassName = 'w-[calc(100%+134px)]'

const fallbackCards: Record<CustomerGroup, CustomerCard> = {
  b2c: {
    customerType: 'b2c',
    title: 'PRIVAT',
    text: 'Energie clever nutzen, Kosten senken und das eigene Zuhause nachhaltig für morgen rüsten.',
    ctaLabel: 'JETZT STARTEN',
    ctaTarget: 'customer-type:b2c',
  },
  b2b: {
    customerType: 'b2b',
    title: 'GEWERBE',
    text: 'Effiziente Energielösungen, die Betriebskosten senken und Unternehmen nachhaltig stärken.',
    ctaLabel: 'JETZT STARTEN',
    ctaTarget: 'customer-type:b2b',
  },
}

const fallbackQuestions: CustomerInfoQuestion[] = [
  {
    title: 'Name',
    questionText: 'Name',
    answerType: 'name',
    isRequired: true,
    sortOrder: 0,
  },
  {
    title: 'Telefon',
    questionText: 'Telefon',
    answerType: 'telefon',
    isRequired: true,
    sortOrder: 1,
  },
  {
    title: 'E-Mail',
    questionText: 'E-Mail',
    answerType: 'email',
    isRequired: false,
    sortOrder: 2,
  },
]

function includesGroup(value: string | null | undefined, group: CustomerGroup) {
  const normalized = value?.toLocaleLowerCase('de-AT') || ''

  if (group === 'b2c') {
    return normalized.includes('b2c') || normalized.includes('privat')
  }

  return normalized.includes('b2b') || normalized.includes('gewerbe') || normalized.includes('geschäft')
}

function findSectionForGroup(sections: ScreenSection[], group: CustomerGroup, fallbackIndex: number) {
  return (
    sections.find(
      (section) =>
        section.visibleFor === group ||
        includesGroup(section.title, group) ||
        includesGroup(section.eyebrow, group) ||
        includesGroup(section.cta?.target, group),
    ) || sections[fallbackIndex]
  )
}

function findSegmentForGroup(segments: CustomerSegmentDocument[], group: CustomerGroup) {
  return segments.find(
    (segment) =>
      segment.targetGroup === group ||
      includesGroup(segment.segmentKey, group) ||
      includesGroup(segment.title, group),
  )
}

function buildCustomerCards(
  sections: ScreenSection[] | null | undefined,
  segments: CustomerSegmentDocument[] | null | undefined,
  privateCtaIconUrl?: string,
  businessCtaIconUrl?: string,
) {
  const sortedSections = [...(sections || [])].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
  const groups: CustomerGroup[] = ['b2c', 'b2b']

  return groups.map((group, index) => {
    const fallback = fallbackCards[group]
    const section = findSectionForGroup(sortedSections, group, index)
    const segment = findSegmentForGroup(segments || [], group)
    const title = section?.title || segment?.headline || segment?.title || fallback.title
    const text = section?.text || segment?.mainText || segment?.focusText || fallback.text
    const ctaLabel = section?.cta?.label || segment?.ctaText || fallback.ctaLabel
    const ctaTarget = section?.cta?.target || fallback.ctaTarget

    return {
      customerType: group,
      title: title.toLocaleUpperCase('de-AT'),
      text,
      ctaLabel: ctaLabel.toLocaleUpperCase('de-AT'),
      ctaTarget,
      ctaIconUrl: group === 'b2c' ? privateCtaIconUrl : businessCtaIconUrl,
      patternUrl: section?.patternUrl,
    }
  })
}

function getQuestionKey(question: CustomerInfoQuestion, index: number) {
  return question.answerType || question.title || question.questionText || `field-${index}`
}

function getInputType(answerType: string | null | undefined) {
  if (answerType === 'telefon') {
    return 'tel'
  }

  if (answerType === 'email') {
    return 'email'
  }

  return 'text'
}

function getQuestionLabel(question: CustomerInfoQuestion) {
  return (question.questionText || question.title || 'Feld').replace(/\s*\*+\s*$/, '')
}

function isQuestionRequired(question: CustomerInfoQuestion) {
  const visibleLabel = question.questionText || question.title || ''

  return Boolean(question.isRequired) || /\*\s*$/.test(visibleLabel)
}

function getAnswerKind(answerType: string | null | undefined) {
  const normalized = answerType?.toLocaleLowerCase('de-AT') || ''

  if (normalized.includes('mail')) {
    return 'email'
  }

  if (normalized.includes('tel') || normalized.includes('phone')) {
    return 'phone'
  }

  if (normalized.includes('name')) {
    return 'name'
  }

  return 'text'
}

function validateCustomerInfoSchema(
  questions: CustomerInfoQuestion[],
  values: Record<string, string>,
): CustomerInfoValidationResult {
  const errors: Record<string, CustomerInfoFieldError> = {}

  questions.forEach((question, index) => {
    const questionKey = getQuestionKey(question, index)
    const questionLabel = getQuestionLabel(question)
    const answerKind = getAnswerKind(question.answerType)
    const value = values[questionKey]?.trim() || ''

    if (isQuestionRequired(question) && !value) {
      errors[questionKey] = {
        message: `${questionLabel} ist ein Pflichtfeld.`,
      }
      return
    }

    if (!value) {
      return
    }

    if (answerKind === 'name' && value.length < 2) {
      errors[questionKey] = {
        message: 'Bitte einen vollständigen Namen eingeben.',
      }
      return
    }

    if (answerKind === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      errors[questionKey] = {
        message: 'Bitte eine gültige E-Mail-Adresse eingeben.',
      }
      return
    }

    if (answerKind === 'phone' && value.replace(/\D/g, '').length < 6) {
      errors[questionKey] = {
        message: 'Bitte eine gültige Telefonnummer eingeben.',
      }
    }
  })

  return {
    success: Object.keys(errors).length === 0,
    errors,
  }
}

function getErrorSummary(errorCount: number) {
  if (errorCount === 1) {
    return 'Bitte das markierte Pflichtfeld ausfüllen.'
  }

  return 'Bitte die markierten Pflichtfelder ausfüllen.'
}

function getFieldId(questionKey: string, index: number) {
  return `customer-info-${index}-${questionKey.toLocaleLowerCase('de-AT').replace(/[^a-z0-9]+/g, '-')}`
}

function buildCustomerFromForm(
  questions: CustomerInfoQuestion[],
  values: Record<string, string>,
): ConsultationCustomer {
  const customer: ConsultationCustomer = {
    name: '',
    phone: '',
    email: '',
  }

  questions.forEach((question, index) => {
    const questionKey = getQuestionKey(question, index)
    const value = values[questionKey]?.trim() || ''

    if (!value) {
      return
    }

    const answerKind = getAnswerKind(question.answerType)

    if (answerKind === 'name' && !customer.name) {
      customer.name = value
    }

    if (answerKind === 'phone' && !customer.phone) {
      customer.phone = value
    }

    if (answerKind === 'email' && !customer.email) {
      customer.email = value
    }
  })

  return customer
}

function buildFormValuesFromCustomer(
  questions: CustomerInfoQuestion[],
  customer: ConsultationCustomer,
) {
  const values: Record<string, string> = {}

  questions.forEach((question, index) => {
    const questionKey = getQuestionKey(question, index)
    const answerKind = getAnswerKind(question.answerType)

    if (answerKind === 'name') {
      values[questionKey] = customer.name
    }

    if (answerKind === 'phone') {
      values[questionKey] = customer.phone
    }

    if (answerKind === 'email') {
      values[questionKey] = customer.email
    }
  })

  return values
}

export function CustomerSelectionScreen({
  screen,
  segments,
  formQuestions,
  privateCtaIconUrl,
  businessCtaIconUrl,
  rightPatternUrl,
}: CustomerSelectionScreenProps) {
  const router = useRouter()
  const consultation = useConsultationStore()
  const cards = useMemo(
    () => buildCustomerCards(screen?.sections, segments, privateCtaIconUrl, businessCtaIconUrl),
    [screen?.sections, segments, privateCtaIconUrl, businessCtaIconUrl],
  )
  const questions = formQuestions && formQuestions.length > 0 ? formQuestions : fallbackQuestions
  const storedFormValues = useMemo(
    () => consultation.customer ? buildFormValuesFromCustomer(questions, consultation.customer) : {},
    [consultation.customer, questions],
  )
  const [selectedCustomerType, setSelectedCustomerType] = useState<CustomerGroup | null>(null)
  const [formValues, setFormValues] = useState<Record<string, string>>({})
  const [fieldErrors, setFieldErrors] = useState<Record<string, CustomerInfoFieldError>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const currentFormValues = useMemo(
    () => ({
      ...storedFormValues,
      ...formValues,
    }),
    [formValues, storedFormValues],
  )
  const visibleSelectedCustomerType = selectedCustomerType || consultation.customerType || null

  function validateCustomerInfo() {
    const validation = validateCustomerInfoSchema(questions, currentFormValues)
    const nextErrors = validation.errors
    const errorCount = Object.keys(nextErrors).length

    setFieldErrors(nextErrors)

    if (!validation.success) {
      setSelectedCustomerType(null)
      setFormError(getErrorSummary(errorCount))

      const firstErrorIndex = questions.findIndex((question, index) => nextErrors[getQuestionKey(question, index)])

      if (firstErrorIndex >= 0) {
        const firstQuestion = questions[firstErrorIndex]
        const firstQuestionKey = getQuestionKey(firstQuestion, firstErrorIndex)
        const firstFieldId = getFieldId(firstQuestionKey, firstErrorIndex)

        window.requestAnimationFrame(() => {
          document.getElementById(firstFieldId)?.focus()
        })
      }

      return false
    }

    setFormError(null)
    return true
  }

  function handleCustomerStart(customerType: CustomerGroup) {
    if (!validateCustomerInfo()) {
      return
    }

    saveCustomerSelection(customerType, buildCustomerFromForm(questions, currentFormValues))
    setSelectedCustomerType(customerType)
    router.push(`/about?type=${customerType}`)
  }

  return (
    <section className={selectionLayoutClassName}>
      <div className={selectionCardsClassName} aria-label={screen?.headline || 'Kundengruppe auswählen'}>
        {cards.map((card) => {
          const isActive = visibleSelectedCustomerType === card.customerType
          const patternUrl = card.patternUrl || rightPatternUrl
          const cardPatternStyle = patternUrl
            ? { backgroundImage: `url("${patternUrl}")` }
            : undefined

          return (
            <article
              key={card.customerType}
              role="button"
              tabIndex={0}
              aria-label={`${card.title}: ${card.ctaLabel}`}
              aria-pressed={isActive}
              className={`${cardBaseClass} ${card.customerType === 'b2c' ? 'bg-[#efb804] text-[#3d4248]' : 'bg-[#3d4248] text-white'
                } ${isActive ? cardActiveClass : ''}`}
              onClick={() => handleCustomerStart(card.customerType)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  handleCustomerStart(card.customerType)
                }
              }}
            >
              {cardPatternStyle ? (
                <span
                  className={`${cardPatternBaseClassName} ${card.customerType === 'b2c'
                    ? privateCardPatternClassName
                    : businessCardPatternClassName
                    }`}
                  style={cardPatternStyle}
                  aria-hidden="true"
                />
              ) : null}

              <div className={cardContentClass}>
                <h2 className={cardTitleClass}>{card.title}</h2>
                <p className={cardTextClass}>{card.text}</p>
                <span
                  data-target={card.ctaTarget}
                  className={`${cardButtonBaseClass} ${card.customerType === 'b2c' ? 'bg-[#3d4248] text-white' : 'bg-white text-[#3d4248]'
                    }`}
                  aria-hidden="true"
                >
                  <span className="min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap">
                    {card.ctaLabel}
                  </span>
                  {card.ctaIconUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={card.ctaIconUrl}
                      alt=""
                      className={cardButtonIconClass}
                      aria-hidden="true"
                    />
                  ) : (
                    <ArrowUpRight className="h-[15px] w-[15px] shrink-0" strokeWidth={2.4} aria-hidden="true" />
                  )}
                </span>
              </div>
            </article>
          )
        })}
      </div>

      <form
        className="relative z-[1] w-[min(370px,100%)] justify-self-end pt-[14px] text-[#3d4248]"
        aria-label="Kundeninfos"
      >
        <h2 className={`${customerInfoTranslateClassName} text-[34px] font-bold leading-none tracking-[0.018em] max-[1600px]:text-[38px] [@media(max-height:920px)]:text-[38px]`}>
          KUNDENINFOS
        </h2>

        {formError ? (
          <div
            id="customer-info-error-summary"
            className={`mt-[18px] flex ${customerInfoFullWidthClassName} ${customerInfoTranslateClassName} items-center gap-[10px] border-l-[3px] border-l-[#efb804] pl-[12px] text-[13px] font-semibold leading-[1.3] text-[#6f757b] max-[1600px]:text-[15px] [@media(max-height:920px)]:text-[15px]`}
            role="alert"
            aria-live="polite"
          >
            {formError}
          </div>
        ) : null}

        <div className="mt-[58px]">
          {questions.map((question, index) => {
            const questionKey = getQuestionKey(question, index)
            const questionLabel = getQuestionLabel(question)
            const required = isQuestionRequired(question)
            const error = fieldErrors[questionKey]
            const fieldId = getFieldId(questionKey, index)

            return (
              <label
                key={`${questionKey}-${index}`}
                className="mb-6 block"
                htmlFor={fieldId}
              >
                <span className={`block ${customerInfoTranslateClassName} text-[17px] font-bold leading-[1.2] tracking-[0.02em] max-[1600px]:text-[19px] [@media(max-height:920px)]:text-[19px]`}>
                  {questionLabel.toLocaleUpperCase('de-AT')}
                  {required ? ' *' : ''}
                </span>
                <input
                  id={fieldId}
                  type={getInputType(question.answerType)}
                  value={currentFormValues[questionKey] || ''}
                  placeholder={question.placeholder || ''}
                  required={required}
                  aria-invalid={Boolean(error)}
                  aria-describedby={error ? `${fieldId}-error` : undefined}
                  className={`block h-[38px] ${customerInfoFullWidthClassName} ${customerInfoTranslateClassName} border-0 border-b-2 bg-transparent font-sans text-[18px] text-[#3d4248] outline-none placeholder:text-[#aeb3b7] focus:border-b-[#efb804] max-[1600px]:h-[42px] max-[1600px]:text-[20px] [@media(max-height:920px)]:h-[42px] [@media(max-height:920px)]:text-[20px] ${error
                    ? 'border-b-[#efb804] shadow-[0_2px_0_rgba(239,184,4,0.26)]'
                    : 'border-b-[#3d4248]'
                    }`}
                  onChange={(event) => {
                    const nextValue = event.target.value
                    const nextValues = {
                      ...formValues,
                      [questionKey]: nextValue,
                    }
                    const nextCurrentValues = {
                      ...storedFormValues,
                      ...nextValues,
                    }

                    setFormValues(nextValues)
                    saveCustomerDraft(buildCustomerFromForm(questions, nextCurrentValues))

                    if (error && nextValue.trim()) {
                      setFieldErrors((currentErrors) => {
                        const nextErrors = { ...currentErrors }
                        delete nextErrors[questionKey]
                        return nextErrors
                      })
                    }

                    if (formError) {
                      setFormError(null)
                    }
                  }}
                />
                {error ? (
                  <p
                    id={`${fieldId}-error`}
                    className={`mt-2 flex ${customerInfoFullWidthClassName} ${customerInfoTranslateClassName} items-center gap-2 text-[12px] font-semibold leading-[1.25] text-[#6f757b] before:h-1.5 before:w-1.5 before:shrink-0 before:rounded-full before:bg-[#efb804] before:shadow-[0_0_0_4px_rgba(239,184,4,0.14)] max-[1600px]:text-[14px] [@media(max-height:920px)]:text-[14px]`}
                  >
                    {error.message}
                  </p>
                ) : null}
              </label>
            )
          })}
        </div>
      </form>
    </section>
  )
}
