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
function assertFiniteNonNegativeEnergy(result) {
    for (const [key, value] of Object.entries(result)) {
        if (typeof value !== 'number') {
            continue;
        }
        strict_1.default.ok(Number.isFinite(value), `${key} must be finite`);
        if (key.endsWith('Kwh') ||
            key.endsWith('Kw') ||
            key.endsWith('Eur') ||
            key === 'autarkyPercent') {
            strict_1.default.ok(value >= 0, `${key} must not be negative`);
        }
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
    strict_1.default.equal(result.batteryDischargeKwh, 0);
    strict_1.default.equal(result.batteryPeakCoverageKw, 0);
    strict_1.default.equal(result.usableStorageKwh, 0);
});
(0, node_test_1.default)('charging stations increase annual demand exactly once', () => {
    const withoutCharging = (0, scenarioCalculator_1.calculateScenarioResult)('b2c_pv', { ...baseValues, chargingStations: 0 }, baseParameters);
    const withTwoChargingStations = (0, scenarioCalculator_1.calculateScenarioResult)('b2c_pv', { ...baseValues, chargingStations: 2 }, baseParameters);
    strict_1.default.equal(withTwoChargingStations.totalDemandKwh - withoutCharging.totalDemandKwh, 2 * baseParameters.evDemandPerChargingStationKwh);
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
    strict_1.default.equal(largeStorage.batteryDischargeKwh, smallStorage.batteryDischargeKwh);
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
});
