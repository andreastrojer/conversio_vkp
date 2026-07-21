const GRID = [
  0, 0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 2.25, 2.5,
] as const

// Zeilen: nutzbare Speicherkapazität in kWh/MWh
// Spalten: PV-Leistung in kWp/MWh
const AUTARKY_TABLE = [
  [0, 0.17, 0.24, 0.28, 0.30, 0.32, 0.34, 0.35, 0.36, 0.37, 0.37],
  [0, 0.22, 0.32, 0.37, 0.39, 0.41, 0.43, 0.44, 0.45, 0.46, 0.46],
  [0, 0.24, 0.37, 0.42, 0.45, 0.47, 0.49, 0.50, 0.51, 0.52, 0.53],
  [0, 0.24, 0.40, 0.47, 0.51, 0.53, 0.55, 0.56, 0.58, 0.59, 0.60],
  [0, 0.24, 0.43, 0.51, 0.56, 0.59, 0.61, 0.62, 0.64, 0.65, 0.66],
  [0, 0.24, 0.44, 0.55, 0.60, 0.63, 0.65, 0.67, 0.68, 0.69, 0.70],
  [0, 0.24, 0.45, 0.57, 0.63, 0.66, 0.69, 0.70, 0.72, 0.73, 0.74],
  [0, 0.24, 0.46, 0.59, 0.65, 0.69, 0.71, 0.73, 0.75, 0.76, 0.77],
  [0, 0.24, 0.46, 0.59, 0.66, 0.70, 0.73, 0.75, 0.76, 0.78, 0.79],
  [0, 0.24, 0.46, 0.60, 0.67, 0.71, 0.74, 0.76, 0.78, 0.79, 0.80],
  [0, 0.24, 0.46, 0.61, 0.67, 0.71, 0.74, 0.77, 0.79, 0.80, 0.81],
] as const

type AutarkyInput = {
  annualDemandKwh: number
  pvSizeKwp: number
  usableStorageKwh: number
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max)

function getInterpolationPosition(value: number) {
  const clampedValue = clamp(value, GRID[0], GRID[GRID.length - 1])

  // Bei 2,5 muss zwischen Index 9 und 10 mit t = 1 interpoliert werden.
  const lowerIndex = Math.min(
    Math.floor(clampedValue / 0.25),
    GRID.length - 2,
  )

  const upperIndex = lowerIndex + 1
  const lowerValue = GRID[lowerIndex]
  const upperValue = GRID[upperIndex]

  const factor =
    upperValue === lowerValue
      ? 0
      : (clampedValue - lowerValue) / (upperValue - lowerValue)

  return {
    lowerIndex,
    upperIndex,
    factor: clamp(factor, 0, 1),
  }
}

export function calculateHtwAutarky({
  annualDemandKwh,
  pvSizeKwp,
  usableStorageKwh,
}: AutarkyInput): number {
  if (
    !Number.isFinite(annualDemandKwh) ||
    !Number.isFinite(pvSizeKwp) ||
    !Number.isFinite(usableStorageKwh) ||
    annualDemandKwh <= 0
  ) {
    return 0
  }

  const annualDemandMwh = annualDemandKwh / 1000

  const pvRatio = clamp(pvSizeKwp / annualDemandMwh, 0, 2.5)
  const storageRatio = clamp(
    Math.max(usableStorageKwh, 0) / annualDemandMwh,
    0,
    2.5,
  )

  const x = getInterpolationPosition(pvRatio)
  const y = getInterpolationPosition(storageRatio)

  const q11 = AUTARKY_TABLE[y.lowerIndex][x.lowerIndex]
  const q21 = AUTARKY_TABLE[y.lowerIndex][x.upperIndex]
  const q12 = AUTARKY_TABLE[y.upperIndex][x.lowerIndex]
  const q22 = AUTARKY_TABLE[y.upperIndex][x.upperIndex]

  const lowerInterpolation =
    q11 + (q21 - q11) * x.factor

  const upperInterpolation =
    q12 + (q22 - q12) * x.factor

  return clamp(
    lowerInterpolation +
    (upperInterpolation - lowerInterpolation) * y.factor,
    0,
    1,
  )
}