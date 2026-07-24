"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.B2C_CALCULATION_FALLBACKS = void 0;
exports.normalizeB2cSliderDefinition = normalizeB2cSliderDefinition;
exports.calculateScenarioResult = calculateScenarioResult;
exports.calculateScenarioResultDifference = calculateScenarioResultDifference;
const htwAutarky_1 = require("./htwAutarky");
const DAYS_PER_YEAR = 365;
const INTERVALS_PER_DAY = 96;
const PROFILE_INTERVAL_HOURS = 0.25;
const PROFILE_INTERVAL_COUNT = DAYS_PER_YEAR * INTERVALS_PER_DAY;
const HOURS_PER_YEAR = DAYS_PER_YEAR * 24;
const FULL_CIRCLE = Math.PI * 2;
const B2C_CENTI_KW_SCALE = 100;
const B2C_CENTI_KW_RAW_MIN = 50;
const B2C_CENTI_KW_RAW_MAX = 1000;
const B2C_PEAK_LOAD_MIN_KW = 0.5;
const B2C_HOUSEHOLD_PEAK_ALLOWANCE_KW = 30;
const B2C_WALLBOX_POWER_KW = 11;
const B2C_MIN_PEAK_TO_AVERAGE_RATIO = 1.05;
const FALLBACK_PEAK_TO_AVERAGE_RATIO = 3;
exports.B2C_CALCULATION_FALLBACKS = {
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
};
const parameterAliases = {
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
};
const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
const safeNumber = (value) => typeof value === 'number' && Number.isFinite(value) ? Math.max(0, value) : 0;
function normalizeKey(value) {
    return value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/ß/g, 'ss')
        .toLowerCase();
}
function isPeakLoadKey(value) {
    const normalizedKey = normalizeKey(value);
    return normalizedKey === 'lastspitze' || normalizedKey === 'peakloadkw';
}
function isCentiKwPeakSlider(slider) {
    const normalizedUnit = normalizeKey(slider.unit || '');
    return (isPeakLoadKey(slider.key) &&
        normalizedUnit === 'kw' &&
        slider.min >= B2C_CENTI_KW_RAW_MIN &&
        slider.max <= B2C_CENTI_KW_RAW_MAX &&
        slider.step >= 1);
}
function normalizeB2cSliderDefinition(slider) {
    if (!isCentiKwPeakSlider(slider)) {
        return slider;
    }
    return {
        ...slider,
        min: slider.min / B2C_CENTI_KW_SCALE,
        max: slider.max / B2C_CENTI_KW_SCALE,
        step: slider.step / B2C_CENTI_KW_SCALE,
        defaultValue: slider.defaultValue / B2C_CENTI_KW_SCALE,
    };
}
function resolveParameter(parameters, key, warnings) {
    for (const alias of parameterAliases[key]) {
        const value = parameters[alias];
        if (typeof value === 'number' && Number.isFinite(value)) {
            return Math.max(0, value);
        }
    }
    warnings.push(`CMS-Parameter "${key}" fehlt; Fallback wird verwendet.`);
    return exports.B2C_CALCULATION_FALLBACKS[key];
}
function resolveCalculationParameters(parameters, warnings) {
    return {
        pvSizeKwp: resolveParameter(parameters, 'pvSizeKwp', warnings),
        specificYieldKwhPerKwp: resolveParameter(parameters, 'specificYieldKwhPerKwp', warnings),
        electricityPriceEurPerKwh: resolveParameter(parameters, 'electricityPriceEurPerKwh', warnings),
        feedInTariffEurPerKwh: resolveParameter(parameters, 'feedInTariffEurPerKwh', warnings),
        evDemandPerChargingStationKwh: resolveParameter(parameters, 'evDemandPerChargingStationKwh', warnings),
        smartChargingShiftShare: clamp(resolveParameter(parameters, 'smartChargingShiftShare', warnings), 0, 1),
        batteryPowerKw: resolveParameter(parameters, 'batteryPowerKw', warnings),
        roundTripEfficiency: clamp(resolveParameter(parameters, 'roundTripEfficiency', warnings), 0, 1),
        usableStorageShare: clamp(resolveParameter(parameters, 'usableStorageShare', warnings), 0, 1),
        annualOperatingCostEur: resolveParameter(parameters, 'annualOperatingCostEur', warnings),
    };
}
function normalizePeakLoadKw({ rawPeakLoadKw, totalDemandKwh, chargingStations, warnings, }) {
    const averageLoadKw = totalDemandKwh > 0 ? totalDemandKwh / HOURS_PER_YEAR : 0;
    const fallbackPeakLoadKw = clamp(averageLoadKw * FALLBACK_PEAK_TO_AVERAGE_RATIO, B2C_PEAK_LOAD_MIN_KW, B2C_HOUSEHOLD_PEAK_ALLOWANCE_KW);
    let peakLoadKw = typeof rawPeakLoadKw === 'number' && Number.isFinite(rawPeakLoadKw) && rawPeakLoadKw > 0
        ? rawPeakLoadKw
        : fallbackPeakLoadKw;
    if (peakLoadKw === fallbackPeakLoadKw && rawPeakLoadKw !== fallbackPeakLoadKw) {
        warnings.push('Lastspitze fehlt oder ist ungueltig; plausibler Fallback wird verwendet.');
    }
    const plausibleMaxPeakLoadKw = B2C_HOUSEHOLD_PEAK_ALLOWANCE_KW + chargingStations * B2C_WALLBOX_POWER_KW;
    if (peakLoadKw > plausibleMaxPeakLoadKw &&
        peakLoadKw >= B2C_CENTI_KW_RAW_MIN &&
        peakLoadKw <= B2C_CENTI_KW_RAW_MAX) {
        peakLoadKw /= B2C_CENTI_KW_SCALE;
        warnings.push('Lastspitze wurde als Hundertstel-kW aus dem CMS interpretiert.');
    }
    const minimumPeakLoadForDemandKw = averageLoadKw * B2C_MIN_PEAK_TO_AVERAGE_RATIO;
    if (minimumPeakLoadForDemandKw > 0 && peakLoadKw < minimumPeakLoadForDemandKw) {
        peakLoadKw = minimumPeakLoadForDemandKw;
        warnings.push('Lastspitze lag unter der Jahresverbrauchs-Plausibilitaet und wurde angehoben.');
    }
    if (peakLoadKw < B2C_PEAK_LOAD_MIN_KW) {
        peakLoadKw = B2C_PEAK_LOAD_MIN_KW;
        warnings.push('Lastspitze wurde auf den B2C-Mindestwert begrenzt.');
    }
    if (peakLoadKw > plausibleMaxPeakLoadKw) {
        peakLoadKw = plausibleMaxPeakLoadKw;
        warnings.push('Lastspitze wurde auf den plausiblen B2C-Hoechstwert begrenzt.');
    }
    return peakLoadKw;
}
function scaleProfileToAnnual(profile, annualKwh) {
    const sum = profile.reduce((total, value) => total + value, 0);
    if (sum <= 0 || annualKwh <= 0) {
        return profile;
    }
    const scale = annualKwh / sum;
    for (let index = 0; index < profile.length; index += 1) {
        profile[index] *= scale;
    }
    return profile;
}
function dailyHourDistance(hour, center) {
    const distance = Math.abs(hour - center);
    return Math.min(distance, 24 - distance);
}
function gaussianByHour(hour, center, width) {
    const distance = dailyHourDistance(hour, center);
    return Math.exp(-(distance * distance) / (2 * width * width));
}
function buildHouseholdProfile(annualConsumptionKwh) {
    const profile = new Float64Array(PROFILE_INTERVAL_COUNT);
    for (let day = 0; day < DAYS_PER_YEAR; day += 1) {
        const season = 1 + 0.12 * Math.cos((FULL_CIRCLE * (day - 15)) / DAYS_PER_YEAR);
        const isWeekend = day % 7 === 5 || day % 7 === 6;
        for (let interval = 0; interval < INTERVALS_PER_DAY; interval += 1) {
            const hour = (interval + 0.5) * PROFILE_INTERVAL_HOURS;
            const morning = gaussianByHour(hour, isWeekend ? 8.8 : 7.1, 1.4);
            const midday = gaussianByHour(hour, 13.2, isWeekend ? 3 : 2.2);
            const evening = gaussianByHour(hour, 19.4, 2.3);
            const nightBase = 0.22;
            const shape = nightBase + 0.52 * morning + 0.22 * midday + 0.9 * evening;
            profile[day * INTERVALS_PER_DAY + interval] =
                shape * season * PROFILE_INTERVAL_HOURS;
        }
    }
    return scaleProfileToAnnual(profile, annualConsumptionKwh);
}
function buildEvProfile({ annualEvDemandKwh, chargingStations, smartChargingShiftShare, }) {
    const profile = new Float64Array(PROFILE_INTERVAL_COUNT);
    if (annualEvDemandKwh <= 0 || chargingStations <= 0) {
        return profile;
    }
    const eveningShare = 1 - smartChargingShiftShare;
    const middayShare = smartChargingShiftShare;
    const eveningWidth = 1.7 + Math.min(chargingStations, 6) * 0.12;
    const middayWidth = 2.4 + Math.min(chargingStations, 6) * 0.1;
    for (let day = 0; day < DAYS_PER_YEAR; day += 1) {
        const isWeekend = day % 7 === 5 || day % 7 === 6;
        const weekdayDemandFactor = isWeekend ? 0.72 : 1.11;
        for (let interval = 0; interval < INTERVALS_PER_DAY; interval += 1) {
            const hour = (interval + 0.5) * PROFILE_INTERVAL_HOURS;
            const evening = gaussianByHour(hour, 20.2, eveningWidth) * eveningShare;
            const midday = gaussianByHour(hour, 13.1, middayWidth) * middayShare;
            profile[day * INTERVALS_PER_DAY + interval] =
                (evening + midday) * weekdayDemandFactor * PROFILE_INTERVAL_HOURS;
        }
    }
    return scaleProfileToAnnual(profile, annualEvDemandKwh);
}
function buildPvProfile(annualPvProductionKwh) {
    const profile = new Float64Array(PROFILE_INTERVAL_COUNT);
    for (let day = 0; day < DAYS_PER_YEAR; day += 1) {
        const seasonalAngle = (FULL_CIRCLE * (day - 80)) / DAYS_PER_YEAR;
        const dayLengthHours = 12 + 4.2 * Math.sin(seasonalAngle);
        const seasonalYield = clamp(0.48 + 0.52 * Math.sin(seasonalAngle), 0.08, 1);
        const sunrise = 12 - dayLengthHours / 2;
        const sunset = 12 + dayLengthHours / 2;
        for (let interval = 0; interval < INTERVALS_PER_DAY; interval += 1) {
            const hour = (interval + 0.5) * PROFILE_INTERVAL_HOURS;
            if (hour <= sunrise || hour >= sunset) {
                continue;
            }
            const sunPosition = (Math.PI * (hour - sunrise)) / dayLengthHours;
            const clearSkyShape = Math.sin(sunPosition) ** 1.35;
            profile[day * INTERVALS_PER_DAY + interval] =
                clearSkyShape * seasonalYield * PROFILE_INTERVAL_HOURS;
        }
    }
    return scaleProfileToAnnual(profile, annualPvProductionKwh);
}
function fitDemandProfileToPeak(profile, annualDemandKwh, peakLoadKw) {
    if (annualDemandKwh <= 0 || peakLoadKw <= 0) {
        return profile;
    }
    const averageLoadKw = annualDemandKwh / HOURS_PER_YEAR;
    let currentPeakKw = 0;
    for (const intervalDemandKwh of profile) {
        currentPeakKw = Math.max(currentPeakKw, intervalDemandKwh / PROFILE_INTERVAL_HOURS);
    }
    if (currentPeakKw <= averageLoadKw || peakLoadKw <= averageLoadKw) {
        return scaleProfileToAnnual(profile, annualDemandKwh);
    }
    const factor = (peakLoadKw - averageLoadKw) / (currentPeakKw - averageLoadKw);
    for (let index = 0; index < profile.length; index += 1) {
        const currentLoadKw = profile[index] / PROFILE_INTERVAL_HOURS;
        const adjustedLoadKw = Math.max(0, averageLoadKw + (currentLoadKw - averageLoadKw) * factor);
        profile[index] = adjustedLoadKw * PROFILE_INTERVAL_HOURS;
    }
    return scaleProfileToAnnual(profile, annualDemandKwh);
}
function buildEnergyProfile({ householdDemandKwh, evDemandKwh, pvGenerationKwh, chargingStations, smartChargingShiftShare, peakLoadKw, }) {
    const householdProfile = buildHouseholdProfile(householdDemandKwh);
    const evProfile = buildEvProfile({
        annualEvDemandKwh: evDemandKwh,
        chargingStations,
        smartChargingShiftShare,
    });
    const demandKwh = new Float64Array(PROFILE_INTERVAL_COUNT);
    for (let index = 0; index < PROFILE_INTERVAL_COUNT; index += 1) {
        demandKwh[index] = householdProfile[index] + evProfile[index];
    }
    return {
        demandKwh: fitDemandProfileToPeak(demandKwh, householdDemandKwh + evDemandKwh, peakLoadKw),
        pvKwh: buildPvProfile(pvGenerationKwh),
    };
}
function simulateEnergyProfile({ profile, usesStorage, usableStorageKwh, batteryPowerKw, roundTripEfficiency, }) {
    const chargeEfficiency = Math.sqrt(roundTripEfficiency);
    const maxBatteryEnergyPerIntervalKwh = batteryPowerKw * PROFILE_INTERVAL_HOURS;
    let batterySocKwh = 0;
    let directPvConsumptionKwh = 0;
    let batteryChargeFromPvKwh = 0;
    let batteryDischargeKwh = 0;
    let exportedPvKwh = 0;
    let gridImportKwh = 0;
    for (let index = 0; index < PROFILE_INTERVAL_COUNT; index += 1) {
        const demandKwh = profile.demandKwh[index];
        const pvKwh = profile.pvKwh[index];
        const directConsumptionKwh = Math.min(demandKwh, pvKwh);
        let remainingDemandKwh = demandKwh - directConsumptionKwh;
        let surplusPvKwh = pvKwh - directConsumptionKwh;
        directPvConsumptionKwh += directConsumptionKwh;
        if (usesStorage &&
            usableStorageKwh > 0 &&
            batteryPowerKw > 0 &&
            roundTripEfficiency > 0) {
            const chargeFromPvKwh = Math.min(surplusPvKwh, maxBatteryEnergyPerIntervalKwh, (usableStorageKwh - batterySocKwh) / chargeEfficiency);
            batterySocKwh += chargeFromPvKwh * chargeEfficiency;
            batteryChargeFromPvKwh += chargeFromPvKwh;
            surplusPvKwh -= chargeFromPvKwh;
            const dischargeKwh = Math.min(remainingDemandKwh, maxBatteryEnergyPerIntervalKwh, batterySocKwh);
            batterySocKwh -= dischargeKwh;
            batteryDischargeKwh += dischargeKwh;
            remainingDemandKwh -= dischargeKwh;
        }
        exportedPvKwh += Math.max(0, surplusPvKwh);
        gridImportKwh += Math.max(0, remainingDemandKwh);
    }
    const storageLossKwh = Math.max(0, batteryChargeFromPvKwh - batteryDischargeKwh);
    return {
        directPvConsumptionKwh,
        batteryChargeFromPvKwh,
        batteryDischargeKwh,
        selfSuppliedLoadKwh: directPvConsumptionKwh + batteryDischargeKwh,
        exportedPvKwh,
        gridImportKwh,
        storageLossKwh,
    };
}
function applyHtwAutarkyLimit({ simulated, htwSelfSupplyLimitKwh, pvGenerationKwh, totalDemandKwh, }) {
    if (simulated.selfSuppliedLoadKwh <= htwSelfSupplyLimitKwh) {
        return simulated;
    }
    const selfSuppliedLoadKwh = htwSelfSupplyLimitKwh;
    const directPvConsumptionKwh = Math.min(simulated.directPvConsumptionKwh, selfSuppliedLoadKwh);
    const batteryDischargeKwh = Math.max(0, selfSuppliedLoadKwh - directPvConsumptionKwh);
    const batteryScale = simulated.batteryDischargeKwh > 0
        ? batteryDischargeKwh / simulated.batteryDischargeKwh
        : 0;
    const batteryChargeFromPvKwh = simulated.batteryChargeFromPvKwh * batteryScale;
    const storageLossKwh = Math.max(0, batteryChargeFromPvKwh - batteryDischargeKwh);
    const exportedPvKwh = Math.max(0, pvGenerationKwh - directPvConsumptionKwh - batteryChargeFromPvKwh);
    const gridImportKwh = Math.max(0, totalDemandKwh - selfSuppliedLoadKwh);
    return {
        directPvConsumptionKwh,
        batteryChargeFromPvKwh,
        batteryDischargeKwh,
        selfSuppliedLoadKwh,
        exportedPvKwh,
        gridImportKwh,
        storageLossKwh,
    };
}
function roundEnergy(value) {
    return Math.round(Math.max(0, value));
}
function roundMoney(value) {
    return Math.round(Number.isFinite(value) ? value : 0);
}
function roundPeak(value) {
    return Math.round(value * 10) / 10;
}
function calculateScenarioResult(scenarioType, values, parameters) {
    const warnings = [];
    const resolvedParameters = resolveCalculationParameters(parameters, warnings);
    const householdDemandKwh = safeNumber(values.annualConsumption);
    const storageSizeKwh = safeNumber(values.storageSize);
    const chargingStations = Math.round(safeNumber(values.chargingStations));
    const evDemandKwh = chargingStations * resolvedParameters.evDemandPerChargingStationKwh;
    const totalDemandKwh = householdDemandKwh + evDemandKwh;
    const pvGenerationKwh = resolvedParameters.pvSizeKwp * resolvedParameters.specificYieldKwhPerKwp;
    const usesStorage = scenarioType === 'b2c_pv_speicher' || scenarioType === 'b2c_komplett';
    const usesSmartCharging = scenarioType === 'b2c_komplett';
    const usableStorageKwh = usesStorage
        ? storageSizeKwh * resolvedParameters.usableStorageShare
        : 0;
    const peakLoadKw = normalizePeakLoadKw({
        rawPeakLoadKw: values.peakLoadKw,
        totalDemandKwh,
        chargingStations,
        warnings,
    });
    const profile = buildEnergyProfile({
        householdDemandKwh,
        evDemandKwh,
        pvGenerationKwh,
        chargingStations,
        smartChargingShiftShare: usesSmartCharging
            ? resolvedParameters.smartChargingShiftShare
            : 0,
        peakLoadKw,
    });
    const simulatedResult = simulateEnergyProfile({
        profile,
        usesStorage,
        usableStorageKwh,
        batteryPowerKw: resolvedParameters.batteryPowerKw,
        roundTripEfficiency: resolvedParameters.roundTripEfficiency,
    });
    const htwAutarkyRatio = (0, htwAutarky_1.calculateHtwAutarky)({
        annualDemandKwh: totalDemandKwh,
        pvSizeKwp: resolvedParameters.pvSizeKwp,
        usableStorageKwh,
    });
    const htwSelfSupplyLimitKwh = Math.min(totalDemandKwh, pvGenerationKwh, totalDemandKwh * htwAutarkyRatio);
    const energyResult = applyHtwAutarkyLimit({
        simulated: simulatedResult,
        htwSelfSupplyLimitKwh,
        pvGenerationKwh,
        totalDemandKwh,
    });
    const availableBatteryDischargeKw = usesStorage && usableStorageKwh > 0
        ? usableStorageKwh / PROFILE_INTERVAL_HOURS
        : 0;
    const batteryPeakCoverageKw = usesStorage
        ? Math.min(peakLoadKw, resolvedParameters.batteryPowerKw, availableBatteryDischargeKw)
        : 0;
    const remainingGridPeakKw = Math.max(0, peakLoadKw - batteryPeakCoverageKw);
    const baselineCostEur = totalDemandKwh * resolvedParameters.electricityPriceEurPerKwh;
    const newEnergyCostEur = energyResult.gridImportKwh * resolvedParameters.electricityPriceEurPerKwh;
    const feedInRevenueEur = energyResult.exportedPvKwh * resolvedParameters.feedInTariffEurPerKwh;
    const annualSavingsEur = baselineCostEur -
        newEnergyCostEur +
        feedInRevenueEur -
        resolvedParameters.annualOperatingCostEur;
    const autarkyPercent = totalDemandKwh > 0
        ? clamp((energyResult.gridImportKwh <= 0 ? 1 : 1 - energyResult.gridImportKwh / totalDemandKwh) * 100, 0, 100)
        : 0;
    return {
        totalDemandKwh: roundEnergy(totalDemandKwh),
        householdDemandKwh: roundEnergy(householdDemandKwh),
        evDemandKwh: roundEnergy(evDemandKwh),
        pvGenerationKwh: roundEnergy(pvGenerationKwh),
        directPvConsumptionKwh: roundEnergy(energyResult.directPvConsumptionKwh),
        batteryDischargeKwh: roundEnergy(energyResult.batteryDischargeKwh),
        storageLossKwh: roundEnergy(energyResult.storageLossKwh),
        selfConsumedPvKwh: roundEnergy(energyResult.selfSuppliedLoadKwh),
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
        isPrognosis: true,
        warnings,
    };
}
function calculateScenarioResultDifference(previousScenario, nextScenario) {
    return {
        autarkyDifference: nextScenario.autarkyPercent - previousScenario.autarkyPercent,
        savingsDifference: nextScenario.annualSavingsEur - previousScenario.annualSavingsEur,
    };
}
