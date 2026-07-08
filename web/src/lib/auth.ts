import NextAuth, {customFetch} from 'next-auth'
import {getToken, type JWT} from 'next-auth/jwt'
import MicrosoftEntraID from 'next-auth/providers/microsoft-entra-id'
import {headers} from 'next/headers'

export const MICROSOFT_ENTRA_PROVIDER_ID = 'microsoft-entra-id'
const MICROSOFT_ISSUER_PREFIX = 'https://login.microsoftonline.com/'
const MICROSOFT_ISSUER_SUFFIX = '/v2.0'
const MICROSOFT_OPENID_CONFIGURATION_PATH = '/.well-known/openid-configuration'
const MICROSOFT_GRAPH_PHOTO_ENDPOINTS = [
  'https://graph.microsoft.com/v1.0/me/photos/240x240/$value',
  'https://graph.microsoft.com/v1.0/me/photo/$value',
  'https://graph.microsoft.com/v1.0/me/photos/120x120/$value',
  'https://graph.microsoft.com/v1.0/me/photos/96x96/$value',
  'https://graph.microsoft.com/v1.0/me/photos/48x48/$value',
]

type MicrosoftJwt = JWT & {
  microsoftAccessToken?: unknown
}

function readEnvValue(name: string) {
  const value = process.env[name]?.trim()

  return value || undefined
}

function hasPlaceholder(value: string | undefined) {
  if (!value) {
    return true
  }

  const normalized = value.trim().toLowerCase()

  return (
    normalized.length === 0 ||
    normalized.includes('directory_tenant_id') ||
    normalized.includes('dein_') ||
    normalized.includes('your_') ||
    normalized.includes('your-') ||
    normalized.includes('placeholder') ||
    normalized.includes('<') ||
    normalized.includes('>') ||
    normalized === 'tenant_id' ||
    normalized === 'client_id' ||
    normalized === 'client_secret'
  )
}

function normalizeIssuer(issuer: string | undefined) {
  if (!issuer) {
    return undefined
  }

  return issuer.endsWith('/') ? issuer.slice(0, -1) : issuer
}

function getMicrosoftIssuerTenant(issuer: string | undefined) {
  const normalizedIssuer = normalizeIssuer(issuer)

  if (
    !normalizedIssuer?.startsWith(MICROSOFT_ISSUER_PREFIX) ||
    !normalizedIssuer.endsWith(MICROSOFT_ISSUER_SUFFIX)
  ) {
    return undefined
  }

  return normalizedIssuer
    .slice(MICROSOFT_ISSUER_PREFIX.length, -MICROSOFT_ISSUER_SUFFIX.length)
    .trim()
}

function isValidMicrosoftIssuer(issuer: string | undefined) {
  const normalizedIssuer = normalizeIssuer(issuer)

  if (!normalizedIssuer || hasPlaceholder(normalizedIssuer)) {
    return false
  }

  if (
    !normalizedIssuer.startsWith(MICROSOFT_ISSUER_PREFIX) ||
    !normalizedIssuer.endsWith(MICROSOFT_ISSUER_SUFFIX)
  ) {
    return false
  }

  const tenantSegment = getMicrosoftIssuerTenant(normalizedIssuer)

  return Boolean(
    tenantSegment && !hasPlaceholder(tenantSegment) && !tenantSegment.includes('/'),
  )
}

const authSecret = readEnvValue('AUTH_SECRET')
const microsoftClientId = readEnvValue('AUTH_MICROSOFT_ENTRA_ID_ID')
const microsoftClientSecret = readEnvValue('AUTH_MICROSOFT_ENTRA_ID_SECRET')
const microsoftIssuer = normalizeIssuer(readEnvValue('AUTH_MICROSOFT_ENTRA_ID_ISSUER'))

export const microsoftAuthStatus = {
  authSecretSet: !hasPlaceholder(authSecret),
  clientIdSet: !hasPlaceholder(microsoftClientId),
  clientSecretSet: !hasPlaceholder(microsoftClientSecret),
  issuerSet: !hasPlaceholder(microsoftIssuer),
  issuerValid: isValidMicrosoftIssuer(microsoftIssuer),
}

export const isMicrosoftAuthConfigured =
  microsoftAuthStatus.authSecretSet &&
  microsoftAuthStatus.clientIdSet &&
  microsoftAuthStatus.clientSecretSet &&
  microsoftAuthStatus.issuerValid

export function getMicrosoftLogoutUrl(postLogoutRedirectUri: string) {
  const tenant = getMicrosoftIssuerTenant(microsoftIssuer)

  if (!isMicrosoftAuthConfigured || !tenant) {
    return undefined
  }

  const logoutUrl = new URL(`${MICROSOFT_ISSUER_PREFIX}${tenant}/oauth2/v2.0/logout`)
  logoutUrl.searchParams.set('post_logout_redirect_uri', postLogoutRedirectUri)

  return logoutUrl.toString()
}

function getRequestedIssuerFromDiscoveryUrl(url: URL) {
  if (!url.pathname.endsWith(MICROSOFT_OPENID_CONFIGURATION_PATH)) {
    return undefined
  }

  return normalizeIssuer(
    `${url.origin}${url.pathname.slice(0, -MICROSOFT_OPENID_CONFIGURATION_PATH.length)}`,
  )
}

function resolveMicrosoftDiscoveryIssuer(
  requestedIssuer: string,
  discoveredIssuer: unknown,
) {
  const requestedTenant = getMicrosoftIssuerTenant(requestedIssuer)

  if (!requestedTenant || typeof discoveredIssuer !== 'string') {
    return discoveredIssuer
  }

  if (requestedTenant === 'consumers') {
    return requestedIssuer
  }

  if (discoveredIssuer.includes('{tenantid}')) {
    return discoveredIssuer.replace('{tenantid}', requestedTenant)
  }

  return discoveredIssuer
}

const microsoftEntraFetch: typeof fetch = async (...args) => {
  const requestUrl = new URL(args[0] instanceof Request ? args[0].url : args[0])
  const requestedIssuer = getRequestedIssuerFromDiscoveryUrl(requestUrl)
  const response = await fetch(...args)

  if (!requestedIssuer || !response.ok) {
    return response
  }

  try {
    const discovery = await response.clone().json()

    return Response.json({
      ...discovery,
      issuer: resolveMicrosoftDiscoveryIssuer(requestedIssuer, discovery.issuer),
    })
  } catch {
    return response
  }
}

function createMicrosoftEntraProvider() {
  return {
    ...MicrosoftEntraID({
      clientId: microsoftClientId,
      clientSecret: microsoftClientSecret,
      issuer: microsoftIssuer,
      profilePhotoSize: 48,
    }),
    [customFetch]: microsoftEntraFetch,
  }
}

async function fetchMicrosoftPhotoDataUrl(accessToken: string) {
  for (const endpoint of MICROSOFT_GRAPH_PHOTO_ENDPOINTS) {
    try {
      const response = await fetch(endpoint, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        cache: 'no-store',
      })

      if (!response.ok) {
        continue
      }

      const contentType = response.headers.get('content-type') || 'image/jpeg'
      const photoBuffer = Buffer.from(await response.arrayBuffer())

      if (photoBuffer.byteLength === 0) {
        continue
      }

      return `data:${contentType};base64,${photoBuffer.toString('base64')}`
    } catch {
      continue
    }
  }

  return undefined
}

export async function getMicrosoftProfilePhotoDataUrl() {
  if (!authSecret) {
    return undefined
  }

  try {
    const requestHeaders = await headers()
    const token = (await getToken({
      req: {headers: requestHeaders},
      secret: authSecret,
      secureCookie: process.env.NODE_ENV === 'production',
    })) as MicrosoftJwt | null
    const accessToken =
      typeof token?.microsoftAccessToken === 'string' ? token.microsoftAccessToken : undefined

    if (!accessToken) {
      return undefined
    }

    return fetchMicrosoftPhotoDataUrl(accessToken)
  } catch {
    return undefined
  }
}

if (process.env.NODE_ENV === 'development') {
  console.info('[auth] Microsoft Entra config', {
    AUTH_SECRET: microsoftAuthStatus.authSecretSet ? 'SET' : 'MISSING',
    AUTH_MICROSOFT_ENTRA_ID_ID: microsoftAuthStatus.clientIdSet ? 'SET' : 'MISSING',
    AUTH_MICROSOFT_ENTRA_ID_SECRET: microsoftAuthStatus.clientSecretSet ? 'SET' : 'MISSING',
    AUTH_MICROSOFT_ENTRA_ID_ISSUER: microsoftAuthStatus.issuerSet ? 'SET' : 'MISSING',
    ISSUER_VALID: microsoftAuthStatus.issuerValid,
    PROVIDER_ENABLED: isMicrosoftAuthConfigured,
  })
}

export const {handlers, auth, signIn, signOut} = NextAuth({
  secret: authSecret,
  trustHost: true,
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async jwt({token, account}) {
      if (account?.access_token) {
        token.microsoftAccessToken = account.access_token
      }

      return token
    },
  },
  providers: [
    ...(isMicrosoftAuthConfigured ? [createMicrosoftEntraProvider()] : []),
  ],
})
