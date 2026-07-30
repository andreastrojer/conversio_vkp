# B2C-Matrixberechnung

Diese Dokumentation beschreibt die finale Berechnungslogik der B2C-Scenario-Matrix. Oberfläche,
Navigation und CMS-Struktur bleiben unverändert. Die separate B2B-Logik ist in
`b2b-matrix-calculation.md` beschrieben. Das Ergebnis ist eine
deterministische Jahresprognose auf Basis von 35.040 Viertelstundenintervallen.

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
selfSuppliedLoadKwh = directPvConsumptionKwh + batteryDischargeKwh

autarkyPercent = selfSuppliedLoadKwh / totalDemandKwh * 100
```

Gleichwertig gilt:

```text
autarkyPercent =
  (totalDemandKwh - gridImportKwh) / totalDemandKwh * 100
```

Der Wert wird auf `0..100 %` begrenzt. Batterie-Ladeverluste zählen nicht als versorgte Last.

PV-Eigenverbrauch und selbst versorgte Last sind bewusst getrennte Größen:

```text
selfConsumedPvKwh = directPvConsumptionKwh + batteryChargeKwh
selfSuppliedLoadKwh = directPvConsumptionKwh + batteryDischargeKwh
```

Jährliche Ersparnis gegenüber dem Zustand ohne PV und Speicher:

```text
baselineCostEur = totalDemandKwh * electricityPriceEurPerKwh
newEnergyCostEur = gridImportKwh * electricityPriceEurPerKwh
feedInRevenueEur = exportedPvKwh * feedInTariffEurPerKwh

annualSavingsEur =
  baselineCostEur - newEnergyCostEur + feedInRevenueEur - annualOperatingCostEur
```

Es werden keine Investitionskosten und kein B2C-Leistungspreis eingerechnet.

## Viertelstunden-Prognose

Da kein reales Last- und Erzeugungsmessprofil vorliegt, erzeugt die Berechnung ein
deterministisches Viertelstundenprofil:

- Haushaltslast mit Tages-, Wochenend- und Saisonstruktur
- PV-Erzeugung mit Tageslicht- und Saisonprofil
- Ladepunktverbrauch als Abendladung
- im Komplett-Bundle flexibel verschiebbarer Ladepunktanteil zur Tagesmitte
- Speicher-SOC mit Kapazität, Batterieleistung und Roundtrip-Wirkungsgrad

Jedes Profil wird exakt auf seinen jeweiligen Jahreswert skaliert. Bei `0 kWh` beziehungsweise
`0 kWp` wird das Profil vollständig geleert. Die Lastform wird iterativ so angepasst, dass die
plausibilisierte Lastspitze erreicht wird, ohne den Jahresverbrauch zu verändern.

Die frühere HTW-Hartbegrenzung wird nicht mehr auf die Energieflüsse angewendet. Sie konnte den
direkten PV-Verbrauch abhängig von der Speichergröße verändern und damit die Jahresbilanz
verletzen. Der HTW-Unabhängigkeitsrechner ist weiterhin eine sinnvolle Referenz für typische
Haushalte, basiert laut HTW jedoch auf einem Standard-Haushaltsprofil ohne Elektroauto und
Wärmepumpe. Die B2C-Matrix bildet Ladepunkte und deren zeitliche Verschiebung explizit ab und nutzt
deshalb die eigene Viertelstundensimulation als maßgebliches Modell.

Quellen:

- [HTW Berlin: FAQ zum Unabhängigkeitsrechner](https://solar.htw-berlin.de/faq-unabhaengigkeitsrechner/)
- [HTW Berlin: Dimensionierung und Netzintegration von PV-Speichersystemen](https://solar.htw-berlin.de/publikationen/dimensionierung-und-netzintegration-von-pv-speichersystemen/)

## Batterie

Der CMS-Wert für den Roundtrip-Wirkungsgrad wird symmetrisch auf Laden und Entladen verteilt:

```text
chargeEfficiency = sqrt(roundTripEfficiency)
dischargeEfficiency = sqrt(roundTripEfficiency)

chargeEfficiency * dischargeEfficiency = roundTripEfficiency
```

Pro Viertelstunde wird zuerst der gleichzeitige PV-Verbrauch gedeckt. Überschuss lädt die Batterie,
begrenzt durch freie nutzbare Kapazität und Batterieleistung. Verbleibender Verbrauch wird danach
aus der Batterie gedeckt, ebenfalls begrenzt durch Ladezustand und Batterieleistung.

Vor dem ausgewerteten Jahr wird ein vollständiges Aufwärmjahr simuliert. Dessen End-Ladezustand
ist der Start-Ladezustand des Ergebnisjahres. Dadurch entsteht kein künstlicher Vorteil oder
Nachteil durch eine willkürlich leere oder volle Batterie am 1. Januar.

Die beiden zentralen Jahresbilanzen sind:

```text
totalDemandKwh =
  directPvConsumptionKwh + batteryDischargeKwh + gridImportKwh

pvGenerationKwh =
  directPvConsumptionKwh + batteryChargeKwh + exportedPvKwh
```

Die Speicherverluste setzen sich aus Lade- und Entladeverlusten zusammen. Bei periodischem
Jahres-Ladezustand gilt:

```text
batteryChargeKwh =
  batteryDischargeKwh + storageLossKwh
```

## Smart Charging

`smartChargingShiftShare` ist der maximal flexibel verschiebbare Anteil des Ladepunktverbrauchs.
Für das Komplett-Bundle werden keine pauschalen Boni addiert. Die Simulation vergleicht:

```text
0 %
50 % des CMS-Anteils
100 % des CMS-Anteils
```

Verwendet wird die Variante mit dem höchsten jährlichen Energiewert:

```text
annualEnergyValueEur =
  -gridImportKwh * electricityPriceEurPerKwh
  + exportedPvKwh * feedInTariffEurPerKwh
```

Damit erzwingt intelligentes Laden keine ungünstige Verschiebung. Das Komplett-Bundle kann bei
einer Reglerstellung gleich gut, aber nicht schlechter als dasselbe System ohne Smart Charging
sein.

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
- Strompreis und Einspeisetarif gelten im Modell konstant über das gesamte Jahr.
- Investition, Finanzierung, Steuern, Degradation und Wartung außerhalb von
  `annualOperatingCostEur` sind nicht enthalten.
- Angezeigte Prozent- und Euro-Werte werden erst nach der vollständigen Berechnung gerundet.
