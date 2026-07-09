import {WelcomeScreen} from '@/components/auth/WelcomeScreen'
import {auth, getMicrosoftProfilePhotoDataUrl} from '@/lib/auth'
import {
  getAuthPageContent,
  resolveAuthBrandingProps,
  resolveWelcomeProfileProps,
} from '@/lib/authBranding'
import {redirect} from 'next/navigation'

export default async function Home() {
  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

  const content = await getAuthPageContent('welcome')
  const microsoftProfilePhoto = await getMicrosoftProfilePhotoDataUrl()
  const {screen} = content
  const brandingProps = resolveAuthBrandingProps(content)
  const profileProps = resolveWelcomeProfileProps(content)

  return (
    <WelcomeScreen
      userName={session.user.name}
      userEmail={session.user.email}
      userImage={microsoftProfilePhoto || session.user.image}
      headline={screen?.headline}
      subline={screen?.subline}
      ctaLabel={screen?.primaryCta?.label}
      ctaTarget={screen?.primaryCta?.target}
      logoutLabel={screen?.secondaryCta?.label}
      {...brandingProps}
      {...profileProps}
    />
  )
}
