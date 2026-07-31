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
  ScenarioMatrixMetric,
  ScenarioMatrixPageData,
  ScenarioMatrixParameter,
  ScenarioMatrixSlider,
} from '@/lib/scenarioMatrix'
import {
  calculateScenarioResult,
  isScenarioType,
  type CalculationParameters,
  type CalculatorValues,
  type ScenarioCalculationResult,
} from '@/lib/calculation/scenarioCalculator'
import type {ConsultationCalculationResult} from '@/lib/consultation'
import {saveScenarioSelection} from '@/lib/consultationStore'
import type {ProductNavigationItem} from '@/lib/whatFits'
import {AnimatePresence, motion} from 'framer-motion'
import {ArrowLeft, ArrowRight, ArrowUp, ListFilter} from 'lucide-react'
import Link from 'next/link'
import {useRouter} from 'next/navigation'
import {useEffect, useMemo, useState} from 'react'

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
  peakLoadReductionKw?: number
  pvSizeKwp?: number
  storageSizeKwh?: number
  chargingStations?: number
  metrics: CalculatedMetric[]
}

type CalculatedMetric = {
  key: string
  title: string
  value: number
  unit?: string
  metricType?: string
}

type IncludedItemDisplay = {
  id: string
  amount?: string
  label: string
}

const sliderKeyAliases: Record<keyof CalculatorValues, string[]> = {
  annualConsumption: ['annualConsumption'],
  storageSize: ['storageSize', 'speichergrösse', 'speichergroesse', 'speichergrosse'],
  chargingStations: ['chargingStations', 'ladestationen', 'ladepunkte'],
  peakLoadKw: ['peakLoadKw', 'lastspitze'],
  expectedGrowthPercent: [
    'expectedGrowthPercent',
    'growth',
    'growthPercent',
    'rising',
    'wachstum',
  ],
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
const matrixContentShiftClassName = 'translate-y-[-88px] max-[1600px]:translate-y-[-72px] [@media(max-height:920px)]:translate-y-[-72px] [@media(min-width:768px)_and_(max-width:1366px)]:translate-y-[-60px]'

function normalizeCmsKey(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ß/g, 'ss')
    .toLowerCase()
}

function getB2cBottomNavigationSlotClassName(item: ProductNavigationItem) {
  const label = normalizeCmsKey(item.label)

  if (item.kind === 'catalog') {
    return 'w-[54px]'
  }

  if (label.includes('photovoltaik')) {
    return 'w-[122px]'
  }

  if (label.includes('batteriespeicher')) {
    return 'w-[168px]'
  }

  if (label.includes('warmepumpe')) {
    return 'w-[128px]'
  }

  if (label.includes('ladestation')) {
    return 'w-[132px]'
  }

  if (label.includes('energiegemeinschaft')) {
    return 'w-[198px]'
  }

  if (label.includes('matrix')) {
    return 'w-[76px]'
  }

  return 'w-[132px]'
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
  const expectedGrowthPercent = findExactSliderValue(
    sliders,
    values,
    'expectedGrowthPercent',
  )

  if (
    typeof annualConsumption !== 'number' ||
    typeof storageSize !== 'number' ||
    typeof chargingStations !== 'number'
  ) {
    return undefined
  }

  return {
    annualConsumption,
    storageSize,
    chargingStations,
    peakLoadKw,
    expectedGrowthPercent,
  }
}

function getVisibleSliders(sliders: ScenarioMatrixSlider[], customerType: CustomerGroup) {
  if (customerType === 'b2b') {
    return sliders
  }

  return sliders.filter((slider) => b2cSliderKeys.has(normalizeCmsKey(slider.key)))
}

function buildCalculationParameters(
  parameters: ScenarioMatrixParameter[],
): CalculationParameters {
  return Object.fromEntries(
    parameters.flatMap((parameter) =>
      Number.isFinite(parameter.value) ? [[parameter.key, parameter.value]] : [],
    ),
  ) as CalculationParameters
}

function getIncludedStorageSizeKwh(bundle: ScenarioMatrixBundle) {
  const storageItem = bundle.includedItems.find((item) =>
    normalizeCmsKey(item.label).includes('speicher'),
  )
  const match = storageItem?.amount?.replace(',', '.').match(/\d+(?:\.\d+)?/)

  return match ? Number(match[0]) : 0
}

function buildBundleCalculatorValues(
  bundle: ScenarioMatrixBundle,
  values: CalculatorValues,
) {
  if (!bundle.scenarioType?.startsWith('b2b_')) {
    return values
  }

  return {
    ...values,
    storageSize: Math.max(values.storageSize, getIncludedStorageSizeKwh(bundle)),
  }
}

function calculateBundle(
  bundle: ScenarioMatrixBundle,
  values: CalculatorValues | undefined,
  parameters: CalculationParameters | undefined,
  metrics: ScenarioMatrixMetric[],
): CalculatedBundle {
  if (
    !values ||
    !parameters ||
    !bundle.scenarioType ||
    !isScenarioType(bundle.scenarioType)
  ) {
    return {metrics: []}
  }

  const bundleValues = buildBundleCalculatorValues(bundle, values)
  const result = calculateScenarioResult(bundle.scenarioType, bundleValues, parameters)

  return {
    autarkyPercent: result.autarkyPercent,
    annualSavingsEur: result.annualSavingsEur,
    peakLoadReductionKw: result.peakLoadReductionKw,
    pvSizeKwp: result.pvSizeKwp,
    storageSizeKwh: result.storageSizeKwh,
    chargingStations: bundleValues.chargingStations,
    metrics: buildCalculatedMetrics(
      metrics,
      result,
      bundleValues,
      bundle.scenarioType.startsWith('b2b_'),
    ),
  }
}

function buildCalculatedMetrics(
  metrics: ScenarioMatrixMetric[],
  result: ScenarioCalculationResult,
  values: CalculatorValues,
  isBusinessScenario: boolean,
): CalculatedMetric[] {
  const configuredMetrics = metrics.flatMap((metric) => {
    const value = resolveMetricValue(metric, result, values)

    return value === undefined
      ? []
      : [{
          key: metric.key,
          title: metric.title,
          value,
          unit: metric.unit,
          metricType: metric.metricType,
        }]
  })

  if (!isBusinessScenario) {
    return configuredMetrics
  }

  const peakMetric = configuredMetrics.find(
    (metric) => normalizeCmsKey(metric.metricType || '') === 'lastspitzen',
  ) || {
    key: 'lastspitzenreduktion',
    title: 'LASTSPITZENREDUKTION',
    value: result.peakLoadReductionKw,
    unit: 'kW',
    metricType: 'lastspitzen',
  }
  const autarkyMetric = configuredMetrics.find(
    (metric) => normalizeCmsKey(metric.metricType || '') === 'autarkiegrad',
  ) || {
    key: 'autarkie',
    title: 'AUTARK',
    value: result.autarkyPercent,
    unit: '%',
    metricType: 'autarkiegrad',
  }
  const savingsMetric = configuredMetrics.find((metric) => {
    const identity = normalizeCmsKey(`${metric.key} ${metric.title}`)
    const unit = normalizeCmsKey(metric.unit || '')

    return identity.includes('ersparnis') || unit === '€' || unit === 'eur'
  }) || {
    key: 'ersparnis-jahr',
    title: 'ERSPARNIS / JAHR',
    value: result.annualSavingsEur,
    unit: '€',
    metricType: 'nutzenargument',
  }

  return [peakMetric, autarkyMetric, savingsMetric]
}

function resolveMetricValue(
  metric: ScenarioMatrixMetric,
  result: ScenarioCalculationResult,
  values: CalculatorValues,
) {
  const metricType = normalizeCmsKey(metric.metricType || '')
  const identity = normalizeCmsKey(`${metric.key} ${metric.title}`)

  if (metricType === 'autarkiegrad' || identity.includes('autark')) {
    return result.autarkyPercent
  }

  if (metricType === 'lastspitzen' || identity.includes('lastspitzenreduktion')) {
    return result.peakLoadReductionKw
  }

  if (
    identity.includes('ersparnis') ||
    (metricType === 'nutzenargument' && normalizeCmsKey(metric.unit || '') === '€')
  ) {
    return result.annualSavingsEur
  }

  if (metricType === 'jahresverbrauch') {
    return result.totalDemandKwh
  }

  if (metricType === 'speichergroesse') {
    return result.usableStorageKwh
  }

  if (metricType === 'ladestation') {
    return values.chargingStations
  }

  if (metricType === 'jahresertrag') {
    return result.pvGenerationKwh
  }

  if (metricType === 'eigenverbrauch') {
    return normalizeCmsKey(metric.unit || '') === '%'
      ? result.pvGenerationKwh > 0
        ? result.selfConsumedPvKwh / result.pvGenerationKwh * 100
        : 0
      : result.selfConsumedPvKwh
  }

  return undefined
}

function formatPercent(value: number) {
  return `${new Intl.NumberFormat('de-AT', {maximumFractionDigits: 0}).format(Math.round(value))}%`
}

function formatEuro(value: number) {
  return `${new Intl.NumberFormat('de-AT', {maximumFractionDigits: 0}).format(Math.round(value))}€`
}

function formatCalculatedMetric(metric: CalculatedMetric, value = metric.value) {
  const normalizedUnit = normalizeCmsKey(metric.unit || '')

  if (normalizedUnit === '%') {
    return formatPercent(value)
  }

  if (normalizedUnit === '€' || normalizedUnit === 'eur') {
    return formatEuro(value)
  }

  return formatNumber(value, metric.unit)
}

function metricDeltaLabel(metric: CalculatedMetric, isBusiness = false) {
  const metricType = normalizeCmsKey(metric.metricType || '')
  const normalizedUnit = normalizeCmsKey(metric.unit || '')

  if (metricType === 'autarkiegrad') {
    return 'AUTARK'
  }

  if (metricType === 'lastspitzen') {
    return 'LASTSPITZE'
  }

  if (normalizedUnit === '€' || normalizedUnit === 'eur') {
    return isBusiness ? 'ERSPARNIS' : ''
  }

  return metric.title
}

function isPeakMetric(metric: CalculatedMetric) {
  return normalizeCmsKey(metric.metricType || '') === 'lastspitzen'
}

function isAutarkyMetric(metric: CalculatedMetric) {
  return normalizeCmsKey(metric.metricType || '') === 'autarkiegrad'
}

function isSavingsMetric(metric: CalculatedMetric) {
  const identity = normalizeCmsKey(`${metric.key} ${metric.title}`)
  const unit = normalizeCmsKey(metric.unit || '')

  return identity.includes('ersparnis') || unit === '€' || unit === 'eur'
}

function buildPositiveMetricDeltas(
  result: CalculatedBundle,
  previousResult: CalculatedBundle | undefined,
  isBusiness: boolean,
) {
  if (!previousResult) {
    return []
  }

  const deltas = result.metrics.flatMap((metric) => {
    const previousMetric = previousResult.metrics.find(
      (candidate) => candidate.key === metric.key,
    )
    const difference =
      previousMetric === undefined ? undefined : metric.value - previousMetric.value

    return difference !== undefined && difference > 0
      ? [{metric, difference}]
      : []
  })
  const preferredPredicates = isBusiness
    ? [isPeakMetric, isAutarkyMetric, isSavingsMetric]
    : [isAutarkyMetric, isSavingsMetric]
  const orderedDeltas: typeof deltas = []

  for (const predicate of preferredPredicates) {
    const delta = deltas.find(
      (candidate) =>
        predicate(candidate.metric) &&
        !orderedDeltas.some((item) => item.metric.key === candidate.metric.key),
    )

    if (delta) {
      orderedDeltas.push(delta)
    }
  }

  for (const delta of deltas) {
    if (!orderedDeltas.some((item) => item.metric.key === delta.metric.key)) {
      orderedDeltas.push(delta)
    }
  }

  return orderedDeltas.slice(0, isBusiness ? 3 : 2)
}

function splitIncludedItem(
  item: ScenarioMatrixBundle['includedItems'][number],
): Omit<IncludedItemDisplay, 'id'> {
  const amount = item.amount?.trim()
  const label = item.label.trim()

  if (amount) {
    return {amount, label}
  }

  const leadingAmountMatch = label.match(
    /^(\d+(?:[,.]\d+)?\s*(?:kWp|kWh|MWp|MWh|kW|MW|%|x)?)(?:\s+)(.+)$/i,
  )

  if (!leadingAmountMatch) {
    return {amount: undefined, label}
  }

  return {
    amount: leadingAmountMatch[1].trim(),
    label: leadingAmountMatch[2].trim(),
  }
}

function formatChargingStationAmount(value: number) {
  return `${formatNumber(Math.max(0, Math.round(value)))}x`
}

function getIncludedItemDisplay(
  item: ScenarioMatrixBundle['includedItems'][number],
  result: CalculatedBundle,
): IncludedItemDisplay {
  const display = splitIncludedItem(item)
  const label = normalizeCmsKey(`${display.label} ${item.label}`)

  if (label.includes('photovoltaik') && result.pvSizeKwp !== undefined) {
    return {...display, id: item.id, amount: formatNumber(result.pvSizeKwp, 'kWp')}
  }

  if (label.includes('speicher') && result.storageSizeKwh !== undefined) {
    return {...display, id: item.id, amount: formatNumber(result.storageSizeKwh, 'kWh')}
  }

  if (
    (label.includes('ladestation') ||
      label.includes('ladepunkt') ||
      label.includes('wallbox') ||
      label.includes('ladesaule')) &&
    result.chargingStations !== undefined
  ) {
    return {
      ...display,
      id: item.id,
      amount: formatChargingStationAmount(result.chargingStations),
    }
  }

  return {...display, id: item.id}
}

function buildFallbackIncludedItems(
  bundle: ScenarioMatrixBundle,
  result: CalculatedBundle,
): IncludedItemDisplay[] {
  if (bundle.includedItems.length > 0 || !bundle.scenarioType?.startsWith('b2c_')) {
    return []
  }

  const items: IncludedItemDisplay[] = []

  if (result.pvSizeKwp !== undefined) {
    items.push({
      id: `${bundle.id}-fallback-pv`,
      amount: formatNumber(result.pvSizeKwp, 'kWp'),
      label: 'Photovoltaik',
    })
  }

  if (
    (bundle.scenarioType === 'b2c_pv_speicher' ||
      bundle.scenarioType === 'b2c_komplett') &&
    result.storageSizeKwh !== undefined
  ) {
    items.push({
      id: `${bundle.id}-fallback-storage`,
      amount: formatNumber(result.storageSizeKwh, 'kWh'),
      label: 'Speicher',
    })
  }

  if (bundle.scenarioType === 'b2c_komplett' && result.chargingStations !== undefined) {
    items.push({
      id: `${bundle.id}-fallback-charging`,
      amount: formatChargingStationAmount(result.chargingStations),
      label: 'Ladestation',
    })
  }

  return items
}

function buildIncludedItemDisplays(
  bundle: ScenarioMatrixBundle,
  result: CalculatedBundle,
) {
  const configuredItems = bundle.includedItems.map((item) =>
    getIncludedItemDisplay(item, result),
  )

  return configuredItems.length > 0
    ? configuredItems
    : buildFallbackIncludedItems(bundle, result)
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
            isBusiness ? 'text-white' : 'text-[#2a2e33]'
          }`}
        >
          {slider.label}
        </label>
        <output
          htmlFor={`scenario-slider-${slider.id}`}
          className="inline-flex h-[26px] min-w-[38px] items-center justify-center rounded-full bg-[#efb804] px-[12px] text-[14px] font-semibold uppercase leading-none text-[#2a2e33] max-[1600px]:h-[30px] max-[1600px]:text-[16px] [@media(max-height:920px)]:h-[30px] [@media(max-height:920px)]:text-[16px]"
        >
          {formatNumber(value, slider.unit)}
        </output>
      </div>

      <div className="group relative h-[26px]">
        <span
          className={`absolute left-0 right-0 top-1/2 h-[3px] -translate-y-1/2 rounded-full [@media(min-width:768px)_and_(max-width:1366px)]:h-[8px] ${
            isBusiness ? 'bg-white/80' : 'bg-[#2a2e33]/55'
          }`}
          aria-hidden="true"
        />
        <span
          className="absolute left-0 top-1/2 h-[4px] -translate-y-1/2 rounded-full bg-[#efb804] [@media(min-width:768px)_and_(max-width:1366px)]:h-[8px]"
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
}) {
  const positiveMetricDeltas = buildPositiveMetricDeltas(
    result,
    previousResult,
    isBusiness,
  )
  const cardLayoutClassName = isWireframeLayout
    ? 'grid h-[500px] w-[316px] grid-rows-[42px_252px_118px_minmax(0,1fr)]'
    : 'h-[420px] w-[315px]'
  const titleSlotClassName = isWireframeLayout
    ? 'block h-full'
    : 'block h-[38px] max-[1600px]:h-[42px] [@media(max-height:920px)]:h-[42px]'
  const imageSlotClassName = isWireframeLayout
    ? 'flex h-full w-[316px] items-start justify-center pt-0 -translate-y-[54px]'
    : 'flex w-[315px] items-start justify-center pt-[24px]'
  const imageClassName = isWireframeLayout
    ? 'h-[326px] w-[480px] max-w-none'
    : 'h-[160px] w-[315px]'
  const imageFitClassName = 'object-contain object-center'
  const isB2cPvBundle = isWireframeLayout && !isBusiness && bundle.scenarioType === 'b2c_pv'
  const isB2cCompleteBundle = isWireframeLayout && !isBusiness && bundle.scenarioType === 'b2c_komplett'
  const bundleImageNudgeClassName =
    isB2cPvBundle
      ? 'translate-y-[-34px] origin-top scale-[1.1]'
      : isWireframeLayout && bundle.scenarioType === 'b2b_einstieg'
        ? 'translate-y-[-30px] scale-[1.08]'
        : isWireframeLayout && bundle.scenarioType === 'b2b_autark_abgesichert'
          ? 'translate-y-[-12px]'
      : isB2cCompleteBundle
        ? 'origin-top scale-[1.1]'
      : ''
  const resultClassName = isWireframeLayout
    ? `h-full ${isBusiness ? 'pt-[2px] text-[#efb804]' : 'text-[#2a2e33]'}`
    : 'mt-[24px] text-[#efb804]'
  const includedItemDisplays = buildIncludedItemDisplays(bundle, result)

  return (
    <button
      type="button"
      className={`group relative shrink-0 self-start text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-5 focus-visible:outline-[#efb804] ${cardLayoutClassName} ${
        isBusiness ? 'text-white' : 'text-[#2a2e33]'
      }`}
      aria-pressed={active}
      onClick={onSelect}
    >
      <span className={titleSlotClassName}>
        <span
          className={`inline-flex h-full min-w-[205px] items-center justify-center px-[24px] text-[18px] font-bold uppercase leading-none transition-colors duration-200 max-[1600px]:text-[20px] [@media(max-height:920px)]:text-[20px] ${
            active
              ? 'bg-[#efb804] text-[#2a2e33]'
              : isBusiness
                ? 'bg-[#4a4f54] text-white'
                : isWireframeLayout
                  ? 'bg-[#2a2e33] text-white'
                  : 'bg-[#eceeef] text-[#2a2e33]'
          }`}
        >
          {bundle.title}
        </span>
      </span>

      <span className={imageSlotClassName}>
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt={imageAlt}
            className={`${imageClassName} ${imageFitClassName} ${bundleImageNudgeClassName} transition-transform duration-300 ${
              isBusiness || isB2cPvBundle || isB2cCompleteBundle ? '' : 'group-hover:scale-[1.015]'
            }`}
          />
        ) : null}
      </span>

      {positiveMetricDeltas.length > 0 ? (
        <span
          className={`absolute z-[3] flex flex-col items-center justify-center font-semibold uppercase leading-none ${
            isBusiness
              ? 'h-[84px] w-[184px] gap-[7px] px-[10px] text-[14px]'
              : 'h-[72px] w-[156px] gap-[7px] text-[16px]'
          } ${
            isWireframeLayout
              ? `${
                  isBusiness
                    ? 'left-[-188px] top-[178px] [@media(min-width:768px)_and_(max-width:1366px)]:left-[-170px] [@media(min-width:768px)_and_(max-width:1366px)]:top-[178px]'
                    : 'left-[-188px] top-[178px] [@media(min-width:768px)_and_(max-width:1366px)]:left-[-170px] [@media(min-width:768px)_and_(max-width:1366px)]:top-[178px]'
                } ${isBusiness ? 'bg-[#4a4f54] text-[#efb804]' : 'bg-[#efb804] text-[#2a2e33]'}`
              : `left-[-188px] top-[166px] text-[#efb804] ${isBusiness ? 'bg-[#4a4f54]' : 'bg-[#eceeef]'}`
          }`}
        >
          {positiveMetricDeltas.map(({metric, difference}, index) => {
            const deltaLabel = metricDeltaLabel(metric, isBusiness)

            return (
              <span key={metric.key} className="flex items-center gap-[7px] whitespace-nowrap">
                {deltaIconUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={deltaIconUrl}
                    alt={index === 0 ? deltaIconAlt : ''}
                    className={`h-[14px] w-[14px] object-contain ${
                      isBusiness
                        ? '[filter:brightness(0)_saturate(100%)_invert(69%)_sepia(96%)_saturate(1050%)_hue-rotate(359deg)_brightness(101%)_contrast(95%)]'
                        : ''
                    }`}
                    aria-hidden={index > 0 ? 'true' : undefined}
                  />
                ) : (
                  <ArrowUp className="h-[14px] w-[14px] fill-current" strokeWidth={3} aria-hidden="true" />
                )}
                <span>
                  +{formatCalculatedMetric(metric, difference)}
                  {deltaLabel ? ` ${deltaLabel}` : ''}
                </span>
              </span>
            )
          })}
        </span>
      ) : null}

      <div className={resultClassName}>
        {result.metrics.map((metric, index) => {
          const isPeakReduction = isPeakMetric(metric)
          const metricGapClassName =
            isBusiness
              ? isPeakReduction
                ? 'gap-[8px]'
                : 'gap-[11px]'
              : isPeakReduction
                ? 'gap-[10px]'
                : 'gap-[14px]'
          const metricValueClassName = isBusiness
            ? isPeakReduction
              ? 'text-[30px]'
              : 'text-[30px]'
            : 'text-[32px]'
          const metricLabelClassName = isBusiness
            ? 'text-[22px]'
            : isPeakReduction
              ? 'text-[15px] max-[1600px]:text-[16px] [@media(max-height:920px)]:text-[16px]'
              : 'text-[20px] max-[1600px]:text-[22px] [@media(max-height:920px)]:text-[22px]'
          const metricTitle = isBusiness && isPeakReduction ? 'REDUKTION' : metric.title

          return (
            <p
              key={metric.key}
              className={`${index > 0 ? isBusiness ? 'mt-[4px] ' : 'mt-[6px] ' : ''}flex items-baseline whitespace-nowrap uppercase ${metricGapClassName}`}
            >
              <strong className={`shrink-0 whitespace-nowrap font-bold leading-none ${metricValueClassName}`}>
                {formatCalculatedMetric(metric)}
              </strong>
              <span
                className={`shrink-0 whitespace-nowrap font-medium tracking-[0.025em] ${metricLabelClassName}`}
              >
                {metricTitle}
              </span>
            </p>
          )
        })}
      </div>

      <div
        className={`flex min-h-[60px] items-start gap-[8px] border-t-2 pt-[20px] font-sans text-[18px] leading-[1.35] tracking-normal ${
          isWireframeLayout ? isBusiness ? 'mt-[36px]' : 'mt-0' : 'mt-[18px]'
        } ${
          isBusiness ? 'border-white' : 'border-[#2a2e33]'
        }`}
      >
        <span className="shrink-0 font-normal uppercase">Enthalten:</span>
        {includedItemDisplays.length > 0 ? (
          <ul className="space-y-px font-normal" aria-label="Enthaltene Leistungen">
            {includedItemDisplays.map((item) => (
              <li key={item.id}>
                {item.amount ? (
                  <strong className="font-bold">{item.amount} </strong>
                ) : null}
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
  if (!result) {
    return undefined
  }

  const selectedMetricTypes = new Set(
    result.metrics.map((metric) => normalizeCmsKey(metric.metricType || '')),
  )
  const hasSavingsMetric = result.metrics.some((metric) => {
    const identity = normalizeCmsKey(`${metric.key} ${metric.title}`)
    const unit = normalizeCmsKey(metric.unit || '')

    return identity.includes('ersparnis') || unit === '€' || unit === 'eur'
  })
  const calculationResult: ConsultationCalculationResult = {
    autarkyPercent: selectedMetricTypes.has('autarkiegrad')
      ? result.autarkyPercent
      : undefined,
    annualSavingsEur: hasSavingsMetric ? result.annualSavingsEur : undefined,
    peakLoadReductionKw: selectedMetricTypes.has('lastspitzen')
      ? result.peakLoadReductionKw
      : undefined,
    pvSizeKwp: result.pvSizeKwp,
    storageSizeKwh: result.storageSizeKwh,
    chargingStations: result.chargingStations,
  }

  return Object.values(calculationResult).some((value) => value !== undefined)
    ? calculationResult
    : undefined
}

export function ScenarioMatrixScreen({
  customerType,
  headline,
  calculatorTabLabel,
  bundleTabLabel,
  calculateButtonLabel,
  sliders,
  metrics,
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
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<CalculatorTab>('needs')
  const [activeBundleId, setActiveBundleId] = useState(bundles[0]?.id || '')
  const [values, setValues] = useState<Record<string, number>>(() =>
    Object.fromEntries(sliders.map((slider) => [slider.key, slider.defaultValue])),
  )
  const [calculatedBundles, setCalculatedBundles] = useState<CalculatedBundle[]>([])
  const [calculationIsCurrent, setCalculationIsCurrent] = useState(false)
  const isBusiness = customerType === 'b2b'
  const isCalculation = activeTab === 'calculation'
  const pageLogoUrl = isBusiness ? inverseLogoUrl || logoUrl : logoUrl || inverseLogoUrl
  const navigationLogoUrl = isBusiness ? logoUrl || inverseLogoUrl : inverseLogoUrl || logoUrl
  const productNavigationHrefs = useMemo(() => {
    if (customerType !== 'b2c') {
      return []
    }

    const hrefs = new Set<string>([`/needs?type=${customerType}`])

    for (const item of bottomNavigation) {
      const href = bottomNavigationHref(item, customerType)

      if (href && !href.includes('/scenario-matrix')) {
        hrefs.add(href)
      }
    }

    return [...hrefs]
  }, [bottomNavigation, customerType])
  const visibleSliders = useMemo(() => getVisibleSliders(sliders, customerType), [customerType, sliders])
  const visibleBundles = useMemo(() => bundles.slice(0, 3), [bundles])
  const calculationParameters = useMemo(() => buildCalculationParameters(parameters), [parameters])
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

  useEffect(() => {
    for (const href of productNavigationHrefs) {
      router.prefetch(href)
    }
  }, [productNavigationHrefs, router])

  function handleSliderChange(key: string, value: number) {
    setValues((current) => ({...current, [key]: value}))
    setCalculationIsCurrent(false)
  }

  function handleCalculate() {
    const calculatorValues = buildCalculatorValues(sliders, values)
    const nextCalculatedBundles = visibleBundles.map((bundle) =>
      calculateBundle(bundle, calculatorValues, calculationParameters, metrics),
    )

    setCalculatedBundles(nextCalculatedBundles)
    setCalculationIsCurrent(true)
    setActiveBundleId((current) =>
      visibleBundles.some((bundle) => bundle.id === current)
        ? current
        : visibleBundles[0]?.id || '',
    )
    setActiveTab('calculation')
  }

  return (
    <PresentationViewport backgroundClassName={isBusiness ? 'bg-[#2a2e33]' : 'bg-[#f5f5f7]'}>
      <main
        className={`relative isolate h-full w-full overflow-hidden font-sans ${
          isBusiness ? 'bg-[#2a2e33] text-white' : 'bg-[#f5f5f7] text-[#2a2e33]'
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
            className={`absolute left-[60px] top-[220px] z-[3] ${matrixContentShiftClassName} font-sans text-[54px] font-bold uppercase leading-[0.92] tracking-[0.006em] ${
              isBusiness ? 'text-white' : 'text-[#2a2e33]'
            }`}
          >
            {headline}
          </h1>
        ) : null}

        <div className={`absolute left-[60px] top-[320px] z-[5] flex items-start gap-[16px] ${matrixContentShiftClassName}`} role="tablist" aria-label={headline || undefined}>
          {([
            {key: 'needs' as const, label: calculatorTabLabel},
            {key: 'calculation' as const, label: bundleTabLabel},
          ]).map((tab) => {
            const isActive = activeTab === tab.key
            const isDisabled = tab.key === 'calculation' && !calculationIsCurrent

            return (
              <button
                key={tab.key}
                type="button"
                role="tab"
                aria-selected={isActive}
                disabled={isDisabled}
                className={`relative px-[12px] pb-[10px] text-[16px] font-semibold uppercase tracking-[0.02em] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#efb804] disabled:cursor-not-allowed disabled:opacity-55 max-[1600px]:text-[18px] [@media(max-height:920px)]:text-[18px] ${
                  isActive ? 'text-[#efb804]' : isBusiness ? 'text-white' : 'text-[#2a2e33]'
                }`}
                onClick={() => {
                  if (!isDisabled) {
                    setActiveTab(tab.key)
                  }
                }}
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
                    className={`pointer-events-none absolute z-0 object-contain object-right-bottom ${
                      isBusiness
                        ? 'bottom-[-142px] right-[-130px] h-[840px] w-[1100px]'
                        : 'bottom-[-84px] right-[-84px] h-[830px] w-[1090px] opacity-68 contrast-[1.45] brightness-[0.86]'
                    }`}
                />
              ) : null}

              <div
                className={`absolute left-[72px] z-[4] space-y-[28px] ${
                  isBusiness
                    ? 'top-[404px]'
                    : 'top-[400px] [@media(min-width:768px)_and_(max-width:1366px)]:top-[415px]'
                } ${matrixContentShiftClassName}`}
              >
                {visibleSliders.map((slider) => (
                  <SliderControl
                    key={slider.id}
                    slider={slider}
                    value={values[slider.key] ?? slider.defaultValue}
                    onChange={(value) => handleSliderChange(slider.key, value)}
                    isBusiness={isBusiness}
                    compact
                  />
                ))}

                {calculateButtonLabel ? (
                  <button
                    type="button"
                    className="group inline-flex h-[36px] min-w-[228px] items-center justify-between rounded-full bg-[#efb804] px-[25px] text-[16px] font-semibold uppercase leading-none tracking-[0.025em] text-[#2a2e33] transition-transform hover:-translate-y-px focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#efb804] max-[1600px]:h-[38px] max-[1600px]:min-w-[244px] max-[1600px]:text-[18px] [@media(max-height:920px)]:h-[38px] [@media(max-height:920px)]:min-w-[244px] [@media(max-height:920px)]:text-[18px]"
                    onClick={handleCalculate}
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
              className={`absolute left-[60px] top-[400px] z-[3] h-[515px] w-[1320px] max-[1600px]:top-[392px] [@media(max-height:920px)]:top-[392px] ${matrixContentShiftClassName}`}
              initial={{opacity: 0, x: 10}}
              animate={{opacity: 1, x: 0}}
              exit={{opacity: 0, x: 10}}
              transition={{duration: 0.34, ease: [0.22, 1, 0.36, 1]}}
              aria-label={bundleTabLabel}
            >
              {visibleBundles.length > 0 ? (
                <div
                  className="flex h-full items-start gap-[188px] max-[1600px]:gap-[175px] [@media(max-height:920px)]:gap-[175px]"
                >
                  {visibleBundles.map((bundle, index) => (
                    <BundleCard
                      key={bundle.id}
                      bundle={bundle}
                      imageUrl={bundle.imageUrl || bundleImageUrl}
                      imageAlt={bundle.imageAlt || bundleImageAlt}
                      deltaIconUrl={heroImage2Url}
                      deltaIconAlt={heroImage2Alt}
                      result={calculatedBundles[index]}
                      previousResult={index > 0 ? calculatedBundles[index - 1] : undefined}
                      active={bundle.id === activeBundleId}
                      onSelect={() => setActiveBundleId(bundle.id)}
                      isBusiness={isBusiness}
                      isWireframeLayout
                    />
                  ))}
                </div>
              ) : null}
            </motion.section>
          )}
        </AnimatePresence>

        {isCalculation && calculationCtaLabel ? (
          <div className="absolute bottom-[58px] left-[72px] right-[72px] z-[8] flex items-end justify-between max-[1600px]:bottom-[26px] max-[1600px]:left-[60px] max-[1600px]:right-[60px] [@media(max-height:920px)]:bottom-[26px] [@media(max-height:920px)]:left-[60px] [@media(max-height:920px)]:right-[60px] [@media(min-width:768px)_and_(max-width:1366px)]:bottom-[52px] [@media(min-width:768px)_and_(max-width:1366px)]:left-[72px] [@media(min-width:768px)_and_(max-width:1366px)]:right-[72px]">
            <Link
              href={`/needs?type=${customerType}`}
              className="group w-[332px] text-left font-sans text-[22px] font-bold uppercase leading-none tracking-[0.02em] text-[#efb804] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-6 focus-visible:outline-[#efb804]"
            >
              <span className="flex items-center justify-between pb-[20px]">
                <ArrowLeft className="h-[16px] w-[22px] transition-transform group-hover:-translate-x-1" strokeWidth={2.8} aria-hidden="true" />
                <span>Was passt zu Ihnen</span>
              </span>
              <span className="block h-px w-full bg-[#efb804]" aria-hidden="true" />
            </Link>
            <div className="w-[262px]">
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
                className="group flex items-center justify-between pb-[20px] font-sans text-[22px] font-bold uppercase leading-none tracking-[0.02em] text-[#efb804] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-6 focus-visible:outline-[#efb804]"
              >
                <span>{calculationCtaLabel}</span>
                <ArrowRight className="h-[16px] w-[22px] transition-transform group-hover:translate-x-1" strokeWidth={2.8} aria-hidden="true" />
              </Link>
              <span className="block h-px w-full bg-[#efb804]" aria-hidden="true" />
            </div>
          </div>
        ) : null}

        {bottomNavigation.length > 0 && !isCalculation ? (
          <nav
            className="absolute bottom-[36px] left-[60px] z-[8] isolate flex h-[48px] w-max items-center bg-transparent"
            aria-label="Produktnavigation"
          >
            <span
              className="pointer-events-none absolute inset-0 z-0 bg-[#464b50]"
              aria-hidden="true"
            />
            <Link
              href={`/needs?type=${customerType}`}
              scroll={false}
              className="absolute -left-[20px] z-[2] grid h-[92px] w-[26px] place-items-center text-[#efb804] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#efb804]"
              aria-label="Zum Katalog"
            >
              {productNavigationLeftArrowUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={productNavigationLeftArrowUrl} alt="" className="h-[92px] w-[26px] object-contain" aria-hidden="true" />
              ) : (
                <ArrowLeft className="h-[28px] w-[28px]" strokeWidth={2.8} aria-hidden="true" />
              )}
            </Link>

            <div className={`relative z-[1] flex w-auto items-center justify-start gap-[40px] ${isBusiness ? 'pl-[10px] pr-[36px]' : 'pl-[10px] pr-[42px]'}`}>
              {bottomNavigation.map((item) => {
                const href = bottomNavigationHref(item, customerType)
                const isMatrix = item.kind === 'screen' && Boolean(item.href?.includes('scenario-matrix'))
                const isCatalog = item.kind === 'catalog'
                const slotClassName = getB2cBottomNavigationSlotClassName(item)
                const catalogIconUrl = productNavigationCatalogIconUrl || item.iconUrl
                const className = `inline-flex items-center justify-center rounded-full whitespace-nowrap text-[16px] font-semibold uppercase tracking-[0.02em] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#efb804] ${
                  isMatrix && !isCatalog ? 'bg-[#efb804] text-[#2a2e33]' : 'text-white'
                  } ${
                  isCatalog
                    ? catalogIconUrl
                      ? 'h-[26px] w-[66px] p-0 leading-none'
                      : 'h-[26px] min-w-[66px] rounded-full bg-white px-[12px] text-[#2a2e33]'
                    : isMatrix && !isCatalog
                      ? 'h-[32px] px-[26px]'
                      : 'h-[26px] px-[12px]'
                }`
                const content = isCatalog ? (
                  catalogIconUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={catalogIconUrl} alt={item.label} className="block h-[26px] w-[66px] shrink-0 object-contain" />
                  ) : (
                    <><ListFilter className="h-[17px] w-[17px] text-[#2a2e33]" strokeWidth={2.2} aria-hidden="true" /><span className="sr-only">{item.label}</span></>
                  )
                ) : item.label

                const itemElement = href && !isMatrix ? (
                  isBusiness ? (
                    <Link key={item.key} href={href} scroll={false} className={className}>{content}</Link>
                  ) : (
                    <button
                      key={item.key}
                      type="button"
                      className={className}
                      onClick={() => router.push(href, {scroll: false})}
                    >
                      {content}
                    </button>
                  )
                ) : (
                  <span key={item.key} className={className} aria-current={isMatrix ? 'page' : undefined}>{content}</span>
                )

                return isBusiness ? itemElement : (
                  <span key={`${item.key}-slot`} className={`flex h-[48px] shrink-0 items-center justify-center ${slotClassName}`}>
                    {itemElement}
                  </span>
                )
              })}
            </div>

            <span className="absolute -right-[20px] z-[2] grid h-[92px] w-[26px] place-items-center text-[#efb804]" aria-hidden="true">
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
