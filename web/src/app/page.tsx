import {WelcomeScreen} from '@/components/auth/WelcomeScreen'
import {auth} from '@/lib/auth'
import {getAuthPageContent, resolveAuthBrandingProps} from '@/lib/authBranding'
import {redirect} from 'next/navigation'

export default async function Home() {
  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

  const content = await getAuthPageContent()
  const brandingProps = resolveAuthBrandingProps(content)

  return (
    <WelcomeScreen
      userName={session.user.name}
      userEmail={session.user.email}
      userImage={session.user.image}
      {...brandingProps}
    />
  )
}
