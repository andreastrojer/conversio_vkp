'use client'

import {PresentationViewport} from '@/components/layout/PresentationViewport'
import {ChapterNavigation} from '@/components/navigation/ChapterNavigation'
import {
  brandLogoImageClassName,
  brandLogoPositionClassName,
} from '@/lib/brandingLayout'
import {
  buildCrmSpreadsheetHtml,
  bundleToConsultationBundle,
  isValidEmail,
  validateConsultationCustomer,
  type ConsultationState,
} from '@/lib/consultation'
import {
  saveCustomerDraft,
  saveSelectedSalesDocumentIds,
  useConsultationStore,
} from '@/lib/consultationStore'
import type {NextStepDocumentCategory, NextStepPageData} from '@/lib/nextStep'
import {AnimatePresence, motion} from 'framer-motion'
import {ArrowRight, Download, Hexagon} from 'lucide-react'
import Link from 'next/link'
import {useEffect, useMemo, useState} from 'react'

type NextStepScreenProps = NextStepPageData & {
  salesPerson: {
    name?: string | null
    email?: string | null
  }
}

type SendStatus = 'idle' | 'sending' | 'mock-success' | 'graph-success' | 'error'

type SendDocumentsResponse = {
  success: boolean
  sendMode?: 'mock' | 'graph'
  error?: string
}

type ScenarioDocumentsResponse = {
  success: boolean
  categories?: NextStepDocumentCategory[]
  error?: string
}

type UnknownRecord = Record<string, unknown>

const patternClassName =
  'pointer-events-none absolute bottom-[-215px] right-[-240px] z-0 h-[850px] w-[850px] bg-contain bg-center bg-no-repeat'

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function formatPercent(value: number) {
  return `${new Intl.NumberFormat('de-AT', {maximumFractionDigits: 0}).format(Math.round(value))}%`
}

function formatEuro(value: number) {
  return `${new Intl.NumberFormat('de-AT', {maximumFractionDigits: 0}).format(Math.round(value))}€`
}

function parseSendDocumentsResponse(value: unknown): SendDocumentsResponse {
  if (!isRecord(value)) {
    return {success: false, error: 'Der Server hat keine gültige Antwort geliefert.'}
  }

  return {
    success: value.success === true,
    sendMode: value.sendMode === 'mock' || value.sendMode === 'graph' ? value.sendMode : undefined,
    error: typeof value.error === 'string' ? value.error : undefined,
  }
}

function parseScenarioDocumentsResponse(value: unknown): ScenarioDocumentsResponse {
  if (!isRecord(value)) {
    return {success: false, error: 'Der Server hat keine gültige Dokumentliste geliefert.'}
  }

  const categories = Array.isArray(value.categories)
    ? value.categories.flatMap((category): NextStepDocumentCategory[] => {
        if (!isRecord(category)) {
          return []
        }

        const key = typeof category.key === 'string' ? category.key : ''
        const title = typeof category.title === 'string' ? category.title : ''

        if (!key || !title) {
          return []
        }

        const documents = Array.isArray(category.documents)
          ? category.documents.flatMap((document) => {
              if (!isRecord(document)) {
                return []
              }

              const id = typeof document.id === 'string' ? document.id : ''
              const documentTitle = typeof document.title === 'string' ? document.title : ''

              return id && documentTitle
                ? [{
                    id,
                    title: documentTitle,
                    description: typeof document.description === 'string' ? document.description : undefined,
                  }]
                : []
            })
          : []

        return [{key, title, documents}]
      })
    : undefined

  return {
    success: value.success === true,
    categories,
    error: typeof value.error === 'string' ? value.error : undefined,
  }
}

function getSendButtonText(status: SendStatus, defaultLabel: string) {
  if (status === 'sending') {
    return 'WIRD GESENDET …'
  }

  if (status === 'mock-success') {
    return 'VERSAND ERFOLGREICH SIMULIERT'
  }

  if (status === 'graph-success') {
    return 'UNTERLAGEN WURDEN VERSENDET'
  }

  return (defaultLabel || 'Senden').toLocaleUpperCase('de-AT')
}

function buildDocumentTitleMap(categories: NextStepDocumentCategory[]) {
  return new Map(
    categories.flatMap((category) =>
      category.documents.map((document) => [document.id, document.title] as const),
    ),
  )
}

function DocumentCategory({
  category,
  active,
  onSelect,
  selectedDocumentIds,
  onToggleDocument,
  isBusiness,
}: {
  category: NextStepDocumentCategory
  active: boolean
  onSelect: () => void
  selectedDocumentIds: string[]
  onToggleDocument: (documentId: string) => void
  isBusiness: boolean
}) {
  return (
    <div>
      <button
        type="button"
        className={`flex h-[46px] w-[348px] items-center justify-between rounded-[8px] border-2 px-[30px] text-left text-[18px] font-medium uppercase leading-none tracking-[0.02em] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#efb804] ${active
          ? isBusiness
            ? 'rounded-b-none border-white bg-[#4a4f54] text-white'
            : 'rounded-b-none border-[#3d4248] bg-[#3d4248] text-white'
          : isBusiness
            ? 'border-white bg-transparent text-white'
            : 'border-[#3d4248] bg-transparent text-[#3d4248]'
          }`}
        aria-expanded={active}
        onClick={onSelect}
      >
        <span>{category.title}</span>
        <Hexagon
          className={`h-[21px] w-[21px] shrink-0 ${active ? 'fill-white text-white' : isBusiness ? 'text-white' : 'text-[#3d4248]'}`}
          strokeWidth={2.4}
          aria-hidden="true"
        />
      </button>

      <AnimatePresence initial={false}>
        {active ? (
          <motion.div
            initial={{opacity: 0, y: -6}}
            animate={{opacity: 1, y: 0}}
            transition={{duration: 0.22, ease: [0.22, 1, 0.36, 1]}}
            className={`mt-[-1px] w-[348px] overflow-hidden rounded-b-[8px] ${isBusiness ? 'bg-[#4a4f54]' : 'bg-[#3d4248]'}`}
          >
            <div className="px-[32px] pb-[24px] pt-[20px]">
              {category.documents.length > 0 ? (
                <ul className="space-y-[22px]">
                  {category.documents.map((document) => {
                    const isSelected = selectedDocumentIds.includes(document.id)

                    return (
                      <li key={document.id}>
                        <button
                          type="button"
                          className={`flex items-center gap-[14px] text-left text-[15px] font-normal leading-none transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#efb804] ${
                            isSelected ? 'text-[#efb804]' : 'text-white'
                          }`}
                          aria-pressed={isSelected}
                          onClick={() => onToggleDocument(document.id)}
                        >
                          <Hexagon
                            className={`mt-[1px] h-[16px] w-[16px] shrink-0 ${
                              isSelected ? 'fill-[#efb804] text-[#efb804]' : 'text-white'
                            }`}
                            strokeWidth={2.2}
                            aria-hidden="true"
                          />
                          <span>{document.title}</span>
                        </button>
                      </li>
                    )
                  })}
                </ul>
              ) : (
                <div className="h-[122px]" aria-hidden="true" />
              )}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}

export function NextStepScreen({
  customerType,
  headline,
  documentsHeadline,
  emailLabel,
  sendButtonLabel,
  selectedBundle,
  bundleImageUrl,
  bundleImageAlt,
  documentCategories,
  contactImageUrl,
  contactImageAlt,
  navigationItems,
  logoUrl,
  inverseLogoUrl,
  logoAlt,
  patternUrl,
  patternAlt,
  navigationArrowUrl,
  sendButtonArrowUrl,
  salesPerson,
}: NextStepScreenProps) {
  const consultation = useConsultationStore()
  const [requestedActiveCategoryKey, setRequestedActiveCategoryKey] = useState(documentCategories[1]?.key || documentCategories[0]?.key || '')
  const [selectedDocumentIdsOverride, setSelectedDocumentIdsOverride] = useState<string[] | null>(null)
  const [recipientEmailOverride, setRecipientEmailOverride] = useState<string | null>(null)
  const [documentCategoriesOverride, setDocumentCategoriesOverride] = useState<NextStepDocumentCategory[] | null>(null)
  const [sendStatus, setSendStatus] = useState<SendStatus>('idle')
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const isBusiness = customerType === 'b2b'
  const pageLogoUrl = isBusiness ? inverseLogoUrl || logoUrl : logoUrl || inverseLogoUrl
  const navigationLogoUrl = isBusiness ? logoUrl || inverseLogoUrl : inverseLogoUrl || logoUrl
  const foregroundClassName = isBusiness ? 'text-white' : 'text-[#3d4248]'
  const metricClassName = isBusiness ? 'text-[#efb804]' : 'text-[#3d4248]'
  const displayBundle =
    consultation.customerType === customerType && consultation.selectedBundle
      ? consultation.selectedBundle
      : selectedBundle
  const displayResult =
    displayBundle && consultation.selectedBundle?.id === displayBundle.id
      ? consultation.calculationResult
      : undefined
  const scenarioId = displayBundle?.id
  const visibleDocumentCategories = documentCategoriesOverride || documentCategories
  const documentTitleById = useMemo(
    () => buildDocumentTitleMap(visibleDocumentCategories),
    [visibleDocumentCategories],
  )
  const availableDocumentIds = useMemo(
    () => new Set(visibleDocumentCategories.flatMap((category) => category.documents.map((document) => document.id))),
    [visibleDocumentCategories],
  )
  const selectedDocumentIds = useMemo(
    () =>
      (selectedDocumentIdsOverride || consultation.selectedSalesDocumentIds).filter((documentId) =>
        availableDocumentIds.has(documentId),
      ),
    [availableDocumentIds, consultation.selectedSalesDocumentIds, selectedDocumentIdsOverride],
  )
  const activeCategoryKey =
    requestedActiveCategoryKey === ''
      ? ''
      : visibleDocumentCategories.some((category) => category.key === requestedActiveCategoryKey)
        ? requestedActiveCategoryKey
        : visibleDocumentCategories[1]?.key || visibleDocumentCategories[0]?.key || ''
  const recipientEmail = recipientEmailOverride ?? consultation.customer?.email ?? ''
  const customerForSending = consultation.customer
    ? {
        ...consultation.customer,
        email: recipientEmail.trim(),
      }
    : undefined
  const customerValidation = validateConsultationCustomer(customerForSending, true)
  const emailIsValid = isValidEmail(recipientEmail)
  const successStatus = sendStatus === 'mock-success' || sendStatus === 'graph-success'
  const sendDisabled =
    !emailIsValid ||
    !scenarioId ||
    selectedDocumentIds.length === 0 ||
    !customerValidation.success ||
    sendStatus === 'sending' ||
    successStatus
  const selectedDocumentTitles = selectedDocumentIds.flatMap((documentId) => {
    const title = documentTitleById.get(documentId)

    return title ? [title] : []
  })

  useEffect(() => {
    if (!scenarioId) {
      return
    }

    const abortController = new AbortController()
    const params = new URLSearchParams({
      customerType,
      scenarioId,
    })

    fetch(`/api/scenario-documents?${params.toString()}`, {
      signal: abortController.signal,
    })
      .then(async (response) => {
        const payload = parseScenarioDocumentsResponse(await response.json().catch(() => undefined))

        if (!response.ok || !payload.success || !payload.categories) {
          throw new Error(payload.error || 'Die Produktblätter konnten nicht geladen werden.')
        }

        setDocumentCategoriesOverride(payload.categories)
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') {
          return
        }

        setDocumentCategoriesOverride(null)
      })

    return () => {
      abortController.abort()
    }
  }, [customerType, scenarioId])

  function resetSuccessState() {
    if (successStatus) {
      setSendStatus('idle')
      setStatusMessage(null)
    }
  }

  function handleToggleDocument(documentId: string) {
    resetSuccessState()

    const nextDocumentIds = selectedDocumentIds.includes(documentId)
      ? selectedDocumentIds.filter((id) => id !== documentId)
      : [...selectedDocumentIds, documentId]

    setSelectedDocumentIdsOverride(nextDocumentIds)
    saveSelectedSalesDocumentIds(nextDocumentIds)
  }

  function handleEmailChange(nextEmail: string) {
    resetSuccessState()
    setRecipientEmailOverride(nextEmail)
    saveCustomerDraft({
      name: consultation.customer?.name || '',
      phone: consultation.customer?.phone || '',
      email: nextEmail,
    })
  }

  async function handleSendDocuments() {
    if (!scenarioId || !customerForSending) {
      setSendStatus('error')
      setStatusMessage('Die Beratung ist unvollständig. Bitte Kundendaten, Bundle und Produktblätter prüfen.')
      return
    }

    if (!customerValidation.success) {
      setSendStatus('error')
      setStatusMessage(Object.values(customerValidation.errors)[0] || 'Bitte die Kundendaten prüfen.')
      return
    }

    if (selectedDocumentIds.length === 0) {
      setSendStatus('error')
      setStatusMessage('Bitte mindestens ein Produktblatt auswählen.')
      return
    }

    setSendStatus('sending')
    setStatusMessage(null)

    try {
      const response = await fetch('/api/send-documents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipientEmail: recipientEmail.trim(),
          customerType: consultation.customerType || customerType,
          scenarioId,
          selectedSalesDocumentIds: selectedDocumentIds,
          customer: customerForSending,
          matrixValues: consultation.matrixValues,
          calculationResult: consultation.calculationResult,
        }),
      })
      const responsePayload = parseSendDocumentsResponse(await response.json().catch(() => undefined))

      if (!response.ok || !responsePayload.success) {
        throw new Error(responsePayload.error || 'Die Unterlagen konnten nicht versendet werden.')
      }

      if (responsePayload.sendMode === 'mock') {
        setSendStatus('mock-success')
        setStatusMessage('Mock-Modus: Unterlagen wurden geprüft, aber nicht versendet.')
      } else {
        setSendStatus('graph-success')
        setStatusMessage('Die ausgewählten Unterlagen wurden per E-Mail versendet.')
      }
    } catch (error) {
      setSendStatus('error')
      setStatusMessage(error instanceof Error ? error.message : 'Die Unterlagen konnten nicht versendet werden.')
    }
  }

  function handleExportSpreadsheet() {
    const exportCustomer = customerForSending || consultation.customer
    const exportConsultation: ConsultationState = {
      ...consultation,
      customer: exportCustomer,
      selectedBundle:
        consultation.selectedBundle ||
        (selectedBundle ? bundleToConsultationBundle(selectedBundle) : undefined),
      selectedSalesDocumentIds: selectedDocumentIds,
    }
    const spreadsheet = buildCrmSpreadsheetHtml({
      consultation: exportConsultation,
      recipientEmail: recipientEmail.trim(),
      salesPersonName: salesPerson.name,
      salesPersonEmail: salesPerson.email,
      selectedDocumentTitles,
    })
    const blob = new Blob([spreadsheet], {type: 'application/vnd.ms-excel;charset=utf-8'})
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')

    link.href = url
    link.download = `conversio-crm-${new Date().toISOString().slice(0, 10)}.xls`
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
  }

  return (
    <PresentationViewport backgroundClassName={isBusiness ? 'bg-[#2b3036]' : 'bg-white'}>
      <main className={`relative isolate h-full w-full overflow-hidden font-sans ${isBusiness ? 'bg-[#2b3036] text-white' : 'bg-white text-[#3d4248]'}`}>
        {patternUrl ? (
          <span
            className={`${patternClassName} ${
              isBusiness
                ? 'opacity-[0.065] [filter:brightness(0)_invert(1)]'
                : 'opacity-[0.86] mix-blend-normal [filter:brightness(0)_saturate(100%)_invert(86%)_sepia(5%)_saturate(126%)_hue-rotate(178deg)_brightness(96%)_contrast(90%)]'
            }`}
            style={{backgroundImage: `url("${patternUrl}")`}}
            title={patternAlt || undefined}
            aria-hidden="true"
          />
        ) : null}

        <div className={brandLogoPositionClassName}>
          <Link href="/" className="block w-max" aria-label="Zur Welcome-Seite">
            {pageLogoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={pageLogoUrl} alt={logoAlt} className={brandLogoImageClassName} />
            ) : (
              <span className="text-[21px] font-bold uppercase tracking-[0.08em]">{logoAlt}</span>
            )}
          </Link>
        </div>

        <h1 className={`absolute left-[60px] top-[236px] z-[3] font-sans text-[54px] font-bold uppercase leading-[0.92] tracking-[0.006em] ${foregroundClassName}`}>
          {headline}
        </h1>

        <section className="absolute left-[60px] top-[368px] z-[4] h-[500px] w-[316px]" aria-label="Ausgewähltes Bundle">
          {displayBundle ? (
            <>
              <span className="block h-[38px] max-[1600px]:h-[42px] [@media(max-height:920px)]:h-[42px]">
                <span className="inline-flex h-full min-w-[205px] items-center justify-center bg-[#efb804] px-[24px] text-[18px] font-bold uppercase leading-none text-[#3d4248] max-[1600px]:text-[20px] [@media(max-height:920px)]:text-[20px]">
                  {displayBundle.title}
                </span>
              </span>

              {bundleImageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={bundleImageUrl}
                  alt={bundleImageAlt}
                  className="mt-[14px] h-[214px] w-[316px] object-contain object-center"
                />
              ) : null}

              {displayResult ? (
                <div className={`mt-[18px] h-[104px] ${metricClassName}`}>
                  <p className="flex items-baseline gap-[14px] uppercase">
                    <strong className="text-[30px] font-bold leading-none max-[1600px]:text-[34px] [@media(max-height:920px)]:text-[34px]">{formatPercent(displayResult.autarkyPercent)}</strong>
                    <span className="text-[20px] font-medium tracking-[0.025em] max-[1600px]:text-[22px] [@media(max-height:920px)]:text-[22px]">AUTARK</span>
                  </p>
                  <p className="mt-[6px] flex items-baseline gap-[14px] uppercase">
                    <strong className="text-[30px] font-bold leading-none max-[1600px]:text-[34px] [@media(max-height:920px)]:text-[34px]">{formatEuro(displayResult.annualSavingsEur)}</strong>
                    <span className="text-[20px] font-medium tracking-[0.025em] max-[1600px]:text-[22px] [@media(max-height:920px)]:text-[22px]">ERSPARNIS / JAHR</span>
                  </p>
                </div>
              ) : null}

              <div className={`mt-0 flex min-h-[60px] items-start gap-[8px] border-t-2 pt-[20px] font-sans text-[16px] leading-[1.35] tracking-normal ${isBusiness ? 'border-white' : 'border-[#3d4248]'}`}>
                <span className="shrink-0 font-normal uppercase">Enthalten:</span>
                {displayBundle.includedItems.length > 0 ? (
                  <ul className="space-y-px font-normal" aria-label="Enthaltene Leistungen">
                    {displayBundle.includedItems.map((item) => (
                      <li key={item.id}>
                        {item.amount ? <strong className="font-bold">{item.amount} </strong> : null}
                        {item.label}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            </>
          ) : null}
        </section>

        <section className="absolute left-[507px] top-[368px] z-[4] w-[350px]" aria-labelledby="documents-heading">
          <h2 id="documents-heading" className={`text-[36px] font-bold uppercase leading-none tracking-[0.02em] ${foregroundClassName}`}>
            {documentsHeadline}
          </h2>

          <div className="mt-[38px] space-y-[26px]">
            {visibleDocumentCategories.map((category) => (
              <DocumentCategory
                key={category.key}
                category={category}
                active={category.key === activeCategoryKey}
                onSelect={() =>
                  setRequestedActiveCategoryKey((current) => current === category.key ? '' : category.key)
                }
                selectedDocumentIds={selectedDocumentIds}
                onToggleDocument={handleToggleDocument}
                isBusiness={isBusiness}
              />
            ))}
          </div>
        </section>

        <section className="absolute left-[952px] top-[431px] z-[4] w-[410px]" aria-labelledby="email-heading">
          <h2 id="email-heading" className={`text-[18px] font-bold uppercase leading-none tracking-[0.02em] ${foregroundClassName}`}>
            {emailLabel}
          </h2>
          <input
            type="email"
            value={recipientEmail}
            placeholder=""
            aria-label="Empfänger-E-Mail"
            aria-invalid={recipientEmail.length > 0 && !emailIsValid}
            className={`mt-[22px] block h-[34px] w-[342px] border-0 border-b-2 bg-transparent font-sans text-[17px] font-medium outline-none transition-colors focus:border-b-[#efb804] ${
              recipientEmail.length > 0 && !emailIsValid
                ? 'border-b-[#efb804]'
                : isBusiness
                  ? 'border-b-white text-white placeholder:text-white/45'
                  : 'border-b-[#3d4248] text-[#3d4248] placeholder:text-[#aeb3b7]'
            }`}
            onChange={(event) => handleEmailChange(event.target.value)}
          />
          <div className="mt-[18px] flex flex-wrap items-center gap-[12px]">
            <button
              type="button"
              disabled={sendDisabled}
              className={`group inline-flex h-[30px] min-w-[146px] items-center justify-between rounded-full bg-[#4a4f54] px-[26px] text-[15px] font-bold uppercase leading-none text-white transition-transform focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#efb804] ${
                sendDisabled ? 'cursor-not-allowed bg-[#a7aaad]' : 'hover:-translate-y-px'
              }`}
              onClick={handleSendDocuments}
            >
              <span>{getSendButtonText(sendStatus, sendButtonLabel)}</span>
              {sendButtonArrowUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={sendButtonArrowUrl}
                  alt=""
                  className="block h-[17px] w-[17px] shrink-0 object-contain object-center [filter:brightness(0)] transition-transform group-hover:translate-x-0.5"
                  aria-hidden="true"
                />
              ) : (
                <ArrowRight className="h-[14px] w-[16px] rotate-[-45deg] transition-transform group-hover:translate-x-0.5" strokeWidth={2.4} aria-hidden="true" />
              )}
            </button>
            <button
              type="button"
              className="group inline-flex h-[30px] min-w-[132px] items-center justify-between rounded-full bg-[#efb804] px-[20px] text-[14px] font-bold uppercase leading-none text-[#3d4248] transition-transform hover:-translate-y-px focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#efb804]"
              onClick={handleExportSpreadsheet}
            >
              <span>EXCEL EXPORT</span>
              <Download className="h-[14px] w-[14px] transition-transform group-hover:translate-y-0.5" strokeWidth={2.4} aria-hidden="true" />
            </button>
          </div>
          {statusMessage ? (
            <p
              className={`mt-[14px] w-[342px] text-[13px] font-semibold leading-[1.3] ${
                sendStatus === 'error' ? 'text-[#efb804]' : foregroundClassName
              }`}
              role={sendStatus === 'error' ? 'alert' : 'status'}
            >
              {statusMessage}
            </p>
          ) : null}
        </section>

        {contactImageUrl ? (
          <div className="absolute bottom-[76px] right-[86px] z-[3] h-[276px] w-[226px] overflow-hidden">
            <span className="absolute inset-x-0 bottom-0 z-[2] h-[72px] bg-[#efb804] [clip-path:polygon(0_55%,50%_100%,100%_55%,100%_72%,50%_100%,0_72%)]" aria-hidden="true" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={contactImageUrl}
              alt={contactImageAlt}
              className="absolute inset-0 h-full w-full object-contain object-bottom grayscale"
            />
          </div>
        ) : null}

        <ChapterNavigation
          customerType={customerType}
          items={navigationItems}
          currentKey="next-step"
          logoUrl={navigationLogoUrl}
          logoAlt={logoAlt}
          navigationArrowUrl={navigationArrowUrl}
        />
      </main>
    </PresentationViewport>
  )
}
