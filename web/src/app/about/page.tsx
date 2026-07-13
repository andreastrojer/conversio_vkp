import {AboutScreen} from '@/components/screens/AboutScreen'
import {getAboutPageData} from '@/lib/about'
import {auth} from '@/lib/auth'
import type {CustomerGroup} from '@/lib/customerSelection'
import {redirect} from 'next/navigation'

type AboutPageProps = {
  searchParams: Promise<{
    type?: string | string[]
  }>
}

function resolveCustomerType(value: string | string[] | undefined): CustomerGroup {
  const normalizedValue = Array.isArray(value) ? value[0] : value

  return normalizedValue === 'b2b' ? 'b2b' : 'b2c'
}

export default async function AboutPage({searchParams}: AboutPageProps) {
  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

  const {type} = await searchParams
  const customerType = resolveCustomerType(type)
  const content = await getAboutPageData(customerType)

  return (
    <AboutScreen
      customerType={customerType}
      headline={content.screen?.headline}
      sections={content.screen?.sections}
      navigationItems={content.navigationItems}
      logoUrl={content.logoUrl}
      inverseLogoUrl={content.inverseLogoUrl}
      logoAlt={content.logoAlt}
      patternUrl={content.patternUrl}
      patternAlt={content.patternAlt}
      navigationArrowUrl={content.navigationArrowUrl}
      businessMapUrl={content.businessMapUrl}
      businessMapAlt={content.businessMapAlt}
    />
  )
}
