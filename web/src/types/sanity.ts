export type SanityDocumentBase = {
  _id: string
  _type: string
  _createdAt?: string
  _updatedAt?: string
}

export type SiteSettings = SanityDocumentBase & {
  _type: 'siteSettings'
  title?: string
  companyName?: string
}

export type CalculatorSlider = {
  _key: string
  label?: string
  key: string
  min: number
  max: number
  step: number
  defaultValue: number
  unit?: string
}

export type CmsCalculationParameter = {
  _key: string
  key: string
  label?: string
  value: number
  unit?: string
}

export type MatrixScenario = {
  _id: string
  title: string
  scenarioType:
  | 'b2c_pv'
  | 'b2c_pv_speicher'
  | 'b2c_komplett'
  sortOrder?: number
  isActive?: boolean
  resultText?: string
  nextStepText?: string
  includedItems?: Array<{
    _key: string
    amount?: string
    label: string
  }>
}

export type ScenarioCalculationDisplay = {
  autarkyPercent: number
  annualSavingsEur: number
}
