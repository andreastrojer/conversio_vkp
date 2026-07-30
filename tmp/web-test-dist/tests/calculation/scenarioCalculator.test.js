"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = __importDefault(require("node:test"));
const scenarioCalculator_1 = require("../../src/lib/calculation/scenarioCalculator");
const baseValues = {
    annualConsumption: 5900,
    storageSize: 7,
    chargingStations: 1,
    peakLoadKw: 3.2,
};
const baseParameters = {
    pvSizeKwp: 10,
    specificYieldKwhPerKwp: 1050,
    electricityPriceEurPerKwh: 0.3,
    feedInTariffEurPerKwh: 0.06772,
    evDemandPerChargingStationKwh: 2500,
    batteryRoundTripEfficiency: 0.9,
    smartChargingShiftShare: 0.35,
    batteryPowerKw: 5,
    usableStorageShare: 0.9,
};
const b2bValues = {
    annualConsumption: 50_000,
    storageSize: 20,
    chargingStations: 10,
    peakLoadKw: 150,
    expectedGrowthPercent: 15,
};
const b2bParameters = {
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
};
function assertFiniteNonNegativeEnergy(result) {
    for (const [key, value] of Object.entries(result)) {
        if (typeof value !== 'number') {
            continue;
        }
        strict_1.default.ok(Number.isFinite(value), `${key} must be finite`);
        if (key.endsWith('Kwh') ||
            key.endsWith('Kw') ||
            key === 'autarkyPercent') {
            strict_1.default.ok(value >= 0, `${key} must not be negative`);
        }
    }
    strict_1.default.ok(result.baselineCostEur >= 0);
    strict_1.default.ok(result.newEnergyCostEur >= 0);
    strict_1.default.ok(result.feedInRevenueEur >= 0);
}
function assertEnergyBalances(result) {
    const demandBalance = result.directPvConsumptionKwh + result.batteryDischargeKwh + result.gridImportKwh;
    const pvBalance = result.directPvConsumptionKwh + result.batteryChargeKwh + result.exportedPvKwh;
    const expectedSelfConsumedPv = result.directPvConsumptionKwh + result.batteryChargeKwh;
    const expectedSelfSuppliedLoad = result.directPvConsumptionKwh + result.batteryDischargeKwh;
    strict_1.default.ok(Math.abs(result.totalDemandKwh - demandBalance) <= 3, `demand balance differs by ${result.totalDemandKwh - demandBalance} kWh`);
    strict_1.default.ok(Math.abs(result.pvGenerationKwh - pvBalance) <= 3, `PV balance differs by ${result.pvGenerationKwh - pvBalance} kWh`);
    strict_1.default.ok(Math.abs(result.selfConsumedPvKwh - expectedSelfConsumedPv) <= 2);
    strict_1.default.ok(Math.abs(result.selfSuppliedLoadKwh - expectedSelfSuppliedLoad) <= 2);
    if (result.totalDemandKwh > 0) {
        const expectedAutarkyPercent = Math.round((result.selfSuppliedLoadKwh / result.totalDemandKwh) * 100);
        strict_1.default.ok(Math.abs(result.autarkyPercent - expectedAutarkyPercent) <= 1);
    }
    if (result.batteryChargeKwh > 0) {
        strict_1.default.ok(Math.abs(result.batteryChargeKwh -
            result.batteryDischargeKwh -
            result.storageLossKwh) <= 3, 'battery charge, discharge and loss must form a closed annual balance');
    }
}
(0, node_test_1.default)('normalizes B2C LASTSPITZE CMS slider values from centi-kW to kW', () => {
    const slider = (0, scenarioCalculator_1.normalizeB2cSliderDefinition)({
        key: 'lastspitze',
        label: 'LASTSPITZE',
        min: 50,
        max: 500,
        step: 10,
        defaultValue: 320,
        unit: 'kW',
    });
    strict_1.default.equal(slider.min, 0.5);
    strict_1.default.equal(slider.max, 5);
    strict_1.default.equal(slider.step, 0.1);
    strict_1.default.equal(slider.defaultValue, 3.2);
});
(0, node_test_1.default)('does not treat raw LASTSPITZE value 320 as 320 kW in B2C calculation', () => {
    const result = (0, scenarioCalculator_1.calculateScenarioResult)('b2c_pv_speicher', { ...baseValues, chargingStations: 0, peakLoadKw: 320 }, baseParameters);
    strict_1.default.equal(result.peakLoadKw, 3.2);
    strict_1.default.ok(result.warnings.some((warning) => warning.includes('Hundertstel-kW')));
});
(0, node_test_1.default)('passes LASTSPITZE into battery peak coverage calculation', () => {
    const lowerPeak = (0, scenarioCalculator_1.calculateScenarioResult)('b2c_pv_speicher', { ...baseValues, peakLoadKw: 3.2 }, baseParameters);
    const higherPeak = (0, scenarioCalculator_1.calculateScenarioResult)('b2c_pv_speicher', { ...baseValues, peakLoadKw: 8 }, baseParameters);
    strict_1.default.equal(lowerPeak.batteryPeakCoverageKw, 3.2);
    strict_1.default.equal(lowerPeak.remainingGridPeakKw, 0);
    strict_1.default.equal(higherPeak.batteryPeakCoverageKw, 5);
    strict_1.default.equal(higherPeak.remainingGridPeakKw, 3);
});
(0, node_test_1.default)('PV basis has no storage effect', () => {
    const result = (0, scenarioCalculator_1.calculateScenarioResult)('b2c_pv', baseValues, baseParameters);
    strict_1.default.equal(result.batteryChargeKwh, 0);
    strict_1.default.equal(result.batteryDischargeKwh, 0);
    strict_1.default.equal(result.batteryPeakCoverageKw, 0);
    strict_1.default.equal(result.usableStorageKwh, 0);
});
(0, node_test_1.default)('charging stations increase annual demand exactly once', () => {
    const withoutCharging = (0, scenarioCalculator_1.calculateScenarioResult)('b2c_pv', { ...baseValues, chargingStations: 0 }, baseParameters);
    const withTwoChargingStations = (0, scenarioCalculator_1.calculateScenarioResult)('b2c_pv', { ...baseValues, chargingStations: 2 }, baseParameters);
    strict_1.default.equal(withTwoChargingStations.totalDemandKwh - withoutCharging.totalDemandKwh, 2 * baseParameters.evDemandPerChargingStationKwh);
});
(0, node_test_1.default)('B2C PV size follows the demand covered by the bundle', () => {
    const pvOnly = (0, scenarioCalculator_1.calculateScenarioResult)('b2c_pv', baseValues, baseParameters);
    const storage = (0, scenarioCalculator_1.calculateScenarioResult)('b2c_pv_speicher', baseValues, baseParameters);
    const complete = (0, scenarioCalculator_1.calculateScenarioResult)('b2c_komplett', baseValues, baseParameters);
    strict_1.default.equal(pvOnly.pvSizeKwp, 5.6);
    strict_1.default.equal(storage.pvSizeKwp, 5.6);
    strict_1.default.equal(complete.pvSizeKwp, 8);
    strict_1.default.equal(pvOnly.pvGenerationKwh, baseValues.annualConsumption);
    strict_1.default.equal(storage.pvGenerationKwh, baseValues.annualConsumption);
    strict_1.default.equal(complete.pvGenerationKwh, baseValues.annualConsumption + baseParameters.evDemandPerChargingStationKwh);
});
(0, node_test_1.default)('smart charging affects only the complete bundle', () => {
    const storageWithoutSmart = (0, scenarioCalculator_1.calculateScenarioResult)('b2c_pv_speicher', baseValues, { ...baseParameters, smartChargingShiftShare: 0 });
    const storageWithSmart = (0, scenarioCalculator_1.calculateScenarioResult)('b2c_pv_speicher', baseValues, { ...baseParameters, smartChargingShiftShare: 1 });
    const completeWithoutSmart = (0, scenarioCalculator_1.calculateScenarioResult)('b2c_komplett', baseValues, { ...baseParameters, smartChargingShiftShare: 0 });
    const completeWithSmart = (0, scenarioCalculator_1.calculateScenarioResult)('b2c_komplett', baseValues, { ...baseParameters, smartChargingShiftShare: 1 });
    strict_1.default.equal(storageWithSmart.gridImportKwh, storageWithoutSmart.gridImportKwh);
    strict_1.default.ok(completeWithSmart.gridImportKwh <= completeWithoutSmart.gridImportKwh);
});
(0, node_test_1.default)('autarky is clamped between 0 and 100 percent', () => {
    const result = (0, scenarioCalculator_1.calculateScenarioResult)('b2c_komplett', baseValues, baseParameters);
    strict_1.default.ok(result.autarkyPercent >= 0);
    strict_1.default.ok(result.autarkyPercent <= 100);
});
(0, node_test_1.default)('larger storage does not increase autarky when no PV energy is available', () => {
    const noPvParameters = { ...baseParameters, pvSizeKwp: 0, specificYieldKwhPerKwp: 0 };
    const smallStorage = (0, scenarioCalculator_1.calculateScenarioResult)('b2c_pv_speicher', { ...baseValues, storageSize: 1 }, noPvParameters);
    const largeStorage = (0, scenarioCalculator_1.calculateScenarioResult)('b2c_pv_speicher', { ...baseValues, storageSize: 20 }, noPvParameters);
    strict_1.default.equal(largeStorage.autarkyPercent, smallStorage.autarkyPercent);
    strict_1.default.equal(largeStorage.batteryChargeKwh, 0);
    strict_1.default.equal(largeStorage.batteryDischargeKwh, smallStorage.batteryDischargeKwh);
    strict_1.default.equal(largeStorage.selfConsumedPvKwh, 0);
    strict_1.default.equal(largeStorage.exportedPvKwh, 0);
});
(0, node_test_1.default)('annual savings follow avoided grid import plus feed-in revenue', () => {
    const result = (0, scenarioCalculator_1.calculateScenarioResult)('b2c_komplett', baseValues, baseParameters);
    const expectedSavings = result.baselineCostEur - result.newEnergyCostEur + result.feedInRevenueEur;
    strict_1.default.ok(Math.abs(result.annualSavingsEur - expectedSavings) <= 2);
});
(0, node_test_1.default)('bundle differences are calculated from complete scenario results', () => {
    const previousScenario = (0, scenarioCalculator_1.calculateScenarioResult)('b2c_pv', baseValues, baseParameters);
    const nextScenario = (0, scenarioCalculator_1.calculateScenarioResult)('b2c_pv_speicher', baseValues, baseParameters);
    const difference = (0, scenarioCalculator_1.calculateScenarioResultDifference)(previousScenario, nextScenario);
    strict_1.default.equal(difference.autarkyDifference, nextScenario.autarkyPercent - previousScenario.autarkyPercent);
    strict_1.default.equal(difference.savingsDifference, nextScenario.annualSavingsEur - previousScenario.annualSavingsEur);
});
(0, node_test_1.default)('calculation is deterministic and contains no invalid numbers', () => {
    const firstRun = (0, scenarioCalculator_1.calculateScenarioResult)('b2c_komplett', baseValues, baseParameters);
    const secondRun = (0, scenarioCalculator_1.calculateScenarioResult)('b2c_komplett', baseValues, baseParameters);
    strict_1.default.deepEqual(secondRun, firstRun);
    assertFiniteNonNegativeEnergy(firstRun);
    assertEnergyBalances(firstRun);
});
(0, node_test_1.default)('storage changes only battery flows, not direct PV consumption', () => {
    const withoutStorage = (0, scenarioCalculator_1.calculateScenarioResult)('b2c_pv_speicher', { ...baseValues, storageSize: 0 }, baseParameters);
    const withStorage = (0, scenarioCalculator_1.calculateScenarioResult)('b2c_pv_speicher', { ...baseValues, storageSize: 12 }, baseParameters);
    strict_1.default.equal(withStorage.directPvConsumptionKwh, withoutStorage.directPvConsumptionKwh);
    strict_1.default.ok(withStorage.batteryChargeKwh > 0);
    strict_1.default.ok(withStorage.batteryDischargeKwh > 0);
    strict_1.default.ok(withStorage.gridImportKwh <= withoutStorage.gridImportKwh);
    strict_1.default.ok(withStorage.exportedPvKwh <= withoutStorage.exportedPvKwh);
});
(0, node_test_1.default)('battery round-trip efficiency is applied across charging and discharging', () => {
    const result = (0, scenarioCalculator_1.calculateScenarioResult)('b2c_pv_speicher', { ...baseValues, storageSize: 12, chargingStations: 0 }, baseParameters);
    const measuredRoundTripEfficiency = result.batteryDischargeKwh / result.batteryChargeKwh;
    strict_1.default.ok(result.batteryChargeKwh > 0);
    strict_1.default.ok(Math.abs(measuredRoundTripEfficiency - baseParameters.batteryRoundTripEfficiency) <= 0.01);
    assertEnergyBalances(result);
});
(0, node_test_1.default)('larger storage never lowers autarky or annual savings with the configured tariffs', () => {
    for (const annualConsumption of [2000, 5900, 15000]) {
        for (const chargingStations of [0, 1, 10, 20]) {
            let previousResult;
            for (const storageSize of [0, 1, 5, 10, 15]) {
                const result = (0, scenarioCalculator_1.calculateScenarioResult)('b2c_pv_speicher', { annualConsumption, storageSize, chargingStations, peakLoadKw: 3.2 }, baseParameters);
                if (previousResult) {
                    strict_1.default.ok(result.autarkyPercent >= previousResult.autarkyPercent);
                    strict_1.default.ok(result.annualSavingsEur >= previousResult.annualSavingsEur);
                }
                previousResult = result;
            }
        }
    }
});
(0, node_test_1.default)('smart charging selects no worse result than the storage bundle', () => {
    for (const annualConsumption of [2000, 5900, 15000]) {
        for (const chargingStations of [0, 1, 10, 20]) {
            for (const peakLoadKw of [0.5, 1.5, 3.2, 5]) {
                const values = {
                    annualConsumption,
                    storageSize: 10,
                    chargingStations,
                    peakLoadKw,
                };
                const storage = (0, scenarioCalculator_1.calculateScenarioResult)('b2c_pv_speicher', values, baseParameters);
                const complete = (0, scenarioCalculator_1.calculateScenarioResult)('b2c_komplett', values, baseParameters);
                strict_1.default.ok(complete.autarkyPercent >= storage.autarkyPercent);
                strict_1.default.ok(complete.annualSavingsEur >= storage.annualSavingsEur);
            }
        }
    }
});
(0, node_test_1.default)('representative slider boundaries stay finite and energy-balanced', () => {
    for (const annualConsumption of [2000, 15000]) {
        for (const storageSize of [0, 15]) {
            for (const chargingStations of [0, 10, 20]) {
                for (const peakLoadKw of [0.5, 2.5, 5]) {
                    for (const scenarioType of [
                        'b2c_pv',
                        'b2c_pv_speicher',
                        'b2c_komplett',
                    ]) {
                        const result = (0, scenarioCalculator_1.calculateScenarioResult)(scenarioType, { annualConsumption, storageSize, chargingStations, peakLoadKw }, baseParameters);
                        assertFiniteNonNegativeEnergy(result);
                        assertEnergyBalances(result);
                        strict_1.default.ok(result.autarkyPercent >= 0 && result.autarkyPercent <= 100);
                    }
                }
            }
        }
    }
});
(0, node_test_1.default)('B2B keeps the CMS LASTSPITZE in real kW', () => {
    const result = (0, scenarioCalculator_1.calculateScenarioResult)('b2b_einstieg', b2bValues, b2bParameters);
    strict_1.default.equal(result.peakLoadKw, 150);
    strict_1.default.ok(result.projectedPeakLoadKw > result.peakLoadKw);
    strict_1.default.equal(result.peakLoadReductionKw, 0);
    strict_1.default.equal(result.batteryPeakCoverageKw, 0);
    strict_1.default.ok(!result.warnings.some((warning) => warning.includes('Hundertstel-kW')));
});
(0, node_test_1.default)('B2B demand includes expected growth and charging demand exactly once', () => {
    const result = (0, scenarioCalculator_1.calculateScenarioResult)('b2b_einstieg', b2bValues, b2bParameters);
    strict_1.default.equal(result.householdDemandKwh, 57_500);
    strict_1.default.equal(result.evDemandKwh, 50_000);
    strict_1.default.equal(result.totalDemandKwh, 107_500);
    strict_1.default.ok(result.gridImportKwh < result.totalDemandKwh);
    strict_1.default.ok(Math.abs(result.totalDemandKwh -
        (result.selfSuppliedLoadKwh + result.gridImportKwh)) <= 2);
    strict_1.default.equal(result.expectedGrowthPercent, 15);
});
(0, node_test_1.default)('B2B storage bundle respects usable capacity and backup reserve', () => {
    const result = (0, scenarioCalculator_1.calculateScenarioResult)('b2b_autark_abgesichert', b2bValues, b2bParameters);
    strict_1.default.equal(result.usableStorageKwh, 18);
    strict_1.default.equal(result.backupReserveKwh, 3.6);
    strict_1.default.equal(result.batteryPeakCoverageKw, 50);
    strict_1.default.equal(result.peakLoadReductionKw, 50);
    strict_1.default.ok(Math.abs(result.remainingGridPeakKw -
        (result.projectedPeakLoadKw - result.peakLoadReductionKw)) <= 0.2);
});
(0, node_test_1.default)('B2B annual savings combine PV energy value and the CMS demand charge', () => {
    const result = (0, scenarioCalculator_1.calculateScenarioResult)('b2b_autark_abgesichert', b2bValues, b2bParameters);
    const expectedSavings = result.peakLoadReductionKw * b2bParameters.demandChargeEurPerKwYear;
    strict_1.default.ok(Math.abs(result.demandChargeSavingsEur - expectedSavings) <= 1);
    strict_1.default.ok(result.annualSavingsEur > result.demandChargeSavingsEur);
    strict_1.default.ok(Math.abs(result.annualSavingsEur -
        (result.baselineCostEur - result.newEnergyCostEur + result.feedInRevenueEur)) <= 2);
});
(0, node_test_1.default)('B2B entry bundle already produces PV autarky and energy savings', () => {
    const entry = (0, scenarioCalculator_1.calculateScenarioResult)('b2b_einstieg', b2bValues, b2bParameters);
    strict_1.default.equal(entry.pvGenerationKwh, b2bValues.annualConsumption);
    strict_1.default.ok(entry.autarkyPercent > 0);
    strict_1.default.ok(entry.annualSavingsEur > 0);
    strict_1.default.equal(entry.batteryChargeKwh, 0);
    strict_1.default.equal(entry.batteryDischargeKwh, 0);
    strict_1.default.equal(entry.peakLoadReductionKw, 0);
});
(0, node_test_1.default)('B2B storage increases self-supply beyond the entry bundle', () => {
    const entry = (0, scenarioCalculator_1.calculateScenarioResult)('b2b_einstieg', b2bValues, b2bParameters);
    const storage = (0, scenarioCalculator_1.calculateScenarioResult)('b2b_autark_abgesichert', b2bValues, b2bParameters);
    strict_1.default.ok(storage.batteryChargeKwh > 0);
    strict_1.default.ok(storage.batteryDischargeKwh > 0);
    strict_1.default.equal(storage.pvGenerationKwh, 57_500);
    strict_1.default.ok(storage.autarkyPercent > entry.autarkyPercent);
    strict_1.default.ok(storage.annualSavingsEur > entry.annualSavingsEur);
});
(0, node_test_1.default)('B2B growth and mobility adds only beneficial smart charging peak reduction', () => {
    const storage = (0, scenarioCalculator_1.calculateScenarioResult)('b2b_autark_abgesichert', b2bValues, b2bParameters);
    const growthAndMobility = (0, scenarioCalculator_1.calculateScenarioResult)('b2b_wachstum_mobilitaet', b2bValues, b2bParameters);
    const withoutChargingStations = (0, scenarioCalculator_1.calculateScenarioResult)('b2b_wachstum_mobilitaet', { ...b2bValues, chargingStations: 0 }, b2bParameters);
    const storageWithoutChargingStations = (0, scenarioCalculator_1.calculateScenarioResult)('b2b_autark_abgesichert', { ...b2bValues, chargingStations: 0 }, b2bParameters);
    strict_1.default.ok(growthAndMobility.peakLoadReductionKw > storage.peakLoadReductionKw);
    strict_1.default.ok(growthAndMobility.remainingGridPeakKw < storage.remainingGridPeakKw);
    strict_1.default.equal(growthAndMobility.pvGenerationKwh, growthAndMobility.totalDemandKwh);
    strict_1.default.ok(growthAndMobility.autarkyPercent > storage.autarkyPercent);
    strict_1.default.ok(growthAndMobility.annualSavingsEur >= storage.annualSavingsEur);
    strict_1.default.equal(withoutChargingStations.peakLoadReductionKw, storageWithoutChargingStations.peakLoadReductionKw);
});
(0, node_test_1.default)('B2B uses growthDemandShare when the growth slider is absent', () => {
    const result = (0, scenarioCalculator_1.calculateScenarioResult)('b2b_einstieg', { ...b2bValues, expectedGrowthPercent: undefined }, b2bParameters);
    strict_1.default.equal(result.expectedGrowthPercent, 15);
    strict_1.default.equal(result.householdDemandKwh, 57_500);
});
(0, node_test_1.default)('B2B backup reserve lowers dispatchable peak-shaving power', () => {
    const values = { ...b2bValues, storageSize: 10, chargingStations: 0 };
    const withoutReserve = (0, scenarioCalculator_1.calculateScenarioResult)('b2b_autark_abgesichert', values, { ...b2bParameters, backupReserveShare: 0 });
    const withReserve = (0, scenarioCalculator_1.calculateScenarioResult)('b2b_autark_abgesichert', values, b2bParameters);
    strict_1.default.ok(withReserve.batteryPeakCoverageKw < withoutReserve.batteryPeakCoverageKw);
    strict_1.default.ok(withReserve.peakLoadReductionKw < withoutReserve.peakLoadReductionKw);
});
