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
  fetchSalesEmailTemplate,
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

type MailContent = {
  subject: string
  body: string
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
  return process.env.EMAIL_SEND_MODE?.trim().toLowerCase() === 'graph'
    ? 'graph'
    : 'mock'
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

  return [
    `Autarkie: ${Math.round(result.autarkyPercent)}%`,
    `Ersparnis: ${Math.round(result.annualSavingsEur)} EUR pro Jahr`,
  ].join('\n')
}

function buildSignature({
  salesPersonName,
  salesPersonEmail,
  template,
}: {
  salesPersonName: string
  salesPersonEmail: string
  template?: SalesEmailTemplate
}) {
  return [
    salesPersonName,
    salesPersonEmail,
    template?.signatureHint,
  ].filter(Boolean).join('\n')
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

function buildMailContent({
  payload,
  documents,
  scenarioTitle,
  salesPersonName,
  salesPersonEmail,
  template,
}: {
  payload: ValidatedSendDocumentsRequest
  documents: AllowedSalesDocument[]
  scenarioTitle: string
  salesPersonName: string
  salesPersonEmail: string
  template?: SalesEmailTemplate
}): MailContent {
  const selectedDocuments = documents.map((document) => `- ${document.title}`).join('\n')
  const calculation = formatCalculation(payload.calculationResult)
  const replacements = {
    customerName: payload.customer.name,
    salesPersonName,
    selectedDocuments,
    selectedScenario: scenarioTitle,
    appointmentDate: '',
    autarkyPercent: payload.calculationResult ? `${Math.round(payload.calculationResult.autarkyPercent)}%` : '',
    annualSavingsEur: payload.calculationResult ? `${Math.round(payload.calculationResult.annualSavingsEur)} EUR` : '',
  }
  const subject = replaceTemplatePlaceholders(
    template?.subject || `Ihre Conversio Unterlagen: ${scenarioTitle}`,
    replacements,
  )
  const baseBody = template?.body
    ? replaceTemplatePlaceholders(template.body, replacements)
    : [
        `Guten Tag ${payload.customer.name},`,
        '',
        'anbei erhalten Sie die ausgewählten Unterlagen aus der Beratung.',
        '',
        `Scenario: ${scenarioTitle}`,
        '',
        'Produktblätter:',
        selectedDocuments,
        calculation ? ['', calculation].join('\n') : '',
      ].filter(Boolean).join('\n')
  const signature = buildSignature({salesPersonName, salesPersonEmail, template})

  return {
    subject,
    body: template?.includeSignature === false || !signature
      ? baseBody
      : `${baseBody}\n\n${signature}`,
  }
}

async function sendGraphMail({
  accessToken,
  recipientEmail,
  mailContent,
  attachments,
}: {
  accessToken: string
  recipientEmail: string
  mailContent: MailContent
  attachments: PdfAttachment[]
}) {
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
          contentType: 'Text',
          content: mailContent.body,
        },
        toRecipients: [{
          emailAddress: {
            address: recipientEmail,
          },
        }],
        attachments: attachments.map((attachment) => ({
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
    fail('Microsoft Graph hat den Versand abgelehnt. Bitte Berechtigung Mail.Send prüfen.', 502)
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
    const template = await fetchSalesEmailTemplate(payload.customerType)
    const salesPersonName = session.user.name?.trim() || 'Conversio'
    const salesPersonEmail = session.user.email?.trim() || ''
    const mailContent = buildMailContent({
      payload,
      documents: selectedDocuments,
      scenarioTitle: documentSelection.scenario.title,
      salesPersonName,
      salesPersonEmail,
      template,
    })
    const sendMode = resolveSendMode()

    if (sendMode === 'graph') {
      const accessToken = await getMicrosoftAccessToken()

      if (!accessToken) {
        fail('Microsoft Graph Access Token fehlt. Bitte erneut anmelden.', 401)
      }

      await sendGraphMail({
        accessToken,
        recipientEmail: payload.recipientEmail,
        mailContent,
        attachments,
      })
    }

    return NextResponse.json({
      success: true,
      sendMode,
      checkedAttachmentCount: attachments.length,
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
