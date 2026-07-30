export type B2cScenarioType = 'b2c_pv' | 'b2c_pv_speicher' | 'b2c_komplett'

export type B2bScenarioType =
  | 'b2b_einstieg'
  | 'b2b_autark_abgesichert'
  | 'b2b_wachstum_mobilitaet'

export type ScenarioType = B2cScenarioType | B2bScenarioType

export type CalculatorValues = {
  annualConsumption: number
  storageSize: number
  chargingStations: number
  peakLoadKw?: number
  expectedGrowthPercent?: number
}

export type CalculationParameters = Partial<{
  pvSizeKwp: number
  specificYieldKwhPerKwp: number
  electricityPriceEurPerKwh: number
  feedInTariffEurPerKwh: number
  evDemandPerChargingStationKwh: number
  smartChargingShiftShare: number
  batteryPowerKw: number
  roundTripEfficiency: number
  batteryRoundTripEfficiency: number
  usableStorageShare: number
  annualOperatingCostEur: number
  backupReserveShare: number
  demandChargeEurPerKwYear: number
  growthDemandShare: number
}> &
  Record<string, number | undefined>

export type ScenarioCalculationResult = {
  totalDemandKwh: number
  householdDemandKwh: number
  evDemandKwh: number
  pvGenerationKwh: number
  directPvConsumptionKwh: number
  batteryChargeKwh: number
  batteryDischargeKwh: number
  storageLossKwh: number
  selfConsumedPvKwh: number
  selfSuppliedLoadKwh: number
  exportedPvKwh: number
  gridImportKwh: number
  autarkyPercent: number
  baselineCostEur: number
  newEnergyCostEur: number
  feedInRevenueEur: number
  annualSavingsEur: number
  peakLoadKw: number
  batteryPeakCoverageKw: number
  remainingGridPeakKw: number
  batteryPowerKw: number
  usableStorageKwh: number
  peakLoadReductionKw: number
  projectedPeakLoadKw: number
  demandChargeSavingsEur: number
  backupReserveKwh: number
  expectedGrowthPercent: number
  isPrognosis: true
  warnings: string[]
}

export type ScenarioResultDifference = {
  autarkyDifference: number
  savingsDifference: number
  peakLoadReductionDifference: number
}

type ResolvedCalculationParameters = {
  pvSizeKwp: number
  specificYieldKwhPerKwp: number
  electricityPriceEurPerKwh: number
  feedInTariffEurPerKwh: number
  evDemandPerChargingStationKwh: number
  smartChargingShiftShare: number
  batteryPowerKw: number
  roundTripEfficiency: number
  usableStorageShare: number
  annualOperatingCostEur: number
}

type ResolvedB2bCalculationParameters = {
  evDemandPerChargingStationKwh: number
  smartChargingShiftShare: number
  batteryPowerKw: number
  roundTripEfficiency: number
  usableStorageShare: number
  annualOperatingCostEur: number
  backupReserveShare: number
  demandChargeEurPerKwYear: number
  growthDemandShare: number
}

type SliderDefinition = {
  key: string
  min: number
  max: number
  step: number
  defaultValue: number
  unit?: string
}

type EnergyProfile = {
  demandKwh: Float64Array
  pvKwh: Float64Array
}

type SimulatedEnergyResult = {
  directPvConsumptionKwh: number
  batteryChargeFromPvKwh: number
  batteryDischargeKwh: number
  selfSuppliedLoadKwh: number
  exportedPvKwh: number
  gridImportKwh: number
  storageLossKwh: number
}

type SimulatedYearResult = SimulatedEnergyResult & {
  endingBatterySocKwh: number
}

const DAYS_PER_YEAR = 365
const INTERVALS_PER_DAY = 96
const PROFILE_INTERVAL_HOURS = 0.25
const PROFILE_INTERVAL_COUNT = DAYS_PER_YEAR * INTERVALS_PER_DAY
const HOURS_PER_YEAR = DAYS_PER_YEAR * 24
const FULL_CIRCLE = Math.PI * 2

const B2C_CENTI_KW_SCALE = 100
const B2C_CENTI_KW_RAW_MIN = 50
const B2C_CENTI_KW_RAW_MAX = 1000
const B2C_PEAK_LOAD_MIN_KW = 0.5
const B2C_HOUSEHOLD_PEAK_ALLOWANCE_KW = 30
const B2C_WALLBOX_POWER_KW = 11
const B2C_MIN_PEAK_TO_AVERAGE_RATIO = 1.05
const FALLBACK_PEAK_TO_AVERAGE_RATIO = 3

export const B2C_CALCULATION_FALLBACKS = {
  pvSizeKwp: 0,
  specificYieldKwhPerKwp: 0,
  electricityPriceEurPerKwh: 0,
  feedInTariffEurPerKwh: 0,
  evDemandPerChargingStationKwh: 0,
  smartChargingShiftShare: 0,
  batteryPowerKw: 5,
  roundTripEfficiency: 0.9,
  usableStorageShare: 0.9,
  annualOperatingCostEur: 0,
} as const satisfies ResolvedCalculationParameters

export const B2B_CALCULATION_FALLBACKS = {
  evDemandPerChargingStationKwh: 0,
  smartChargingShiftShare: 0,
  batteryPowerKw: 0,
  roundTripEfficiency: 0.9,
  usableStorageShare: 0.9,
  annualOperatingCostEur: 0,
  backupReserveShare: 0,
  demandChargeEurPerKwYear: 0,
  growthDemandShare: 0,
} as const satisfies ResolvedB2bCalculationParameters

const parameterAliases: Record<keyof ResolvedCalculationParameters, string[]> = {
  pvSizeKwp: ['pvSizeKwp'],
  specificYieldKwhPerKwp: ['specificYieldKwhPerKwp'],
  electricityPriceEurPerKwh: ['electricityPriceEurPerKwh'],
  feedInTariffEurPerKwh: ['feedInTariffEurPerKwh'],
  evDemandPerChargingStationKwh: ['evDemandPerChargingStationKwh'],
  smartChargingShiftShare: ['smartChargingShiftShare'],
  batteryPowerKw: ['batteryPowerKw'],
  roundTripEfficiency: ['roundTripEfficiency', 'batteryRoundTripEfficiency'],
  usableStorageShare: ['usableStorageShare'],
  annualOperatingCostEur: ['annualOperatingCostEur'],
}

const b2bParameterAliases: Record<keyof ResolvedB2bCalculationParameters, string[]> = {
  evDemandPerChargingStationKwh: ['evDemandPerChargingStationKwh'],
  smartChargingShiftShare: ['smartChargingShiftShare'],
  batteryPowerKw: ['batteryPowerKw'],
  roundTripEfficiency: ['roundTripEfficiency', 'batteryRoundTripEfficiency'],
  usableStorageShare: ['usableStorageShare'],
  annualOperatingCostEur: ['annualOperatingCostEur'],
  backupReserveShare: ['backupReserveShare'],
  demandChargeEurPerKwYear: ['demandChargeEurPerKwYear'],
  growthDemandShare: ['growthDemandShare'],
}

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)

const safeNumber = (value: number | undefined) =>
  typeof value === 'number' && Number.isFinite(value) ? Math.max(0, value) : 0

function normalizeKey(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ß/g, 'ss')
    .toLowerCase()
}

export function isScenarioType(value: string): value is ScenarioType {
  return (
    value === 'b2c_pv' ||
    value === 'b2c_pv_speicher' ||
    value === 'b2c_komplett' ||
    value === 'b2b_einstieg' ||
    value === 'b2b_autark_abgesichert' ||
    value === 'b2b_wachstum_mobilitaet'
  )
}

function isB2bScenarioType(scenarioType: ScenarioType): scenarioType is B2bScenarioType {
  return scenarioType.startsWith('b2b_')
}

function isPeakLoadKey(value: string) {
  const normalizedKey = normalizeKey(value)

  return normalizedKey === 'lastspitze' || normalizedKey === 'peakloadkw'
}

function isCentiKwPeakSlider(slider: SliderDefinition) {
  const normalizedUnit = normalizeKey(slider.unit || '')

  return (
    isPeakLoadKey(slider.key) &&
    normalizedUnit === 'kw' &&
    slider.min >= B2C_CENTI_KW_RAW_MIN &&
    slider.max <= B2C_CENTI_KW_RAW_MAX &&
    slider.step >= 1
  )
}

export function normalizeB2cSliderDefinition<T extends SliderDefinition>(slider: T): T {
  if (!isCentiKwPeakSlider(slider)) {
    return slider
  }

  return {
    ...slider,
    min: slider.min / B2C_CENTI_KW_SCALE,
    max: slider.max / B2C_CENTI_KW_SCALE,
    step: slider.step / B2C_CENTI_KW_SCALE,
    defaultValue: slider.defaultValue / B2C_CENTI_KW_SCALE,
  }
}

function resolveParameter(
  parameters: CalculationParameters,
  key: keyof ResolvedCalculationParameters,
  warnings: string[],
) {
  for (const alias of parameterAliases[key]) {
    const value = parameters[alias]

    if (typeof value === 'number' && Number.isFinite(value)) {
      return Math.max(0, value)
    }
  }

  warnings.push(`CMS-Parameter "${key}" fehlt; Fallback wird verwendet.`)

  return B2C_CALCULATION_FALLBACKS[key]
}

function resolveCalculationParameters(
  parameters: CalculationParameters,
  warnings: string[],
): ResolvedCalculationParameters {
  return {
    pvSizeKwp: resolveParameter(parameters, 'pvSizeKwp', warnings),
    specificYieldKwhPerKwp: resolveParameter(parameters, 'specificYieldKwhPerKwp', warnings),
    electricityPriceEurPerKwh: resolveParameter(parameters, 'electricityPriceEurPerKwh', warnings),
    feedInTariffEurPerKwh: resolveParameter(parameters, 'feedInTariffEurPerKwh', warnings),
    evDemandPerChargingStationKwh: resolveParameter(
      parameters,
      'evDemandPerChargingStationKwh',
      warnings,
    ),
    smartChargingShiftShare: clamp(
      resolveParameter(parameters, 'smartChargingShiftShare', warnings),
      0,
      1,
    ),
    batteryPowerKw: resolveParameter(parameters, 'batteryPowerKw', warnings),
    roundTripEfficiency: clamp(resolveParameter(parameters, 'roundTripEfficiency', warnings), 0, 1),
    usableStorageShare: clamp(resolveParameter(parameters, 'usableStorageShare', warnings), 0, 1),
    annualOperatingCostEur: resolveParameter(parameters, 'annualOperatingCostEur', warnings),
  }
}

function resolveB2bParameter(
  parameters: CalculationParameters,
  key: keyof ResolvedB2bCalculationParameters,
  warnings: string[],
) {
  for (const alias of b2bParameterAliases[key]) {
    const value = parameters[alias]

    if (typeof value === 'number' && Number.isFinite(value)) {
      return Math.max(0, value)
    }
  }

  warnings.push(`CMS-Parameter "${key}" fehlt; B2B-Fallback wird verwendet.`)

  return B2B_CALCULATION_FALLBACKS[key]
}

function resolveB2bCalculationParameters(
  parameters: CalculationParameters,
  warnings: string[],
): ResolvedB2bCalculationParameters {
  return {
    evDemandPerChargingStationKwh: resolveB2bParameter(
      parameters,
      'evDemandPerChargingStationKwh',
      warnings,
    ),
    smartChargingShiftShare: clamp(
      resolveB2bParameter(parameters, 'smartChargingShiftShare', warnings),
      0,
      1,
    ),
    batteryPowerKw: resolveB2bParameter(parameters, 'batteryPowerKw', warnings),
    roundTripEfficiency: clamp(
      resolveB2bParameter(parameters, 'roundTripEfficiency', warnings),
      0,
      1,
    ),
    usableStorageShare: clamp(
      resolveB2bParameter(parameters, 'usableStorageShare', warnings),
      0,
      1,
    ),
    annualOperatingCostEur: resolveB2bParameter(
      parameters,
      'annualOperatingCostEur',
      warnings,
    ),
    backupReserveShare: clamp(
      resolveB2bParameter(parameters, 'backupReserveShare', warnings),
      0,
      1,
    ),
    demandChargeEurPerKwYear: resolveB2bParameter(
      parameters,
      'demandChargeEurPerKwYear',
      warnings,
    ),
    growthDemandShare: resolveB2bParameter(parameters, 'growthDemandShare', warnings),
  }
}

function normalizeShare(value: number) {
  return clamp(value > 1 ? value / 100 : value, 0, 1)
}

function normalizePeakLoadKw({
  rawPeakLoadKw,
  totalDemandKwh,
  chargingStations,
  warnings,
}: {
  rawPeakLoadKw: number | undefined
  totalDemandKwh: number
  chargingStations: number
  warnings: string[]
}) {
  const averageLoadKw = totalDemandKwh > 0 ? totalDemandKwh / HOURS_PER_YEAR : 0
  const fallbackPeakLoadKw = clamp(
    averageLoadKw * FALLBACK_PEAK_TO_AVERAGE_RATIO,
    B2C_PEAK_LOAD_MIN_KW,
    B2C_HOUSEHOLD_PEAK_ALLOWANCE_KW,
  )
  let peakLoadKw =
    typeof rawPeakLoadKw === 'number' && Number.isFinite(rawPeakLoadKw) && rawPeakLoadKw > 0
      ? rawPeakLoadKw
      : fallbackPeakLoadKw

  if (peakLoadKw === fallbackPeakLoadKw && rawPeakLoadKw !== fallbackPeakLoadKw) {
    warnings.push('Lastspitze fehlt oder ist ungueltig; plausibler Fallback wird verwendet.')
  }

  const plausibleMaxPeakLoadKw =
    B2C_HOUSEHOLD_PEAK_ALLOWANCE_KW + chargingStations * B2C_WALLBOX_POWER_KW

  if (
    peakLoadKw > plausibleMaxPeakLoadKw &&
    peakLoadKw >= B2C_CENTI_KW_RAW_MIN &&
    peakLoadKw <= B2C_CENTI_KW_RAW_MAX
  ) {
    peakLoadKw /= B2C_CENTI_KW_SCALE
    warnings.push('Lastspitze wurde als Hundertstel-kW aus dem CMS interpretiert.')
  }

  const minimumPeakLoadForDemandKw = averageLoadKw * B2C_MIN_PEAK_TO_AVERAGE_RATIO

  if (minimumPeakLoadForDemandKw > 0 && peakLoadKw < minimumPeakLoadForDemandKw) {
    peakLoadKw = minimumPeakLoadForDemandKw
    warnings.push('Lastspitze lag unter der Jahresverbrauchs-Plausibilitaet und wurde angehoben.')
  }

  if (peakLoadKw < B2C_PEAK_LOAD_MIN_KW) {
    peakLoadKw = B2C_PEAK_LOAD_MIN_KW
    warnings.push('Lastspitze wurde auf den B2C-Mindestwert begrenzt.')
  }

  if (peakLoadKw > plausibleMaxPeakLoadKw) {
    peakLoadKw = plausibleMaxPeakLoadKw
    warnings.push('Lastspitze wurde auf den plausiblen B2C-Hoechstwert begrenzt.')
  }

  return peakLoadKw
}

function normalizeB2bPeakLoadKw({
  rawPeakLoadKw,
  annualDemandKwh,
  warnings,
}: {
  rawPeakLoadKw: number | undefined
  annualDemandKwh: number
  warnings: string[]
}) {
  if (
    typeof rawPeakLoadKw === 'number' &&
    Number.isFinite(rawPeakLoadKw) &&
    rawPeakLoadKw > 0
  ) {
    return rawPeakLoadKw
  }

  const averageLoadKw = annualDemandKwh > 0 ? annualDemandKwh / HOURS_PER_YEAR : 0
  const fallbackPeakLoadKw = averageLoadKw * FALLBACK_PEAK_TO_AVERAGE_RATIO

  warnings.push('B2B-Lastspitze fehlt oder ist ungueltig; Verbrauchs-Fallback wird verwendet.')

  return fallbackPeakLoadKw
}

function scaleProfileToAnnual(profile: Float64Array, annualKwh: number) {
  if (annualKwh <= 0) {
    profile.fill(0)
    return profile
  }

  const sum = profile.reduce((total, value) => total + value, 0)

  if (sum <= 0) {
    return profile
  }

  const scale = annualKwh / sum

  for (let index = 0; index < profile.length; index += 1) {
    profile[index] *= scale
  }

  return profile
}

function dailyHourDistance(hour: number, center: number) {
  const distance = Math.abs(hour - center)

  return Math.min(distance, 24 - distance)
}

function gaussianByHour(hour: number, center: number, width: number) {
  const distance = dailyHourDistance(hour, center)

  return Math.exp(-(distance * distance) / (2 * width * width))
}

function buildHouseholdProfile(annualConsumptionKwh: number) {
  const profile = new Float64Array(PROFILE_INTERVAL_COUNT)

  for (let day = 0; day < DAYS_PER_YEAR; day += 1) {
    const season = 1 + 0.12 * Math.cos((FULL_CIRCLE * (day - 15)) / DAYS_PER_YEAR)
    const isWeekend = day % 7 === 5 || day % 7 === 6

    for (let interval = 0; interval < INTERVALS_PER_DAY; interval += 1) {
      const hour = (interval + 0.5) * PROFILE_INTERVAL_HOURS
      const morning = gaussianByHour(hour, isWeekend ? 8.8 : 7.1, 1.4)
      const midday = gaussianByHour(hour, 13.2, isWeekend ? 3 : 2.2)
      const evening = gaussianByHour(hour, 19.4, 2.3)
      const nightBase = 0.22
      const shape = nightBase + 0.52 * morning + 0.22 * midday + 0.9 * evening

      profile[day * INTERVALS_PER_DAY + interval] =
        shape * season * PROFILE_INTERVAL_HOURS
    }
  }

  return scaleProfileToAnnual(profile, annualConsumptionKwh)
}

function buildEvProfile({
  annualEvDemandKwh,
  chargingStations,
  smartChargingShiftShare,
}: {
  annualEvDemandKwh: number
  chargingStations: number
  smartChargingShiftShare: number
}) {
  const profile = new Float64Array(PROFILE_INTERVAL_COUNT)

  if (annualEvDemandKwh <= 0 || chargingStations <= 0) {
    return profile
  }

  const eveningShare = 1 - smartChargingShiftShare
  const middayShare = smartChargingShiftShare
  const eveningWidth = 1.7 + Math.min(chargingStations, 6) * 0.12
  const middayWidth = 2.4 + Math.min(chargingStations, 6) * 0.1

  for (let day = 0; day < DAYS_PER_YEAR; day += 1) {
    const isWeekend = day % 7 === 5 || day % 7 === 6
    const weekdayDemandFactor = isWeekend ? 0.72 : 1.11

    for (let interval = 0; interval < INTERVALS_PER_DAY; interval += 1) {
      const hour = (interval + 0.5) * PROFILE_INTERVAL_HOURS
      const evening = gaussianByHour(hour, 20.2, eveningWidth) * eveningShare
      const midday = gaussianByHour(hour, 13.1, middayWidth) * middayShare

      profile[day * INTERVALS_PER_DAY + interval] =
        (evening + midday) * weekdayDemandFactor * PROFILE_INTERVAL_HOURS
    }
  }

  return scaleProfileToAnnual(profile, annualEvDemandKwh)
}

function getProfilePeakKw(profile: Float64Array) {
  let peakLoadKw = 0

  for (const intervalDemandKwh of profile) {
    peakLoadKw = Math.max(peakLoadKw, intervalDemandKwh / PROFILE_INTERVAL_HOURS)
  }

  return peakLoadKw
}

function buildPvProfile(annualPvProductionKwh: number) {
  const profile = new Float64Array(PROFILE_INTERVAL_COUNT)

  for (let day = 0; day < DAYS_PER_YEAR; day += 1) {
    const seasonalAngle = (FULL_CIRCLE * (day - 80)) / DAYS_PER_YEAR
    const dayLengthHours = 12 + 4.2 * Math.sin(seasonalAngle)
    const seasonalYield = clamp(0.48 + 0.52 * Math.sin(seasonalAngle), 0.08, 1)
    const sunrise = 12 - dayLengthHours / 2
    const sunset = 12 + dayLengthHours / 2

    for (let interval = 0; interval < INTERVALS_PER_DAY; interval += 1) {
      const hour = (interval + 0.5) * PROFILE_INTERVAL_HOURS

      if (hour <= sunrise || hour >= sunset) {
        continue
      }

      const sunPosition = (Math.PI * (hour - sunrise)) / dayLengthHours
      const clearSkyShape = Math.sin(sunPosition) ** 1.35

      profile[day * INTERVALS_PER_DAY + interval] =
        clearSkyShape * seasonalYield * PROFILE_INTERVAL_HOURS
    }
  }

  return scaleProfileToAnnual(profile, annualPvProductionKwh)
}

function fitDemandProfileToPeak(
  profile: Float64Array,
  annualDemandKwh: number,
  peakLoadKw: number,
) {
  if (annualDemandKwh <= 0 || peakLoadKw <= 0) {
    return profile
  }

  const averageLoadKw = annualDemandKwh / HOURS_PER_YEAR
  if (peakLoadKw <= averageLoadKw) {
    return scaleProfileToAnnual(profile, annualDemandKwh)
  }

  const getPeakForFactor = (factor: number) => {
    let adjustedEnergyKwh = 0
    let adjustedPeakKw = 0

    for (const intervalDemandKwh of profile) {
      const currentLoadKw = intervalDemandKwh / PROFILE_INTERVAL_HOURS
      const adjustedLoadKw = Math.max(
        0,
        averageLoadKw + (currentLoadKw - averageLoadKw) * factor,
      )

      adjustedEnergyKwh += adjustedLoadKw * PROFILE_INTERVAL_HOURS
      adjustedPeakKw = Math.max(adjustedPeakKw, adjustedLoadKw)
    }

    if (adjustedEnergyKwh <= 0) {
      return 0
    }

    return adjustedPeakKw * (annualDemandKwh / adjustedEnergyKwh)
  }

  let lowerFactor = 0
  let upperFactor = 1

  while (getPeakForFactor(upperFactor) < peakLoadKw && upperFactor < 1024) {
    upperFactor *= 2
  }

  for (let iteration = 0; iteration < 40; iteration += 1) {
    const candidateFactor = (lowerFactor + upperFactor) / 2

    if (getPeakForFactor(candidateFactor) < peakLoadKw) {
      lowerFactor = candidateFactor
    } else {
      upperFactor = candidateFactor
    }
  }

  const factor = (lowerFactor + upperFactor) / 2

  for (let index = 0; index < profile.length; index += 1) {
    const currentLoadKw = profile[index] / PROFILE_INTERVAL_HOURS
    const adjustedLoadKw = Math.max(0, averageLoadKw + (currentLoadKw - averageLoadKw) * factor)

    profile[index] = adjustedLoadKw * PROFILE_INTERVAL_HOURS
  }

  return scaleProfileToAnnual(profile, annualDemandKwh)
}

function buildEnergyProfile({
  householdDemandKwh,
  evDemandKwh,
  pvGenerationKwh,
  chargingStations,
  smartChargingShiftShare,
  peakLoadKw,
}: {
  householdDemandKwh: number
  evDemandKwh: number
  pvGenerationKwh: number
  chargingStations: number
  smartChargingShiftShare: number
  peakLoadKw: number
}): EnergyProfile {
  const householdProfile = buildHouseholdProfile(householdDemandKwh)
  const evProfile = buildEvProfile({
    annualEvDemandKwh: evDemandKwh,
    chargingStations,
    smartChargingShiftShare,
  })
  const demandKwh = new Float64Array(PROFILE_INTERVAL_COUNT)

  for (let index = 0; index < PROFILE_INTERVAL_COUNT; index += 1) {
    demandKwh[index] = householdProfile[index] + evProfile[index]
  }

  return {
    demandKwh: fitDemandProfileToPeak(demandKwh, householdDemandKwh + evDemandKwh, peakLoadKw),
    pvKwh: buildPvProfile(pvGenerationKwh),
  }
}

function simulateEnergyProfile({
  profile,
  usesStorage,
  usableStorageKwh,
  batteryPowerKw,
  roundTripEfficiency,
}: {
  profile: EnergyProfile
  usesStorage: boolean
  usableStorageKwh: number
  batteryPowerKw: number
  roundTripEfficiency: number
}): SimulatedEnergyResult {
  const chargeEfficiency = Math.sqrt(roundTripEfficiency)
  const dischargeEfficiency = Math.sqrt(roundTripEfficiency)
  const maxBatteryEnergyPerIntervalKwh = batteryPowerKw * PROFILE_INTERVAL_HOURS
  const storageIsAvailable =
    usesStorage &&
    usableStorageKwh > 0 &&
    batteryPowerKw > 0 &&
    roundTripEfficiency > 0

  const simulateYear = (startingBatterySocKwh: number): SimulatedYearResult => {
    let batterySocKwh = clamp(startingBatterySocKwh, 0, usableStorageKwh)
    let directPvConsumptionKwh = 0
    let batteryChargeFromPvKwh = 0
    let batteryDischargeKwh = 0
    let chargingLossKwh = 0
    let dischargingLossKwh = 0
    let exportedPvKwh = 0
    let gridImportKwh = 0

    for (let index = 0; index < PROFILE_INTERVAL_COUNT; index += 1) {
      const demandKwh = profile.demandKwh[index]
      const pvKwh = profile.pvKwh[index]
      const directConsumptionKwh = Math.min(demandKwh, pvKwh)
      let remainingDemandKwh = demandKwh - directConsumptionKwh
      let surplusPvKwh = pvKwh - directConsumptionKwh

      directPvConsumptionKwh += directConsumptionKwh

      if (storageIsAvailable) {
        const chargeFromPvKwh = Math.min(
          surplusPvKwh,
          maxBatteryEnergyPerIntervalKwh,
          (usableStorageKwh - batterySocKwh) / chargeEfficiency,
        )
        const storedEnergyKwh = chargeFromPvKwh * chargeEfficiency

        batterySocKwh += storedEnergyKwh
        batteryChargeFromPvKwh += chargeFromPvKwh
        chargingLossKwh += chargeFromPvKwh - storedEnergyKwh
        surplusPvKwh -= chargeFromPvKwh

        const dischargeKwh = Math.min(
          remainingDemandKwh,
          maxBatteryEnergyPerIntervalKwh,
          batterySocKwh * dischargeEfficiency,
        )
        const withdrawnEnergyKwh = dischargeKwh / dischargeEfficiency

        batterySocKwh -= withdrawnEnergyKwh
        batteryDischargeKwh += dischargeKwh
        dischargingLossKwh += withdrawnEnergyKwh - dischargeKwh
        remainingDemandKwh -= dischargeKwh
      }

      exportedPvKwh += Math.max(0, surplusPvKwh)
      gridImportKwh += Math.max(0, remainingDemandKwh)
    }

    return {
      directPvConsumptionKwh,
      batteryChargeFromPvKwh,
      batteryDischargeKwh,
      selfSuppliedLoadKwh: directPvConsumptionKwh + batteryDischargeKwh,
      exportedPvKwh,
      gridImportKwh,
      storageLossKwh: chargingLossKwh + dischargingLossKwh,
      endingBatterySocKwh: batterySocKwh,
    }
  }

  const warmupResult = storageIsAvailable ? simulateYear(0) : null
  const measuredResult = simulateYear(warmupResult?.endingBatterySocKwh ?? 0)

  return measuredResult
}

function roundEnergy(value: number) {
  return Math.round(Math.max(0, value))
}

function roundMoney(value: number) {
  return Math.round(Number.isFinite(value) ? value : 0)
}

function roundPeak(value: number) {
  return Math.round(value * 10) / 10
}

function calculateB2bScenarioResult(
  scenarioType: B2bScenarioType,
  values: CalculatorValues,
  parameters: CalculationParameters,
): ScenarioCalculationResult {
  const warnings: string[] = []
  const resolvedParameters = resolveB2bCalculationParameters(parameters, warnings)
  const annualConsumptionKwh = safeNumber(values.annualConsumption)
  const storageSizeKwh = safeNumber(values.storageSize)
  const chargingStations = Math.round(safeNumber(values.chargingStations))
  const configuredGrowth =
    typeof values.expectedGrowthPercent === 'number' &&
    Number.isFinite(values.expectedGrowthPercent)
      ? Math.max(0, values.expectedGrowthPercent)
      : resolvedParameters.growthDemandShare
  const growthDemandShare = normalizeShare(configuredGrowth)
  const grownBusinessDemandKwh = annualConsumptionKwh * (1 + growthDemandShare)
  const evDemandKwh =
    chargingStations * resolvedParameters.evDemandPerChargingStationKwh
  const totalDemandKwh = grownBusinessDemandKwh + evDemandKwh
  const currentPeakLoadKw = normalizeB2bPeakLoadKw({
    rawPeakLoadKw: values.peakLoadKw,
    annualDemandKwh: annualConsumptionKwh,
    warnings,
  })
  const uncontrolledEvProfile = buildEvProfile({
    annualEvDemandKwh: evDemandKwh,
    chargingStations,
    smartChargingShiftShare: 0,
  })
  const uncontrolledEvPeakKw = getProfilePeakKw(uncontrolledEvProfile)
  const projectedPeakLoadKw =
    currentPeakLoadKw * (1 + growthDemandShare) + uncontrolledEvPeakKw
  const usesStorage =
    scenarioType === 'b2b_autark_abgesichert' ||
    scenarioType === 'b2b_wachstum_mobilitaet'
  const usesSmartCharging = scenarioType === 'b2b_wachstum_mobilitaet'
  const usableStorageKwh = usesStorage
    ? storageSizeKwh * resolvedParameters.usableStorageShare
    : 0
  const backupReserveKwh = usesStorage
    ? usableStorageKwh * resolvedParameters.backupReserveShare
    : 0
  const dispatchableStorageKwh = Math.max(0, usableStorageKwh - backupReserveKwh)
  const dischargeEfficiency = Math.sqrt(resolvedParameters.roundTripEfficiency)
  const availableBatteryDischargeKw =
    dispatchableStorageKwh * dischargeEfficiency / PROFILE_INTERVAL_HOURS
  const optimizedSmartChargingPeakReductionKw =
    usesSmartCharging &&
    chargingStations > 0 &&
    resolvedParameters.smartChargingShiftShare > 0
      ? Math.max(
          0,
          uncontrolledEvPeakKw -
            Math.min(
              ...[
                resolvedParameters.smartChargingShiftShare / 2,
                resolvedParameters.smartChargingShiftShare,
              ].map((smartChargingShiftShare) =>
                getProfilePeakKw(
                  buildEvProfile({
                    annualEvDemandKwh: evDemandKwh,
                    chargingStations,
                    smartChargingShiftShare,
                  }),
                ),
              ),
            ),
        )
      : 0
  const peakAfterSmartChargingKw = Math.max(
    0,
    projectedPeakLoadKw - optimizedSmartChargingPeakReductionKw,
  )
  const batteryPeakCoverageKw = usesStorage
    ? Math.min(
        peakAfterSmartChargingKw,
        resolvedParameters.batteryPowerKw,
        availableBatteryDischargeKw,
      )
    : 0
  const peakLoadReductionKw = Math.min(
    projectedPeakLoadKw,
    optimizedSmartChargingPeakReductionKw + batteryPeakCoverageKw,
  )
  const remainingGridPeakKw = Math.max(0, projectedPeakLoadKw - peakLoadReductionKw)
  const baselineCostEur =
    projectedPeakLoadKw * resolvedParameters.demandChargeEurPerKwYear
  const newEnergyCostEur =
    remainingGridPeakKw * resolvedParameters.demandChargeEurPerKwYear +
    resolvedParameters.annualOperatingCostEur
  const demandChargeSavingsEur =
    peakLoadReductionKw * resolvedParameters.demandChargeEurPerKwYear
  const annualSavingsEur =
    demandChargeSavingsEur - resolvedParameters.annualOperatingCostEur

  return {
    totalDemandKwh: roundEnergy(totalDemandKwh),
    householdDemandKwh: roundEnergy(grownBusinessDemandKwh),
    evDemandKwh: roundEnergy(evDemandKwh),
    pvGenerationKwh: 0,
    directPvConsumptionKwh: 0,
    batteryChargeKwh: 0,
    batteryDischargeKwh: 0,
    storageLossKwh: 0,
    selfConsumedPvKwh: 0,
    selfSuppliedLoadKwh: 0,
    exportedPvKwh: 0,
    gridImportKwh: roundEnergy(totalDemandKwh),
    autarkyPercent: 0,
    baselineCostEur: roundMoney(baselineCostEur),
    newEnergyCostEur: roundMoney(newEnergyCostEur),
    feedInRevenueEur: 0,
    annualSavingsEur: roundMoney(annualSavingsEur),
    peakLoadKw: roundPeak(currentPeakLoadKw),
    batteryPeakCoverageKw: roundPeak(batteryPeakCoverageKw),
    remainingGridPeakKw: roundPeak(remainingGridPeakKw),
    batteryPowerKw: roundPeak(resolvedParameters.batteryPowerKw),
    usableStorageKwh: roundPeak(usableStorageKwh),
    peakLoadReductionKw: roundPeak(peakLoadReductionKw),
    projectedPeakLoadKw: roundPeak(projectedPeakLoadKw),
    demandChargeSavingsEur: roundMoney(demandChargeSavingsEur),
    backupReserveKwh: roundPeak(backupReserveKwh),
    expectedGrowthPercent: Math.round(growthDemandShare * 1000) / 10,
    isPrognosis: true,
    warnings,
  }
}

export function calculateScenarioResult(
  scenarioType: ScenarioType,
  values: CalculatorValues,
  parameters: CalculationParameters,
): ScenarioCalculationResult {
  if (isB2bScenarioType(scenarioType)) {
    return calculateB2bScenarioResult(scenarioType, values, parameters)
  }

  const warnings: string[] = []
  const resolvedParameters = resolveCalculationParameters(parameters, warnings)
  const householdDemandKwh = safeNumber(values.annualConsumption)
  const storageSizeKwh = safeNumber(values.storageSize)
  const chargingStations = Math.round(safeNumber(values.chargingStations))
  const evDemandKwh =
    chargingStations * resolvedParameters.evDemandPerChargingStationKwh
  const totalDemandKwh = householdDemandKwh + evDemandKwh
  const pvGenerationKwh =
    resolvedParameters.pvSizeKwp * resolvedParameters.specificYieldKwhPerKwp
  const usesStorage = scenarioType === 'b2c_pv_speicher' || scenarioType === 'b2c_komplett'
  const usesSmartCharging = scenarioType === 'b2c_komplett'
  const usableStorageKwh = usesStorage
    ? storageSizeKwh * resolvedParameters.usableStorageShare
    : 0
  const peakLoadKw = normalizePeakLoadKw({
    rawPeakLoadKw: values.peakLoadKw,
    totalDemandKwh,
    chargingStations,
    warnings,
  })
  const simulateSmartChargingShare = (smartChargingShiftShare: number) => {
    const profile = buildEnergyProfile({
      householdDemandKwh,
      evDemandKwh,
      pvGenerationKwh,
      chargingStations,
      smartChargingShiftShare,
      peakLoadKw,
    })

    return simulateEnergyProfile({
      profile,
      usesStorage,
      usableStorageKwh,
      batteryPowerKw: resolvedParameters.batteryPowerKw,
      roundTripEfficiency: resolvedParameters.roundTripEfficiency,
    })
  }
  const shiftCandidates =
    usesSmartCharging && resolvedParameters.smartChargingShiftShare > 0
      ? [
          0,
          resolvedParameters.smartChargingShiftShare / 2,
          resolvedParameters.smartChargingShiftShare,
        ]
      : [0]
  const energyResult = shiftCandidates
    .map(simulateSmartChargingShare)
    .reduce((bestResult, candidateResult) => {
      const bestAnnualEnergyValueEur =
        -bestResult.gridImportKwh * resolvedParameters.electricityPriceEurPerKwh +
        bestResult.exportedPvKwh * resolvedParameters.feedInTariffEurPerKwh
      const candidateAnnualEnergyValueEur =
        -candidateResult.gridImportKwh * resolvedParameters.electricityPriceEurPerKwh +
        candidateResult.exportedPvKwh * resolvedParameters.feedInTariffEurPerKwh

      if (candidateAnnualEnergyValueEur > bestAnnualEnergyValueEur) {
        return candidateResult
      }

      if (
        candidateAnnualEnergyValueEur === bestAnnualEnergyValueEur &&
        candidateResult.selfSuppliedLoadKwh > bestResult.selfSuppliedLoadKwh
      ) {
        return candidateResult
      }

      return bestResult
    })
  const availableBatteryDischargeKw =
    usesStorage && usableStorageKwh > 0
      ? usableStorageKwh / PROFILE_INTERVAL_HOURS
      : 0
  const batteryPeakCoverageKw = usesStorage
    ? Math.min(
        peakLoadKw,
        resolvedParameters.batteryPowerKw,
        availableBatteryDischargeKw,
      )
    : 0
  const remainingGridPeakKw = Math.max(0, peakLoadKw - batteryPeakCoverageKw)
  const baselineCostEur = totalDemandKwh * resolvedParameters.electricityPriceEurPerKwh
  const newEnergyCostEur = energyResult.gridImportKwh * resolvedParameters.electricityPriceEurPerKwh
  const feedInRevenueEur = energyResult.exportedPvKwh * resolvedParameters.feedInTariffEurPerKwh
  const annualSavingsEur =
    baselineCostEur -
    newEnergyCostEur +
    feedInRevenueEur -
    resolvedParameters.annualOperatingCostEur
  const autarkyPercent =
    totalDemandKwh > 0
      ? clamp((energyResult.gridImportKwh <= 0 ? 1 : 1 - energyResult.gridImportKwh / totalDemandKwh) * 100, 0, 100)
      : 0

  return {
    totalDemandKwh: roundEnergy(totalDemandKwh),
    householdDemandKwh: roundEnergy(householdDemandKwh),
    evDemandKwh: roundEnergy(evDemandKwh),
    pvGenerationKwh: roundEnergy(pvGenerationKwh),
    directPvConsumptionKwh: roundEnergy(energyResult.directPvConsumptionKwh),
    batteryChargeKwh: roundEnergy(energyResult.batteryChargeFromPvKwh),
    batteryDischargeKwh: roundEnergy(energyResult.batteryDischargeKwh),
    storageLossKwh: roundEnergy(energyResult.storageLossKwh),
    selfConsumedPvKwh: roundEnergy(
      energyResult.directPvConsumptionKwh + energyResult.batteryChargeFromPvKwh,
    ),
    selfSuppliedLoadKwh: roundEnergy(energyResult.selfSuppliedLoadKwh),
    exportedPvKwh: roundEnergy(energyResult.exportedPvKwh),
    gridImportKwh: roundEnergy(energyResult.gridImportKwh),
    autarkyPercent: Math.round(autarkyPercent),
    baselineCostEur: roundMoney(baselineCostEur),
    newEnergyCostEur: roundMoney(newEnergyCostEur),
    feedInRevenueEur: roundMoney(feedInRevenueEur),
    annualSavingsEur: roundMoney(annualSavingsEur),
    peakLoadKw: roundPeak(peakLoadKw),
    batteryPeakCoverageKw: roundPeak(batteryPeakCoverageKw),
    remainingGridPeakKw: roundPeak(remainingGridPeakKw),
    batteryPowerKw: roundPeak(resolvedParameters.batteryPowerKw),
    usableStorageKwh: roundPeak(usableStorageKwh),
    peakLoadReductionKw: roundPeak(batteryPeakCoverageKw),
    projectedPeakLoadKw: roundPeak(peakLoadKw),
    demandChargeSavingsEur: 0,
    backupReserveKwh: 0,
    expectedGrowthPercent: 0,
    isPrognosis: true,
    warnings,
  }
}

export function calculateScenarioResultDifference(
  previousScenario: ScenarioCalculationResult,
  nextScenario: ScenarioCalculationResult,
): ScenarioResultDifference {
  return {
    autarkyDifference: nextScenario.autarkyPercent - previousScenario.autarkyPercent,
    savingsDifference: nextScenario.annualSavingsEur - previousScenario.annualSavingsEur,
    peakLoadReductionDifference:
      nextScenario.peakLoadReductionKw - previousScenario.peakLoadReductionKw,
  }
}
