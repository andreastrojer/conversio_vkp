import {auth} from '@/lib/auth'
import {isCustomerGroup} from '@/lib/consultation'
import {
  fetchScenarioDocumentSelection,
  type ScenarioDocumentCategory,
} from '@/lib/salesDocuments'
import {NextResponse} from 'next/server'

function toPublicCategory(category: ScenarioDocumentCategory) {
  return {
    key: category.key,
    title: category.title,
    documents: category.documents.map((document) => ({
      id: document.id,
      title: document.title,
      description: document.description,
    })),
  }
}

export async function GET(request: Request) {
  const session = await auth()

  if (!session?.user) {
    return NextResponse.json(
      {success: false, error: 'Bitte erneut anmelden.'},
      {status: 401},
    )
  }

  const url = new URL(request.url)
  const customerType = url.searchParams.get('customerType')
  const scenarioId = url.searchParams.get('scenarioId')?.trim()

  if (!isCustomerGroup(customerType) || !scenarioId) {
    return NextResponse.json(
      {success: false, error: 'Scenario oder Kundengruppe fehlt.'},
      {status: 400},
    )
  }

  const selection = await fetchScenarioDocumentSelection({customerType, scenarioId})

  if (!selection) {
    return NextResponse.json(
      {success: false, error: 'Keine freigegebene Dokumentauswahl gefunden.'},
      {status: 404},
    )
  }

  return NextResponse.json({
    success: true,
    scenario: selection.scenario,
    categories: selection.categories.map(toPublicCategory),
  })
}
