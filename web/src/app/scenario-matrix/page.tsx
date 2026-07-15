import {ScenarioMatrixScreen} from '@/components/screens/ScenarioMatrixScreen'
import {auth} from '@/lib/auth'
import type {CustomerGroup} from '@/lib/customerSelection'
import {getScenarioMatrixPageData} from '@/lib/scenarioMatrix'
import {redirect} from 'next/navigation'

type ScenarioMatrixPageProps = {
  searchParams: Promise<{
    type?: string | string[]
  }>
}

function resolveCustomerType(value: string | string[] | undefined): CustomerGroup {
  const normalizedValue = Array.isArray(value) ? value[0] : value

  return normalizedValue === 'b2b' ? 'b2b' : 'b2c'
}

export default async function ScenarioMatrixPage({searchParams}: ScenarioMatrixPageProps) {
  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

  const {type} = await searchParams
  const customerType = resolveCustomerType(type)
  const content = await getScenarioMatrixPageData(customerType)

  return <ScenarioMatrixScreen customerType={customerType} {...content} />
}
