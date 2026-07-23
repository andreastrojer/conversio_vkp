import type {CustomerGroup} from '@/lib/customerSelection'
import type {ScenarioMatrixBundle} from '@/lib/scenarioMatrix'

export const CONSULTATION_STORAGE_KEY = 'conversio.consultation'

export type ConsultationCustomer = {
  name: string
  phone: string
  email: string
}

export type ConsultationCalculationResult = {
  autarkyPercent: number
  annualSavingsEur: number
}

export type ConsultationBundle = {
  id: string
  title: string
  slug?: string
  scenarioType?: string
  features: string[]
  includedItems: Array<{
    id: string
    amount?: string
    label: string
  }>
}

export type ConsultationState = {
  customerType?: CustomerGroup
  customer?: ConsultationCustomer
  selectedBundle?: ConsultationBundle
  matrixValues: Record<string, number>
  calculationResult?: ConsultationCalculationResult
  selectedSalesDocumentIds: string[]
  updatedAt?: string
}

export type ConsultationCustomerValidation = {
  success: boolean
  errors: Partial<Record<keyof ConsultationCustomer, string>>
}

type UnknownRecord = Record<string, unknown>

export const defaultConsultationState: ConsultationState = {
  matrixValues: {},
  selectedSalesDocumentIds: [],
}

export function isCustomerGroup(value: unknown): value is CustomerGroup {
  return value === 'b2b' || value === 'b2c'
}

export function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
}

export function normalizeText(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function normalizeFiniteNumber(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined
}

function normalizeStringArray(value: unknown) {
  if (!Array.isArray(value)) {
    return []
  }

  return [...new Set(value.map(normalizeText).filter(Boolean))]
}

function normalizeMatrixValues(value: unknown) {
  if (!isRecord(value)) {
    return {}
  }

  return Object.fromEntries(
    Object.entries(value).flatMap(([key, rawValue]) => {
      const numberValue = normalizeFiniteNumber(rawValue)

      return numberValue === undefined || !key.trim() ? [] : [[key, numberValue]]
    }),
  )
}

export function normalizeCustomer(value: unknown): ConsultationCustomer | undefined {
  if (!isRecord(value)) {
    return undefined
  }

  return {
    name: normalizeText(value.name),
    phone: normalizeText(value.phone),
    email: normalizeText(value.email),
  }
}

export function validateConsultationCustomer(
  customer: ConsultationCustomer | undefined,
  requireEmail: boolean,
): ConsultationCustomerValidation {
  const errors: ConsultationCustomerValidation['errors'] = {}

  if (!customer?.name.trim()) {
    errors.name = 'Bitte einen Kundennamen eingeben.'
  } else if (customer.name.trim().length < 2) {
    errors.name = 'Bitte einen vollständigen Kundennamen eingeben.'
  }

  if (!customer?.phone.trim()) {
    errors.phone = 'Bitte eine Telefonnummer eingeben.'
  } else if (customer.phone.replace(/\D/g, '').length < 6) {
    errors.phone = 'Bitte eine gültige Telefonnummer eingeben.'
  }

  if (requireEmail && !customer?.email.trim()) {
    errors.email = 'Bitte eine Empfänger-E-Mail eingeben.'
  } else if (customer?.email.trim() && !isValidEmail(customer.email)) {
    errors.email = 'Bitte eine gültige E-Mail-Adresse eingeben.'
  }

  return {
    success: Object.keys(errors).length === 0,
    errors,
  }
}

export function normalizeCalculationResult(
  value: unknown,
): ConsultationCalculationResult | undefined {
  if (!isRecord(value)) {
    return undefined
  }

  const autarkyPercent = normalizeFiniteNumber(value.autarkyPercent)
  const annualSavingsEur = normalizeFiniteNumber(value.annualSavingsEur)

  if (autarkyPercent === undefined || annualSavingsEur === undefined) {
    return undefined
  }

  return {
    autarkyPercent,
    annualSavingsEur,
  }
}

export function normalizeBundle(value: unknown): ConsultationBundle | undefined {
  if (!isRecord(value)) {
    return undefined
  }

  const id = normalizeText(value.id)
  const title = normalizeText(value.title)

  if (!id || !title) {
    return undefined
  }

  const includedItems = Array.isArray(value.includedItems)
    ? value.includedItems.flatMap((item, index) => {
        if (!isRecord(item)) {
          return []
        }

        const label = normalizeText(item.label)

        if (!label) {
          return []
        }

        return [{
          id: normalizeText(item.id) || `${id}-included-${index}`,
          amount: normalizeText(item.amount) || undefined,
          label,
        }]
      })
    : []

  return {
    id,
    title,
    slug: normalizeText(value.slug) || undefined,
    scenarioType: normalizeText(value.scenarioType) || undefined,
    features: normalizeStringArray(value.features),
    includedItems,
  }
}

export function normalizeConsultationState(value: unknown): ConsultationState {
  if (!isRecord(value)) {
    return defaultConsultationState
  }

  return {
    customerType: isCustomerGroup(value.customerType) ? value.customerType : undefined,
    customer: normalizeCustomer(value.customer),
    selectedBundle: normalizeBundle(value.selectedBundle),
    matrixValues: normalizeMatrixValues(value.matrixValues),
    calculationResult: normalizeCalculationResult(value.calculationResult),
    selectedSalesDocumentIds: normalizeStringArray(value.selectedSalesDocumentIds),
    updatedAt: normalizeText(value.updatedAt) || undefined,
  }
}

export function bundleToConsultationBundle(bundle: ScenarioMatrixBundle): ConsultationBundle {
  return {
    id: bundle.id,
    title: bundle.title,
    slug: bundle.slug,
    scenarioType: bundle.scenarioType,
    features: bundle.features,
    includedItems: bundle.includedItems,
  }
}

export function sanitizeSalesDocumentIds(ids: string[]) {
  return [...new Set(ids.map((id) => id.trim()).filter(Boolean))]
}

function csvCell(value: string | number | undefined) {
  const text = value === undefined ? '' : String(value)
  const escaped = text.replace(/"/g, '""')

  return `"${escaped}"`
}

export function buildCrmCsv({
  consultation,
  recipientEmail,
  salesPersonName,
  salesPersonEmail,
  selectedDocumentTitles,
}: {
  consultation: ConsultationState
  recipientEmail: string
  salesPersonName?: string | null
  salesPersonEmail?: string | null
  selectedDocumentTitles: string[]
}) {
  const header = [
    'Kundenname',
    'Telefon',
    'E-Mail',
    'Mitarbeiter',
    'Mitarbeiter E-Mail',
    'Bundle',
    'Scenario-ID',
    'Matrixwerte',
    'Autarkie',
    'Ersparnis',
    'Ausgewählte Produktblätter',
    'Quelle',
    'Status',
  ]
  const matrixValues = Object.entries(consultation.matrixValues)
    .map(([key, value]) => `${key}=${value}`)
    .join(' | ')
  const row = [
    consultation.customer?.name,
    consultation.customer?.phone,
    recipientEmail || consultation.customer?.email,
    salesPersonName || '',
    salesPersonEmail || '',
    consultation.selectedBundle?.title,
    consultation.selectedBundle?.id,
    matrixValues,
    consultation.calculationResult?.autarkyPercent,
    consultation.calculationResult?.annualSavingsEur,
    selectedDocumentTitles.join(' | '),
    'Conversio Web-App',
    'Unterlagen vorbereitet',
  ]

  return `\uFEFF${header.map(csvCell).join(';')}\r\n${row.map(csvCell).join(';')}\r\n`
}
