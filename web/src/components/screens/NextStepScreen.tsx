'use client'

import { PresentationViewport } from '@/components/layout/PresentationViewport'
import { ChapterNavigation } from '@/components/navigation/ChapterNavigation'
import {
  brandLogoImageClassName,
  brandLogoPositionClassName,
} from '@/lib/brandingLayout'
import {
  calculateScenarioResult,
  type CalculationParameters,
  type CalculatorValues,
  type ScenarioType,
} from '@/lib/calculation/scenarioCalculator'
import type { NextStepPageData, NextStepDocumentCategory } from '@/lib/nextStep'
import { AnimatePresence, motion } from 'framer-motion'
import type { ScenarioMatrixParameter } from '@/lib/scenarioMatrix'
import { ArrowRight, Check, Hexagon } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

const patternClassName =
  'pointer-events-none absolute bottom-[-215px] right-[-240px] z-0 h-[850px] w-[850px] bg-contain bg-center bg-no-repeat opacity-[0.065]'

function formatPercent(value: number) {
  return `${new Intl.NumberFormat('de-AT', { maximumFractionDigits: 0 }).format(Math.round(value))}%`
}

function formatEuro(value: number) {
  return `${new Intl.NumberFormat('de-AT', { maximumFractionDigits: 0 }).format(Math.round(value))}€`
}

const validScenarioTypes = new Set<ScenarioType>(['b2c_pv', 'b2c_pv_speicher', 'b2c_komplett'])

function buildCalculationParameters(parameters: ScenarioMatrixParameter[]): CalculationParameters | undefined {
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

function readStoredCalculatorValues(
  expectedCustomerType: string,
  expectedBundleId: string | undefined,
): CalculatorValues | undefined {
  if (typeof window === 'undefined') {
    return undefined
  }

  const rawValue = window.sessionStorage.getItem('scenarioMatrix.nextStep')

  if (!rawValue) {
    return undefined
  }

  try {
    const parsedValue = JSON.parse(rawValue) as {
      customerType?: string
      bundleId?: string
      calculatorValues?: Partial<CalculatorValues>
    }
    const values = parsedValue.calculatorValues

    if (
      parsedValue.customerType !== expectedCustomerType ||
      (expectedBundleId && parsedValue.bundleId !== expectedBundleId) ||
      typeof values?.annualConsumption !== 'number' ||
      typeof values.storageSize !== 'number' ||
      typeof values.chargingStations !== 'number'
    ) {
      return undefined
    }

    return {
      annualConsumption: values.annualConsumption,
      storageSize: values.storageSize,
      chargingStations: values.chargingStations,
      peakLoadKw: typeof values.peakLoadKw === 'number' ? values.peakLoadKw : undefined,
    }
  } catch {
    return undefined
  }
}

function calculateStoredResult({
  customerType,
  selectedBundle,
  selectedResult,
  parameters,
}: {
  customerType: string
  selectedBundle: NextStepPageData['selectedBundle']
  selectedResult: NextStepPageData['selectedResult']
  parameters: ScenarioMatrixParameter[]
}) {
  if (!selectedBundle?.scenarioType || !validScenarioTypes.has(selectedBundle.scenarioType as ScenarioType)) {
    return selectedResult
  }

  const storedValues = readStoredCalculatorValues(customerType, selectedBundle.id)
  const calculationParameters = buildCalculationParameters(parameters)

  if (!storedValues || !calculationParameters) {
    return selectedResult
  }

  const result = calculateScenarioResult(
    selectedBundle.scenarioType as ScenarioType,
    storedValues,
    calculationParameters,
  )

  return {
    autarkyPercent: result.autarkyPercent,
    annualSavingsEur: result.annualSavingsEur,
  }
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
        className={`flex h-[46px] w-[348px] items-center justify-between rounded-[8px] border px-[30px] text-left text-[18px] font-medium uppercase leading-none tracking-[0.02em] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#efb804] ${active
          ? isBusiness
            ? 'border-[#4a4f54] bg-[#4a4f54] text-white'
            : 'border-[#3d4248] bg-[#3d4248] text-white'
          : isBusiness
            ? 'border-white/10 bg-transparent text-white'
            : 'border-[#3d4248]/18 bg-transparent text-[#3d4248]'
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
            initial={{ height: 0, opacity: 0, y: -8 }}
            animate={{ height: 'auto', opacity: 1, y: 0 }}
            exit={{ height: 0, opacity: 0, y: -8 }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            className={`w-[348px] overflow-hidden rounded-b-[8px] ${isBusiness ? 'bg-[#4a4f54]' : 'bg-[#3d4248]'}`}
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
  selectedResult,
  parameters,
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
}: NextStepPageData) {
  const [activeCategoryKey, setActiveCategoryKey] = useState(documentCategories[1]?.key || documentCategories[0]?.key || '')
  const [selectedDocumentIds, setSelectedDocumentIds] = useState<string[]>([])
  const [displayResult] = useState(() =>
    calculateStoredResult({ customerType, selectedBundle, selectedResult, parameters }),
  )
  const isBusiness = customerType === 'b2b'
  const pageLogoUrl = isBusiness ? inverseLogoUrl || logoUrl : logoUrl || inverseLogoUrl
  const navigationLogoUrl = isBusiness ? logoUrl || inverseLogoUrl : inverseLogoUrl || logoUrl
  const foregroundClassName = isBusiness ? 'text-white' : 'text-[#3d4248]'
  const metricClassName = isBusiness ? 'text-[#efb804]' : 'text-[#3d4248]'
  const lineClassName = isBusiness ? 'bg-white' : 'bg-[#3d4248]'

  return (
    <PresentationViewport backgroundClassName={isBusiness ? 'bg-[#2b3036]' : 'bg-white'}>
      <main className={`relative isolate h-full w-full overflow-hidden font-sans ${isBusiness ? 'bg-[#2b3036] text-white' : 'bg-white text-[#3d4248]'}`}>
        {patternUrl ? (
          <span
            className={`${patternClassName} ${
              isBusiness
                ? '[filter:brightness(0)_invert(1)]'
                : '[filter:brightness(0)_saturate(100%)_invert(25%)_sepia(7%)_saturate(442%)_hue-rotate(169deg)_brightness(91%)_contrast(83%)]'
            }`}
            style={{ backgroundImage: `url("${patternUrl}")` }}
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

        <section className="absolute left-[60px] top-[368px] z-[4] w-[315px]" aria-label="Ausgewähltes Bundle">
          {selectedBundle ? (
            <>
              <div className="inline-flex h-[38px] min-w-[238px] items-center justify-center bg-[#efb804] px-[24px] text-[18px] font-bold uppercase leading-none text-[#3d4248]">
                {selectedBundle.title}
              </div>

              {bundleImageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={bundleImageUrl}
                  alt={bundleImageAlt}
                  className="mt-[38px] h-[160px] w-[315px] object-contain object-center"
                />
              ) : null}

              {displayResult ? (
                <div className={`mt-[58px] ${metricClassName}`}>
                  <p className="flex items-baseline gap-[14px] uppercase">
                    <strong className="text-[34px] font-bold leading-none">{formatPercent(displayResult.autarkyPercent)}</strong>
                    <span className="text-[22px] font-medium tracking-[0.025em]">AUTARK</span>
                  </p>
                  <p className="mt-[6px] flex items-baseline gap-[14px] uppercase">
                    <strong className="text-[34px] font-bold leading-none">{formatEuro(displayResult.annualSavingsEur)}</strong>
                    <span className="text-[22px] font-medium tracking-[0.025em]">ERSPARNIS / JAHR</span>
                  </p>
                </div>
              ) : null}

              <div className={`mt-[44px] flex min-h-[60px] items-start gap-[8px] border-t-2 pt-[24px] text-[16px] leading-[1.35] ${isBusiness ? 'border-white' : 'border-[#3d4248]'}`}>
                <span className="shrink-0 font-normal uppercase">Enthalten:</span>
                {selectedBundle.includedItems.length > 0 ? (
                  <ul className="space-y-px font-normal" aria-label="Enthaltene Leistungen">
                    {selectedBundle.includedItems.map((item) => (
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

        <section className="absolute left-[507px] top-[353px] z-[4] w-[350px]" aria-labelledby="documents-heading">
          <h2 id="documents-heading" className={`text-[36px] font-bold uppercase leading-none tracking-[0.02em] ${foregroundClassName}`}>
            {documentsHeadline}
          </h2>

          <div className="mt-[38px] space-y-[26px]">
            {documentCategories.map((category) => (
              <DocumentCategory
                key={category.key}
                category={category}
                active={category.key === activeCategoryKey}
                onSelect={() => setActiveCategoryKey(category.key)}
                selectedDocumentIds={selectedDocumentIds}
                onToggleDocument={(documentId) =>
                  setSelectedDocumentIds((current) =>
                    current.includes(documentId)
                      ? current.filter((id) => id !== documentId)
                      : [...current, documentId],
                  )
                }
                isBusiness={isBusiness}
              />
            ))}
          </div>
        </section>

        <section className="absolute left-[952px] top-[431px] z-[4] w-[410px]" aria-labelledby="email-heading">
          <h2 id="email-heading" className={`text-[18px] font-bold uppercase leading-none tracking-[0.02em] ${foregroundClassName}`}>
            {emailLabel}
          </h2>
          <div className={`mt-[38px] h-[2px] w-[342px] ${lineClassName}`} aria-hidden="true" />
          <button
            type="button"
            className="group mt-[22px] inline-flex h-[30px] min-w-[146px] items-center justify-between rounded-full bg-[#4a4f54] px-[26px] text-[15px] font-bold uppercase leading-none text-white transition-transform hover:-translate-y-px focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#efb804]"
          >
            <span>{sendButtonLabel}</span>
            <ArrowRight className="h-[14px] w-[16px] rotate-[-45deg] transition-transform group-hover:translate-x-0.5" strokeWidth={2.4} aria-hidden="true" />
          </button>
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

        <Check className="absolute left-[362px] top-[518px] h-[16px] w-[16px] text-[#4a4f54]" strokeWidth={2.6} aria-hidden="true" />

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
