import {
  auth,
  getMicrosoftAccessToken,
} from '@/lib/auth'
import {
  isCustomerGroup,
  isValidEmail,
  normalizeCalculationResult,
  normalizeBundle,
  normalizeCustomer,
  sanitizeSalesDocumentIds,
  validateConsultationCustomer,
  type ConsultationCalculationResult,
  type ConsultationBundle,
  type ConsultationCustomer,
} from '@/lib/consultation'
import type {CustomerGroup} from '@/lib/customerSelection'
import {
  fetchProductDocumentSelection,
  fetchSalesEmailTemplates,
  fetchScenarioDocumentSelection,
  flattenAllowedDocuments,
  type AllowedSalesDocument,
  type SalesEmailTemplate,
} from '@/lib/salesDocuments'
import {NextResponse} from 'next/server'

export const runtime = 'nodejs'

type SendMode = 'mock' | 'graph'

type ValidatedSendDocumentsRequest = {
  recipientEmail: string
  customerType: CustomerGroup
  scenarioId?: string
  selectedSalesDocumentIds: string[]
  customer: ConsultationCustomer
  selectedBundle?: ConsultationBundle
  matrixValues: Record<string, number>
  calculationResult?: ConsultationCalculationResult
}

type PdfAttachment = {
  name: string
  contentType: string
  contentBytes: string
}

type MailBodyContentType = 'Text' | 'HTML'

type MailContent = {
  subject: string
  body: string
  contentType: MailBodyContentType
}

type SalesPersonProfile = {
  jobTitle?: string
  phone?: string
}

type SummaryRow = {
  label: string
  value: string
}

type UnknownRecord = Record<string, unknown>

const signatureLogoLinkUrl = 'https://www.conversiogroup.at/'
const signatureBannerLinkUrl = 'https://conversiumbeg.at/'

class SendDocumentsError extends Error {
  status: number

  constructor(message: string, status = 400) {
    super(message)
    this.status = status
  }
}

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function normalizeText(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function normalizeMatrixValues(value: unknown) {
  if (!isRecord(value)) {
    return {}
  }

  return Object.fromEntries(
    Object.entries(value).flatMap(([key, rawValue]) => {
      const numberValue = typeof rawValue === 'number' && Number.isFinite(rawValue)
        ? rawValue
        : undefined

      return numberValue === undefined || !key.trim() ? [] : [[key, numberValue]]
    }),
  )
}

function fail(message: string, status = 400): never {
  throw new SendDocumentsError(message, status)
}

function resolveSendMode(): SendMode {
  return process.env.EMAIL_SEND_MODE?.trim().toLowerCase() === 'mock'
    ? 'mock'
    : 'graph'
}

async function readRequestBody(request: Request) {
  try {
    return await request.json()
  } catch {
    fail('Die Anfrage enthält kein gültiges JSON.')
  }
}

function parseSelectedDocumentIds(value: unknown) {
  if (!Array.isArray(value)) {
    fail('Bitte mindestens ein Produktblatt auswählen.')
  }

  return sanitizeSalesDocumentIds(
    value.flatMap((item) => (typeof item === 'string' ? [item] : [])),
  )
}

function parseSendDocumentsRequest(value: unknown): ValidatedSendDocumentsRequest {
  if (!isRecord(value)) {
    fail('Die Anfrage ist unvollständig.')
  }

  const recipientEmail = normalizeText(value.recipientEmail)

  if (!isValidEmail(recipientEmail)) {
    fail('Bitte eine gültige Empfänger-E-Mail eingeben.')
  }

  if (!isCustomerGroup(value.customerType)) {
    fail('Die Kundengruppe ist ungültig.')
  }

  const scenarioId = normalizeText(value.scenarioId)

  const selectedSalesDocumentIds = parseSelectedDocumentIds(value.selectedSalesDocumentIds)

  if (selectedSalesDocumentIds.length === 0) {
    fail('Bitte mindestens ein Produktblatt auswählen.')
  }

  const customer = normalizeCustomer(value.customer)
  const customerValidation = validateConsultationCustomer(customer, false)

  if (!customerValidation.success || !customer) {
    fail(Object.values(customerValidation.errors)[0] || 'Die Kundendaten sind unvollständig.')
  }

  return {
    recipientEmail,
    customerType: value.customerType,
    scenarioId: scenarioId || undefined,
    selectedSalesDocumentIds,
    customer,
    selectedBundle: normalizeBundle(value.selectedBundle),
    matrixValues: normalizeMatrixValues(value.matrixValues),
    calculationResult: normalizeCalculationResult(value.calculationResult),
  }
}

function selectRequestedDocuments(
  allowedDocuments: AllowedSalesDocument[],
  selectedSalesDocumentIds: string[],
) {
  const allowedDocumentById = new Map(allowedDocuments.map((document) => [document.id, document]))
  const invalidDocumentIds = selectedSalesDocumentIds.filter((documentId) => !allowedDocumentById.has(documentId))

  if (invalidDocumentIds.length > 0) {
    fail('Mindestens ein ausgewähltes Produktblatt ist für dieses Scenario nicht freigegeben.')
  }

  return selectedSalesDocumentIds.map((documentId) => {
    const document = allowedDocumentById.get(documentId)

    if (!document) {
      fail('Mindestens ein ausgewähltes Produktblatt ist für dieses Scenario nicht freigegeben.')
    }

    return document
  })
}

function sanitizeAttachmentName(document: AllowedSalesDocument) {
  const baseName = document.pdfOriginalFilename || `${document.title}.pdf`
  const sanitizedName = baseName.replace(/[\\/:*?"<>|]+/g, '-').trim() || `${document.id}.pdf`

  return sanitizedName.toLowerCase().endsWith('.pdf')
    ? sanitizedName
    : `${sanitizedName}.pdf`
}

async function fetchPdfAttachment(document: AllowedSalesDocument): Promise<PdfAttachment> {
  let response: Response

  try {
    response = await fetch(document.pdfUrl, {cache: 'no-store'})
  } catch {
    fail(`Das PDF "${document.title}" konnte nicht geladen werden.`, 502)
  }

  if (!response.ok) {
    fail(`Das PDF "${document.title}" konnte nicht geladen werden.`, 502)
  }

  const contentType =
    response.headers.get('content-type') ||
    document.pdfMimeType ||
    'application/pdf'
  const looksLikePdf =
    contentType.toLowerCase().includes('pdf') ||
    document.pdfMimeType?.toLowerCase().includes('pdf') ||
    document.pdfUrl.toLowerCase().includes('.pdf')
  const buffer = Buffer.from(await response.arrayBuffer())

  if (!looksLikePdf || buffer.byteLength === 0) {
    fail(`Das Produktblatt "${document.title}" ist keine gültige PDF-Datei.`, 502)
  }

  return {
    name: sanitizeAttachmentName(document),
    contentType: 'application/pdf',
    contentBytes: buffer.toString('base64'),
  }
}

function formatNumber(value: number, maximumFractionDigits = 1) {
  return new Intl.NumberFormat('de-AT', {maximumFractionDigits}).format(value)
}

function formatInteger(value: number) {
  return new Intl.NumberFormat('de-AT', {maximumFractionDigits: 0}).format(Math.round(value))
}

function formatCalculationRows(result: ConsultationCalculationResult | undefined): SummaryRow[] {
  if (!result) {
    return []
  }

  return [
    result.autarkyPercent !== undefined
      ? {label: 'Autarkie', value: `${formatInteger(result.autarkyPercent)}%`}
      : undefined,
    result.annualSavingsEur !== undefined
      ? {label: 'Ersparnis', value: `${formatInteger(result.annualSavingsEur)} EUR pro Jahr`}
      : undefined,
    result.peakLoadReductionKw !== undefined
      ? {label: 'Lastspitzenreduktion', value: `${formatNumber(result.peakLoadReductionKw)} kW`}
      : undefined,
    result.pvSizeKwp !== undefined
      ? {label: 'PV-Leistung', value: `${formatNumber(result.pvSizeKwp)} kWp`}
      : undefined,
    result.storageSizeKwh !== undefined
      ? {label: 'Speichergröße', value: `${formatNumber(result.storageSizeKwh)} kWh`}
      : undefined,
    result.chargingStations !== undefined
      ? {label: 'Ladepunkte', value: formatInteger(result.chargingStations)}
      : undefined,
  ].filter((row): row is SummaryRow => Boolean(row))
}

function formatCalculation(result: ConsultationCalculationResult | undefined) {
  return formatCalculationRows(result)
    .map((row) => `${row.label}: ${row.value}`)
    .join('\n')
}

function normalizeDisplayKey(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ß/g, 'ss')
    .toLowerCase()
}

function splitBundleItem(item: ConsultationBundle['includedItems'][number]) {
  const amount = item.amount?.trim()
  const label = item.label.trim()

  if (amount) {
    return {amount, label}
  }

  const leadingAmountMatch = label.match(
    /^(\d+(?:[,.]\d+)?\s*(?:kWp|kWh|MWp|MWh|kW|MW|%|x)?)(?:\s+)(.+)$/i,
  )

  if (!leadingAmountMatch) {
    return {amount: '', label}
  }

  return {
    amount: leadingAmountMatch[1].trim(),
    label: leadingAmountMatch[2].trim(),
  }
}

function formatChargingStations(value: number) {
  return `${formatInteger(Math.max(0, value))}x`
}

function formatBundleItems(
  selectedBundle: ConsultationBundle | undefined,
  result: ConsultationCalculationResult | undefined,
): SummaryRow[] {
  if (!selectedBundle) {
    return []
  }

  const configuredRows = selectedBundle.includedItems.map((item) => {
    const display = splitBundleItem(item)
    const labelKey = normalizeDisplayKey(`${display.label} ${item.label}`)
    let value = display.amount

    if (labelKey.includes('photovoltaik') && result?.pvSizeKwp !== undefined) {
      value = `${formatNumber(result.pvSizeKwp)} kWp`
    } else if (labelKey.includes('speicher') && result?.storageSizeKwh !== undefined) {
      value = `${formatNumber(result.storageSizeKwh)} kWh`
    } else if (
      (
        labelKey.includes('ladestation') ||
        labelKey.includes('ladepunkt') ||
        labelKey.includes('wallbox') ||
        labelKey.includes('ladesaule')
      ) &&
      result?.chargingStations !== undefined
    ) {
      value = formatChargingStations(result.chargingStations)
    }

    return {
      label: display.label,
      value: value || 'enthalten',
    }
  })

  if (configuredRows.length > 0 || !result) {
    return configuredRows
  }

  return [
    result.pvSizeKwp !== undefined
      ? {label: 'Photovoltaik', value: `${formatNumber(result.pvSizeKwp)} kWp`}
      : undefined,
    result.storageSizeKwh !== undefined
      ? {label: 'Speicher', value: `${formatNumber(result.storageSizeKwh)} kWh`}
      : undefined,
    result.chargingStations !== undefined
      ? {label: 'Ladestation', value: formatChargingStations(result.chargingStations)}
      : undefined,
  ].filter((row): row is SummaryRow => Boolean(row))
}

function formatSentAt() {
  return new Intl.DateTimeFormat('de-AT', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date())
}

function resolveSalesPersonRole({
  salesPersonProfile,
  template,
}: {
  salesPersonProfile?: SalesPersonProfile
  template?: SalesEmailTemplate
}) {
  return salesPersonProfile?.jobTitle || template?.signatureJobTitle || ''
}

function resolveSalesPersonPhone({
  salesPersonProfile,
  template,
}: {
  salesPersonProfile?: SalesPersonProfile
  template?: SalesEmailTemplate
}) {
  return salesPersonProfile?.phone || template?.signaturePhone || ''
}

function buildSignature({
  salesPersonName,
  salesPersonEmail,
  salesPersonProfile,
  template,
}: {
  salesPersonName: string
  salesPersonEmail: string
  salesPersonProfile?: SalesPersonProfile
  template?: SalesEmailTemplate
}) {
  const salesPersonRole = resolveSalesPersonRole({salesPersonProfile, template})
  const salesPersonPhone = resolveSalesPersonPhone({salesPersonProfile, template})

  return [
    template?.signatureIntro,
    salesPersonName,
    salesPersonRole,
    salesPersonPhone,
    salesPersonEmail,
    template?.signatureHint,
  ].filter(Boolean).join('\n')
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function formatTextAsHtml(value: string) {
  return escapeHtml(value)
    .replace(/\r\n/g, '\n')
    .split('\n\n')
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map(
      (paragraph) =>
        `<div style="margin:0 0 12px 0;">${paragraph.replace(/\n/g, '<br>')}</div>`,
    )
    .join('')
}

function replaceTemplatePlaceholders(
  value: string,
  replacements: Record<string, string>,
) {
  return Object.entries(replacements).reduce(
    (currentValue, [placeholder, replacement]) =>
      currentValue.split(`{{${placeholder}}}`).join(replacement),
    value,
  )
}

type MailContentContext = {
  payload: ValidatedSendDocumentsRequest
  documents: AllowedSalesDocument[]
  scenarioTitle: string
  salesPersonName: string
  salesPersonEmail: string
  salesPersonProfile?: SalesPersonProfile
  template?: SalesEmailTemplate
}

function buildTemplateReplacements({
  payload,
  documents,
  scenarioTitle,
  salesPersonName,
  salesPersonEmail,
  salesPersonProfile,
  template,
}: MailContentContext): Record<string, string> {
  const calculationSummary = formatCalculation(payload.calculationResult)
  const salesPersonRole = resolveSalesPersonRole({salesPersonProfile, template})
  const salesPersonPhone = resolveSalesPersonPhone({salesPersonProfile, template})

  return {
    customerName: payload.customer.name,
    customerEmail: payload.recipientEmail || payload.customer.email,
    customerPhone: payload.customer.phone,
    customerCompany: '',
    salesPersonName,
    salesPersonEmail,
    salesPersonRole,
    salesPersonPhone,
    selectedDocuments: documents.map((document) => `- ${document.title}`).join('\n'),
    selectedScenario: scenarioTitle,
    calculationSummary,
    sentAt: formatSentAt(),
    appointmentDate: '',
    appointmentTime: '',
    appointmentLocation: '',
    autarkyPercent:
      payload.calculationResult?.autarkyPercent !== undefined
        ? `${Math.round(payload.calculationResult.autarkyPercent)}%`
        : '',
    annualSavingsEur:
      payload.calculationResult?.annualSavingsEur !== undefined
        ? `${Math.round(payload.calculationResult.annualSavingsEur)} EUR`
        : '',
  }
}

function buildMailContent({
  payload,
  documents,
  scenarioTitle,
  salesPersonName,
  salesPersonEmail,
  salesPersonProfile,
  template,
  fallbackSubject,
  fallbackBody,
  includeFallbackSignature,
}: MailContentContext & {
  fallbackSubject: string
  fallbackBody: string
  includeFallbackSignature: boolean
}): MailContent {
  const replacements = buildTemplateReplacements({
    payload,
    documents,
    scenarioTitle,
    salesPersonName,
    salesPersonEmail,
    salesPersonProfile,
    template,
  })
  const subject = replaceTemplatePlaceholders(
    template?.subject || fallbackSubject,
    replacements,
  )
  const baseBody = replaceTemplatePlaceholders(template?.body || fallbackBody, replacements)
  const signature = buildSignature({salesPersonName, salesPersonEmail, salesPersonProfile, template})
  const includeSignature = template?.includeSignature ?? includeFallbackSignature

  return {
    subject,
    body: !includeSignature || !signature
      ? baseBody
      : `${baseBody}\n\n${signature}`,
    contentType: 'Text',
  }
}

function buildHtmlImage({
  src,
  alt,
  width,
  maxWidth,
  href,
}: {
  src?: string
  alt: string
  width: number
  maxWidth: number
  href?: string
}) {
  if (!src) {
    return ''
  }

  const image = [
    `<img src="${escapeHtml(src)}"`,
    `alt="${escapeHtml(alt)}"`,
    `width="${width}"`,
    `style="display:block;width:100%;max-width:${maxWidth}px;height:auto;border:0;outline:none;text-decoration:none;"`,
    '/>',
  ].join(' ')

  if (!href) {
    return image
  }

  return `<a href="${escapeHtml(href)}" style="display:block;text-decoration:none;border:0;">${image}</a>`
}

function buildHtmlSummaryRows(rows: SummaryRow[]) {
  return rows.map((row) => `
    <tr>
      <td style="padding:6px 18px 6px 0;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:20px;color:#4d5358;vertical-align:top;">
        ${escapeHtml(row.label)}
      </td>
      <td style="padding:6px 0;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:20px;color:#2f3439;font-weight:600;text-align:right;vertical-align:top;">
        ${escapeHtml(row.value)}
      </td>
    </tr>
  `).join('')
}

function buildHtmlDocumentList(documents: AllowedSalesDocument[]) {
  return documents.map((document) => `
    <div style="margin:0 0 5px 0;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:20px;color:#2f3439;">
      ${escapeHtml(document.title)}
    </div>
  `).join('')
}

function buildHtmlSummaryHeading(value: string) {
  return `
    <div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:21px;font-weight:700;color:#2f3439;margin:18px 0 7px 0;">
      ${escapeHtml(value)}
    </div>
  `
}

function buildCustomerSummarySection({
  payload,
  documents,
  scenarioTitle,
}: MailContentContext) {
  const selectedBundle = payload.selectedBundle
  const bundleRows = formatBundleItems(selectedBundle, payload.calculationResult)
  const calculationRows = formatCalculationRows(payload.calculationResult)
  const contactRows = [
    {label: 'Kunde', value: payload.customer.name},
    {label: 'E-Mail', value: payload.recipientEmail || payload.customer.email},
    payload.customer.phone ? {label: 'Telefon', value: payload.customer.phone} : undefined,
  ].filter((row): row is SummaryRow => Boolean(row))
  const bundleTitle = selectedBundle?.title || scenarioTitle

  return `
    <table role="presentation" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:22px 0 26px 0;width:100%;max-width:760px;border-top:1px solid #d8dcdf;border-bottom:1px solid #d8dcdf;">
      <tr>
        <td style="padding:18px 0 17px 0;font-family:Arial,Helvetica,sans-serif;color:#2f3439;">
          <div style="font-size:16px;line-height:23px;font-weight:700;color:#2f3439;margin:0 0 4px 0;">
            Zusammenfassung
          </div>
          <div style="font-size:15px;line-height:21px;color:#4d5358;margin:0 0 14px 0;">
            ${escapeHtml(bundleTitle)}
          </div>

          <table role="presentation" cellpadding="0" cellspacing="0" style="border-collapse:collapse;width:100%;">
            ${buildHtmlSummaryRows(contactRows)}
          </table>

          ${bundleRows.length > 0 ? `
            ${buildHtmlSummaryHeading('Im Bundle enthalten')}
            <table role="presentation" cellpadding="0" cellspacing="0" style="border-collapse:collapse;width:100%;">
              ${buildHtmlSummaryRows(bundleRows)}
            </table>
          ` : ''}

          ${calculationRows.length > 0 ? `
            ${buildHtmlSummaryHeading('Berechnete Kennwerte')}
            <table role="presentation" cellpadding="0" cellspacing="0" style="border-collapse:collapse;width:100%;">
              ${buildHtmlSummaryRows(calculationRows)}
            </table>
          ` : ''}

          ${buildHtmlSummaryHeading('Produktblätter')}
          ${buildHtmlDocumentList(documents)}
        </td>
      </tr>
    </table>
  `
}

function buildCustomerHtmlSignature({
  salesPersonName,
  salesPersonEmail,
  salesPersonProfile,
  template,
}: MailContentContext) {
  const intro = template?.signatureIntro || 'Liebe Grüße'
  const salesPersonRole = resolveSalesPersonRole({salesPersonProfile, template})
  const salesPersonPhone = resolveSalesPersonPhone({salesPersonProfile, template})
  const contactLines = [
    salesPersonRole
      ? `<div style="font-size:13px;line-height:18px;color:#3f464d;margin-top:3px;">${escapeHtml(salesPersonRole)}</div>`
      : '',
    salesPersonPhone
      ? `<div style="font-size:13px;line-height:18px;color:#3f464d;margin-top:22px;">${escapeHtml(salesPersonPhone)}</div>`
      : '',
    salesPersonEmail
      ? `<div style="font-size:13px;line-height:18px;color:#3f464d;margin-top:4px;">${escapeHtml(salesPersonEmail)}</div>`
      : '',
  ].filter(Boolean).join('')
  const logo = buildHtmlImage({
    src: template?.signatureLogoUrl,
    alt: template?.signatureLogoAlt || 'Conversio',
    width: 300,
    maxWidth: 300,
    href: signatureLogoLinkUrl,
  })
  const banner = buildHtmlImage({
    src: template?.signatureBannerUrl,
    alt: template?.signatureBannerAlt || '',
    width: 760,
    maxWidth: 760,
    href: signatureBannerLinkUrl,
  })
  const signatureHint = template?.signatureHint
    ? `<div style="font-size:12px;line-height:17px;color:#59616a;margin-top:18px;">${formatTextAsHtml(template.signatureHint)}</div>`
    : ''

  return `
    <table role="presentation" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-top:28px;width:100%;max-width:760px;">
      <tr>
        <td style="font-family:Arial,Helvetica,sans-serif;color:#2f3439;padding:0;">
          <div style="font-size:15px;line-height:22px;margin:0 0 24px 0;">${escapeHtml(intro)}</div>
          <div style="font-size:16px;line-height:22px;font-weight:600;margin:0;color:#2f3439;">${escapeHtml(salesPersonName)}</div>
          ${contactLines}
          ${logo ? `<div style="margin-top:24px;max-width:300px;">${logo}</div>` : ''}
          ${banner ? `<div style="margin-top:30px;max-width:760px;">${banner}</div>` : ''}
          ${signatureHint}
        </td>
      </tr>
    </table>
  `
}

function buildCustomerHtmlBody({
  baseBody,
  includeSignature,
  context,
}: {
  baseBody: string
  includeSignature: boolean
  context: MailContentContext
}) {
  const signature = includeSignature ? buildCustomerHtmlSignature(context) : ''
  const summarySection = buildCustomerSummarySection(context)

  return `
    <!doctype html>
    <html>
      <body style="margin:0;padding:0;background:#ffffff;">
        <div style="font-family:Arial,Helvetica,sans-serif;color:#2f3439;font-size:15px;line-height:22px;max-width:760px;">
          ${formatTextAsHtml(baseBody)}
          ${summarySection}
          ${signature}
        </div>
      </body>
    </html>
  `
}

function buildCustomerMailContent(context: MailContentContext): MailContent {
  const fallbackBody = [
    'Guten Tag {{customerName}},',
    '',
    'anbei erhalten Sie die ausgewählten Unterlagen aus der Beratung.',
  ].join('\n').trim()
  const replacements = buildTemplateReplacements(context)
  const subject = replaceTemplatePlaceholders(
    context.template?.subject || `Ihre Conversio Unterlagen: ${context.scenarioTitle}`,
    replacements,
  )
  const baseBody = replaceTemplatePlaceholders(context.template?.body || fallbackBody, replacements)

  return {
    subject,
    body: buildCustomerHtmlBody({
      baseBody,
      includeSignature: context.template?.includeSignature !== false,
      context,
    }),
    contentType: 'HTML',
  }
}

function buildInternalMailContent(context: MailContentContext): MailContent {
  return buildMailContent({
    ...context,
    fallbackSubject: `Unterlagen an ${context.payload.customer.name} versendet`,
    fallbackBody: [
      'Hallo {{salesPersonName}},',
      '',
      'die Unterlagen wurden an den Kunden versendet.',
      '',
      'Kunde: {{customerName}}',
      'Empfänger-E-Mail: {{customerEmail}}',
      'Telefon: {{customerPhone}}',
      'Scenario: {{selectedScenario}}',
      'Versandzeitpunkt: {{sentAt}}',
      '',
      'Produktblätter:',
      '{{selectedDocuments}}',
      '',
      '{{calculationSummary}}',
    ].join('\n').trim(),
    includeFallbackSignature: false,
  })
}

function buildGraphRecipients(emailAddresses: string[]) {
  return emailAddresses.map((address) => ({
    emailAddress: {
      address,
    },
  }))
}

async function readGraphError(response: Response) {
  try {
    const payload = await response.clone().json()
    const message =
      typeof payload?.error?.message === 'string'
        ? payload.error.message
        : typeof payload?.message === 'string'
          ? payload.message
          : ''

    return message.trim()
  } catch {
    try {
      return (await response.text()).trim()
    } catch {
      return ''
    }
  }
}

function getFirstGraphPhone(value: unknown) {
  if (!Array.isArray(value)) {
    return ''
  }

  return normalizeText(value.find((item) => normalizeText(item)))
}

async function fetchSalesPersonProfile(accessToken: string): Promise<SalesPersonProfile> {
  try {
    const response = await fetch(
      'https://graph.microsoft.com/v1.0/me?$select=jobTitle,businessPhones,mobilePhone',
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        cache: 'no-store',
      },
    )

    if (!response.ok) {
      return {}
    }

    const payload = await response.json()

    return {
      jobTitle: normalizeText(payload?.jobTitle) || undefined,
      phone: normalizeText(payload?.mobilePhone) || getFirstGraphPhone(payload?.businessPhones) || undefined,
    }
  } catch {
    return {}
  }
}

async function sendGraphMail({
  accessToken,
  recipientEmail,
  mailContent,
  attachments,
  errorMessage = 'Microsoft Graph hat den Versand abgelehnt. Bitte Berechtigung Mail.Send prüfen.',
}: {
  accessToken: string
  recipientEmail: string
  mailContent: MailContent
  attachments?: PdfAttachment[]
  errorMessage?: string
}) {
  const fileAttachments = attachments || []

  const response = await fetch('https://graph.microsoft.com/v1.0/me/sendMail', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: {
        subject: mailContent.subject,
        body: {
          contentType: mailContent.contentType,
          content: mailContent.body,
        },
        toRecipients: buildGraphRecipients([recipientEmail]),
        attachments: fileAttachments.map((attachment) => ({
          '@odata.type': '#microsoft.graph.fileAttachment',
          name: attachment.name,
          contentType: attachment.contentType,
          contentBytes: attachment.contentBytes,
        })),
      },
      saveToSentItems: true,
    }),
  })

  if (!response.ok) {
    const graphError = await readGraphError(response)
    const details = graphError ? ` (${response.status}: ${graphError})` : ` (${response.status})`

    fail(`${errorMessage}${details}`, 502)
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json(
        {success: false, error: 'Bitte erneut anmelden.'},
        {status: 401},
      )
    }

    const payload = parseSendDocumentsRequest(await readRequestBody(request))
    const documentSelection = payload.scenarioId
      ? await fetchScenarioDocumentSelection({
          customerType: payload.customerType,
          scenarioId: payload.scenarioId,
        })
      : await fetchProductDocumentSelection(payload.customerType)

    if (!documentSelection) {
      fail(
        payload.scenarioId
          ? 'Das ausgewählte Scenario ist nicht freigegeben oder wurde nicht gefunden.'
          : 'Keine freigegebenen Produktblätter gefunden.',
      )
    }

    const selectedDocuments = selectRequestedDocuments(
      flattenAllowedDocuments(documentSelection),
      payload.selectedSalesDocumentIds,
    )
    const attachments = await Promise.all(selectedDocuments.map(fetchPdfAttachment))
    const templates = await fetchSalesEmailTemplates(payload.customerType)
    const salesPersonName = session.user.name?.trim() || 'Conversio'
    const salesPersonEmail = session.user.email?.trim() || ''
    const sendMode = resolveSendMode()
    let salesNotificationSent = false

    if (sendMode === 'graph') {
      const accessToken = await getMicrosoftAccessToken()

      if (!accessToken) {
        fail('Microsoft Graph Access Token fehlt. Bitte erneut anmelden.', 401)
      }

      if (!isValidEmail(salesPersonEmail)) {
        fail('Die E-Mail-Adresse des Vertriebsmitarbeiters fehlt in der Microsoft-Anmeldung.', 400)
      }

      const salesPersonProfile = await fetchSalesPersonProfile(accessToken)
      const baseMailContext = {
        payload,
        documents: selectedDocuments,
        scenarioTitle: documentSelection.scenario.title,
        salesPersonName,
        salesPersonEmail,
        salesPersonProfile,
      }
      const customerMailContent = buildCustomerMailContent({
        ...baseMailContext,
        template: templates.customer,
      })
      const internalMailContent = buildInternalMailContent({
        ...baseMailContext,
        template: templates.internal,
      })

      await sendGraphMail({
        accessToken,
        recipientEmail: payload.recipientEmail,
        mailContent: customerMailContent,
        attachments,
      })

      await sendGraphMail({
        accessToken,
        recipientEmail: salesPersonEmail,
        mailContent: internalMailContent,
        errorMessage:
          'Die Kundenmail wurde versendet, aber die interne Vertriebsbestätigung konnte nicht versendet werden.',
      })

      salesNotificationSent = true
    }

    return NextResponse.json({
      success: true,
      sendMode,
      checkedAttachmentCount: attachments.length,
      salesNotificationSent,
      sentDocumentIds: selectedDocuments.map((document) => document.id),
    })
  } catch (error) {
    if (error instanceof SendDocumentsError) {
      return NextResponse.json(
        {success: false, error: error.message},
        {status: error.status},
      )
    }

    return NextResponse.json(
      {success: false, error: 'Der Versand konnte nicht abgeschlossen werden.'},
      {status: 500},
    )
  }
}
