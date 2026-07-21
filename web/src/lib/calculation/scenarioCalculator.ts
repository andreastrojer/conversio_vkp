import { calculateHtwAutarky } from './htwAutarky'

export type ScenarioType =
  | 'b2c_pv'
  | 'b2c_pv_speicher'
  | 'b2c_komplett'

export type CalculatorValues = {
  annualConsumption: number
  storageSize: number
  chargingStations: number
}

export type CalculationParameters = {
  pvSizeKwp: number
  specificYieldKwhPerKwp: number
  electricityPriceEurPerKwh: number
  feedInTariffEurPerKwh: number
  evDemandPerChargingStationKwh: number
  smartChargingShiftShare: number
}

export type ScenarioCalculationResult = {
  totalDemandKwh: number
  pvGenerationKwh: number
  selfConsumedPvKwh: number
  exportedPvKwh: number
  gridImportKwh: number
  autarkyPercent: number
  annualSavingsEur: number
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max)

const safeNumber = (value: number) =>
  Number.isFinite(value) ? Math.max(0, value) : 0

export function calculateScenarioResult(
  scenarioType: ScenarioType,
  values: CalculatorValues,
  parameters: CalculationParameters,
): ScenarioCalculationResult {
  const annualConsumption = safeNumber(values.annualConsumption)
  const storageSize = safeNumber(values.storageSize)
  const chargingStations = safeNumber(values.chargingStations)

  const evDemandKwh =
    chargingStations *
    safeNumber(parameters.evDemandPerChargingStationKwh)

  const totalDemandKwh = annualConsumption + evDemandKwh

  const pvGenerationKwh =
    safeNumber(parameters.pvSizeKwp) *
    safeNumber(parameters.specificYieldKwhPerKwp)

  const usesStorage =
    scenarioType === 'b2c_pv_speicher' ||
    scenarioType === 'b2c_komplett'

  const usesSmartCharging = scenarioType === 'b2c_komplett'

  const htwAutarkyRatio = calculateHtwAutarky({
    annualDemandKwh: totalDemandKwh,
    pvSizeKwp: parameters.pvSizeKwp,
    usableStorageKwh: usesStorage ? storageSize : 0,
  })

  let selfConsumedPvKwh = Math.min(
    totalDemandKwh,
    pvGenerationKwh,
    totalDemandKwh * htwAutarkyRatio,
  )

  if (usesSmartCharging) {
    const exportedBeforeSmartCharging = Math.max(
      0,
      pvGenerationKwh - selfConsumedPvKwh,
    )

    const gridImportBeforeSmartCharging = Math.max(
      0,
      totalDemandKwh - selfConsumedPvKwh,
    )

    const shiftableEvDemandKwh =
      evDemandKwh *
      clamp(parameters.smartChargingShiftShare, 0, 1)

    const additionalSmartChargingKwh = Math.min(
      exportedBeforeSmartCharging,
      gridImportBeforeSmartCharging,
      shiftableEvDemandKwh,
    )

    selfConsumedPvKwh += additionalSmartChargingKwh
  }

  selfConsumedPvKwh = Math.min(
    selfConsumedPvKwh,
    totalDemandKwh,
    pvGenerationKwh,
  )

  const exportedPvKwh = Math.max(
    0,
    pvGenerationKwh - selfConsumedPvKwh,
  )

  const gridImportKwh = Math.max(
    0,
    totalDemandKwh - selfConsumedPvKwh,
  )

  const autarky =
    totalDemandKwh > 0
      ? selfConsumedPvKwh / totalDemandKwh
      : 0

  const annualSavingsEur =
    selfConsumedPvKwh *
    safeNumber(parameters.electricityPriceEurPerKwh) +
    exportedPvKwh *
    safeNumber(parameters.feedInTariffEurPerKwh)

  return {
    totalDemandKwh: Math.round(totalDemandKwh),
    pvGenerationKwh: Math.round(pvGenerationKwh),
    selfConsumedPvKwh: Math.round(selfConsumedPvKwh),
    exportedPvKwh: Math.round(exportedPvKwh),
    gridImportKwh: Math.round(gridImportKwh),
    autarkyPercent: Math.round(clamp(autarky, 0, 1) * 100),
    annualSavingsEur: Math.round(annualSavingsEur),
  }
}
