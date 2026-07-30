# B2B-Matrixberechnung

Die B2B-Matrix verwendet die publizierten Sanity-Eingaben, Rechenparameter, Ergebnismetriken
und Bundle-Szenarien. Die B2C-Viertelstundenberechnung bleibt davon getrennt.

## Eingaben

| CMS-Key | Bedeutung | Einheit |
| --- | --- | --- |
| `annualConsumption` | aktueller Jahresverbrauch des Betriebs | kWh/Jahr |
| `speichergrösse` | nominelle Speicherkapazität | kWh |
| `ladepunkte` | geplante Ladepunkte | Stück |
| `lastspitze` | aktuelle betriebliche Lastspitze | kW |
| `rising` | erwartetes Wachstum | % |

Anders als bei B2C wird `lastspitze` in B2B unverändert als echter kW-Wert verwendet.

## CMS-Parameter

| Parameter | Verwendung |
| --- | --- |
| `usableStorageShare` | nutzbarer Anteil des nominellen Speichers |
| `batteryRoundTripEfficiency` oder `roundTripEfficiency` | Wirkungsgrad des Speichers |
| `batteryPowerKw` | maximale Entladeleistung |
| `annualOperatingCostEur` | jährliche Betriebskosten |
| `smartChargingShiftShare` | maximal verschiebbarer Ladeanteil |
| `backupReserveShare` | für Ersatzstrom reservierter Speicheranteil |
| `evDemandPerChargingStationKwh` | Jahresverbrauch pro Ladepunkt |
| `demandChargeEurPerKwYear` | jährlicher Leistungspreis |
| `growthDemandShare` | Wachstums-Fallback, wenn kein Sliderwert vorhanden ist |

Bei Wachstumswerten größer als `1` wird eine Prozentangabe angenommen. Daher entsprechen sowohl
`15` aus dem Slider als auch `0.15` aus dem Parameter einem Wachstum von 15 Prozent.

## Last- und Spitzenprognose

```text
growthShare = rising / 100
grownBusinessDemandKwh = annualConsumption * (1 + growthShare)
evDemandKwh = chargingStations * evDemandPerChargingStationKwh
totalDemandKwh = grownBusinessDemandKwh + evDemandKwh
```

Für den Ladebedarf wird ein deterministisches Viertelstundenprofil aufgebaut. Dessen höchste
Leistung wird zur gewachsenen Betriebsspitze addiert:

```text
projectedPeakLoadKw =
  peakLoadKw * (1 + growthShare) + uncontrolledEvPeakKw
```

Damit stammen Jahresverbrauch, Wachstum, Ladebedarf und Lastspitze jeweils genau einmal aus den
CMS-Eingaben.

## Speicher und Reserve

```text
usableStorageKwh = storageSizeKwh * usableStorageShare
backupReserveKwh = usableStorageKwh * backupReserveShare
dispatchableStorageKwh = usableStorageKwh - backupReserveKwh
dischargeEfficiency = sqrt(roundTripEfficiency)

availableBatteryDischargeKw =
  dispatchableStorageKwh * dischargeEfficiency / 0.25h

batteryPeakCoverageKw =
  min(peakAfterSmartChargingKw, batteryPowerKw, availableBatteryDischargeKw)
```

Die Ersatzstromreserve steht nicht für die Lastspitzenreduktion zur Verfügung.

## Smart Charging

Für `b2b_wachstum_mobilitaet` wird der im CMS konfigurierte verschiebbare Ladeanteil geprüft.
Verglichen werden 0 Prozent, die Hälfte und der vollständige Anteil. Verwendet wird ausschließlich
eine Variante, die die Ladepunktspitze reduziert. Ohne Ladepunkte gibt es keinen Smart-Charging-
Bonus.

```text
peakLoadReductionKw =
  smartChargingPeakReductionKw + batteryPeakCoverageKw

remainingGridPeakKw =
  projectedPeakLoadKw - peakLoadReductionKw
```

Die Reduktion wird auf die projizierte Spitze begrenzt.

## Bundles

| Szenario-Typ | Speicher | Smart Charging |
| --- | --- | --- |
| `b2b_einstieg` | nein | nein |
| `b2b_autark_abgesichert` | ja | nein |
| `b2b_wachstum_mobilitaet` | ja | ja |

`b2b_einstieg` erhält ohne Speicher keine rechnerische Lastspitzenreduktion. Es werden keine
pauschalen Bundle-Boni addiert.

## Leistungspreis und Anzeige

```text
demandChargeSavingsEur =
  peakLoadReductionKw * demandChargeEurPerKwYear

annualSavingsEur =
  demandChargeSavingsEur - annualOperatingCostEur
```

Welche Ergebnisse auf den Bundle-Karten erscheinen, wird über `calculatorConfig.resultMetrics`
gesteuert. Aktuell ist für B2B die Metrik `lastspitzenreduktion` ausgewählt. Wird später eine
unterstützte Metrik wie Autarkie oder Ersparnis im CMS ausgewählt, folgt die Anzeige dieser
Konfiguration ohne fest verdrahtete B2B-Beschriftung.

