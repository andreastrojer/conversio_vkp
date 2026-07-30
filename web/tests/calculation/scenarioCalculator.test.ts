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

const b2bValues: CalculatorValues = {
  annualConsumption: 50_000,
  storageSize: 20,
  chargingStations: 10,
  peakLoadKw: 150,
  expectedGrowthPercent: 15,
}

const b2bParameters: CalculationParameters = {
  pvSizeKwp: 10,
  specificYieldKwhPerKwp: 1050,
  electricityPriceEurPerKwh: 0.3,
  feedInTariffEurPerKwh: 0.06772,
  usableStorageShare: 0.9,
  batteryRoundTripEfficiency: 0.9,
  batteryPowerKw: 50,
  annualOperatingCostEur: 0,
  smartChargingShiftShare: 0.35,
  backupReserveShare: 0.2,
  evDemandPerChargingStationKwh: 5000,
  demandChargeEurPerKwYear: 112.32,
  growthDemandShare: 0.15,
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
      key === 'autarkyPercent'
    ) {
      assert.ok(value >= 0, `${key} must not be negative`)
    }
  }

  assert.ok(result.baselineCostEur >= 0)
  assert.ok(result.newEnergyCostEur >= 0)
  assert.ok(result.feedInRevenueEur >= 0)
}

function assertEnergyBalances(result: ReturnType<typeof calculateScenarioResult>) {
  const demandBalance =
    result.directPvConsumptionKwh + result.batteryDischargeKwh + result.gridImportKwh
  const pvBalance =
    result.directPvConsumptionKwh + result.batteryChargeKwh + result.exportedPvKwh
  const expectedSelfConsumedPv =
    result.directPvConsumptionKwh + result.batteryChargeKwh
  const expectedSelfSuppliedLoad =
    result.directPvConsumptionKwh + result.batteryDischargeKwh

  assert.ok(
    Math.abs(result.totalDemandKwh - demandBalance) <= 3,
    `demand balance differs by ${result.totalDemandKwh - demandBalance} kWh`,
  )
  assert.ok(
    Math.abs(result.pvGenerationKwh - pvBalance) <= 3,
    `PV balance differs by ${result.pvGenerationKwh - pvBalance} kWh`,
  )
  assert.ok(Math.abs(result.selfConsumedPvKwh - expectedSelfConsumedPv) <= 2)
  assert.ok(Math.abs(result.selfSuppliedLoadKwh - expectedSelfSuppliedLoad) <= 2)

  if (result.totalDemandKwh > 0) {
    const expectedAutarkyPercent = Math.round(
      (result.selfSuppliedLoadKwh / result.totalDemandKwh) * 100,
    )

    assert.ok(Math.abs(result.autarkyPercent - expectedAutarkyPercent) <= 1)
  }

  if (result.batteryChargeKwh > 0) {
    assert.ok(
      Math.abs(
        result.batteryChargeKwh -
          result.batteryDischargeKwh -
          result.storageLossKwh,
      ) <= 3,
      'battery charge, discharge and loss must form a closed annual balance',
    )
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

  assert.equal(result.batteryChargeKwh, 0)
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

test('B2C PV size follows the demand covered by the bundle', () => {
  const pvOnly = calculateScenarioResult('b2c_pv', baseValues, baseParameters)
  const storage = calculateScenarioResult('b2c_pv_speicher', baseValues, baseParameters)
  const complete = calculateScenarioResult('b2c_komplett', baseValues, baseParameters)

  assert.equal(pvOnly.pvSizeKwp, 5.6)
  assert.equal(storage.pvSizeKwp, 5.6)
  assert.equal(complete.pvSizeKwp, 8)
  assert.equal(pvOnly.pvGenerationKwh, baseValues.annualConsumption)
  assert.equal(storage.pvGenerationKwh, baseValues.annualConsumption)
  assert.equal(
    complete.pvGenerationKwh,
    baseValues.annualConsumption + baseParameters.evDemandPerChargingStationKwh!,
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
  assert.equal(largeStorage.batteryChargeKwh, 0)
  assert.equal(largeStorage.batteryDischargeKwh, smallStorage.batteryDischargeKwh)
  assert.equal(largeStorage.selfConsumedPvKwh, 0)
  assert.equal(largeStorage.exportedPvKwh, 0)
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
  assertEnergyBalances(firstRun)
})

test('storage changes only battery flows, not direct PV consumption', () => {
  const withoutStorage = calculateScenarioResult(
    'b2c_pv_speicher',
    {...baseValues, storageSize: 0},
    baseParameters,
  )
  const withStorage = calculateScenarioResult(
    'b2c_pv_speicher',
    {...baseValues, storageSize: 12},
    baseParameters,
  )

  assert.equal(withStorage.directPvConsumptionKwh, withoutStorage.directPvConsumptionKwh)
  assert.ok(withStorage.batteryChargeKwh > 0)
  assert.ok(withStorage.batteryDischargeKwh > 0)
  assert.ok(withStorage.gridImportKwh <= withoutStorage.gridImportKwh)
  assert.ok(withStorage.exportedPvKwh <= withoutStorage.exportedPvKwh)
})

test('battery round-trip efficiency is applied across charging and discharging', () => {
  const result = calculateScenarioResult(
    'b2c_pv_speicher',
    {...baseValues, storageSize: 12, chargingStations: 0},
    baseParameters,
  )
  const measuredRoundTripEfficiency =
    result.batteryDischargeKwh / result.batteryChargeKwh

  assert.ok(result.batteryChargeKwh > 0)
  assert.ok(
    Math.abs(measuredRoundTripEfficiency - baseParameters.batteryRoundTripEfficiency!) <= 0.01,
  )
  assertEnergyBalances(result)
})

test('larger storage never lowers autarky or annual savings with the configured tariffs', () => {
  for (const annualConsumption of [2000, 5900, 15000]) {
    for (const chargingStations of [0, 1, 10, 20]) {
      let previousResult: ReturnType<typeof calculateScenarioResult> | undefined

      for (const storageSize of [0, 1, 5, 10, 15]) {
        const result = calculateScenarioResult(
          'b2c_pv_speicher',
          {annualConsumption, storageSize, chargingStations, peakLoadKw: 3.2},
          baseParameters,
        )

        if (previousResult) {
          assert.ok(result.autarkyPercent >= previousResult.autarkyPercent)
          assert.ok(result.annualSavingsEur >= previousResult.annualSavingsEur)
        }

        previousResult = result
      }
    }
  }
})

test('smart charging selects no worse result than the storage bundle', () => {
  for (const annualConsumption of [2000, 5900, 15000]) {
    for (const chargingStations of [0, 1, 10, 20]) {
      for (const peakLoadKw of [0.5, 1.5, 3.2, 5]) {
        const values = {
          annualConsumption,
          storageSize: 10,
          chargingStations,
          peakLoadKw,
        }
        const storage = calculateScenarioResult('b2c_pv_speicher', values, baseParameters)
        const complete = calculateScenarioResult('b2c_komplett', values, baseParameters)

        assert.ok(complete.autarkyPercent >= storage.autarkyPercent)
        assert.ok(complete.annualSavingsEur >= storage.annualSavingsEur)
      }
    }
  }
})

test('representative slider boundaries stay finite and energy-balanced', () => {
  for (const annualConsumption of [2000, 15000]) {
    for (const storageSize of [0, 15]) {
      for (const chargingStations of [0, 10, 20]) {
        for (const peakLoadKw of [0.5, 2.5, 5]) {
          for (const scenarioType of [
            'b2c_pv',
            'b2c_pv_speicher',
            'b2c_komplett',
          ] as const) {
            const result = calculateScenarioResult(
              scenarioType,
              {annualConsumption, storageSize, chargingStations, peakLoadKw},
              baseParameters,
            )

            assertFiniteNonNegativeEnergy(result)
            assertEnergyBalances(result)
            assert.ok(result.autarkyPercent >= 0 && result.autarkyPercent <= 100)
          }
        }
      }
    }
  }
})

test('B2B keeps the CMS LASTSPITZE in real kW', () => {
  const result = calculateScenarioResult(
    'b2b_einstieg',
    b2bValues,
    b2bParameters,
  )

  assert.equal(result.peakLoadKw, 150)
  assert.ok(result.projectedPeakLoadKw > result.peakLoadKw)
  assert.equal(result.peakLoadReductionKw, 0)
  assert.equal(result.batteryPeakCoverageKw, 0)
  assert.ok(!result.warnings.some((warning) => warning.includes('Hundertstel-kW')))
})

test('B2B demand includes expected growth and charging demand exactly once', () => {
  const result = calculateScenarioResult(
    'b2b_einstieg',
    b2bValues,
    b2bParameters,
  )

  assert.equal(result.householdDemandKwh, 57_500)
  assert.equal(result.evDemandKwh, 50_000)
  assert.equal(result.totalDemandKwh, 107_500)
  assert.ok(result.gridImportKwh < result.totalDemandKwh)
  assert.ok(
    Math.abs(
      result.totalDemandKwh -
        (result.selfSuppliedLoadKwh + result.gridImportKwh),
    ) <= 2,
  )
  assert.equal(result.expectedGrowthPercent, 15)
})

test('B2B storage bundle respects usable capacity and backup reserve', () => {
  const result = calculateScenarioResult(
    'b2b_autark_abgesichert',
    b2bValues,
    b2bParameters,
  )

  assert.equal(result.usableStorageKwh, 18)
  assert.equal(result.backupReserveKwh, 3.6)
  assert.equal(result.batteryPeakCoverageKw, 50)
  assert.equal(result.peakLoadReductionKw, 50)
  assert.ok(
    Math.abs(
      result.remainingGridPeakKw -
        (result.projectedPeakLoadKw - result.peakLoadReductionKw),
    ) <= 0.2,
  )
})

test('B2B annual savings combine PV energy value and the CMS demand charge', () => {
  const result = calculateScenarioResult(
    'b2b_autark_abgesichert',
    b2bValues,
    b2bParameters,
  )
  const expectedSavings =
    result.peakLoadReductionKw * b2bParameters.demandChargeEurPerKwYear!

  assert.ok(Math.abs(result.demandChargeSavingsEur - expectedSavings) <= 1)
  assert.ok(result.annualSavingsEur > result.demandChargeSavingsEur)
  assert.ok(
    Math.abs(
      result.annualSavingsEur -
        (result.baselineCostEur - result.newEnergyCostEur + result.feedInRevenueEur),
    ) <= 2,
  )
})

test('B2B entry bundle already produces PV autarky and energy savings', () => {
  const entry = calculateScenarioResult(
    'b2b_einstieg',
    b2bValues,
    b2bParameters,
  )

  assert.equal(entry.pvGenerationKwh, b2bValues.annualConsumption)
  assert.ok(entry.autarkyPercent > 0)
  assert.ok(entry.annualSavingsEur > 0)
  assert.equal(entry.batteryChargeKwh, 0)
  assert.equal(entry.batteryDischargeKwh, 0)
  assert.equal(entry.peakLoadReductionKw, 0)
})

test('B2B storage increases self-supply beyond the entry bundle', () => {
  const entry = calculateScenarioResult(
    'b2b_einstieg',
    b2bValues,
    b2bParameters,
  )
  const storage = calculateScenarioResult(
    'b2b_autark_abgesichert',
    b2bValues,
    b2bParameters,
  )

  assert.ok(storage.batteryChargeKwh > 0)
  assert.ok(storage.batteryDischargeKwh > 0)
  assert.equal(storage.pvGenerationKwh, 57_500)
  assert.ok(storage.autarkyPercent > entry.autarkyPercent)
  assert.ok(storage.annualSavingsEur > entry.annualSavingsEur)
})

test('B2B growth and mobility adds only beneficial smart charging peak reduction', () => {
  const storage = calculateScenarioResult(
    'b2b_autark_abgesichert',
    b2bValues,
    b2bParameters,
  )
  const growthAndMobility = calculateScenarioResult(
    'b2b_wachstum_mobilitaet',
    b2bValues,
    b2bParameters,
  )
  const withoutChargingStations = calculateScenarioResult(
    'b2b_wachstum_mobilitaet',
    {...b2bValues, chargingStations: 0},
    b2bParameters,
  )
  const storageWithoutChargingStations = calculateScenarioResult(
    'b2b_autark_abgesichert',
    {...b2bValues, chargingStations: 0},
    b2bParameters,
  )

  assert.ok(growthAndMobility.peakLoadReductionKw > storage.peakLoadReductionKw)
  assert.ok(growthAndMobility.remainingGridPeakKw < storage.remainingGridPeakKw)
  assert.equal(growthAndMobility.pvGenerationKwh, growthAndMobility.totalDemandKwh)
  assert.ok(growthAndMobility.autarkyPercent > storage.autarkyPercent)
  assert.ok(growthAndMobility.annualSavingsEur >= storage.annualSavingsEur)
  assert.equal(
    withoutChargingStations.peakLoadReductionKw,
    storageWithoutChargingStations.peakLoadReductionKw,
  )
})

test('B2B uses growthDemandShare when the growth slider is absent', () => {
  const result = calculateScenarioResult(
    'b2b_einstieg',
    {...b2bValues, expectedGrowthPercent: undefined},
    b2bParameters,
  )

  assert.equal(result.expectedGrowthPercent, 15)
  assert.equal(result.householdDemandKwh, 57_500)
})

test('B2B backup reserve lowers dispatchable peak-shaving power', () => {
  const values = {...b2bValues, storageSize: 10, chargingStations: 0}
  const withoutReserve = calculateScenarioResult(
    'b2b_autark_abgesichert',
    values,
    {...b2bParameters, backupReserveShare: 0},
  )
  const withReserve = calculateScenarioResult(
    'b2b_autark_abgesichert',
    values,
    b2bParameters,
  )

  assert.ok(withReserve.batteryPeakCoverageKw < withoutReserve.batteryPeakCoverageKw)
  assert.ok(withReserve.peakLoadReductionKw < withoutReserve.peakLoadReductionKw)
})
