import {ProcessScreen} from '@/components/screens/ProcessScreen'
import {auth} from '@/lib/auth'
import type {CustomerGroup} from '@/lib/customerSelection'
import {getProcessPageData} from '@/lib/process'
import {redirect} from 'next/navigation'

type ProcessPageProps = {
  searchParams: Promise<{
    type?: string | string[]
  }>
}

function resolveCustomerType(value: string | string[] | undefined): CustomerGroup {
  const normalizedValue = Array.isArray(value) ? value[0] : value

  return normalizedValue === 'b2b' ? 'b2b' : 'b2c'
}

export default async function ProcessPage({searchParams}: ProcessPageProps) {
  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

  const {type} = await searchParams
  const customerType = resolveCustomerType(type)

  const content = await getProcessPageData(customerType)

  return (
    <ProcessScreen
      customerType={customerType}
      subline={content.subline}
      sections={content.sections}
      activeRingImageUrl={content.activeRingImageUrl}
      inactiveRingImageUrl={content.inactiveRingImageUrl}
      primaryCta={content.primaryCta}
      navigationItems={content.navigationItems}
      logoUrl={content.logoUrl}
      inverseLogoUrl={content.inverseLogoUrl}
      logoAlt={content.logoAlt}
      patternUrl={content.patternUrl}
      patternAlt={content.patternAlt}
      navigationArrowUrl={content.navigationArrowUrl}
    />
  )
}
