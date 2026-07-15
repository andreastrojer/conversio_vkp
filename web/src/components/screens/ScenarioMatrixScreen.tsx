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
  'pointer-events-none absolute bottom-[-215px] right-[-240px] z-0 h-[850px] w-[850px] bg-contain bg-center bg-no-repeat opacity-[0.065] [filter:brightness(0)_invert(1)]'

function normalizeKey(value?: string) {
  return (value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]/g, '')
    .toLowerCase()
}

function findSliderValue(
  sliders: ScenarioMatrixSlider[],
  values: Record<string, number>,
  terms: string[],
) {
  const slider = sliders.find((item) => {
    const key = normalizeKey(item.key)
    return terms.some((term) => key.includes(term))
  })

  return slider ? values[slider.key] : undefined
}

function formatNumber(value: number, unit?: string) {
  const maximumFractionDigits = Number.isInteger(value) ? 0 : 1
  const formatted = new Intl.NumberFormat('de-AT', {maximumFractionDigits}).format(value)

  return unit ? `${formatted} ${unit}` : formatted
}

type CalculatedBundle = {
  autarky?: number
  savings?: number
  autarkyMetric?: ScenarioMatrixMetric
  savingsMetric?: ScenarioMatrixMetric
}

function findExactParameter(parameters: ScenarioMatrixParameter[], key: string) {
  return parameters.find((parameter) => parameter.key === key)?.value
}

function calculateBundle(
  bundle: ScenarioMatrixBundle,
  sliders: ScenarioMatrixSlider[],
  values: Record<string, number>,
  parameters: ScenarioMatrixParameter[],
  metrics: ScenarioMatrixMetric[],
): CalculatedBundle {
  const annualConsumption = findSliderValue(sliders, values, ['annual', 'jahresverbrauch'])
  const storageSize = findSliderValue(sliders, values, ['speicher', 'storage'])
  const chargingStations = findSliderValue(sliders, values, ['ladestation', 'charging'])
  const autarkyMetric = metrics.find(
    (metric) => normalizeKey(metric.metricType) === 'autarkiegrad' || normalizeKey(metric.key) === 'autarkie',
  )
  const savingsMetric = metrics.find((metric) => {
    const identity = normalizeKey(`${metric.key} ${metric.metricType || ''} ${metric.title}`)
    return identity.includes('ersparnis') || identity.includes('einspar') || identity.includes('savings')
  })
  const referenceAnnualConsumption = findExactParameter(parameters, 'referenceAnnualConsumption')
  const referenceStorageSize = findExactParameter(parameters, 'referenceStorageSize')
  const referenceChargingStations = findExactParameter(parameters, 'referenceChargingStations')
  const baseAutarky = findExactParameter(parameters, 'baseAutarky')
  const storageAutarkyBonusPerKwh = findExactParameter(parameters, 'storageAutarkyBonusPerKwh')
  const chargingAutarkyBonus = findExactParameter(parameters, 'chargingAutarkyBonus')
  const baseAnnualSavings = findExactParameter(parameters, 'baseAnnualSavings')
  const storageSavingsPerKwh = findExactParameter(parameters, 'storageSavingsPerKwh')
  const chargingAnnualSavings = findExactParameter(parameters, 'chargingAnnualSavings')
  const requiredValues = [
    annualConsumption,
    storageSize,
    chargingStations,
    referenceAnnualConsumption,
    referenceStorageSize,
    referenceChargingStations,
    baseAutarky,
    storageAutarkyBonusPerKwh,
    chargingAutarkyBonus,
    baseAnnualSavings,
    storageSavingsPerKwh,
    chargingAnnualSavings,
  ]

  if (
    requiredValues.some((value) => typeof value !== 'number' || !Number.isFinite(value)) ||
    !referenceAnnualConsumption ||
    !referenceStorageSize ||
    !referenceChargingStations
  ) {
    return {autarkyMetric, savingsMetric}
  }

  const scenarioType = normalizeKey(bundle.scenarioType)
  const includesStorage = scenarioType === 'b2cpvspeicher' || scenarioType === 'b2ckomplett'
  const includesCharging = scenarioType === 'b2ckomplett'
  const storageRatio = storageSize! / referenceStorageSize
  const chargingRatio = chargingStations! / referenceChargingStations
  const autarkyAtReference =
    baseAutarky! +
    (includesStorage ? referenceStorageSize * storageAutarkyBonusPerKwh! * storageRatio : 0) +
    (includesCharging ? chargingAutarkyBonus! * chargingRatio : 0)
  const autarky = Math.min(
    100,
    Math.max(0, autarkyAtReference * (referenceAnnualConsumption / annualConsumption!)),
  )
  const savingsAtReference =
    baseAnnualSavings! +
    (includesStorage ? referenceStorageSize * storageSavingsPerKwh! * storageRatio : 0) +
    (includesCharging ? chargingAnnualSavings! * chargingRatio : 0)
  const savings = Math.max(0, savingsAtReference * (annualConsumption! / referenceAnnualConsumption))

  return {
    autarky,
    savings,
    autarkyMetric,
    savingsMetric,
  }
}

function formatMetricValue(value: number, metric: ScenarioMatrixMetric) {
  const formatted = new Intl.NumberFormat('de-AT', {maximumFractionDigits: 0}).format(Math.round(value))

  return metric.unit ? `${formatted}${metric.unit}` : formatted
}

function SliderControl({
  slider,
  value,
  onChange,
}: {
  slider: ScenarioMatrixSlider
  value: number
  onChange: (value: number) => void
}) {
  const percentage = ((value - slider.min) / (slider.max - slider.min)) * 100

  return (
    <div className="w-[660px]">
      <div className="mb-[18px] flex items-center justify-between gap-[24px]">
        <label
          htmlFor={`scenario-slider-${slider.id}`}
          className="text-[20px] font-semibold uppercase leading-none tracking-[0.025em] text-white"
        >
          {slider.label}
        </label>
        <output
          htmlFor={`scenario-slider-${slider.id}`}
          className="inline-flex h-[26px] min-w-[38px] items-center justify-center rounded-full bg-[#efb804] px-[12px] text-[14px] font-semibold uppercase leading-none text-[#3d4248]"
        >
          {formatNumber(value, slider.unit)}
        </output>
      </div>

      <div className="group relative h-[26px]">
        <span className="absolute left-0 right-0 top-1/2 h-[3px] -translate-y-1/2 bg-white/80" aria-hidden="true" />
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
  result,
  previousResult,
  active,
  onSelect,
}: {
  bundle: ScenarioMatrixBundle
  imageUrl?: string
  imageAlt: string
  result: CalculatedBundle
  previousResult?: CalculatedBundle
  active: boolean
  onSelect: () => void
}) {
  const autarkyDelta =
    result.autarky !== undefined && previousResult?.autarky !== undefined
      ? Math.round(result.autarky - previousResult.autarky)
      : undefined
  const savingsDelta =
    result.savings !== undefined && previousResult?.savings !== undefined
      ? Math.round(result.savings - previousResult.savings)
      : undefined

  return (
    <button
      type="button"
      className="group relative h-[452px] w-[315px] text-left text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-5 focus-visible:outline-[#efb804]"
      aria-pressed={active}
      onClick={onSelect}
    >
      <span
        className={`inline-flex h-[38px] min-w-[205px] items-center justify-center px-[24px] text-[18px] font-bold uppercase leading-none transition-colors duration-200 ${
          active ? 'bg-[#efb804] text-[#3d4248]' : 'bg-[#4a4f54] text-white'
        }`}
      >
        {bundle.title}
      </span>

      {imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imageUrl}
          alt={imageAlt}
          className="mt-[34px] h-[190px] w-[315px] object-contain object-center transition-transform duration-300 group-hover:scale-[1.015]"
        />
      ) : null}

      {(autarkyDelta !== undefined || savingsDelta !== undefined) ? (
        <span className="absolute left-[-188px] top-[194px] z-[3] flex h-[72px] w-[156px] flex-col items-center justify-center gap-[5px] bg-[#4a4f54] text-[15px] font-semibold uppercase leading-none text-[#efb804]">
          {autarkyDelta !== undefined && result.autarkyMetric ? (
            <span className="flex items-center gap-[7px]">
              <ArrowUp className="h-[14px] w-[14px] fill-current" strokeWidth={3} aria-hidden="true" />
              <span>
                {autarkyDelta >= 0 ? '+' : ''}{formatMetricValue(autarkyDelta, result.autarkyMetric)}{' '}
                {result.autarkyMetric.title}
              </span>
            </span>
          ) : null}
          {savingsDelta !== undefined && result.savingsMetric ? (
            <span className="flex items-center gap-[7px]">
              <ArrowUp className="h-[14px] w-[14px] fill-current" strokeWidth={3} aria-hidden="true" />
              <span>{savingsDelta >= 0 ? '+' : ''}{formatMetricValue(savingsDelta, result.savingsMetric)}</span>
            </span>
          ) : null}
        </span>
      ) : null}

      <div className="mt-[30px] text-[#efb804]">
        {result.autarky !== undefined && result.autarkyMetric ? (
          <p className="flex items-baseline gap-[14px] uppercase">
            <strong className="text-[30px] font-bold leading-none">
              {formatMetricValue(result.autarky, result.autarkyMetric)}
            </strong>
            <span className="text-[20px] font-medium tracking-[0.025em]">{result.autarkyMetric.title}</span>
          </p>
        ) : null}
        {result.savings !== undefined && result.savingsMetric ? (
          <p className="mt-[8px] flex items-baseline gap-[14px] uppercase">
            <strong className="text-[30px] font-bold leading-none">
              {formatMetricValue(result.savings, result.savingsMetric)}
            </strong>
            <span className="text-[20px] font-medium tracking-[0.025em]">{result.savingsMetric.title}</span>
          </p>
        ) : null}
      </div>

      <div className="mt-[28px] flex min-h-[72px] items-start gap-[8px] border-t-2 border-white pt-[20px] text-[16px] leading-[1.35]">
        <span className="shrink-0 uppercase">Enthalten:</span>
        {bundle.includedItems.length > 0 ? (
          <ul className="font-semibold" aria-label="Enthaltene Leistungen">
            {bundle.includedItems.map((item) => (
              <li key={item.id}>
                <strong>
                  {item.amount ? `${item.amount} ` : ''}{item.label}
                </strong>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </button>
  )
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
  offerImageUrl,
  offerImageAlt,
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
}: ScenarioMatrixScreenProps) {
  const [activeTab, setActiveTab] = useState<CalculatorTab>('needs')
  const [activeBundleId, setActiveBundleId] = useState(bundles[0]?.id || '')
  const [values, setValues] = useState<Record<string, number>>(() =>
    Object.fromEntries(sliders.map((slider) => [slider.key, slider.defaultValue])),
  )
  const [submittedValues, setSubmittedValues] = useState<Record<string, number>>(() =>
    Object.fromEntries(sliders.map((slider) => [slider.key, slider.defaultValue])),
  )
  const pageLogoUrl = inverseLogoUrl || logoUrl
  const navigationLogoUrl = logoUrl || inverseLogoUrl
  const visibleBundles = useMemo(() => bundles.slice(0, 3), [bundles])
  const calculatedBundles = useMemo(
    () => visibleBundles.map((bundle) => calculateBundle(bundle, sliders, submittedValues, parameters, metrics)),
    [metrics, parameters, sliders, submittedValues, visibleBundles],
  )

  return (
    <PresentationViewport backgroundClassName="bg-[#3d4248]">
      <main className="relative isolate h-full w-full overflow-hidden bg-[#3d4248] font-sans text-white">
        {patternUrl ? (
          <span
            className={patternClassName}
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
          <h1 className="absolute left-[60px] top-[220px] z-[3] text-[50px] font-bold uppercase leading-none tracking-[0.035em]">
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
                className={`relative px-[12px] pb-[10px] text-[16px] font-semibold uppercase tracking-[0.02em] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#efb804] ${
                  isActive ? 'text-[#efb804]' : 'text-white'
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
                  className="pointer-events-none absolute bottom-[-92px] right-[-42px] z-0 h-[840px] w-[1100px] object-contain object-right-bottom"
                />
              ) : null}

              <div className="absolute left-[72px] top-[396px] z-[4] space-y-[42px]">
                {sliders.map((slider) => (
                  <SliderControl
                    key={slider.id}
                    slider={slider}
                    value={values[slider.key] ?? slider.defaultValue}
                    onChange={(value) => setValues((current) => ({...current, [slider.key]: value}))}
                  />
                ))}

                {calculateButtonLabel ? (
                  <button
                    type="button"
                    className="group inline-flex h-[46px] min-w-[258px] items-center justify-between rounded-full bg-[#efb804] px-[28px] text-[16px] font-semibold uppercase tracking-[0.025em] text-[#3d4248] transition-transform hover:-translate-y-px focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#efb804]"
                    onClick={() => {
                      setSubmittedValues({...values})
                      setActiveTab('calculation')
                    }}
                  >
                    <span>{calculateButtonLabel}</span>
                    {navigationArrowUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={navigationArrowUrl} alt="" className="h-[16px] w-[16px] object-contain" aria-hidden="true" />
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
              className="absolute left-[60px] top-[350px] z-[3] h-[500px] w-[1320px]"
              initial={{opacity: 0, x: 10}}
              animate={{opacity: 1, x: 0}}
              exit={{opacity: 0, x: 10}}
              transition={{duration: 0.34, ease: [0.22, 1, 0.36, 1]}}
              aria-label={bundleTabLabel}
            >
              {visibleBundles.length > 0 ? (
                <div className="grid h-full grid-cols-[315px_315px_315px] gap-x-[188px]">
                  {visibleBundles.map((bundle, index) => (
                    <BundleCard
                      key={bundle.id}
                      bundle={bundle}
                      imageUrl={offerImageUrl}
                      imageAlt={offerImageAlt}
                      result={calculatedBundles[index]}
                      previousResult={index > 0 ? calculatedBundles[index - 1] : undefined}
                      active={bundle.id === activeBundleId}
                      onSelect={() => setActiveBundleId(bundle.id)}
                    />
                  ))}
                </div>
              ) : null}
            </motion.section>
          )}
        </AnimatePresence>

        {bottomNavigation.length > 0 ? (
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

            <div className="flex w-auto items-center justify-start gap-[44px] pl-[10px] pr-[12px]">
              {bottomNavigation.map((item) => {
                const href = bottomNavigationHref(item, customerType)
                const isMatrix = item.kind === 'screen' && Boolean(item.href?.includes('scenario-matrix'))
                const isCatalog = item.kind === 'catalog'
                const catalogIconUrl = item.iconUrl || productNavigationCatalogIconUrl
                const className = `inline-flex items-center justify-center whitespace-nowrap text-[14px] font-semibold uppercase tracking-[0.02em] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#efb804] ${
                  isMatrix ? 'text-[#efb804]' : 'text-white'
                } ${
                  isCatalog
                    ? catalogIconUrl
                      ? 'h-[26px] w-[66px] p-0 text-[#3d4248]'
                      : 'h-[26px] min-w-[66px] rounded-full bg-[#efb804] px-[12px] text-[#3d4248]'
                    : 'h-[34px] px-[12px]'
                }`
                const content = isCatalog ? (
                  catalogIconUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={catalogIconUrl} alt={item.label} className="h-[26px] w-[66px] object-contain" />
                  ) : (
                    <><ListFilter className="h-[17px] w-[17px]" strokeWidth={2.2} aria-hidden="true" /><span className="sr-only">{item.label}</span></>
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
