# B2C-Matrixberechnung

Diese Dokumentation beschreibt die Berechnungslogik der bestehenden B2C-Scenario-Matrix. Die
Oberfläche, Komponenten, Navigation und CMS-Struktur bleiben unverändert; korrigiert wurden
Einheiten, Datenübergabe und Berechnungslogik.

## Eingaben

Die B2C-Matrix verwendet vier Slider:

| Slider | Bedeutung | Interne Einheit |
| --- | --- | --- |
| Jahresverbrauch | Haushaltsstromverbrauch ohne separat erfasste Ladepunkte | kWh/Jahr |
| Speichergröße | nominelle Batteriekapazität | kWh |
| Ladepunkte | Anzahl berücksichtigter Ladepunkte | Stück |
| Lastspitze | höchste gleichzeitig benötigte Leistung | kW |

Im produktiven CMS-Export war `lastspitze` als `min=50`, `max=500`, `step=10`,
`defaultValue=150`, `unit=kW` gespeichert. Für B2C passt diese Skala nicht zu echten kW,
sondern zu Hundertstel-kW. Deshalb wird diese Sliderdefinition im B2C-Datenfluss zentral zu
`0,5..5,0 kW`, Schritt `0,1 kW`, Startwert `1,5 kW` normalisiert. Ein Rohwert `320` wird
dadurch als `3,2 kW` interpretiert.

## CMS-Parameter

Aktuell verwendete Parameter:

| Parameter | Bedeutung |
| --- | --- |
| `pvSizeKwp` | PV-Leistung in kWp |
| `specificYieldKwhPerKwp` | spezifischer Jahresertrag in kWh/kWp |
| `electricityPriceEurPerKwh` | Netzstrompreis |
| `feedInTariffEurPerKwh` | Einspeisevergütung |
| `evDemandPerChargingStationKwh` | zusätzlicher Jahresverbrauch pro Ladepunkt |
| `smartChargingShiftShare` | verschiebbarer EV-Anteil für intelligentes Laden |
| `roundTripEfficiency` oder `batteryRoundTripEfficiency` | Speicher-Roundtrip-Wirkungsgrad |
| `batteryPowerKw` | maximale Batterie-Leistung |
| `usableStorageShare` | nutzbarer Anteil der nominellen Speicherkapazität |
| `annualOperatingCostEur` | optionale jährliche Betriebskosten |

Im vorhandenen CMS-Export waren `batteryRoundTripEfficiency` und `smartChargingShiftShare`
vorhanden. `batteryPowerKw`, `usableStorageShare` und `annualOperatingCostEur` fehlten; dafür
werden zentral benannte Fallbacks in der Berechnungsdatei verwendet. Core-Parameter wie PV-Größe,
Ertrag und Preise fallen bei Fehlen auf `0`, damit keine verdeckten Demo-Ergebnisse entstehen.

## Formeln

Zusätzlicher Ladepunktverbrauch:

```text
evDemandKwh = chargingStations * evDemandPerChargingStationKwh
```

Gesamtverbrauch:

```text
totalDemandKwh = annualConsumptionKwh + evDemandKwh
```

Der Jahresverbrauch-Slider wird als Haushaltsverbrauch verstanden. Der Verbrauch der Ladepunkte
wird genau einmal addiert, weil Ladepunkte separat als eigener Slider erfasst werden.

PV-Jahresertrag:

```text
pvGenerationKwh = pvSizeKwp * specificYieldKwhPerKwp
```

Nutzbarer Speicher:

```text
usableStorageKwh = storageSizeKwh * usableStorageShare
```

Autarkie:

```text
autarkyPercent =
  (totalDemandKwh - gridImportKwh) / totalDemandKwh * 100
```

Der Wert wird auf `0..100 %` begrenzt.

Jährliche Ersparnis gegenüber dem Zustand ohne PV und Speicher:

```text
baselineCostEur = totalDemandKwh * electricityPriceEurPerKwh
newEnergyCostEur = gridImportKwh * electricityPriceEurPerKwh
feedInRevenueEur = exportedPvKwh * feedInTariffEurPerKwh

annualSavingsEur =
  baselineCostEur - newEnergyCostEur + feedInRevenueEur - annualOperatingCostEur
```

Es werden keine Investitionskosten und kein B2C-Leistungspreis eingerechnet.

## HTW-Autarkie und Prognoseprofil

Die vorhandene HTW-Autarkie-Tabelle bleibt die fachliche Obergrenze für den jährlichen
Autarkiegrad. Sie wird mit bilinearer Interpolation über PV-Leistung pro MWh Jahresverbrauch und
nutzbare Speicherkapazität pro MWh Jahresverbrauch ausgewertet.

Da kein echtes 15-Minuten-Messprofil vorhanden ist, erzeugt die Berechnung zusätzlich ein
deterministisches 15-Minuten-Prognoseprofil:

- Haushaltslast mit Tages-, Wochenend- und Saisonstruktur
- PV-Erzeugung mit Tageslicht- und Saisonprofil
- Ladepunktverbrauch als Abendladung
- im Komplett-Bundle verschiebbarer Ladepunktanteil zur Tagesmitte
- Speicher-SOC mit Kapazität, Batterieleistung und Roundtrip-Wirkungsgrad

Das simulierte Ergebnis wird anschließend durch die HTW-Autarkie begrenzt. Dadurch bleibt das
HTW-Modell erhalten, während Batterieleistung, Lastspitze und Ladepunkt-Zeitverschiebung nicht
pauschal, sondern als physikalische Einschränkungen wirken. Das Ergebnis ist damit eine belastbare
Prognose, keine messwertgenaue Abrechnung.

## Bundles

Die drei B2C-Bundles werden aus ihrer Ausstattung gerechnet:

| Bundle | PV | Speicher | Smart Charging |
| --- | --- | --- | --- |
| `b2c_pv` | ja | nein | nein |
| `b2c_pv_speicher` | ja | ja | nein |
| `b2c_komplett` | ja | ja | ja |

Es gibt keine festen Autarkie- oder Euro-Boni. Die gelben Vergleichswerte sind echte Differenzen:

```text
autarkyDifference = nextScenario.autarkyPercent - previousScenario.autarkyPercent
savingsDifference = nextScenario.annualSavingsEur - previousScenario.annualSavingsEur
```

## Lastspitze

`peakLoadKw` beschreibt die höchste gleichzeitige elektrische Leistung. Sie erzeugt im B2C-Modell
keinen Leistungspreis und keinen Eurobonus.

Sie wird verwendet für:

- Plausibilitätsprüfung und Skalierung
- Anpassung des synthetischen Lastprofils
- Begrenzung der Speicherabdeckung einer Verbrauchsspitze

Peak-Coverage:

```text
availableBatteryDischargeKw = usableStorageKwh / 0.25h

batteryPeakCoverageKw =
  min(peakLoadKw, batteryPowerKw, availableBatteryDischargeKw)

remainingGridPeakKw =
  max(0, peakLoadKw - batteryPeakCoverageKw)
```

Bei `b2c_pv` ist `batteryPeakCoverageKw = 0`, weil kein Speicher enthalten ist.

## Grenzen

- Das Profil ist synthetisch und deterministisch, aber kein reales Messprofil.
- Ladepunkte werden als zusätzlicher Jahresverbrauch modelliert; genaue Fahrzeug-Ladezeiten sind
  nicht messwertbasiert.
- Fehlende technische CMS-Parameter werden zentral mit benannten Fallbacks behandelt.
- Die Lastspitze beeinflusst die jährliche Ersparnis nur über das Prognoseprofil und die
  Batterieleistungsbegrenzung, nicht über einen erfundenen Peak-Shaving-Bonus.
