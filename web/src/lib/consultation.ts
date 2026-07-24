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

function htmlCell(value: string | number | undefined) {
  const text = value === undefined ? '' : String(value)

  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function formatInteger(value: number) {
  return new Intl.NumberFormat('de-AT', {maximumFractionDigits: 0}).format(Math.round(value))
}

function formatDecimal(value: number) {
  return new Intl.NumberFormat('de-AT', {maximumFractionDigits: 1}).format(value)
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('de-AT', {
    currency: 'EUR',
    maximumFractionDigits: 0,
    style: 'currency',
  }).format(Math.round(value))
}

function formatPercentValue(value: number) {
  return `${formatInteger(value)} %`
}

function normalizeExportKey(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ß/g, 'ss')
    .toLowerCase()
}

function formatMatrixValue(key: string, value: number) {
  const normalizedKey = normalizeExportKey(key)

  if (normalizedKey === 'annualconsumption') {
    return {
      label: 'Jahresverbrauch',
      value: `${formatInteger(value)} kWh/Jahr`,
    }
  }

  if (
    normalizedKey === 'storagesize' ||
    normalizedKey === 'speichergroesse' ||
    normalizedKey === 'speichergrosse'
  ) {
    return {
      label: 'Speichergröße',
      value: `${formatDecimal(value)} kWh`,
    }
  }

  if (
    normalizedKey === 'chargingstations' ||
    normalizedKey === 'ladestationen' ||
    normalizedKey === 'ladepunkte'
  ) {
    return {
      label: 'Ladepunkte',
      value: formatInteger(value),
    }
  }

  if (normalizedKey === 'peakloadkw' || normalizedKey === 'lastspitze') {
    return {
      label: 'Lastspitze',
      value: `${formatDecimal(value)} kW`,
    }
  }

  return {
    label: key,
    value: Number.isInteger(value) ? formatInteger(value) : formatDecimal(value),
  }
}

function formatCustomerType(value: CustomerGroup | undefined) {
  if (value === 'b2b') {
    return 'Geschäftskunden'
  }

  if (value === 'b2c') {
    return 'Privatkunden'
  }

  return ''
}

function exportRow(label: string, value?: string | number, valueClassName = '') {
  return `<tr><td class="label">${htmlCell(label)}</td><td class="value ${valueClassName}">${htmlCell(value)}</td></tr>`
}

function exportSection(title: string) {
  return `<tr><td class="section" colspan="2">${htmlCell(title)}</td></tr>`
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

export function buildCrmSpreadsheetHtml({
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
  const matrixRows = Object.entries(consultation.matrixValues)
    .map(([key, value]) => formatMatrixValue(key, value))
    .map(({label, value}) => exportRow(label, value))
    .join('')
  const includedItemRows = (consultation.selectedBundle?.includedItems || [])
    .map((item) => exportRow(item.amount || '-', item.label))
    .join('')
  const documentRows = selectedDocumentTitles.length
    ? selectedDocumentTitles.map((title, index) => exportRow(`Produktblatt ${index + 1}`, title)).join('')
    : exportRow('Produktblätter', 'Keine Auswahl')
  const generatedAt = new Intl.DateTimeFormat('de-AT', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date())

  return `\uFEFF<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <style>
      body {
        background: #ffffff;
        color: #3d4248;
        font-family: Arial, Helvetica, sans-serif;
        font-size: 12px;
      }

      table {
        border-collapse: collapse;
        min-width: 720px;
      }

      td {
        border: 1px solid #d8dde2;
        padding: 8px 10px;
        vertical-align: top;
      }

      .title {
        background: #3d4248;
        color: #ffffff;
        font-size: 20px;
        font-weight: 700;
        letter-spacing: 0.5px;
        padding: 14px 12px;
      }

      .subtitle {
        background: #f4f5f6;
        color: #5d646b;
        font-size: 11px;
        padding: 7px 10px;
      }

      .section {
        background: #efb804;
        color: #3d4248;
        font-size: 13px;
        font-weight: 700;
        text-transform: uppercase;
      }

      .label {
        background: #f7f8f9;
        color: #3d4248;
        font-weight: 700;
        width: 230px;
      }

      .value {
        background: #ffffff;
        color: #1f2428;
        width: 490px;
      }

      .metric {
        color: #167047;
        font-size: 14px;
        font-weight: 700;
      }

      .money {
        color: #167047;
        font-size: 14px;
        font-weight: 700;
      }
    </style>
  </head>
  <body>
    <table>
      <tr><td class="title" colspan="2">Conversio CRM Export</td></tr>
      <tr><td class="subtitle" colspan="2">Erstellt am ${htmlCell(generatedAt)} · Quelle: Conversio Web-App</td></tr>
      ${exportSection('Kunde')}
      ${exportRow('Kundenname', consultation.customer?.name)}
      ${exportRow('Telefon', consultation.customer?.phone)}
      ${exportRow('E-Mail', recipientEmail || consultation.customer?.email)}
      ${exportRow('Kundengruppe', formatCustomerType(consultation.customerType))}
      ${exportSection('Beratung')}
      ${exportRow('Bundle', consultation.selectedBundle?.title)}
      ${exportRow('Scenario-ID', consultation.selectedBundle?.id)}
      ${exportRow('Scenario-Typ', consultation.selectedBundle?.scenarioType)}
      ${exportRow('Status', 'Unterlagen vorbereitet')}
      ${exportSection('Ergebnis')}
      ${exportRow('Autarkiegrad', consultation.calculationResult ? formatPercentValue(consultation.calculationResult.autarkyPercent) : undefined, 'metric')}
      ${exportRow('Ersparnis pro Jahr', consultation.calculationResult ? formatCurrency(consultation.calculationResult.annualSavingsEur) : undefined, 'money')}
      ${exportSection('Matrixwerte')}
      ${matrixRows || exportRow('Matrixwerte', 'Keine Werte gespeichert')}
      ${exportSection('Enthaltene Leistungen')}
      ${includedItemRows || exportRow('Leistungen', 'Keine Leistungen gespeichert')}
      ${exportSection('Ausgewählte Produktblätter')}
      ${documentRows}
      ${exportSection('Mitarbeiter')}
      ${exportRow('Mitarbeiter', salesPersonName || '')}
      ${exportRow('Mitarbeiter E-Mail', salesPersonEmail || '')}
    </table>
  </body>
</html>`
}
