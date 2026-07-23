'use client'

import {PresentationViewport} from '@/components/layout/PresentationViewport'
import {ChapterNavigation} from '@/components/navigation/ChapterNavigation'
import {
  brandLogoImageClassName,
  brandLogoPositionClassName,
} from '@/lib/brandingLayout'
import type {CustomerGroup} from '@/lib/customerSelection'
import type {
  ScenarioMatrixBundle,
  ScenarioMatrixPageData,
  ScenarioMatrixParameter,
  ScenarioMatrixSlider,
} from '@/lib/scenarioMatrix'
import {
  calculateScenarioResult,
  type CalculationParameters,
  type CalculatorValues,
  type ScenarioType,
} from '@/lib/calculation/scenarioCalculator'
import type {ConsultationCalculationResult} from '@/lib/consultation'
import {saveScenarioSelection} from '@/lib/consultationStore'
import type {ProductNavigationItem} from '@/lib/whatFits'
import {AnimatePresence, motion} from 'framer-motion'
import {ArrowLeft, ArrowRight, ArrowUp, ListFilter} from 'lucide-react'
import Link from 'next/link'
import {useMemo, useState} from 'react'

type ScenarioMatrixScreenProps = ScenarioMatrixPageData & {
  customerType: CustomerGroup
}

type CalculatorTab = 'needs' | 'calculation'

const patternClassName =
  'pointer-events-none absolute bottom-[-215px] right-[-240px] z-0 h-[850px] w-[850px] bg-contain bg-center bg-no-repeat'

function formatNumber(value: number, unit?: string) {
  const maximumFractionDigits = Number.isInteger(value) ? 0 : 1
  const formatted = new Intl.NumberFormat('de-AT', {maximumFractionDigits}).format(value)

  return unit ? `${formatted} ${unit}` : formatted
}

type CalculatedBundle = {
  autarkyPercent?: number
  annualSavingsEur?: number
}

const validScenarioTypes = new Set<ScenarioType>(['b2c_pv', 'b2c_pv_speicher', 'b2c_komplett'])
const sliderKeyAliases: Record<keyof CalculatorValues, string[]> = {
  annualConsumption: ['annualConsumption'],
  storageSize: ['storageSize', 'speichergrösse', 'speichergroesse', 'speichergrosse'],
  chargingStations: ['chargingStations', 'ladestationen', 'ladepunkte'],
  peakLoadKw: ['peakLoadKw', 'lastspitze'],
}
const b2cSliderKeys = new Set([
  'annualconsumption',
  'storagesize',
  'speichergrosse',
  'chargingstations',
  'ladestationen',
  'ladepunkte',
  'lastspitze',
])

function normalizeCmsKey(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ß/g, 'ss')
    .toLowerCase()
}

function findExactParameter(parameters: ScenarioMatrixParameter[], key: keyof CalculationParameters) {
  return parameters.find((parameter) => parameter.key === key)?.value
}

function findExactSliderValue(
  sliders: ScenarioMatrixSlider[],
  values: Record<string, number>,
  key: keyof CalculatorValues,
) {
  const aliases = sliderKeyAliases[key].map(normalizeCmsKey)
  const slider = sliders.find((item) => aliases.includes(normalizeCmsKey(item.key)))

  return slider ? values[slider.key] : undefined
}

function buildCalculatorValues(
  sliders: ScenarioMatrixSlider[],
  values: Record<string, number>,
): CalculatorValues | undefined {
  const annualConsumption = findExactSliderValue(sliders, values, 'annualConsumption')
  const storageSize = findExactSliderValue(sliders, values, 'storageSize')
  const chargingStations = findExactSliderValue(sliders, values, 'chargingStations')
  const peakLoadKw = findExactSliderValue(sliders, values, 'peakLoadKw')

  if (
    typeof annualConsumption !== 'number' ||
    typeof storageSize !== 'number' ||
    typeof chargingStations !== 'number'
  ) {
    return undefined
  }

  return {annualConsumption, storageSize, chargingStations, peakLoadKw}
}

function getVisibleSliders(sliders: ScenarioMatrixSlider[], customerType: CustomerGroup) {
  if (customerType === 'b2b') {
    return sliders
  }

  return sliders.filter((slider) => b2cSliderKeys.has(normalizeCmsKey(slider.key)))
}

function buildCalculationParameters(
  parameters: ScenarioMatrixParameter[],
): CalculationParameters | undefined {
  const keys: Array<keyof CalculationParameters> = [
    'pvSizeKwp',
    'specificYieldKwhPerKwp',
    'electricityPriceEurPerKwh',
    'feedInTariffEurPerKwh',
    'evDemandPerChargingStationKwh',
    'smartChargingShiftShare',
  ]
  const entries = keys.map((key) => [key, findExactParameter(parameters, key)] as const)

  if (entries.some(([, value]) => typeof value !== 'number' || !Number.isFinite(value))) {
    return undefined
  }

  return Object.fromEntries(entries) as CalculationParameters
}

function calculateBundle(
  bundle: ScenarioMatrixBundle,
  values: CalculatorValues | undefined,
  parameters: CalculationParameters | undefined,
): CalculatedBundle {
  if (!values || !parameters || !bundle.scenarioType || !validScenarioTypes.has(bundle.scenarioType as ScenarioType)) {
    return {}
  }

  const result = calculateScenarioResult(bundle.scenarioType as ScenarioType, values, parameters)

  return {
    autarkyPercent: result.autarkyPercent,
    annualSavingsEur: result.annualSavingsEur,
  }
}

function formatPercent(value: number) {
  return `${new Intl.NumberFormat('de-AT', {maximumFractionDigits: 0}).format(Math.round(value))}%`
}

function formatEuro(value: number) {
  return `${new Intl.NumberFormat('de-AT', {maximumFractionDigits: 0}).format(Math.round(value))}€`
}

function SliderControl({
  slider,
  value,
  onChange,
  isBusiness,
  compact,
}: {
  slider: ScenarioMatrixSlider
  value: number
  onChange: (value: number) => void
  isBusiness: boolean
  compact: boolean
}) {
  const percentage = ((value - slider.min) / (slider.max - slider.min)) * 100

  return (
    <div className="w-[660px]">
      <div className={`${compact ? 'mb-[12px]' : 'mb-[18px]'} flex items-center justify-between gap-[24px]`}>
        <label
          htmlFor={`scenario-slider-${slider.id}`}
          className={`text-[20px] font-semibold uppercase leading-none tracking-[0.025em] max-[1600px]:text-[22px] [@media(max-height:920px)]:text-[22px] ${
            isBusiness ? 'text-white' : 'text-[#3d4248]'
          }`}
        >
          {slider.label}
        </label>
        <output
          htmlFor={`scenario-slider-${slider.id}`}
          className="inline-flex h-[26px] min-w-[38px] items-center justify-center rounded-full bg-[#efb804] px-[12px] text-[14px] font-semibold uppercase leading-none text-[#3d4248] max-[1600px]:h-[30px] max-[1600px]:text-[16px] [@media(max-height:920px)]:h-[30px] [@media(max-height:920px)]:text-[16px]"
        >
          {formatNumber(value, slider.unit)}
        </output>
      </div>

      <div className="group relative h-[26px]">
        <span
          className={`absolute left-0 right-0 top-1/2 h-[3px] -translate-y-1/2 ${
            isBusiness ? 'bg-white/80' : 'bg-[#3d4248]/55'
          }`}
          aria-hidden="true"
        />
        <span
          className="absolute left-0 top-1/2 h-[4px] -translate-y-1/2 bg-[#efb804]"
          style={{width: `${percentage}%`}}
          aria-hidden="true"
        />
        <span
          className="absolute top-1/2 h-[22px] w-[22px] -translate-x-1/2 -translate-y-1/2 rounded-full border-[5px] border-[#efb804] bg-white shadow-[0_2px_8px_rgba(0,0,0,0.2)] transition-shadow group-focus-within:shadow-[0_0_0_3px_rgba(255,255,255,0.38)]"
          style={{left: `${percentage}%`}}
          aria-hidden="true"
        />
        <input
          id={`scenario-slider-${slider.id}`}
          type="range"
          min={slider.min}
          max={slider.max}
          step={slider.step}
          value={value}
          aria-valuetext={formatNumber(value, slider.unit)}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          onChange={(event) => onChange(Number(event.target.value))}
        />
      </div>
    </div>
  )
}

function BundleCard({
  bundle,
  imageUrl,
  imageAlt,
  deltaIconUrl,
  deltaIconAlt,
  result,
  previousResult,
  active,
  onSelect,
  isBusiness,
  isWireframeLayout,
  lowerCard,
}: {
  bundle: ScenarioMatrixBundle
  imageUrl?: string
  imageAlt: string
  deltaIconUrl?: string
  deltaIconAlt: string
  result: CalculatedBundle
  previousResult?: CalculatedBundle
  active: boolean
  onSelect: () => void
  isBusiness: boolean
  isWireframeLayout: boolean
  lowerCard: boolean
}) {
  const autarkyDelta =
    result.autarkyPercent !== undefined && previousResult?.autarkyPercent !== undefined
      ? Math.round(result.autarkyPercent - previousResult.autarkyPercent)
      : undefined
  const savingsDelta =
    result.annualSavingsEur !== undefined && previousResult?.annualSavingsEur !== undefined
      ? Math.round(result.annualSavingsEur - previousResult.annualSavingsEur)
      : undefined
  const hasPositiveAutarkyDelta = autarkyDelta !== undefined && autarkyDelta > 0
  const hasPositiveSavingsDelta = savingsDelta !== undefined && savingsDelta > 0

  return (
    <button
      type="button"
      className={`group relative text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-5 focus-visible:outline-[#efb804] ${
        isWireframeLayout ? 'h-[500px] w-[316px]' : 'h-[420px] w-[315px]'
      } ${
        lowerCard ? 'translate-y-[12px]' : ''
      } ${
        isBusiness ? 'text-white' : 'text-[#3d4248]'
      }`}
      aria-pressed={active}
      onClick={onSelect}
    >
      <span className="block h-[38px] max-[1600px]:h-[42px] [@media(max-height:920px)]:h-[42px]">
        <span
          className={`inline-flex h-full min-w-[205px] items-center justify-center px-[24px] text-[18px] font-bold uppercase leading-none transition-colors duration-200 max-[1600px]:text-[20px] [@media(max-height:920px)]:text-[20px] ${
            active
              ? 'bg-[#efb804] text-[#3d4248]'
              : isBusiness
                ? 'bg-[#4a4f54] text-white'
                : isWireframeLayout
                  ? 'bg-[#3d4248] text-white'
                  : 'bg-[#eceeef] text-[#3d4248]'
          }`}
        >
          {bundle.title}
        </span>
      </span>

      {imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imageUrl}
          alt={imageAlt}
          className={`object-contain object-center transition-transform duration-300 group-hover:scale-[1.015] ${
            isWireframeLayout ? 'mt-[14px] h-[214px] w-[316px]' : 'mt-[24px] h-[160px] w-[315px]'
          }`}
        />
      ) : null}

      {hasPositiveAutarkyDelta || hasPositiveSavingsDelta ? (
        <span
          className={`absolute z-[3] flex h-[72px] w-[156px] flex-col items-center justify-center gap-[7px] text-[15px] font-semibold uppercase leading-none ${
            isWireframeLayout
              ? `left-[-188px] top-[198px] ${isBusiness ? 'bg-[#4a4f54] text-[#efb804]' : 'bg-[#efb804] text-[#3d4248]'}`
              : `left-[-188px] top-[166px] text-[#efb804] ${isBusiness ? 'bg-[#4a4f54]' : 'bg-[#eceeef]'}`
          }`}
        >
          {hasPositiveAutarkyDelta ? (
            <span className="flex items-center gap-[7px]">
              {deltaIconUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={deltaIconUrl}
                  alt={deltaIconAlt}
                  className={`h-[14px] w-[14px] object-contain ${
                    isBusiness
                      ? '[filter:brightness(0)_saturate(100%)_invert(69%)_sepia(96%)_saturate(1050%)_hue-rotate(359deg)_brightness(101%)_contrast(95%)]'
                      : ''
                  }`}
                />
              ) : (
                <ArrowUp className="h-[14px] w-[14px] fill-current" strokeWidth={3} aria-hidden="true" />
              )}
              <span>
                +{formatPercent(autarkyDelta)} AUTARK
              </span>
            </span>
          ) : null}
          {hasPositiveSavingsDelta ? (
            <span className="flex items-center gap-[7px]">
              {deltaIconUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={deltaIconUrl}
                  alt=""
                  className={`h-[14px] w-[14px] object-contain ${
                    isBusiness
                      ? '[filter:brightness(0)_saturate(100%)_invert(69%)_sepia(96%)_saturate(1050%)_hue-rotate(359deg)_brightness(101%)_contrast(95%)]'
                      : ''
                  }`}
                  aria-hidden="true"
                />
              ) : (
                <ArrowUp className="h-[14px] w-[14px] fill-current" strokeWidth={3} aria-hidden="true" />
              )}
              <span>+{formatEuro(savingsDelta)}</span>
            </span>
          ) : null}
        </span>
      ) : null}

      <div className={`${isWireframeLayout ? `mt-[18px] h-[104px] ${isBusiness ? 'text-[#efb804]' : 'text-[#3d4248]'}` : 'mt-[18px] text-[#efb804]'}`}>
        {result.autarkyPercent !== undefined ? (
          <p className="flex items-baseline gap-[14px] uppercase">
            <strong className="text-[30px] font-bold leading-none max-[1600px]:text-[34px] [@media(max-height:920px)]:text-[34px]">
              {formatPercent(result.autarkyPercent)}
            </strong>
            <span className="text-[20px] font-medium tracking-[0.025em] max-[1600px]:text-[22px] [@media(max-height:920px)]:text-[22px]">AUTARK</span>
          </p>
        ) : null}
        {result.annualSavingsEur !== undefined ? (
          <p className="mt-[6px] flex items-baseline gap-[14px] uppercase">
            <strong className="text-[30px] font-bold leading-none max-[1600px]:text-[34px] [@media(max-height:920px)]:text-[34px]">
              {formatEuro(result.annualSavingsEur)}
            </strong>
            <span className="text-[20px] font-medium tracking-[0.025em] max-[1600px]:text-[22px] [@media(max-height:920px)]:text-[22px]">ERSPARNIS / JAHR</span>
          </p>
        ) : null}
      </div>

      <div
        className={`flex min-h-[60px] items-start gap-[8px] border-t-2 pt-[20px] font-sans text-[16px] leading-[1.35] tracking-normal ${
          isWireframeLayout ? 'mt-0' : 'mt-[18px]'
        } ${
          isBusiness ? 'border-white' : 'border-[#3d4248]'
        }`}
      >
        <span className="shrink-0 font-normal uppercase">Enthalten:</span>
        {bundle.includedItems.length > 0 ? (
          <ul className="space-y-px font-normal" aria-label="Enthaltene Leistungen">
            {bundle.includedItems.map((item) => (
              <li key={item.id}>
                {item.amount ? <strong className="font-bold">{item.amount} </strong> : null}
                {item.label}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </button>
  )
}

function resolveTarget(target: string | null | undefined, customerType: CustomerGroup) {
  const normalizedTarget = target?.trim()

  function isNextStepTarget(value: string) {
    const key = normalizeCmsKey(value)
      .replace(/^\/+/, '')
      .split('?')[0]
      .replace(/-/g, '')

    return /^(nextstep|closing|nachsterschritt|documentselection)\d*$/.test(key)
  }

  if (!normalizedTarget || normalizedTarget === 'next' || isNextStepTarget(normalizedTarget)) {
    return `/next-step?type=${customerType}`
  }

  if (normalizedTarget.startsWith('/')) {
    return normalizedTarget
  }

  const screenKey = normalizedTarget.includes(':')
    ? normalizedTarget.split(':').pop() || ''
    : normalizedTarget

  if (isNextStepTarget(screenKey)) {
    return `/next-step?type=${customerType}`
  }

  return screenKey ? `/${screenKey}?type=${customerType}` : `/offer?type=${customerType}`
}

function buildNextStepHref(
  href: string,
  activeBundleId: string,
) {
  const [path, query = ''] = href.split('?')
  const params = new URLSearchParams(query)

  if (activeBundleId) {
    params.set('bundle', activeBundleId)
  }

  const serializedParams = params.toString()

  return serializedParams ? `${path}?${serializedParams}` : path
}

function bottomNavigationHref(item: ProductNavigationItem, customerType: CustomerGroup) {
  if (item.kind === 'catalog') {
    return `/needs?type=${customerType}`
  }

  if (item.kind === 'product' && item.slug) {
    return `/needs?type=${customerType}&product=${encodeURIComponent(item.slug)}`
  }

  return item.href
}

function toConsultationCalculationResult(
  result: CalculatedBundle | undefined,
): ConsultationCalculationResult | undefined {
  if (
    typeof result?.autarkyPercent !== 'number' ||
    typeof result.annualSavingsEur !== 'number'
  ) {
    return undefined
  }

  return {
    autarkyPercent: result.autarkyPercent,
    annualSavingsEur: result.annualSavingsEur,
  }
}

export function ScenarioMatrixScreen({
  customerType,
  headline,
  calculatorTabLabel,
  bundleTabLabel,
  calculateButtonLabel,
  sliders,
  parameters,
  bundles,
  heroImageUrl,
  heroImageAlt,
  heroImage2Url,
  heroImage2Alt,
  primaryCta,
  offerImageUrl,
  offerImageAlt,
  b2cBundleImageUrl,
  b2cBundleImageAlt,
  bottomNavigation,
  navigationItems,
  logoUrl,
  inverseLogoUrl,
  logoAlt,
  patternUrl,
  patternAlt,
  navigationArrowUrl,
  productNavigationLeftArrowUrl,
  productNavigationRightArrowUrl,
  productNavigationCatalogIconUrl,
  calculateButtonArrowUrl,
}: ScenarioMatrixScreenProps) {
  const [activeTab, setActiveTab] = useState<CalculatorTab>('needs')
  const [activeBundleId, setActiveBundleId] = useState(bundles[0]?.id || '')
  const [values, setValues] = useState<Record<string, number>>(() =>
    Object.fromEntries(sliders.map((slider) => [slider.key, slider.defaultValue])),
  )
  const isBusiness = customerType === 'b2b'
  const isCalculation = activeTab === 'calculation'
  const pageLogoUrl = isBusiness ? inverseLogoUrl || logoUrl : logoUrl || inverseLogoUrl
  const navigationLogoUrl = isBusiness ? logoUrl || inverseLogoUrl : inverseLogoUrl || logoUrl
  const visibleSliders = useMemo(() => getVisibleSliders(sliders, customerType), [customerType, sliders])
  const visibleBundles = useMemo(() => bundles.slice(0, 3), [bundles])
  const calculatorValues = useMemo(() => buildCalculatorValues(sliders, values), [sliders, values])
  const calculationParameters = useMemo(() => buildCalculationParameters(parameters), [parameters])
  const calculatedBundles = useMemo(
    () => visibleBundles.map((bundle) => calculateBundle(bundle, calculatorValues, calculationParameters)),
    [calculationParameters, calculatorValues, visibleBundles],
  )
  const activeBundleIndex = visibleBundles.findIndex((bundle) => bundle.id === activeBundleId)
  const activeBundle = activeBundleIndex >= 0 ? visibleBundles[activeBundleIndex] : undefined
  const activeBundleResult = activeBundleIndex >= 0 ? calculatedBundles[activeBundleIndex] : undefined
  const calculationCtaLabel = primaryCta?.label || visibleBundles[visibleBundles.length - 1]?.nextStepText
  const calculationCtaHref = resolveTarget(primaryCta?.target, customerType)
  const calculationCtaHrefWithState = useMemo(
    () => buildNextStepHref(calculationCtaHref, activeBundleId),
    [activeBundleId, calculationCtaHref],
  )
  const bundleImageUrl = b2cBundleImageUrl || offerImageUrl || heroImageUrl
  const bundleImageAlt = b2cBundleImageUrl
    ? b2cBundleImageAlt
    : offerImageUrl
      ? offerImageAlt
      : heroImageAlt

  return (
    <PresentationViewport backgroundClassName={isBusiness ? 'bg-[#3d4248]' : 'bg-white'}>
      <main
        className={`relative isolate h-full w-full overflow-hidden font-sans ${
          isBusiness ? 'bg-[#3d4248] text-white' : 'bg-white text-[#3d4248]'
        }`}
      >
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

        {headline ? (
          <h1
            className={`absolute left-[60px] top-[220px] z-[3] font-sans text-[54px] font-bold uppercase leading-[0.92] tracking-[0.006em] ${
              isBusiness ? 'text-white' : 'text-[#3d4248]'
            }`}
          >
            {headline}
          </h1>
        ) : null}

        <div className="absolute left-[60px] top-[320px] z-[5] flex items-start gap-[16px]" role="tablist" aria-label={headline || undefined}>
          {([
            {key: 'needs' as const, label: calculatorTabLabel},
            {key: 'calculation' as const, label: bundleTabLabel},
          ]).map((tab) => {
            const isActive = activeTab === tab.key

            return (
              <button
                key={tab.key}
                type="button"
                role="tab"
                aria-selected={isActive}
                className={`relative px-[12px] pb-[10px] text-[16px] font-semibold uppercase tracking-[0.02em] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#efb804] max-[1600px]:text-[18px] [@media(max-height:920px)]:text-[18px] ${
                  isActive ? 'text-[#efb804]' : isBusiness ? 'text-white' : 'text-[#3d4248]'
                }`}
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.label}
                {isActive ? <span className="absolute inset-x-0 bottom-0 h-px bg-[#efb804]" aria-hidden="true" /> : null}
              </button>
            )
          })}
        </div>

        <AnimatePresence mode="wait" initial={false}>
          {activeTab === 'needs' ? (
            <motion.section
              key="needs"
              className="absolute inset-0 z-[2]"
              initial={{opacity: 0, x: -10}}
              animate={{opacity: 1, x: 0}}
              exit={{opacity: 0, x: -10}}
              transition={{duration: 0.34, ease: [0.22, 1, 0.36, 1]}}
              aria-label={calculatorTabLabel}
            >
              {heroImageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={heroImageUrl}
                    alt={heroImageAlt}
                    className={`pointer-events-none absolute bottom-[-92px] right-[-42px] z-0 h-[840px] w-[1100px] object-contain object-right-bottom ${
                      isBusiness ? '' : 'brightness-0 opacity-30'
                    }`}
                />
              ) : null}

              <div className="absolute left-[72px] top-[400px] z-[4] space-y-[28px]">
                {visibleSliders.map((slider) => (
                  <SliderControl
                    key={slider.id}
                    slider={slider}
                    value={values[slider.key] ?? slider.defaultValue}
                    onChange={(value) => setValues((current) => ({...current, [slider.key]: value}))}
                    isBusiness={isBusiness}
                    compact
                  />
                ))}

                {calculateButtonLabel ? (
                  <button
                    type="button"
                    className="group inline-flex h-[46px] min-w-[228px] items-center justify-between rounded-full bg-[#efb804] px-[25px] text-[16px] font-semibold uppercase tracking-[0.025em] text-[#3d4248] transition-transform hover:-translate-y-px focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#efb804] max-[1600px]:h-[50px] max-[1600px]:min-w-[244px] max-[1600px]:text-[18px] [@media(max-height:920px)]:h-[50px] [@media(max-height:920px)]:min-w-[244px] [@media(max-height:920px)]:text-[18px]"
                    onClick={() => {
                      setActiveTab('calculation')
                    }}
                  >
                    <span>{calculateButtonLabel}</span>
                    {calculateButtonArrowUrl || navigationArrowUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={calculateButtonArrowUrl || navigationArrowUrl} alt="" className="h-[16px] w-[16px] object-contain" aria-hidden="true" />
                    ) : (
                      <ArrowRight className="h-[17px] w-[17px] transition-transform group-hover:translate-x-1" strokeWidth={2.3} aria-hidden="true" />
                    )}
                  </button>
                ) : null}
              </div>

            </motion.section>
          ) : (
            <motion.section
              key="calculation"
              className="absolute left-[60px] top-[380px] z-[3] h-[515px] w-[1320px] max-[1600px]:top-[372px] [@media(max-height:920px)]:top-[372px]"
              initial={{opacity: 0, x: 10}}
              animate={{opacity: 1, x: 0}}
              exit={{opacity: 0, x: 10}}
              transition={{duration: 0.34, ease: [0.22, 1, 0.36, 1]}}
              aria-label={bundleTabLabel}
            >
              {visibleBundles.length > 0 ? (
                <div
                  className="grid h-full grid-cols-[315px_315px_315px] gap-x-[188px] max-[1600px]:gap-x-[175px] [@media(max-height:920px)]:gap-x-[175px]"
                >
                  {visibleBundles.map((bundle, index) => (
                    <BundleCard
                      key={bundle.id}
                      bundle={bundle}
                      imageUrl={bundleImageUrl}
                      imageAlt={bundleImageAlt}
                      deltaIconUrl={heroImage2Url}
                      deltaIconAlt={heroImage2Alt}
                      result={calculatedBundles[index]}
                      previousResult={index > 0 ? calculatedBundles[index - 1] : undefined}
                      active={bundle.id === activeBundleId}
                      onSelect={() => setActiveBundleId(bundle.id)}
                      isBusiness={isBusiness}
                      isWireframeLayout
                      lowerCard={index === 2}
                    />
                  ))}
                </div>
              ) : null}
            </motion.section>
          )}
        </AnimatePresence>

        {isCalculation && calculationCtaLabel ? (
          <div className="absolute bottom-[58px] right-[72px] z-[8] w-[262px] max-[1600px]:bottom-[26px] max-[1600px]:left-[60px] max-[1600px]:right-auto [@media(max-height:920px)]:bottom-[26px] [@media(max-height:920px)]:left-[60px] [@media(max-height:920px)]:right-auto">
            <Link
              href={calculationCtaHrefWithState}
              onClick={() => {
                if (activeBundle) {
                  saveScenarioSelection({
                    customerType,
                    bundle: activeBundle,
                    matrixValues: values,
                    calculationResult: toConsultationCalculationResult(activeBundleResult),
                  })
                }
              }}
              className="group flex items-center justify-between pb-[10px] font-sans text-[18px] font-bold uppercase leading-none tracking-[0.02em] text-[#efb804] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-6 focus-visible:outline-[#efb804] max-[1600px]:text-[20px] [@media(max-height:920px)]:text-[20px]"
            >
              <span>{calculationCtaLabel}</span>
              <ArrowRight className="h-[14px] w-[20px] transition-transform group-hover:translate-x-1" strokeWidth={2.2} aria-hidden="true" />
            </Link>
            <span className="block h-px w-full bg-[#efb804]" aria-hidden="true" />
          </div>
        ) : null}

        {bottomNavigation.length > 0 && !isCalculation ? (
          <nav
            className="absolute bottom-[36px] left-[60px] z-[8] flex h-[48px] w-max items-center bg-[#464b50]"
            aria-label="Produktnavigation"
          >
            <span className="pointer-events-none absolute -left-[25px] top-0 h-full w-[26px] bg-[#464b50] [clip-path:polygon(100%_0,100%_100%,0_50%)]" aria-hidden="true" />
            <span className="pointer-events-none absolute -right-[25px] top-0 h-full w-[26px] bg-[#464b50] [clip-path:polygon(0_0,0_100%,100%_50%)]" aria-hidden="true" />

            <Link
              href={`/needs?type=${customerType}`}
              className="absolute -left-[25px] z-[2] grid h-[92px] w-[26px] place-items-center text-[#efb804] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#efb804]"
              aria-label="Zum Katalog"
            >
              {productNavigationLeftArrowUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={productNavigationLeftArrowUrl} alt="" className="h-[92px] w-[26px] object-contain" aria-hidden="true" />
              ) : (
                <ArrowLeft className="h-[28px] w-[28px]" strokeWidth={2.8} aria-hidden="true" />
              )}
            </Link>

            <div className="flex w-auto items-center justify-start gap-[40px] pl-[10px] pr-[12px]">
              {bottomNavigation.map((item) => {
                const href = bottomNavigationHref(item, customerType)
                const isMatrix = item.kind === 'screen' && Boolean(item.href?.includes('scenario-matrix'))
                const isCatalog = item.kind === 'catalog'
                const catalogIconUrl = productNavigationCatalogIconUrl || item.iconUrl
                const className = `inline-flex items-center justify-center whitespace-nowrap text-[14px] font-semibold uppercase tracking-[0.02em] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#efb804] max-[1600px]:text-[15px] [@media(max-height:920px)]:text-[15px] ${
                  isMatrix && !isCatalog ? 'rounded-full bg-[#efb804] text-[#3d4248]' : 'text-white'
                  } ${
                  isCatalog
                    ? catalogIconUrl
                      ? 'h-[26px] w-[66px] p-0 leading-none'
                      : 'h-[26px] min-w-[66px] rounded-full bg-white px-[12px] text-[#3d4248]'
                    : 'h-[26px] px-[12px]'
                }`
                const content = isCatalog ? (
                  catalogIconUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={catalogIconUrl} alt={item.label} className="block h-[26px] w-[66px] shrink-0 object-contain" />
                  ) : (
                    <><ListFilter className="h-[17px] w-[17px] text-[#3d4248]" strokeWidth={2.2} aria-hidden="true" /><span className="sr-only">{item.label}</span></>
                  )
                ) : item.label

                return href && !isMatrix ? (
                  <Link key={item.key} href={href} className={className}>{content}</Link>
                ) : (
                  <span key={item.key} className={className} aria-current={isMatrix ? 'page' : undefined}>{content}</span>
                )
              })}
            </div>

            <span className="absolute -right-[25px] z-[2] grid h-[92px] w-[26px] place-items-center text-[#efb804]" aria-hidden="true">
              {productNavigationRightArrowUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={productNavigationRightArrowUrl} alt="" className="h-[92px] w-[26px] object-contain" />
              ) : (
                <ArrowRight className="h-[28px] w-[28px]" strokeWidth={2.8} />
              )}
            </span>
          </nav>
        ) : null}

        <ChapterNavigation
          customerType={customerType}
          items={navigationItems}
          currentKey="needs"
          logoUrl={navigationLogoUrl}
          logoAlt={logoAlt}
          navigationArrowUrl={navigationArrowUrl}
        />
      </main>
    </PresentationViewport>
  )
}
