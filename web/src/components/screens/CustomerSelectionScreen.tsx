'use client'

import type {
  CustomerGroup,
  CustomerInfoQuestion,
  CustomerSegmentDocument,
} from '@/lib/customerSelection'
import type { LoginScreenDocument } from '@/lib/authBranding'
import {ArrowUpRight} from 'lucide-react'
import {useRouter} from 'next/navigation'
import {useMemo, useState} from 'react'

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
  'relative isolate flex min-h-full overflow-hidden rounded-[22px] p-[clamp(34px,2.8vw,40px)] transition-[outline-color,transform] duration-150 max-[1400px]:rounded-[20px] max-[1400px]:p-[34px] [@media_(min-width:1024px)_and_(max-height:950px)]:p-[30px]'
const cardActiveClass =
  'is-active outline outline-[3px] outline-offset-[5px] outline-[rgba(61,66,72,0.26)] [transform:translateY(-4px)]'
const cardContentClass =
  'relative z-[1] flex max-w-[350px] flex-col justify-end self-end'
const cardTitleClass =
  'text-[clamp(42px,3.35vw,48px)] font-bold leading-none tracking-[0.02em] max-[1400px]:text-[42px] [@media_(min-width:1024px)_and_(max-height:950px)]:text-[38px]'
const cardTextClass =
  'mt-6 max-w-[340px] text-[18px] font-normal leading-[1.42] tracking-[0.012em] max-[1400px]:text-[17px] [@media_(min-width:1024px)_and_(max-height:950px)]:mt-[22px] [@media_(min-width:1024px)_and_(max-height:950px)]:text-[16px]'
const cardButtonBaseClass =
  'mt-[34px] inline-flex h-8 w-[206px] items-center justify-between gap-[14px] overflow-hidden rounded-full px-[22px] pl-[25px] text-[15px] font-semibold uppercase leading-none tracking-[0.045em] transition-[background-color,color,transform] duration-150 hover:-translate-y-px [@media_(min-width:1024px)_and_(max-height:950px)]:mt-7 [@media_(min-width:1024px)_and_(max-height:950px)]:h-[31px] [@media_(min-width:1024px)_and_(max-height:950px)]:w-[186px] [@media_(min-width:1024px)_and_(max-height:950px)]:px-[19px] [@media_(min-width:1024px)_and_(max-height:950px)]:pl-[23px] [@media_(min-width:1024px)_and_(max-height:950px)]:text-[14px]'
const cardButtonIconClass =
  'block !h-[14px] !max-h-[14px] !min-h-[14px] !w-[14px] !max-w-[14px] !min-w-[14px] shrink-0 object-contain object-center'
const selectionLayoutClassName =
  'absolute bottom-[clamp(74px,7.2vh,92px)] left-[clamp(48px,3.9vw,60px)] right-[calc(clamp(52px,4.2vw,60px)+clamp(120px,7vw,170px))] top-[clamp(188px,21vh,215px)] z-10 grid grid-cols-[minmax(0,1fr)_minmax(340px,370px)] items-stretch justify-start gap-x-[clamp(46px,4.8vw,70px)] font-sans [transform:translateX(clamp(120px,7vw,170px))] max-[1400px]:bottom-[72px] max-[1400px]:left-[clamp(46px,3.4vw,56px)] max-[1400px]:right-[calc(clamp(48px,4vw,58px)+clamp(120px,7vw,170px))] max-[1400px]:top-[clamp(166px,20vh,190px)] max-[1400px]:grid-cols-[minmax(0,1fr)_minmax(312px,340px)] max-[1400px]:gap-x-[clamp(42px,4vw,58px)] [@media_(min-width:1024px)_and_(max-height:950px)]:!bottom-[66px] [@media_(min-width:1024px)_and_(max-height:950px)]:!left-[clamp(46px,3.4vw,56px)] [@media_(min-width:1024px)_and_(max-height:950px)]:!right-[calc(clamp(46px,3.8vw,56px)+clamp(120px,7vw,170px))] [@media_(min-width:1024px)_and_(max-height:950px)]:!top-[clamp(154px,18.5vh,178px)] [@media_(min-width:1024px)_and_(max-height:950px)]:!grid-cols-[minmax(0,1fr)_minmax(286px,320px)] [@media_(min-width:1024px)_and_(max-height:950px)]:!gap-x-[clamp(44px,3vw,56px)]'
const selectionCardsClassName =
  'grid h-full min-h-0 w-[calc(100%+8px)] grid-cols-2 gap-5 [transform:translateX(-136px)] max-[1400px]:gap-[18px]'
const cardPatternBaseClassName =
  'pointer-events-none absolute -right-[118px] -top-[70px] z-0 block h-[390px] w-[390px] bg-contain bg-center bg-no-repeat max-[1400px]:-right-[120px] max-[1400px]:-top-[68px] max-[1400px]:h-[350px] max-[1400px]:w-[350px] [@media_(min-width:1024px)_and_(max-height:950px)]:!-right-[116px] [@media_(min-width:1024px)_and_(max-height:950px)]:!-top-[64px] [@media_(min-width:1024px)_and_(max-height:950px)]:!h-[315px] [@media_(min-width:1024px)_and_(max-height:950px)]:!w-[315px]'
const privateCardPatternClassName =
  'opacity-[0.92] [filter:brightness(0)_saturate(100%)_invert(21%)_sepia(7%)_saturate(703%)_hue-rotate(169deg)_brightness(92%)_contrast(88%)]'
const businessCardPatternClassName =
  'opacity-[0.62] [filter:brightness(0)_saturate(100%)_invert(76%)_sepia(79%)_saturate(1396%)_hue-rotate(359deg)_brightness(99%)_contrast(91%)]'
const customerInfoTranslateClassName =
  '[transform:translateX(calc(clamp(112px,7vw,150px)*-1))]'
const customerInfoFullWidthClassName = 'w-[calc(100%+clamp(112px,7vw,150px))]'

const fallbackCards: Record<CustomerGroup, CustomerCard> = {
  b2c: {
    customerType: 'b2c',
    title: 'PRIVAT',
    text: 'Veniam mollit nostrud eu quis cupidatat velit ad exercitation aute qui ullamco in tempor.',
    ctaLabel: 'JETZT STARTEN',
    ctaTarget: 'customer-type:b2c',
  },
  b2b: {
    customerType: 'b2b',
    title: 'GEWERBE',
    text: 'Veniam mollit nostrud eu quis cupidatat velit ad exercitation aute qui ullamco in tempor.',
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
    const text = segment?.mainText || segment?.focusText || section?.text || fallback.text
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
    return 'Bitte prüfe die markierte Angabe. Danach kannst du die Kundengruppe starten.'
  }

  return 'Bitte prüfe die markierten Angaben. Danach kannst du die Kundengruppe starten.'
}

function getFieldId(questionKey: string, index: number) {
  return `customer-info-${index}-${questionKey.toLocaleLowerCase('de-AT').replace(/[^a-z0-9]+/g, '-')}`
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
  const cards = useMemo(
    () => buildCustomerCards(screen?.sections, segments, privateCtaIconUrl, businessCtaIconUrl),
    [screen?.sections, segments, privateCtaIconUrl, businessCtaIconUrl],
  )
  const questions = formQuestions && formQuestions.length > 0 ? formQuestions : fallbackQuestions
  const [selectedCustomerType, setSelectedCustomerType] = useState<CustomerGroup | null>(null)
  const [formValues, setFormValues] = useState<Record<string, string>>({})
  const [fieldErrors, setFieldErrors] = useState<Record<string, CustomerInfoFieldError>>({})
  const [formError, setFormError] = useState<string | null>(null)

  function validateCustomerInfo() {
    const validation = validateCustomerInfoSchema(questions, formValues)
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

    setSelectedCustomerType(customerType)
    router.push(`/about?type=${customerType}`)
  }

  return (
    <section className={selectionLayoutClassName}>
      <div className={selectionCardsClassName} aria-label={screen?.headline || 'Kundengruppe auswählen'}>
        {cards.map((card) => {
          const isActive = selectedCustomerType === card.customerType
          const patternUrl = card.patternUrl || rightPatternUrl
          const cardPatternStyle = patternUrl
            ? {backgroundImage: `url("${patternUrl}")`}
            : undefined

          return (
            <article
              key={card.customerType}
              className={`${cardBaseClass} ${
                card.customerType === 'b2c' ? 'bg-[#efb804] text-[#3d4248]' : 'bg-[#3d4248] text-white'
              } ${isActive ? cardActiveClass : ''}`}
            >
              {cardPatternStyle ? (
                <span
                  className={`${cardPatternBaseClassName} ${
                    card.customerType === 'b2c'
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
                <button
                  type="button"
                  data-target={card.ctaTarget}
                  aria-pressed={isActive}
                  className={`${cardButtonBaseClass} ${
                    card.customerType === 'b2c' ? 'bg-[#3d4248] text-white' : 'bg-white text-[#3d4248]'
                  }`}
                  onClick={() => handleCustomerStart(card.customerType)}
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
                </button>
              </div>
            </article>
          )
        })}
      </div>

      <form
        className="relative z-[1] w-[min(370px,100%)] justify-self-end pt-[14px] text-[#3d4248]"
        aria-label="Kundeninfos"
      >
        <h2 className={`${customerInfoTranslateClassName} text-[34px] font-bold leading-none tracking-[0.018em] max-[1400px]:text-[30px] [@media_(min-width:1024px)_and_(max-height:950px)]:text-[28px]`}>
          KUNDENINFOS
        </h2>

        {formError ? (
          <div
            id="customer-info-error-summary"
            className={`mt-[22px] flex ${customerInfoFullWidthClassName} ${customerInfoTranslateClassName} items-start gap-[10px] rounded-[10px] border border-[#e1e4e6] border-l-4 border-l-[#efb804] bg-white/95 px-[14px] py-3 text-[#3d4248] shadow-[0_14px_34px_rgba(61,66,72,0.09)]`}
            role="alert"
            aria-live="polite"
          >
            <span className="mt-[5px] h-[9px] w-[9px] shrink-0 rounded-full bg-[#efb804] shadow-[0_0_0_5px_rgba(239,184,4,0.16)]" aria-hidden="true" />
            <div>
              <strong className="block text-[13px] font-bold uppercase leading-[1.1] tracking-[0.035em]">
                Angaben prüfen
              </strong>
              <p className="mt-1 text-[12px] font-medium leading-[1.3] text-[#6f757b]">{formError}</p>
            </div>
          </div>
        ) : null}

        <div className={`${formError ? 'mt-11' : 'mt-[72px]'} max-[1400px]:mt-16 [@media_(min-width:1024px)_and_(max-height:950px)]:mt-[58px]`}>
          {questions.map((question, index) => {
            const questionKey = getQuestionKey(question, index)
            const questionLabel = getQuestionLabel(question)
            const required = isQuestionRequired(question)
            const error = fieldErrors[questionKey]
            const fieldId = getFieldId(questionKey, index)

            return (
              <label
                key={`${questionKey}-${index}`}
                className="mb-7 block [@media_(min-width:1024px)_and_(max-height:950px)]:mb-6"
                htmlFor={fieldId}
              >
                <span className={`block ${customerInfoTranslateClassName} text-[17px] font-bold leading-[1.2] tracking-[0.02em] [@media_(min-width:1024px)_and_(max-height:950px)]:text-[15px]`}>
                  {questionLabel.toLocaleUpperCase('de-AT')}
                  {required ? ' *' : ''}
                </span>
                <input
                  id={fieldId}
                  type={getInputType(question.answerType)}
                  value={formValues[questionKey] || ''}
                  placeholder={question.placeholder || ''}
                  required={required}
                  aria-invalid={Boolean(error)}
                  aria-describedby={error ? `${fieldId}-error` : undefined}
                  className={`block h-[38px] ${customerInfoFullWidthClassName} ${customerInfoTranslateClassName} border-0 border-b-2 bg-transparent font-sans text-[18px] text-[#3d4248] outline-none placeholder:text-[#aeb3b7] focus:border-b-[#efb804] ${
                    error
                      ? 'border-b-[#efb804] shadow-[0_2px_0_rgba(239,184,4,0.26)]'
                      : 'border-b-[#3d4248]'
                  }`}
                  onChange={(event) => {
                    const nextValue = event.target.value

                    setFormValues((currentValues) => ({
                      ...currentValues,
                      [questionKey]: nextValue,
                    }))

                    if (error && nextValue.trim()) {
                      setFieldErrors((currentErrors) => {
                        const nextErrors = {...currentErrors}
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
                    className={`mt-2 flex ${customerInfoFullWidthClassName} ${customerInfoTranslateClassName} items-center gap-2 text-[12px] font-semibold leading-[1.25] text-[#6f757b] before:h-1.5 before:w-1.5 before:shrink-0 before:rounded-full before:bg-[#efb804] before:shadow-[0_0_0_4px_rgba(239,184,4,0.14)]`}
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
