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
  key:
    | 'annualConsumption'
    | 'storageSize'
    | 'chargingStations'
    | 'speichergrösse'
    | 'speichergroesse'
    | 'ladestationen'
    | 'ladepunkte'
    | 'lastspitze'
    | string
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

export type DocumentSelectionConfig = {
  documentsHeadline?: string
  emailLabel?: string
  sendButtonLabel?: string
  emptyDocumentsText?: string
  emailTemplate?: EmailTemplate
}

export type SalesDocument = SanityDocumentBase & {
  _type: 'salesDocument'
  title: string
  description?: string
  documentType?: 'product' | 'category' | 'reference' | 'funding' | 'followUp' | 'other'
  targetGroup?: 'b2c' | 'b2b' | 'both'
  version?: string
  status?: 'draft' | 'active' | 'archived'
  sortOrder?: number
  isActive?: boolean
}

export type EmailTemplate = SanityDocumentBase & {
  _type: 'emailTemplate'
  title: string
  templateType?: 'customer' | 'internal' | 'followUp' | 'appointment'
  targetGroup?: 'b2c' | 'b2b' | 'both'
  subject: string
  body?: string
  placeholders?: string[]
  includeSignature?: boolean
  signatureHint?: string
  sortOrder?: number
  isActive?: boolean
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
