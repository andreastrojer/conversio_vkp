# B2C-Matrix als Excel-Modell

Diese Spezifikation bildet die Berechnung aus
`web/src/lib/calculation/scenarioCalculator.ts` nach. Für identische Ergebnisse benötigt Excel
35.040 Viertelstundenzeilen je simuliertem Profil sowie ein Aufwärmjahr für den Speicher.

## 1. Tabellenblatt `Eingaben`

| Zelle | Inhalt | Startwert | Einheit |
| --- | --- | ---: | --- |
| B2 | Jahresverbrauch Haushalt | 5900 | kWh/Jahr |
| B3 | Nominelle Speichergröße | 7 | kWh |
| B4 | Ladepunkte | 1 | Stück |
| B5 | Lastspitze | 1,5 | kW |
| B8 | `pvSizeKwp` | 10 | kWp |
| B9 | `specificYieldKwhPerKwp` | 1050 | kWh/kWp |
| B10 | `electricityPriceEurPerKwh` | 0,3 | EUR/kWh |
| B11 | `feedInTariffEurPerKwh` | 0,06772 | EUR/kWh |
| B12 | `evDemandPerChargingStationKwh` | 2500 | kWh/Jahr |
| B13 | `batteryRoundTripEfficiency` | 0,9 | Dezimalwert |
| B14 | `smartChargingShiftShare` | 0,35 | Dezimalwert |
| B15 | `batteryPowerKw` | 5 | kW |
| B16 | `usableStorageShare` | 0,9 | Dezimalwert |
| B17 | `annualOperatingCostEur` | 0 | EUR/Jahr |

### Abgeleitete Werte

| Zelle | Bedeutung | Deutsche Excel-Formel |
| --- | --- | --- |
| B20 | EV-Jahresverbrauch | `=B4*B12` |
| B21 | Gesamtverbrauch | `=B2+B20` |
| B22 | PV-Jahreserzeugung | `=B8*B9` |
| B23 | Nutzbare Speicherkapazität | `=B3*B16` |
| B24 | Mittlere Leistung | `=B21/8760` |
| B25 | Plausibilisierte Lastspitze | `=MIN(30+B4*11;MAX(0,5;B5;B24*1,05))` |
| B26 | Ladewirkungsgrad | `=WURZEL(B13)` |
| B27 | Entladewirkungsgrad | `=WURZEL(B13)` |
| B28 | Maximale Batterieenergie je Intervall | `=B15*0,25` |
| B29 | Baseline-Stromkosten | `=B21*B10` |

Die aktuelle CMS-Konfiguration verwendet echte kW-Werte für die Lastspitze. Die frühere
Hundertstel-kW-Konvertierung für Werte von 50 bis 500 ist daher nicht erforderlich.

## 2. Bundles

| Bundle | PV | Speicher | Flexibler EV-Anteil |
| --- | --- | --- | --- |
| `b2c_pv` | ja | nein | 0 |
| `b2c_pv_speicher` | ja | ja | 0 |
| `b2c_komplett` | ja | ja | 0; B14/2; B14 |

Beim Komplett-Bundle werden drei Varianten berechnet. Verwendet wird die Variante mit dem
höchsten jährlichen Energiewert.

## 3. Tabellenblatt `Profil`

Zeile 2 bis 35041 entspricht den Intervallen 0 bis 35039.

| Spalte | Inhalt | Formel beziehungsweise Definition |
| --- | --- | --- |
| A | Intervallindex | 0 bis 35039 |
| B | Tag | `=GANZZAHL(A2/96)` |
| C | Viertelstundenindex | `=REST(A2;96)` |
| D | Stunde, Intervallmitte | `=(C2+0,5)*0,25` |
| E | Wochenende | `=ODER(REST(B2;7)=5;REST(B2;7)=6)` |

Hilfsfunktionen:

```text
distance(hour, center) =
  MIN(ABS(hour - center); 24 - ABS(hour - center))

gaussian(hour, center, width) =
  EXP(-(distance(hour, center)^2) / (2 * width^2))
```

### Haushaltsprofil

```text
season =
  1 + 0,12 * COS(2 * PI() * (day - 15) / 365)

morning =
  gaussian(hour; WENN(weekend; 8,8; 7,1); 1,4)

midday =
  gaussian(hour; 13,2; WENN(weekend; 3; 2,2))

evening =
  gaussian(hour; 19,4; 2,3)

householdRaw =
  (0,22 + 0,52 * morning + 0,22 * midday + 0,9 * evening)
  * season
  * 0,25

householdKwh =
  householdRaw / SUMME(householdRaw_alle_35040_Zeilen)
  * Eingaben!B2
```

Bei einem Jahresverbrauch von 0 muss `householdKwh` in allen Zeilen 0 sein.

### Ladepunktprofil

Für das PV- und Speicher-Bundle ist `shiftShare = 0`. Für das Komplett-Bundle werden
`shiftShare = 0`, `B14/2` und `B14` separat gerechnet.

```text
eveningShare = 1 - shiftShare
middayShare = shiftShare

eveningWidth = 1,7 + MIN(chargingStations; 6) * 0,12
middayWidth = 2,4 + MIN(chargingStations; 6) * 0,1
weekdayFactor = WENN(weekend; 0,72; 1,11)

evRaw =
  (
    gaussian(hour; 20,2; eveningWidth) * eveningShare
    + gaussian(hour; 13,1; middayWidth) * middayShare
  )
  * weekdayFactor
  * 0,25

evKwh =
  WENN(Eingaben!B20=0; 0;
    evRaw / SUMME(evRaw_alle_35040_Zeilen) * Eingaben!B20
  )

demandBeforePeakKwh = householdKwh + evKwh
```

### Anpassung an die Lastspitze

Excel benötigt eine veränderbare Zelle `peakFactor`. Sie wird mit Zielwertsuche oder Solver so
bestimmt, dass die gemessene Spitze der plausibilisierten Lastspitze entspricht.

```text
averageLoadKw = Eingaben!B24

adjustedLoadKw =
  MAX(
    0;
    averageLoadKw
    + (demandBeforePeakKwh / 0,25 - averageLoadKw) * peakFactor
  )

adjustedEnergyKwh = adjustedLoadKw * 0,25

demandKwh =
  adjustedEnergyKwh
  / SUMME(adjustedEnergyKwh_alle_35040_Zeilen)
  * Eingaben!B21

measuredPeakKw = MAX(demandKwh_alle_35040_Zeilen) / 0,25
```

Zielwertsuche:

```text
Zielzelle: measuredPeakKw
Zielwert: Eingaben!B25
Veränderbare Zelle: peakFactor
```

Der Code ermittelt denselben Faktor mit 40 Schritten binärer Suche.

### PV-Profil

```text
seasonalAngle = 2 * PI() * (day - 80) / 365
dayLengthHours = 12 + 4,2 * SIN(seasonalAngle)
seasonalYield = MIN(1; MAX(0,08; 0,48 + 0,52 * SIN(seasonalAngle)))
sunrise = 12 - dayLengthHours / 2
sunset = 12 + dayLengthHours / 2

pvRaw =
  WENN(
    ODER(hour <= sunrise; hour >= sunset);
    0;
    SIN(PI() * (hour - sunrise) / dayLengthHours)^1,35
    * seasonalYield
    * 0,25
  )

pvKwh =
  WENN(Eingaben!B22=0; 0;
    pvRaw / SUMME(pvRaw_alle_35040_Zeilen) * Eingaben!B22
  )
```

## 4. Tabellenblatt `Aufwaermjahr`

Das Aufwärmjahr verwendet dasselbe Last- und PV-Profil. Der erste Ladezustand ist 0. Der letzte
Ladezustand dieses Blatts wird als erster Ladezustand des Ergebnisjahres verwendet.

| Spalte | Inhalt | Formel |
| --- | --- | --- |
| A | Intervall | Referenz auf `Profil` |
| B | Verbrauch | `demandKwh` |
| C | PV-Erzeugung | `pvKwh` |
| D | SOC vor Intervall | Zeile 2: `0`, danach vorheriger SOC-Endwert |
| E | Direkte PV | `=MIN(B2;C2)` |
| F | Restverbrauch | `=B2-E2` |
| G | PV-Überschuss | `=C2-E2` |
| H | Batterieladung AC | siehe unten |
| I | Gespeicherte Energie | `=H2*Eingaben!B26` |
| J | SOC nach Laden | `=D2+I2` |
| K | Batterieentladung AC | siehe unten |
| L | Entnommene Batterieenergie | `=K2/Eingaben!B27` |
| M | SOC Ende | `=J2-L2` |
| N | Netzbezug | `=F2-K2` |
| O | Einspeisung | `=G2-H2` |
| P | Ladeverlust | `=H2-I2` |
| Q | Entladeverlust | `=L2-K2` |

Für Bundles mit Speicher:

```text
batteryChargeKwh =
  MIN(
    pvSurplusKwh;
    Eingaben!B28;
    (Eingaben!B23 - socStartKwh) / Eingaben!B26
  )

batteryDischargeKwh =
  MIN(
    remainingDemandKwh;
    Eingaben!B28;
    socAfterChargeKwh * Eingaben!B27
  )
```

Beim PV-Bundle sind Batterieladung und Batterieentladung immer 0.

## 5. Tabellenblatt `Ergebnisjahr`

Die Spalten entsprechen dem Aufwärmjahr. Der Unterschied ist der erste Ladezustand:

```text
SOC_Start_Zeile_2 =
  Aufwaermjahr!SOC_Ende_Zeile_35041
```

Alle folgenden Zeilen verwenden wieder den SOC-Endwert der jeweiligen Vorzeile.

## 6. Tabellenblatt `Ergebnisse`

Die folgenden Summen werden aus dem Ergebnisjahr gebildet:

```text
householdDemandKwh = Eingaben!B2
evDemandKwh = Eingaben!B20
totalDemandKwh = Eingaben!B21
pvGenerationKwh = Eingaben!B22

directPvConsumptionKwh = SUMME(directPv)
batteryChargeKwh = SUMME(batteryCharge)
batteryDischargeKwh = SUMME(batteryDischarge)
storageLossKwh = SUMME(chargeLoss) + SUMME(dischargeLoss)
exportedPvKwh = SUMME(export)
gridImportKwh = SUMME(gridImport)

selfConsumedPvKwh =
  directPvConsumptionKwh + batteryChargeKwh

selfSuppliedLoadKwh =
  directPvConsumptionKwh + batteryDischargeKwh

autarkyPercent =
  WENN(
    totalDemandKwh=0;
    0;
    MIN(1; MAX(0; selfSuppliedLoadKwh / totalDemandKwh))
  )

baselineCostEur =
  totalDemandKwh * electricityPriceEurPerKwh

newEnergyCostEur =
  gridImportKwh * electricityPriceEurPerKwh

feedInRevenueEur =
  exportedPvKwh * feedInTariffEurPerKwh

annualSavingsEur =
  baselineCostEur
  - newEnergyCostEur
  + feedInRevenueEur
  - annualOperatingCostEur
```

Leistungswerte:

```text
availableBatteryDischargeKw = usableStorageKwh / 0,25

batteryPeakCoverageKw =
  MIN(
    peakLoadKw;
    batteryPowerKw;
    availableBatteryDischargeKw
  )

remainingGridPeakKw =
  MAX(0; peakLoadKw - batteryPeakCoverageKw)
```

## 7. Smart-Charging-Auswahl

Für das Komplett-Bundle werden drei vollständige Ergebnisjahre mit den Shift-Anteilen 0,
`smartChargingShiftShare/2` und `smartChargingShiftShare` gerechnet.

```text
annualEnergyValueEur =
  -gridImportKwh * electricityPriceEurPerKwh
  + exportedPvKwh * feedInTariffEurPerKwh
```

Die Variante mit dem höchsten `annualEnergyValueEur` wird verwendet. Bei exakt gleichem
Energiewert gewinnt die Variante mit der höheren selbst versorgten Last.

## 8. Rundung

Die Simulation und alle finanziellen Formeln rechnen ungerundet. Erst die Anzeige wird gerundet:

| Wert | Rundung |
| --- | --- |
| Energie | ganze kWh |
| Geld | ganze EUR |
| Autarkie | ganze Prozentpunkte |
| Leistung und nutzbarer Speicher | eine Nachkommastelle |

## 9. Kontrollgleichungen

Diese Gleichungen müssen bis auf Rundungsdifferenzen immer erfüllt sein:

```text
totalDemandKwh =
  directPvConsumptionKwh
  + batteryDischargeKwh
  + gridImportKwh

pvGenerationKwh =
  directPvConsumptionKwh
  + batteryChargeKwh
  + exportedPvKwh

batteryChargeKwh =
  batteryDischargeKwh
  + storageLossKwh

0 <= autarkyPercent <= 100 %
```

## 10. Kontrollwerte für die aktuellen CMS-Startwerte

| Ergebnis | PV | PV + Speicher | Komplett |
| --- | ---: | ---: | ---: |
| Gesamtverbrauch | 8400 kWh | 8400 kWh | 8400 kWh |
| PV-Erzeugung | 10500 kWh | 10500 kWh | 10500 kWh |
| Direkte PV-Nutzung | 3065 kWh | 3065 kWh | 3203 kWh |
| Batterieladung | 0 kWh | 1589 kWh | 1567 kWh |
| Batterieentladung | 0 kWh | 1431 kWh | 1410 kWh |
| Speicherverlust | 0 kWh | 159 kWh | 157 kWh |
| Einspeisung | 7435 kWh | 5846 kWh | 5729 kWh |
| Netzbezug | 5335 kWh | 3905 kWh | 3786 kWh |
| Autarkie | 36 % | 54 % | 55 % |
| Baseline-Kosten | 2520 EUR | 2520 EUR | 2520 EUR |
| Neue Stromkosten | 1601 EUR | 1171 EUR | 1136 EUR |
| Einspeiseerlös | 504 EUR | 396 EUR | 388 EUR |
| Ersparnis pro Jahr | 1423 EUR | 1744 EUR | 1772 EUR |

## 11. Modellgrenzen

- Die Profile sind synthetisch und keine echten Smart-Meter- oder Wetterdaten.
- Strompreis und Einspeisetarif sind über das gesamte Jahr konstant.
- Investition, Finanzierung, Steuern und Alterung sind nicht enthalten.
- Laufende Kosten werden nur über `annualOperatingCostEur` berücksichtigt.
- Die Berechnung ist eine Prognose und keine Abrechnungsgarantie.
