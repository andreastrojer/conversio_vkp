'use client'

import type {
  CustomerGroup,
  CustomerInfoQuestion,
  CustomerSegmentDocument,
} from '@/lib/customerSelection'
import type { LoginScreenDocument } from '@/lib/authBranding'
import { type CSSProperties, useMemo, useState } from 'react'

type ScreenSection = NonNullable<NonNullable<LoginScreenDocument>['sections']>[number]

type CustomerSelectionScreenProps = {
  screen?: LoginScreenDocument
  segments?: CustomerSegmentDocument[]
  formQuestions?: CustomerInfoQuestion[]
  rightPatternUrl?: string
}

type CustomerCard = {
  customerType: CustomerGroup
  title: string
  text: string
  ctaLabel: string
  ctaTarget: string
  patternUrl?: string | null
}

type CustomerInfoFieldError = {
  message: string
}

type CustomerInfoValidationResult = {
  success: boolean
  errors: Record<string, CustomerInfoFieldError>
}

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
  rightPatternUrl,
}: CustomerSelectionScreenProps) {
  const cards = useMemo(() => buildCustomerCards(screen?.sections, segments), [screen?.sections, segments])
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
  }

  return (
    <section className="customer-selection-layout font-barlow absolute z-10">
      <div className="customer-selection-cards" aria-label={screen?.headline || 'Kundengruppe auswählen'}>
        {cards.map((card) => {
          const isActive = selectedCustomerType === card.customerType
          const patternUrl = card.patternUrl || rightPatternUrl
          const cardPatternStyle = patternUrl
            ? ({
              '--selection-card-pattern-image': `url("${patternUrl}")`,
            } as CSSProperties & { '--selection-card-pattern-image': string })
            : undefined

          return (
            <article
              key={card.customerType}
              className={`customer-selection-card customer-selection-card--${card.customerType} ${isActive ? 'is-active' : ''
                }`}
            >
              {cardPatternStyle ? (
                <span
                  className="customer-selection-card-pattern"
                  style={cardPatternStyle}
                  aria-hidden="true"
                />
              ) : null}

              <div className="customer-selection-card-content">
                <h2>{card.title}</h2>
                <p>{card.text}</p>
                <button
                  type="button"
                  data-target={card.ctaTarget}
                  aria-pressed={isActive}
                  className="customer-selection-card-button"
                  onClick={() => handleCustomerStart(card.customerType)}
                >
                  {card.ctaLabel}
                </button>
              </div>
            </article>
          )
        })}
      </div>

      <form className="customer-info-form" aria-label="Kundeninfos">
        <h2>KUNDENINFOS</h2>

        {formError ? (
          <div
            id="customer-info-error-summary"
            className="customer-info-error-summary"
            role="alert"
            aria-live="polite"
          >
            <span className="customer-info-error-mark" aria-hidden="true" />
            <div>
              <strong>Angaben prüfen</strong>
              <p>{formError}</p>
            </div>
          </div>
        ) : null}

        <div className="customer-info-fields">
          {questions.map((question, index) => {
            const questionKey = getQuestionKey(question, index)
            const questionLabel = getQuestionLabel(question)
            const required = isQuestionRequired(question)
            const error = fieldErrors[questionKey]
            const fieldId = getFieldId(questionKey, index)

            return (
              <label
                key={`${questionKey}-${index}`}
                className={`customer-info-field ${error ? 'has-error' : ''}`}
                htmlFor={fieldId}
              >
                <span>
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
                  onChange={(event) =>
                    {
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
                    }
                  }
                />
                {error ? (
                  <p id={`${fieldId}-error`} className="customer-info-field-error">
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
