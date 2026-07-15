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
import {ArrowLeft, ArrowRight, ListFilter} from 'lucide-react'
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

function parameterMap(parameters: ScenarioMatrixParameter[]) {
  return new Map(parameters.map((parameter) => [normalizeKey(parameter.key), parameter.value]))
}

function findParameter(parameters: Map<string, number>, terms: string[]) {
  for (const [key, value] of parameters) {
    if (terms.some((term) => key.includes(term))) {
      return value
    }
  }

  return undefined
}

function calculateMetric(
  metric: ScenarioMatrixMetric,
  sliders: ScenarioMatrixSlider[],
  values: Record<string, number>,
  parameters: ScenarioMatrixParameter[],
) {
  const metricType = normalizeKey(metric.metricType || metric.key)
  const annualConsumption = findSliderValue(sliders, values, ['annual', 'jahresverbrauch'])
  const storage = findSliderValue(sliders, values, ['speicher', 'storage'])
  const chargingStations = findSliderValue(sliders, values, ['ladestation', 'charging'])

  if (metricType.includes('jahresverbrauch')) return annualConsumption
  if (metricType.includes('speicher')) return storage
  if (metricType.includes('ladestation')) return chargingStations

  const mappedParameters = parameterMap(parameters)
  const pvSize = findParameter(mappedParameters, ['pvleistung', 'pvsize', 'kwp'])
  const yieldPerKwp = findParameter(mappedParameters, ['ertragprokwp', 'yieldperkwp', 'spezifischertrag'])
  const annualYield = pvSize !== undefined && yieldPerKwp !== undefined ? pvSize * yieldPerKwp : undefined

  if (metricType.includes('jahresertrag')) return annualYield

  const baseAutarky = findParameter(mappedParameters, ['basisautarkie', 'baseautarky'])
  const storageAutarky = findParameter(mappedParameters, ['speicherautarkie', 'storageautarky'])
  const chargerPenalty = findParameter(mappedParameters, ['ladeverlust', 'chargerpenalty'])
  const autarky =
    baseAutarky !== undefined && storage !== undefined
      ? Math.min(100, Math.max(0, baseAutarky + storage * (storageAutarky || 0) - (chargingStations || 0) * (chargerPenalty || 0)))
      : undefined

  if (metricType.includes('autarkie')) return autarky
  if (metricType.includes('eigenverbrauch')) {
    return annualConsumption !== undefined && autarky !== undefined
      ? annualConsumption * (autarky / 100)
      : undefined
  }

  const baseInvestment = findParameter(mappedParameters, ['basisinvestition', 'baseinvestment'])
  const pvCost = findParameter(mappedParameters, ['kostenprokwp', 'pvcost'])
  const storageCost = findParameter(mappedParameters, ['speicherkosten', 'storagecost'])
  const chargerCost = findParameter(mappedParameters, ['ladestationskosten', 'chargercost'])

  if (metricType.includes('investition')) {
    if (baseInvestment === undefined) return undefined

    return (
      baseInvestment +
      (pvSize || 0) * (pvCost || 0) +
      (storage || 0) * (storageCost || 0) +
      (chargingStations || 0) * (chargerCost || 0)
    )
  }

  const co2Factor = findParameter(mappedParameters, ['co2faktor', 'co2factor'])
  if (metricType.includes('co2')) {
    return annualYield !== undefined && co2Factor !== undefined
      ? annualYield * co2Factor
      : undefined
  }

  return undefined
}

function formatNumber(value: number, unit?: string) {
  const maximumFractionDigits = Number.isInteger(value) ? 0 : 1
  const formatted = new Intl.NumberFormat('de-AT', {maximumFractionDigits}).format(value)

  return unit ? `${formatted} ${unit}` : formatted
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
  active,
  onSelect,
}: {
  bundle: ScenarioMatrixBundle
  active: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      className={`relative h-[490px] w-[350px] overflow-hidden rounded-[22px] border-2 p-[28px] text-left transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-5 focus-visible:outline-[#efb804] ${
        active
          ? 'border-[#efb804] bg-[#efb804] text-[#3d4248]'
          : 'border-white/35 bg-[#454a4f] text-white'
      }`}
      aria-pressed={active}
      onClick={onSelect}
    >
      {bundle.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={bundle.imageUrl}
          alt=""
          className="absolute inset-x-0 top-0 h-[185px] w-full object-cover"
          aria-hidden="true"
        />
      ) : null}
      <div className={bundle.imageUrl ? 'pt-[178px]' : ''}>
        <h2 className="text-[22px] font-bold uppercase leading-[1.05]">{bundle.title}</h2>
        {bundle.shortDescription ? (
          <p className="mt-[18px] text-[18px] leading-[1.42]">{bundle.shortDescription}</p>
        ) : null}
        {bundle.features.length > 0 ? (
          <ul className="mt-[22px] space-y-[8px] text-[18px] font-semibold uppercase leading-[1.35]" role="list">
            {bundle.features.map((feature) => <li key={feature}>{feature}</li>)}
          </ul>
        ) : null}
        {bundle.values.length > 0 ? (
          <dl className="mt-[24px] space-y-[9px] text-[16px]">
            {bundle.values.map((item) => (
              <div key={item.key} className="flex items-baseline justify-between gap-[18px] border-b border-current/25 pb-[6px]">
                <dt>{item.title}</dt>
                <dd className="font-bold">{item.value}{item.unit ? ` ${item.unit}` : ''}</dd>
              </div>
            ))}
          </dl>
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
  const pageLogoUrl = inverseLogoUrl || logoUrl
  const navigationLogoUrl = logoUrl || inverseLogoUrl
  const calculatedMetrics = useMemo(
    () => metrics.flatMap((metric) => {
      const value = calculateMetric(metric, sliders, values, parameters)
      return value === undefined ? [] : [{metric, value}]
    }),
    [metrics, parameters, sliders, values],
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
                    onClick={() => setActiveTab('calculation')}
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

              {calculatedMetrics.length > 0 ? (
                <dl className="absolute right-[72px] top-[370px] z-[4] w-[310px] space-y-[18px]">
                  {calculatedMetrics.map(({metric, value}) => (
                    <div key={metric.key} className="border-b border-white/70 pb-[12px]">
                      <dt className="text-[14px] font-semibold uppercase tracking-[0.04em] text-white/80">{metric.title}</dt>
                      <dd className="mt-[4px] text-[24px] font-bold text-[#efb804]">{formatNumber(value, metric.unit)}</dd>
                    </div>
                  ))}
                </dl>
              ) : null}
            </motion.section>
          ) : (
            <motion.section
              key="calculation"
              className="absolute left-[60px] right-[60px] top-[390px] z-[3]"
              initial={{opacity: 0, x: 10}}
              animate={{opacity: 1, x: 0}}
              exit={{opacity: 0, x: 10}}
              transition={{duration: 0.34, ease: [0.22, 1, 0.36, 1]}}
              aria-label={bundleTabLabel}
            >
              {bundles.length > 0 ? (
                <div className="flex items-start justify-center gap-[34px]">
                  {bundles.slice(0, 3).map((bundle) => (
                    <BundleCard
                      key={bundle.id}
                      bundle={bundle}
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
