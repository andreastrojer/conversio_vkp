import {NextStepScreen} from '@/components/screens/NextStepScreen'
import {auth} from '@/lib/auth'
import type {CustomerGroup} from '@/lib/customerSelection'
import {getNextStepPageData, parseNextStepSliderValues} from '@/lib/nextStep'
import {redirect} from 'next/navigation'

type NextStepPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

function resolveCustomerType(value: string | string[] | undefined): CustomerGroup {
  const normalizedValue = Array.isArray(value) ? value[0] : value

  return normalizedValue === 'b2b' ? 'b2b' : 'b2c'
}

export default async function NextStepPage({searchParams}: NextStepPageProps) {
  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

  const resolvedSearchParams = await searchParams
  const customerType = resolveCustomerType(resolvedSearchParams.type)
  const bundle = Array.isArray(resolvedSearchParams.bundle)
    ? resolvedSearchParams.bundle[0]
    : resolvedSearchParams.bundle
  const sliderValues = parseNextStepSliderValues(resolvedSearchParams)
  const content = await getNextStepPageData({customerType, bundleId: bundle, sliderValues})

  return <NextStepScreen {...content} />
}
