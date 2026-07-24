import assert from 'node:assert/strict'
import test from 'node:test'
import {
  calculateScenarioResult,
  calculateScenarioResultDifference,
  normalizeB2cSliderDefinition,
  type CalculationParameters,
  type CalculatorValues,
} from '../../src/lib/calculation/scenarioCalculator'

const baseValues: CalculatorValues = {
  annualConsumption: 5900,
  storageSize: 7,
  chargingStations: 1,
  peakLoadKw: 3.2,
}

const baseParameters: CalculationParameters = {
  pvSizeKwp: 10,
  specificYieldKwhPerKwp: 1050,
  electricityPriceEurPerKwh: 0.3,
  feedInTariffEurPerKwh: 0.06772,
  evDemandPerChargingStationKwh: 2500,
  batteryRoundTripEfficiency: 0.9,
  smartChargingShiftShare: 0.35,
  batteryPowerKw: 5,
  usableStorageShare: 0.9,
}

function assertFiniteNonNegativeEnergy(result: ReturnType<typeof calculateScenarioResult>) {
  for (const [key, value] of Object.entries(result)) {
    if (typeof value !== 'number') {
      continue
    }

    assert.ok(Number.isFinite(value), `${key} must be finite`)

    if (
      key.endsWith('Kwh') ||
      key.endsWith('Kw') ||
      key.endsWith('Eur') ||
      key === 'autarkyPercent'
    ) {
      assert.ok(value >= 0, `${key} must not be negative`)
    }
  }
}

test('normalizes B2C LASTSPITZE CMS slider values from centi-kW to kW', () => {
  const slider = normalizeB2cSliderDefinition({
    key: 'lastspitze',
    label: 'LASTSPITZE',
    min: 50,
    max: 500,
    step: 10,
    defaultValue: 320,
    unit: 'kW',
  })

  assert.equal(slider.min, 0.5)
  assert.equal(slider.max, 5)
  assert.equal(slider.step, 0.1)
  assert.equal(slider.defaultValue, 3.2)
})

test('does not treat raw LASTSPITZE value 320 as 320 kW in B2C calculation', () => {
  const result = calculateScenarioResult(
    'b2c_pv_speicher',
    {...baseValues, chargingStations: 0, peakLoadKw: 320},
    baseParameters,
  )

  assert.equal(result.peakLoadKw, 3.2)
  assert.ok(result.warnings.some((warning) => warning.includes('Hundertstel-kW')))
})

test('passes LASTSPITZE into battery peak coverage calculation', () => {
  const lowerPeak = calculateScenarioResult(
    'b2c_pv_speicher',
    {...baseValues, peakLoadKw: 3.2},
    baseParameters,
  )
  const higherPeak = calculateScenarioResult(
    'b2c_pv_speicher',
    {...baseValues, peakLoadKw: 8},
    baseParameters,
  )

  assert.equal(lowerPeak.batteryPeakCoverageKw, 3.2)
  assert.equal(lowerPeak.remainingGridPeakKw, 0)
  assert.equal(higherPeak.batteryPeakCoverageKw, 5)
  assert.equal(higherPeak.remainingGridPeakKw, 3)
})

test('PV basis has no storage effect', () => {
  const result = calculateScenarioResult('b2c_pv', baseValues, baseParameters)

  assert.equal(result.batteryDischargeKwh, 0)
  assert.equal(result.batteryPeakCoverageKw, 0)
  assert.equal(result.usableStorageKwh, 0)
})

test('charging stations increase annual demand exactly once', () => {
  const withoutCharging = calculateScenarioResult(
    'b2c_pv',
    {...baseValues, chargingStations: 0},
    baseParameters,
  )
  const withTwoChargingStations = calculateScenarioResult(
    'b2c_pv',
    {...baseValues, chargingStations: 2},
    baseParameters,
  )

  assert.equal(
    withTwoChargingStations.totalDemandKwh - withoutCharging.totalDemandKwh,
    2 * baseParameters.evDemandPerChargingStationKwh!,
  )
})

test('smart charging affects only the complete bundle', () => {
  const storageWithoutSmart = calculateScenarioResult(
    'b2c_pv_speicher',
    baseValues,
    {...baseParameters, smartChargingShiftShare: 0},
  )
  const storageWithSmart = calculateScenarioResult(
    'b2c_pv_speicher',
    baseValues,
    {...baseParameters, smartChargingShiftShare: 1},
  )
  const completeWithoutSmart = calculateScenarioResult(
    'b2c_komplett',
    baseValues,
    {...baseParameters, smartChargingShiftShare: 0},
  )
  const completeWithSmart = calculateScenarioResult(
    'b2c_komplett',
    baseValues,
    {...baseParameters, smartChargingShiftShare: 1},
  )

  assert.equal(storageWithSmart.gridImportKwh, storageWithoutSmart.gridImportKwh)
  assert.ok(completeWithSmart.gridImportKwh <= completeWithoutSmart.gridImportKwh)
})

test('autarky is clamped between 0 and 100 percent', () => {
  const result = calculateScenarioResult('b2c_komplett', baseValues, baseParameters)

  assert.ok(result.autarkyPercent >= 0)
  assert.ok(result.autarkyPercent <= 100)
})

test('larger storage does not increase autarky when no PV energy is available', () => {
  const noPvParameters = {...baseParameters, pvSizeKwp: 0, specificYieldKwhPerKwp: 0}
  const smallStorage = calculateScenarioResult(
    'b2c_pv_speicher',
    {...baseValues, storageSize: 1},
    noPvParameters,
  )
  const largeStorage = calculateScenarioResult(
    'b2c_pv_speicher',
    {...baseValues, storageSize: 20},
    noPvParameters,
  )

  assert.equal(largeStorage.autarkyPercent, smallStorage.autarkyPercent)
  assert.equal(largeStorage.batteryDischargeKwh, smallStorage.batteryDischargeKwh)
})

test('annual savings follow avoided grid import plus feed-in revenue', () => {
  const result = calculateScenarioResult('b2c_komplett', baseValues, baseParameters)
  const expectedSavings =
    result.baselineCostEur - result.newEnergyCostEur + result.feedInRevenueEur

  assert.ok(Math.abs(result.annualSavingsEur - expectedSavings) <= 2)
})

test('bundle differences are calculated from complete scenario results', () => {
  const previousScenario = calculateScenarioResult('b2c_pv', baseValues, baseParameters)
  const nextScenario = calculateScenarioResult('b2c_pv_speicher', baseValues, baseParameters)
  const difference = calculateScenarioResultDifference(previousScenario, nextScenario)

  assert.equal(
    difference.autarkyDifference,
    nextScenario.autarkyPercent - previousScenario.autarkyPercent,
  )
  assert.equal(
    difference.savingsDifference,
    nextScenario.annualSavingsEur - previousScenario.annualSavingsEur,
  )
})

test('calculation is deterministic and contains no invalid numbers', () => {
  const firstRun = calculateScenarioResult('b2c_komplett', baseValues, baseParameters)
  const secondRun = calculateScenarioResult('b2c_komplett', baseValues, baseParameters)

  assert.deepEqual(secondRun, firstRun)
  assertFiniteNonNegativeEnergy(firstRun)
})
