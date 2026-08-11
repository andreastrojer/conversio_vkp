import {
  auth,
  getMicrosoftAccessToken,
} from '@/lib/auth'
import {
  isCustomerGroup,
  isValidEmail,
  normalizeCalculationResult,
  normalizeCustomer,
  sanitizeSalesDocumentIds,
  validateConsultationCustomer,
  type ConsultationCalculationResult,
  type ConsultationCustomer,
} from '@/lib/consultation'
import type {CustomerGroup} from '@/lib/customerSelection'
import {
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
  scenarioId: string
  selectedSalesDocumentIds: string[]
  customer: ConsultationCustomer
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

type UnknownRecord = Record<string, unknown>

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

  if (!scenarioId) {
    fail('Das ausgewählte Scenario fehlt.')
  }

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
    scenarioId,
    selectedSalesDocumentIds,
    customer,
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

function formatCalculation(result: ConsultationCalculationResult | undefined) {
  if (!result) {
    return ''
  }

  const numberFormatter = new Intl.NumberFormat('de-AT', {maximumFractionDigits: 1})

  return [
    result.autarkyPercent !== undefined
      ? `Autarkie: ${Math.round(result.autarkyPercent)}%`
      : '',
    result.annualSavingsEur !== undefined
      ? `Ersparnis: ${Math.round(result.annualSavingsEur)} EUR pro Jahr`
      : '',
    result.peakLoadReductionKw !== undefined
      ? `Lastspitzenreduktion: ${numberFormatter.format(result.peakLoadReductionKw)} kW`
      : '',
    result.pvSizeKwp !== undefined
      ? `PV-Leistung: ${numberFormatter.format(result.pvSizeKwp)} kWp`
      : '',
    result.storageSizeKwh !== undefined
      ? `Speichergröße: ${numberFormatter.format(result.storageSizeKwh)} kWh`
      : '',
    result.chargingStations !== undefined
      ? `Ladepunkte: ${Math.round(result.chargingStations)}`
      : '',
  ].filter(Boolean).join('\n')
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
        `<div style="margin:0 0 14px 0;">${paragraph.replace(/\n/g, '<br>')}</div>`,
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
}: {
  src?: string
  alt: string
  width: number
  maxWidth: number
}) {
  if (!src) {
    return ''
  }

  return [
    `<img src="${escapeHtml(src)}"`,
    `alt="${escapeHtml(alt)}"`,
    `width="${width}"`,
    `style="display:block;width:100%;max-width:${maxWidth}px;height:auto;border:0;outline:none;text-decoration:none;"`,
    '/>',
  ].join(' ')
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
  })
  const banner = buildHtmlImage({
    src: template?.signatureBannerUrl,
    alt: template?.signatureBannerAlt || '',
    width: 760,
    maxWidth: 760,
  })
  const signatureHint = template?.signatureHint
    ? `<div style="font-size:12px;line-height:17px;color:#59616a;margin-top:18px;">${formatTextAsHtml(template.signatureHint)}</div>`
    : ''

  return `
    <table role="presentation" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-top:30px;width:100%;max-width:760px;">
      <tr>
        <td style="font-family:Arial,Helvetica,sans-serif;color:#2f3439;padding:0;">
          <div style="font-size:18px;line-height:24px;margin:0 0 32px 0;">${escapeHtml(intro)}</div>
          <div style="font-size:18px;line-height:24px;font-weight:400;margin:0;">${escapeHtml(salesPersonName)}</div>
          ${contactLines}
          ${logo ? `<div style="margin-top:30px;max-width:300px;">${logo}</div>` : ''}
          ${banner ? `<div style="margin-top:34px;max-width:760px;">${banner}</div>` : ''}
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

  return `
    <!doctype html>
    <html>
      <body style="margin:0;padding:0;background:#ffffff;">
        <div style="font-family:Arial,Helvetica,sans-serif;color:#2f3439;font-size:15px;line-height:22px;max-width:760px;">
          ${formatTextAsHtml(baseBody)}
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
    '',
    'Scenario: {{selectedScenario}}',
    '',
    'Produktblätter:',
    '{{selectedDocuments}}',
    '',
    '{{calculationSummary}}',
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
    const documentSelection = await fetchScenarioDocumentSelection({
      customerType: payload.customerType,
      scenarioId: payload.scenarioId,
    })

    if (!documentSelection) {
      fail('Das ausgewählte Scenario ist nicht freigegeben oder wurde nicht gefunden.')
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
