'use client'

import {
  AuthBrandingShell,
  type AuthBrandingLegalLink,
} from '@/components/layout/AuthBrandingShell'
import type {
  CustomerGroup,
  CustomerInfoQuestion,
  CustomerSegmentDocument,
} from '@/lib/customerSelection'
import type {LoginScreenDocument} from '@/lib/authBranding'
import {type CSSProperties, useMemo, useState} from 'react'

type ScreenSection = NonNullable<NonNullable<LoginScreenDocument>['sections']>[number]

type CustomerSelectionScreenProps = {
  screen?: LoginScreenDocument
  segments?: CustomerSegmentDocument[]
  formQuestions?: CustomerInfoQuestion[]
  logoUrl?: string
  logoAlt?: string
  rightPatternUrl?: string
  rightPatternAlt?: string
  footerAddress?: string | null
  legalLinks?: AuthBrandingLegalLink[] | null
}

type CustomerCard = {
  customerType: CustomerGroup
  title: string
  text: string
  ctaLabel: string
  ctaTarget: string
  patternUrl?: string | null
}

const fallbackCards: Record<CustomerGroup, CustomerCard> = {
  b2c: {
    customerType: 'b2c',
    title: 'PRIVAT',
    text: 'Beratung für Privatkunden mit Fokus auf Eigenheim, Energieunabhängigkeit und verständliche Produktlösungen.',
    ctaLabel: 'JETZT STARTEN',
    ctaTarget: 'customer-type:b2c',
  },
  b2b: {
    customerType: 'b2b',
    title: 'GEWERBE',
    text: 'Beratung für Gewerbekunden mit Fokus auf Wirtschaftlichkeit, Skalierbarkeit und professionelle Energielösungen.',
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
    const text = section?.text || segment?.mainText || segment?.focusText || fallback.text
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

export function CustomerSelectionScreen({
  screen,
  segments,
  formQuestions,
  logoUrl,
  logoAlt,
  rightPatternUrl,
  rightPatternAlt,
  footerAddress,
  legalLinks,
}: CustomerSelectionScreenProps) {
  const cards = useMemo(() => buildCustomerCards(screen?.sections, segments), [screen?.sections, segments])
  const questions = formQuestions && formQuestions.length > 0 ? formQuestions : fallbackQuestions
  const [selectedCustomerType, setSelectedCustomerType] = useState<CustomerGroup | null>(null)
  const [formValues, setFormValues] = useState<Record<string, string>>({})

  return (
    <AuthBrandingShell
      logoUrl={logoUrl}
      logoAlt={logoAlt}
      rightPatternUrl={rightPatternUrl}
      rightPatternAlt={rightPatternAlt}
      footerAddress={footerAddress}
      legalLinks={legalLinks}
    >
      <section className="customer-selection-layout font-barlow absolute z-10">
        <div className="customer-selection-cards" aria-label={screen?.headline || 'Kundengruppe auswählen'}>
          {cards.map((card) => {
            const isActive = selectedCustomerType === card.customerType
            const patternUrl = card.patternUrl || rightPatternUrl
            const cardPatternStyle = patternUrl
              ? ({
                  '--selection-card-pattern-image': `url("${patternUrl}")`,
                } as CSSProperties & {'--selection-card-pattern-image': string})
              : undefined

            return (
              <article
                key={card.customerType}
                className={`customer-selection-card customer-selection-card--${card.customerType} ${
                  isActive ? 'is-active' : ''
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
                    onClick={() => setSelectedCustomerType(card.customerType)}
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

          <div className="customer-info-fields">
            {questions.map((question, index) => {
              const questionKey = getQuestionKey(question, index)
              const questionLabel = getQuestionLabel(question)
              const required = Boolean(question.isRequired)

              return (
                <label key={`${questionKey}-${index}`} className="customer-info-field">
                  <span>
                    {questionLabel.toLocaleUpperCase('de-AT')}
                    {required ? ' *' : ''}
                  </span>
                  <input
                    type={getInputType(question.answerType)}
                    value={formValues[questionKey] || ''}
                    placeholder={question.placeholder || ''}
                    required={required}
                    onChange={(event) =>
                      setFormValues((currentValues) => ({
                        ...currentValues,
                        [questionKey]: event.target.value,
                      }))
                    }
                  />
                </label>
              )
            })}
          </div>
        </form>
      </section>
    </AuthBrandingShell>
  )
}
