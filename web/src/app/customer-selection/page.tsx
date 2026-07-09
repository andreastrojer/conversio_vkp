import {CustomerSelectionScreen} from '@/components/screens/CustomerSelectionScreen'
import {auth} from '@/lib/auth'
import {getAuthPageContent, resolveAuthBrandingProps} from '@/lib/authBranding'
import {getCustomerSelectionData} from '@/lib/customerSelection'
import {redirect} from 'next/navigation'

export default async function CustomerSelectionPage() {
  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

  const [content, customerSelectionData] = await Promise.all([
    getAuthPageContent('customer-selection'),
    getCustomerSelectionData(),
  ])
  const brandingProps = resolveAuthBrandingProps(content)

  return (
    <CustomerSelectionScreen
      screen={content.screen}
      segments={customerSelectionData.segments}
      formQuestions={customerSelectionData.formQuestions}
      {...brandingProps}
    />
  )
}
